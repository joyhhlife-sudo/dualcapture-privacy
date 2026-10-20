(function () {
  const manualLanguageKey = 'dualcapture.manualLanguage';
  const legacyLanguageKey = 'xdc-lang';
  const supportedLanguages = ['en', 'zh-Hans'];

  function normalizeLanguage(value) {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().replace(/_/g, '-').toLowerCase();
    if (normalized === 'en' || normalized.startsWith('en-')) {
      return 'en';
    }

    if (normalized === 'zh') {
      return 'zh-Hans';
    }

    const parts = normalized.split('-');
    if (parts[0] !== 'zh') {
      return null;
    }

    if (parts.includes('hant') || ['tw', 'hk', 'mo'].some(region => parts.includes(region))) {
      return 'en';
    }

    if (
      parts.includes('hans') ||
      parts.includes('cn') ||
      parts.includes('sg')
    ) {
      return 'zh-Hans';
    }

    return null;
  }

  function storedManualLanguage() {
    try {
      return normalizeLanguage(localStorage.getItem(manualLanguageKey));
    } catch (_) {
      return null;
    }
  }

  function requestedLanguage() {
    try {
      return normalizeLanguage(new URLSearchParams(window.location.search).get('lang'));
    } catch (_) {
      return null;
    }
  }

  function browserLanguage() {
    const languages = Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language];

    for (const language of languages) {
      const normalized = normalizeLanguage(language);
      if (normalized) {
        return normalized;
      }
    }

    return null;
  }

  function resolveInitialLanguage() {
    return storedManualLanguage() || requestedLanguage() || browserLanguage() || 'en';
  }

  function localizedValue(node, language) {
    return language === 'zh-Hans' ? node.dataset.i18nZh : node.dataset.i18nEn;
  }

  function applyTitle(language) {
    const title = document.querySelector('title');
    if (!title) {
      return;
    }
    const nextTitle = localizedValue(title, language);
    if (nextTitle) {
      title.textContent = nextTitle;
    }
  }

  function applyLanguage(language, options) {
    const nextLanguage = supportedLanguages.includes(language) ? language : 'en';
    const panelLanguage = nextLanguage === 'zh-Hans' ? 'zh' : 'en';

    document.documentElement.lang = nextLanguage;
    document.documentElement.dataset.xdcLang = nextLanguage;
    applyTitle(nextLanguage);

    document.querySelectorAll('.lang-panel').forEach(panel => {
      panel.hidden = panel.dataset.lang !== panelLanguage;
    });

    document.querySelectorAll('.lang-btn').forEach(button => {
      const active = normalizeLanguage(button.dataset.langChoice) === nextLanguage;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    document.querySelectorAll('[data-i18n-en]').forEach(node => {
      if (node.tagName.toLowerCase() === 'title') {
        return;
      }
      const text = localizedValue(node, nextLanguage);
      if (typeof text === 'string') {
        node.textContent = text;
      }
    });

    if (options && options.manual) {
      try {
        localStorage.setItem(manualLanguageKey, nextLanguage);
        localStorage.removeItem(legacyLanguageKey);
      } catch (_) {}
    }
  }

  const initialLanguage = resolveInitialLanguage();
  document.documentElement.lang = initialLanguage;
  document.documentElement.dataset.xdcLang = initialLanguage;
  applyTitle(initialLanguage);

  window.DualCaptureLanguage = {
    applyLanguage,
    normalizeLanguage,
    resolveInitialLanguage,
    manualLanguageKey
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyLanguage(initialLanguage);

    document.querySelectorAll('.lang-btn').forEach(button => {
      button.addEventListener('click', function () {
        applyLanguage(normalizeLanguage(button.dataset.langChoice) || 'en', { manual: true });
      });
    });

    const toggle = document.querySelector('.mobile-nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
      toggle.addEventListener('click', function () {
        const open = navLinks.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      });
    }
  });
})();