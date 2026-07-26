const express = require('express');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const crypto = require('crypto');

const app = express();

// --- Security Middleware ---

// Helmet: sets various HTTP security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // nginx handles COEP upstream
}));

// CORS: restrict to known origins in production; allow all in development
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
if (allowedOrigins.length === 0) {
  console.warn('CORS_ORIGINS not set — CORS restricted to same origin');
}
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Request-ID'],
  maxAge: 86400,
}));

// Rate limiting: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use(limiter);

// Stricter rate limit for PDF generation: 10 per minute per IP
const pdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'PDF generation rate limit exceeded. Please try again later' },
});

// Body parsing with reduced limit (5MB is sufficient for PDF data)
app.use(express.json({ limit: '5mb' }));

// Logging
app.use(morgan('combined', {
  skip: (req) => req.url === '/health',
}));

// Request ID middleware
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// --- Health Check ---
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// --- Input Validation ---
function validateAssessment(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return ['Request body must be a JSON object'];
  }
  if (data.projectName && typeof data.projectName !== 'string') {
    errors.push('projectName must be a string');
  }
  if (data.location && typeof data.location !== 'string') {
    errors.push('location must be a string');
  }
  if (data.projectType && typeof data.projectType !== 'string') {
    errors.push('projectType must be a string');
  }
  if (data.report && typeof data.report !== 'string') {
    errors.push('report must be a string');
  }
  if (data.report && data.report.length > 500000) {
    errors.push('report exceeds maximum length of 500000 characters');
  }
  if (data.createdAt && typeof data.createdAt !== 'string' && typeof data.createdAt !== 'number') {
    errors.push('createdAt must be a string or number');
  }
  if (data.evidence && !Array.isArray(data.evidence)) {
    errors.push('evidence must be an array');
  }
  if (data.evidence && Array.isArray(data.evidence)) {
    for (let i = 0; i < data.evidence.length; i++) {
      const ev = data.evidence[i];
      if (!ev || typeof ev !== 'object') {
        errors.push(`evidence[${i}] must be an object`);
        continue;
      }
      if (ev.data && typeof ev.data === 'string' && ev.data.length > 10 * 1024 * 1024) {
        errors.push(`evidence[${i}] data exceeds 10MB limit`);
      }
    }
  }
  return errors;
}

// --- PDF Generation Endpoint ---
app.post('/generate-pdf', pdfLimiter, async (req, res) => {
  const startTime = Date.now();

  try {
    const validationErrors = validateAssessment(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
        requestId: req.requestId,
      });
    }

    const assessment = req.body || {};
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const PAGE_WIDTH = 595;
    const PAGE_HEIGHT = 842;
    const MARGIN = 40;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

    const pages = [];

    const addPage = () => {
      const p = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      const title = sanitizeText(assessment.projectName || 'Assessment Report');
      p.drawText(title, { x: MARGIN, y: PAGE_HEIGHT - 60, size: 18, font, color: rgb(0.06, 0.45, 0.23) });
      p.drawLine({ start: { x: MARGIN, y: PAGE_HEIGHT - 68 }, end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 68 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
      pages.push(p);
      return p;
    };

    let currentPage = addPage();
    let cursorY = PAGE_HEIGHT - 90;
    const fontSize = 11;

    const pushText = (text) => {
      const wrapped = wrapText(text, fontSize, font, CONTENT_WIDTH);
      for (const wl of wrapped) {
        if (cursorY < MARGIN + 80) {
          currentPage = addPage();
          cursorY = PAGE_HEIGHT - 90;
        }
        currentPage.drawText(wl, { x: MARGIN, y: cursorY, size: fontSize, font, color: rgb(0, 0, 0) });
        cursorY -= fontSize + 4;
      }
    };

    // Metadata box
    const metaLines = [
      `Project: ${sanitizeText(assessment.projectName || '')}`,
      `Location: ${sanitizeText(assessment.location || '')}`,
      `Type: ${sanitizeText(assessment.projectType || '')}`,
      `Date: ${assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : ''}`,
    ];

    if (cursorY - (metaLines.length * (fontSize + 4) + 14) < MARGIN) {
      currentPage = addPage();
      cursorY = PAGE_HEIGHT - 90;
    }
    const boxHeight = metaLines.length * (fontSize + 4) + 12;
    currentPage.drawRectangle({ x: MARGIN, y: cursorY - boxHeight + 6, width: CONTENT_WIDTH, height: boxHeight, color: rgb(0.97, 0.98, 0.97), borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 0.5 });
    let metaY = cursorY - 8;
    for (const ml of metaLines) {
      currentPage.drawText(ml, { x: MARGIN + 8, y: metaY, size: fontSize, font, color: rgb(0.12, 0.12, 0.12) });
      metaY -= fontSize + 4;
    }
    cursorY -= boxHeight + 8;

    // Report content
    const reportText = assessment.report || '';
    const reportLines = reportText.split('\n');
    for (const line of reportLines) {
      pushText(line);
    }

    // Evidence images
    if (Array.isArray(assessment.evidence)) {
      for (const ev of assessment.evidence) {
        const data = (ev.data || '').toString();
        const m = data.match(/^data:(image\/(png|jpeg|jpg));base64,(.*)$/);
        if (!m) continue;
        const mime = m[1];
        const b64 = m[3];

        // Validate base64 size
        const decodedSize = Buffer.byteLength(b64, 'base64');
        if (decodedSize > 10 * 1024 * 1024) continue;

        const imgBytes = Buffer.from(b64, 'base64');
        let embeddedImg;
        try {
          if (mime === 'image/png') embeddedImg = await pdfDoc.embedPng(imgBytes);
          else embeddedImg = await pdfDoc.embedJpg(imgBytes);
        } catch {
          continue;
        }

        const imgDims = embeddedImg.scale(1);
        const maxImgWidth = CONTENT_WIDTH;
        const maxImgHeight = PAGE_HEIGHT - MARGIN - 120;
        const scale = Math.min(maxImgWidth / imgDims.width, maxImgHeight / imgDims.height, 1);
        const drawn = embeddedImg.scale(scale);

        if (cursorY - drawn.height < MARGIN + 40) {
          currentPage = addPage();
          cursorY = PAGE_HEIGHT - 90;
        }

        currentPage.drawImage(embeddedImg, {
          x: MARGIN,
          y: cursorY - drawn.height,
          width: drawn.width,
          height: drawn.height,
        });
        currentPage.drawText(sanitizeText(ev.name || ''), { x: MARGIN, y: cursorY - drawn.height - 14, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
        cursorY -= drawn.height + 28;
      }
    }

    // Page numbers
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const label = `Page ${i + 1} of ${pages.length}`;
      const textWidth = font.widthOfTextAtSize(label, 9);
      p.drawText(label, { x: (PAGE_WIDTH - textWidth) / 2, y: 20, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
    }

    const pdfBytes = await pdfDoc.save();

    const duration = Date.now() - startTime;
    console.log(`[PDF] Generated in ${duration}ms, size: ${pdfBytes.length} bytes, requestId: ${req.requestId}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBytes.length);
    res.setHeader('X-Request-ID', req.requestId);
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error('[PDF] Generation failed in %sms, requestId: %s: %s', duration, req.requestId, err.message);
    return res.status(500).json({
      error: 'PDF generation failed',
      requestId: req.requestId,
    });
  }
});

// --- Helpers ---

function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').substring(0, 10000);
}

function wrapText(text, fontSize, font, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// --- Graceful Shutdown ---
const server = app.listen(process.env.PORT || 4001, () => {
  console.log(`PDF server running on http://localhost:${process.env.PORT || 4001}`);
});

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
