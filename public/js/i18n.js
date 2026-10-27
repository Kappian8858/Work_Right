/**
 * WorkRight Client-Side Internationalization (i18n)
 * Supports English (en), Tamil (ta), and Hindi (hi).
 */

const I18N = {
  currentLang: localStorage.getItem('workright_lang') || 'en',
  translations: {},

  async init(onReady) {
    await this.loadLanguage(this.currentLang);
    this.bindLanguageToggles();
    this.translatePage();
    if (typeof onReady === 'function') onReady();
  },

  async loadLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('workright_lang', lang);

    if (this.translations[lang]) {
      return this.translations[lang];
    }

    try {
      const apiUrl = typeof WorkRightConfig !== 'undefined' ? WorkRightConfig.url(`/api/translations/${lang}`) : `/api/translations/${lang}`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        this.translations[lang] = await res.json();
      } else {
        // Fallback to English
        const fallbackUrl = typeof WorkRightConfig !== 'undefined' ? WorkRightConfig.url('/api/translations/en') : '/api/translations/en';
        const fallback = await fetch(fallbackUrl);
        this.translations[lang] = await fallback.json();
      }
    } catch (e) {
      console.warn('Failed to fetch translations, using fallback', e);
    }

    return this.translations[lang];
  },

  t(key, params = {}) {
    const dict = this.translations[this.currentLang] || this.translations['en'] || {};
    let text = dict[key] || key;

    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), pVal);
    }
    return text;
  },

  translatePage() {
    // Translate textContent
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = this.t(key);
      if (val) {
        el.textContent = val;
      }
    });

    // Translate attributes like placeholder or aria-label
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const raw = el.getAttribute('data-i18n-attr');
      // format: "placeholder:key,aria-label:key"
      raw.split(',').forEach(pair => {
        const [attr, key] = pair.split(':');
        if (attr && key) {
          el.setAttribute(attr.trim(), this.t(key.trim()));
        }
      });
    });

    // Update active button state
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === this.currentLang) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  },

  bindLanguageToggles() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const selected = btn.getAttribute('data-lang');
        if (selected && selected !== this.currentLang) {
          await this.loadLanguage(selected);
          this.translatePage();
          window.dispatchEvent(new CustomEvent('workright:languageChanged', { detail: { lang: selected } }));
        }
      });
    });
  }
};
