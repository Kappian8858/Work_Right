/**
 * WorkRight Multi-Cloud Deployment Configuration
 * Clean, zero-nagging API routing for Vercel, Render, and Localhost.
 * Never displays intrusive banners or popups on login.
 */

const WorkRightConfig = {
  // Production Render Backend URL
  DEFAULT_BACKEND_URL: 'https://prompt-wars-vsi5.onrender.com',

  // Returns base URL for all API calls
  getApiBase() {
    // 1. Saved custom URL in localStorage (persisted)
    const custom = localStorage.getItem('workright_backend_url');
    if (custom) {
      return custom.replace(/\/$/, '');
    }

    // 2. Global window override
    if (window.WORKRIGHT_BACKEND_URL) {
      return window.WORKRIGHT_BACKEND_URL.replace(/\/$/, '');
    }

    // 3. If running directly on Render backend, use same origin
    if (typeof window !== 'undefined' && window.location && window.location.hostname.includes('onrender.com')) {
      return '';
    }

    // 4. Multi-cloud default (Connects Vercel frontend to Render backend)
    if (this.DEFAULT_BACKEND_URL) {
      return this.DEFAULT_BACKEND_URL.replace(/\/$/, '');
    }

    return '';
  },

  // Generates full endpoint URL
  url(path) {
    if (!path.startsWith('/')) path = '/' + path;
    const base = this.getApiBase();
    return base ? `${base}${path}` : path;
  },

  // Set and save backend URL permanently in localStorage
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

  // Check URL parameter once (e.g. ?backend=https://your-api.onrender.com)
  checkUrlParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const backendParam = params.get('backend') || params.get('api') || params.get('render');
      if (backendParam) {
        this.setBackendUrl(backendParam);
        params.delete('backend');
        params.delete('api');
        params.delete('render');
        const newSearch = params.toString();
        const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (e) {}
  }
};

// Check URL params on load, NO intrusive popups or banners
document.addEventListener('DOMContentLoaded', () => {
  WorkRightConfig.checkUrlParams();
});