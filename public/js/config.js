/**
 * WorkRight Multi-Cloud Deployment Configuration
 * Supports split deployment: Vercel (Frontend) + Render (Backend),
 * single-host deployments (Render / Cloud Run full-stack),
 * and local development.
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

    // 3. Same origin (Render full-stack, local server, or single-origin proxy)
    return '';
  },

  // Generates full endpoint URL
  url(path) {
    if (!path.startsWith('/')) path = '/' + path;
    const base = this.getApiBase();
    return base ? `${base}${path}` : path;
  },

  // Set and save backend URL (e.g. https://your-app.onrender.com)
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

  // Automatically parse URL parameter (?backend=... or ?api=...)
  checkUrlParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const backendParam = params.get('backend') || params.get('api') || params.get('render');
      if (backendParam) {
        this.setBackendUrl(backendParam);
        console.log('WorkRight connected to backend via URL param:', backendParam);
        // Clean URL parameter without reloading
        params.delete('backend');
        params.delete('api');
        params.delete('render');
        const newSearch = params.toString();
        const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (e) {}
  },

  // Ping backend to test connectivity & cold start status
  async pingBackend(baseUrl) {
    const target = baseUrl ? baseUrl.replace(/\/$/, '') : this.getApiBase();
    const testUrl = (target ? target : '') + '/api/sectors';
    const start = Date.now();
    try {
      const res = await fetch(testUrl, { method: 'GET', mode: 'cors' });
      const elapsed = Date.now() - start;
      if (res.ok) {
        return { success: true, latency: elapsed, message: `Connected (${elapsed}ms)` };
      }
      return { success: false, message: `Server returned HTTP ${res.status}` };
    } catch (err) {
      return {
        success: false,
        message: 'Could not connect. (If Render free instance, it may take 20-30s to wake up from cold sleep).'
      };
    }
  },

  // Open modal/prompt to configure backend URL
  promptBackendUrl() {
    const current = this.getApiBase() || '(Same Origin)';
    const input = prompt(
      'Configure Render Backend API URL\n\n' +
      'Current Backend: ' + current + '\n\n' +
      'Enter your Render URL (e.g. https://workright-api.onrender.com) or leave empty for same origin:',
      this.getApiBase()
    );

    if (input !== null) {
      this.setBackendUrl(input);
      if (input.trim()) {
        alert('Render Backend URL saved:\n' + input.trim() + '\n\nPage will reload to connect.');
      } else {
        alert('Reset to default same-origin.');
      }
      window.location.reload();
    }
  },

  // Render connector bar when running on Vercel or when user needs connection
  initVercelConnector() {
    this.checkUrlParams();

    const isVercel = window.location.hostname.includes('vercel.app');
    const configuredBackend = this.getApiBase();

    // 1. If on Vercel and NO backend configured yet, show prominent top banner
    if (isVercel && !configuredBackend) {
      if (!document.getElementById('renderConnectorBar')) {
        const bar = document.createElement('div');
        bar.id = 'renderConnectorBar';
        bar.style.cssText = `
          background: #0f172a;
          color: #ffffff;
          padding: 8px 14px;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          position: sticky;
          top: 0;
          z-index: 99999;
          border-bottom: 2px solid #38bdf8;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        `;
        bar.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">🚀</span>
            <span><strong>Vercel Frontend:</strong> Connect your Render Backend API URL to enable live database & logins:</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <input
              type="url"
              id="renderUrlInput"
              placeholder="https://your-backend.onrender.com"
              style="padding: 6px 10px; font-size: 12px; border-radius: 6px; border: 1px solid #94a3b8; min-width: 240px; color: #000;"
            />
            <button
              type="button"
              onclick="WorkRightConfig.saveAndReload()"
              style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;"
            >Connect</button>
            <button
              type="button"
              onclick="document.getElementById('renderConnectorBar').remove()"
              style="background: transparent; color: #94a3b8; border: none; font-size: 18px; cursor: pointer; padding: 0 6px;"
              title="Dismiss"
            >×</button>
          </div>
        `;
        document.body.prepend(bar);
      }
    }

    // 2. Add subtle floating status badge in bottom-left corner
    if (!document.getElementById('floatingServerBadge')) {
      const badge = document.createElement('div');
      badge.id = 'floatingServerBadge';
      const label = configuredBackend ? '☁️ Render: Connected' : (isVercel ? '⚙️ Connect Render' : '☁️ Server: Active');
      badge.style.cssText = `
        position: fixed;
        bottom: 8px;
        left: 8px;
        z-index: 9000;
        background: #0f172a;
        color: #94a3b8;
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 12px;
        border: 1px solid #334155;
        cursor: pointer;
        opacity: 0.85;
        transition: opacity 0.2s;
        font-family: sans-serif;
      `;
      badge.innerHTML = `<span style="color: ${configuredBackend ? '#4ade80' : '#38bdf8'}; font-weight: 700;">${label}</span>`;
      badge.title = 'Click to view or change backend server URL';
      badge.onclick = () => WorkRightConfig.promptBackendUrl();
      document.body.appendChild(badge);
    }
  },

  saveAndReload() {
    const input = document.getElementById('renderUrlInput');
    if (input && input.value) {
      this.setBackendUrl(input.value);
      alert('Connected to Render backend:\n' + input.value);
      window.location.reload();
    }
  }
};

// Initialize connector on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  WorkRightConfig.initVercelConnector();
});