export function startPerfReporting() {
  try {
    const perf: Record<string, number> = {};

    if ('PerformanceObserver' in window) {
      try {
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              perf.fcp = Math.round(entry.startTime);
            }
          }
        });
        po.observe({ type: 'paint', buffered: true });
      } catch {
        // PerformanceObserver not available for paint
      }

      try {
        const po2 = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const e = entry as PerformanceEntry & { renderTime?: number };
            perf.lcp = Math.round(e.renderTime || e.startTime);
          }
        });
        po2.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        // PerformanceObserver not available for LCP
      }
    }

    (window as Window & { __perfMetrics?: Record<string, number> }).__perfMetrics = perf;

    window.addEventListener('load', () => {
      setTimeout(() => {
        try {
          const w = window as Window & { __perfMetrics?: Record<string, number> };
          console.info('[perf] metrics', w.__perfMetrics || perf);
        } catch {
          // console may not be available
        }
      }, 2000);
    });
  } catch {
    // Performance API not available
  }
}
