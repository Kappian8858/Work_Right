/**
 * WorkRight API Configuration
 * Supports single-origin hosting (Cloud Run / Render full-stack)
 * as well as split deployment (Vercel Frontend + Render Backend).
 */

const WorkRightConfig = {
  // Returns base URL for all API calls
  getApiBase() {
    // 1. Check if user configured a custom Render backend in localStorage
    const custom = localStorage.getItem('workright_backend_url');
    if (custom) {
      return custom.replace(/\/$/, '');
    }

    // 2. Global window override (if injected during build or hosting)
    if (window.WORKRIGHT_BACKEND_URL) {
      return window.WORKRIGHT_BACKEND_URL.replace(/\/$/, '');
    }

    // 3. Fallback to same origin
    return '';
  },

  // Generates full endpoint URL
  url(path) {
    if (!path.startsWith('/')) path = '/' + path;
    const base = this.getApiBase();
    return base ? `${base}${path}` : path;
  },

  // Set and save backend URL (e.g. https://workright.onrender.com)
  setBackendUrl(url) {
    if (!url || !url.trim()) {
      localStorage.removeItem('workright_backend_url');
    } else {
      let cleaned = url.trim().replace(/\/$/, '');
      if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
        cleaned = 'https://' + cleaned;
      }
      localStorage.setItem('workright_backend_url', cleaned);
    }
  },

  // Render backend connection banner if running on Vercel without configured backend
  initVercelConnector() {
    if (window.location.hostname.includes('vercel.app')) {
      const current = localStorage.getItem('workright_backend_url');
      if (!current) {
        const bar = document.createElement('div');
        bar.id = 'renderConnectorBar';
        bar.style.cssText = `
          background: #1e293b;
          color: #ffffff;
          padding: 8px 12px;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          position: sticky;
          top: 0;
          z-index: 9999;
          border-bottom: 2px solid #38bdf8;
        `;
        bar.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px;">
            <span>🚀 <strong>Vercel + Render Deployment:</strong></span>
            <span>Connect your Render backend URL</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <input
              type="url"
              id="renderUrlInput"
              placeholder="https://your-app.onrender.com"
              style="padding: 4px 8px; font-size: 12px; border-radius: 4px; border: 1px solid #94a3b8; min-width: 220px;"
            />
            <button
              type="button"
              onclick="WorkRightConfig.saveAndReload()"
              style="background: #2563eb; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; cursor: pointer;"
            >Save</button>
            <button
              type="button"
              onclick="document.getElementById('renderConnectorBar').remove()"
              style="background: transparent; color: #94a3b8; border: none; font-size: 14px; cursor: pointer;"
            >×</button>
          </div>
        `;
        document.body.prepend(bar);
      }
    }
  },

  saveAndReload() {
    const input = document.getElementById('renderUrlInput');
    if (input && input.value) {
      this.setBackendUrl(input.value);
      alert('Connected to Render backend: ' + input.value);
      window.location.reload();
    }
  }
};

// Initialize connector banner on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  WorkRightConfig.initVercelConnector();
});
