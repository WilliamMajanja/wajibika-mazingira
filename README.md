<div align="center">
  <h1>Wajibika Mazingira</h1>
  <p><strong>Empowering East African communities with AI-driven environmental conservation and carbon credit management.</strong></p>
  <p><em>A minima PiNet OS project by William Majanja</em></p>
</div>

<p align="center">
  <img alt="Technology" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img alt="Technology" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white">
</p>

**Wajibika Mazingira** (Swahili for "Be Responsible for the Environment") is a comprehensive web platform for environmental conservation, carbon credit sequestering, carbon token pricing, and community governance. Built as part of the **minima PiNet OS** ecosystem by **William Majanja**, it features AI-powered environmental oversight via **Ollama** (local) or **OpenRouter** (cloud free tier).

## Screenshots

<table>
  <tr>
    <td align="center"><img src="screenshots/01-assessment-generator.png" alt="AI Impact Assessment Generator" width="100%"><br><b>AI Impact Assessment Generator</b></td>
    <td align="center"><img src="screenshots/02-carbon-dashboard.png" alt="Carbon Dashboard" width="100%"><br><b>Carbon Dashboard</b></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/03-carbon-market.png" alt="Carbon Market" width="100%"><br><b>Carbon Market</b></td>
    <td align="center"><img src="screenshots/04-governance-portal.png" alt="Governance Portal" width="100%"><br><b>Governance Portal</b></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/05-evidence-locker.png" alt="Evidence Locker" width="100%"><br><b>Evidence Locker</b></td>
    <td align="center"><img src="screenshots/06-community-chat.png" alt="AI Community Assistant" width="100%"><br><b>AI Community Assistant</b></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/07-zanzibar-showcase.png" alt="Zanzibar Showcase" width="100%"><br><b>Zanzibar Showcase</b></td>
    <td align="center"><img src="screenshots/08-carbon-passport.png" alt="Carbon Passport" width="100%"><br><b>Carbon Passport</b></td>
  </tr>
</table>

## 🌴 Zanzibar Showcase

Wajibika Mazingira features a dedicated **Zanzibar showcase** highlighting the island archipelago's unique conservation projects and carbon sequestration potential. Zanzibar serves as a living laboratory for innovative environmental solutions that can be scaled across East Africa.

### 🌊 Key Zanzibar Conservation Initiatives

#### 1. **Mangrove Conservation** 🌱
- **Location**: Unguja & Pemba Islands
- **Focus**: Jozani Reserve and surrounding mangrove forests
- **Impact**: 20,000+ hectares of mangrove forest protecting coastlines and sequestering carbon
- **Community**: Local fishermen and women involved in mangrove restoration

#### 2. **Coral Reef Protection** 🌊
- **Location**: Coastal reefs around Zanzibar and Pemba
- **Focus**: Biodiversity conservation and sustainable fisheries
- **Coverage**: 1,500+ km² of coral reef ecosystems
- **Species**: 350+ marine species protected

#### 3. **Seaweed Farming** 🌿
- **Location**: Coastal communities of Zanzibar
- **Focus**: Women-led seaweed cultivation for blue carbon
- **Benefits**: Income generation + carbon sequestration
- **Scale**: Supporting hundreds of coastal families

### 📊 Zanzibar Impact Statistics

| Metric | Value |
|--------|-------|
| **Mangrove Coverage** | 20,000+ hectares |
| **Coral Reef Area** | 1,500+ km² |
| **Marine Species** | 350+ species |
| **Carbon Potential** | 500,000+ tCO₂/yr |
| **Projects Active** | 15+ ongoing initiatives |

## 🌴 Core Features

### 📊 **AI Impact Assessment Generator**
Generate professional environmental, social, health, climate, and **carbon sequestration** impact assessments. Features AI-powered report generation with real-time streaming and deep analysis mode.

### 🌱 **Carbon Dashboard**
Track carbon sequestration projects with:
- Project registration and management (reforestation, afforestation, conservation, agroforestry, soil carbon, blue carbon, renewable energy)
- Carbon sequestration rate tracking (tCO₂e/ha/yr)
- Automated carbon credit issuance based on sequestration calculations
- AI-powered carbon potential analysis
- Real-time metrics (total sequestered, credits issued, area restored)

### 💰 **Carbon Market**
A decentralized carbon credit marketplace with:
- Order book for buying and selling carbon credits
- Automated order matching engine
- Real-time price discovery with historical charting
- AI-powered market insights and price predictions
- Credit listing, trading, and retirement
- Project type filtering and market depth visualization

### 🗳️ **Governance Portal**
Community-driven governance for carbon credit management with:
- Proposal creation and voting (Carbon Standards, Pricing, Project Approval, Parameter Changes, Funding)
- Weighted voting power based on carbon projects (10 VP each) and credit ownership (1 VP each)
- Quorum-based decision making (20% participation required)
- Automatic proposal execution when conditions are met
- AI-powered debate analysis for informed voting

### 🔐 **Secure Evidence Locker**
Store reports and upload photographic evidence with AI-powered image analysis. Export assessments as PDF.

### 🤖 **AI Community Assistant**
Engage with "Mazingira Rafiki," a multi-mode AI assistant with voice-to-text, text-to-speech, and modes for fast, smart, grounded, and maps-based queries.

## 📱 Companion Applications (Monorepo)

Wajibika Mazingira is part of a monorepo suite of companion applications within the **minima PiNet OS** ecosystem. Each app focuses on a specific aspect of environmental conservation and carbon management. All apps live in the `apps/` directory of this same repository.

### Project Structure

```
wajibika-mazingira/
├── src/                          # Main app — core platform
├── apps/
│   ├── land-developer/           # Land parcel registration & impact analysis
│   ├── community-reporter/       # Environmental incident reporting
│   ├── carbon-wallet/            # Carbon credit wallet & transactions
│   └── conservation-map/         # Interactive conservation project map
├── package.json                  # Root with npm workspaces
└── ...
```

| Application | Port | Description |
|-------------|------|-------------|
| **Wajibika Mazingira** (root) | `:5173` | Core platform — AI impact assessments, carbon dashboard, marketplace, governance, passports |
| **Land Developer** | `:5174` | Land parcel registration, zoning, and environmental impact analysis for developers |
| **Community Reporter** | `:5175` | Lightweight environmental incident reporting and community collaboration |
| **Carbon Wallet** | `:5176` | Mobile carbon credit wallet — manage balances, verify credits, and trade on the go |
| **Conservation Map** | `:5177` | Interactive map visualization of all conservation projects and environmental data |

### Running All Apps

The monorepo uses **npm workspaces**. Install dependencies once from the root:

```bash
npm install
```

To run all apps simultaneously:

```bash
npm run dev:all
```

To run a specific app:

```bash
npm run dev --workspace=@wajibika/land-developer
```

To build all apps for production:

```bash
npm run build:all
```

Each app runs on its own port (5173–5177) and can be accessed independently or through the minima PiNet OS launcher.

## 🛠 Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8
- **Styling**: Tailwind CSS 4 with fluid `clamp()` typography scale
- **AI**: Ollama (local) or OpenRouter (cloud) — no API key required for Ollama
- **Storage**: Client-side localStorage
- **Deployment**: GitHub Pages, Docker, Kubernetes/k3s

## 📱 Cross-Platform Optimizations

Wajibika Mazingira is built for every device — from low-end smartphones in rural East Africa to desktops and large displays. The following optimizations ensure a consistent, accessible experience across all platforms:

### Fluid Typography
Font sizes scale smoothly between viewports using `clamp()` values rather than discrete breakpoints, ensuring readability on any screen size without manual breakpoint tuning.

### Safe Area Support
The app respects `safe-area-inset-*` environment variables for notched and rounded display devices (iPhone X+, modern Android). Body padding, sticky header, and toast notifications all account for display cutouts.

### Touch-Optimized UI
- All interactive elements meet **44×44px minimum touch target** size (WCAG 2.5.5)
- Responsive grid layouts collapse at `lg` (1024px) rather than `xl` (1280px) for better tablet ergonomics
- Horizontal scroll fallback for tables on narrow viewports

### Reduced Motion
A `prefers-reduced-motion` media query disables all animations and transitions for users who prefer reduced motion, respecting system accessibility settings.

### Dark Mode
Automatic dark mode support via `prefers-color-scheme: dark` media query. The app adapts to the user's system preference without manual toggling.

### Print Styles
Dedicated `@media print` rules hide navigation chrome and format content for clean paper or PDF output.

### Image Optimization
- `loading="lazy"` and `decoding="async"` for all images
- `aspect-ratio` based containers prevent layout shift (CLS)
- Responsive image containers adapt to viewport width

### Build Performance
- `react.lazy` + `<Suspense>` code splitting per route
- Manual vendor chunking for `react`, `react-dom`, `react-markdown`, and `html2pdf`
- Lightning CSS minification in production builds
- Source maps disabled in production for faster loads

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- **Option A (Ollama — recommended, free, private):** Install [Ollama](https://ollama.ai) and pull a model:
  ```bash
  ollama pull deepseek-r1:8b
  ```
- **Option B (OpenRouter — free cloud tier):** Sign up at [openrouter.ai](https://openrouter.ai) and create a free API key.

### Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/WilliamMajanja/wajibika-mazingira.git
    cd wajibika-mazingira
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
 4. Open your browser and navigate to the local address provided (e.g., `http://localhost:5173/wajibika-mazingira/`). To expose on your network, use `npm run dev -- --host`.
5.  Click the **AI icon (✨)** in the header to configure your AI provider — choose Ollama (default, local) or OpenRouter (cloud).

## Carbon Credit System

The platform implements a complete carbon credit lifecycle:

1. **Project Registration**: Users register conservation projects with type, area, location, and sequestration rate
2. **Credit Issuance**: Projects are activated to generate verified carbon credits, each with unique serial numbers
3. **Market Trading**: Credits can be listed on the order book for peer-to-peer trading with price discovery
4. **Retirement**: Credits can be permanently retired with a recorded reason, removing them from circulation
5. **Governance**: The community votes on carbon standards, pricing parameters, and project approvals

### Default Sequestration Rates
| Project Type | Rate (tCO₂/ha/yr) |
|---|---|
| Reforestation | 12 |
| Afforestation | 10 |
| Agroforestry | 8 |
| Blue Carbon | 7 |
| Conservation | 5 |
| Renewable Energy | 4 |
| Soil Carbon | 3 |

## AI Provider Configuration

Click the **AI icon (✨)** in the header to open the configuration panel.

### Ollama (Default — Free & Private)
- Runs entirely on your machine — no data leaves your computer.
- Default URL: `http://localhost:11434`
- Recommended models: `deepseek-r1:8b`, `llama3.2`, `mistral`, `qwen2.5`
- Vision-capable models (for image analysis): `llava`, `bakllava`

### OpenRouter (Cloud — Free Tier)
- Sign up at [openrouter.ai](https://openrouter.ai) and get a free API key.
- Free models include: `deepseek/deepseek-v4-flash-free`, `cognitivecomputations/dolphin-mixtral-8x7b`
- Supports vision models for image analysis.

## Deployment

This project is configured for automatic deployment via GitHub Actions to GitHub Pages.

1. Push your repository to GitHub.
2. Go to **Settings > Pages** and set the source to **GitHub Actions**.
3. Push to the `main` branch. Your site will be live at `https://<username>.github.io/wajibika-mazingira/`.

> **Note:** No API keys are embedded in the build when using Ollama. If using OpenRouter, the API key is stored only in your browser's localStorage.
