(() => {
  const SUPPORTED_LANGUAGES = ["en", "it"];
  const FALLBACK_LANGUAGE = "en";
  const STORAGE_KEY = "mylinks:lang";
  const QUERY_KEY = "lang";

  const translationsCache = {};
  const bundledLocales = window.ProfileLocaleBundles || {};
  let currentLanguage = FALLBACK_LANGUAGE;

  const normalizeLanguage = (language) => {
    if (!language || typeof language !== "string") {
      return null;
    }
    const normalized = language.trim().toLowerCase().slice(0, 2);
    return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : null;
  };

  const getSavedLanguage = () => {
    try {
      return normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  };

  const getQueryLanguage = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return normalizeLanguage(params.get(QUERY_KEY));
    } catch {
      return null;
    }
  };

  const detectBrowserLanguage = () => {
    const browserLanguage = normalizeLanguage(window.navigator.language || "");
    return browserLanguage === "it" ? "it" : FALLBACK_LANGUAGE;
  };

  const resolveLanguage = () => {
    const fromQuery = getQueryLanguage();
    if (fromQuery) {
      return fromQuery;
    }

    const fromStorage = getSavedLanguage();
    if (fromStorage) {
      return fromStorage;
    }

    return detectBrowserLanguage();
  };

  const updateQueryLanguage = (language) => {
    if (window.location.protocol === "file:") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set(QUERY_KEY, language);
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;

    try {
      window.history.replaceState({}, "", nextUrl);
    } catch {
      // Some browsers treat file:// previews as opaque origins and reject URL rewriting.
    }
  };

  const setSavedLanguage = (language) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Storage can be unavailable in private modes; ignore.
    }
  };

  const getNestedValue = (source, key) => {
    if (!source || !key) {
      return undefined;
    }
    return key.split(".").reduce((accumulator, chunk) => {
      if (accumulator === undefined || accumulator === null) {
        return undefined;
      }
      return accumulator[chunk];
    }, source);
  };

  const interpolate = (value, variables = {}) => {
    if (typeof value !== "string") {
      return value;
    }
    return value.replace(/\{(\w+)\}/g, (match, key) => {
      if (!Object.prototype.hasOwnProperty.call(variables, key)) {
        return match;
      }
      return String(variables[key]);
    });
  };

  const loadTranslations = async (language) => {
    if (translationsCache[language]) {
      return translationsCache[language];
    }
    const bundledLocale = bundledLocales && bundledLocales[language] ? bundledLocales[language] : null;

    const localePath = (() => {
      try {
        return new URL(`locales/${language}.json`, window.location.href).toString();
      } catch {
        return `locales/${language}.json`;
      }
    })();

    const parseAndStore = (raw) => {
      try {
        const parsed = JSON.parse(raw);
        translationsCache[language] = parsed;
        return parsed;
      } catch {
        return null;
      }
    };

    try {
      const response = await fetch(localePath, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Unable to load locale ${language}`);
      }

      const text = await response.text();
      const parsed = parseAndStore(text);
      if (parsed) {
        return parsed;
      }
      if (bundledLocale) {
        translationsCache[language] = bundledLocale;
        return bundledLocale;
      }
      return null;
    } catch {
      // Fallback for environments where fetch to local files can fail (e.g. file:// preview).
      return new Promise((resolve) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", localePath, true);
          xhr.onreadystatechange = () => {
            if (xhr.readyState !== 4) {
              return;
            }
            const responseOk = xhr.status >= 200 && xhr.status < 300;
            const fileProtocolOk = xhr.status === 0 && typeof xhr.responseText === "string" && xhr.responseText.length > 0;
            if (responseOk || fileProtocolOk) {
              const parsed = parseAndStore(xhr.responseText);
              if (parsed) {
                resolve(parsed);
                return;
              }
              if (bundledLocale) {
                translationsCache[language] = bundledLocale;
                resolve(bundledLocale);
                return;
              }
              resolve(null);
              return;
            }
            if (bundledLocale) {
              translationsCache[language] = bundledLocale;
              resolve(bundledLocale);
              return;
            }
            resolve(null);
          };
          xhr.onerror = () => {
            if (bundledLocale) {
              translationsCache[language] = bundledLocale;
              resolve(bundledLocale);
              return;
            }
            resolve(null);
          };
          xhr.send();
        } catch {
          if (bundledLocale) {
            translationsCache[language] = bundledLocale;
            resolve(bundledLocale);
            return;
          }
          resolve(null);
        }
      });
    }
  };

  const getLanguage = () => currentLanguage;

  const getValue = (key) => {
    const activeTranslations = translationsCache[currentLanguage] || {};
    const fallbackTranslations = translationsCache[FALLBACK_LANGUAGE] || {};
    const fromActive = getNestedValue(activeTranslations, key);
    if (fromActive !== undefined) {
      return fromActive;
    }
    return getNestedValue(fallbackTranslations, key);
  };

  const t = (key, variables = {}) => {
    const value = getValue(key);
    if (value === undefined) {
      return undefined;
    }
    return interpolate(value, variables);
  };

  const applyTranslations = (scope = document) => {
    const nodes = [...scope.querySelectorAll("[data-i18n]")];
    nodes.forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (!key) {
        return;
      }
      const translated = t(key);
      if (typeof translated !== "string" || translated.length === 0) {
        return;
      }
      node.textContent = translated;
    });

    const placeholders = [...scope.querySelectorAll("[data-i18n-placeholder]")];
    placeholders.forEach((node) => {
      const key = node.getAttribute("data-i18n-placeholder");
      if (!key) {
        return;
      }
      const translated = t(key);
      if (typeof translated === "string") {
        node.setAttribute("placeholder", translated);
      }
    });

    const ariaLabels = [...scope.querySelectorAll("[data-i18n-aria-label]")];
    ariaLabels.forEach((node) => {
      const key = node.getAttribute("data-i18n-aria-label");
      if (!key) {
        return;
      }
      const translated = t(key);
      if (typeof translated === "string") {
        node.setAttribute("aria-label", translated);
      }
    });

    const titles = [...scope.querySelectorAll("[data-i18n-title]")];
    titles.forEach((node) => {
      const key = node.getAttribute("data-i18n-title");
      if (!key) {
        return;
      }
      const translated = t(key);
      if (typeof translated === "string") {
        node.setAttribute("title", translated);
      }
    });
  };

  const updateMeta = () => {
    const body = document.body;
    if (!body) {
      return;
    }

    const titleKey = body.dataset.i18nTitleKey;
    const descriptionKey = body.dataset.i18nDescriptionKey;

    if (titleKey) {
      const translatedTitle = t(titleKey);
      if (typeof translatedTitle === "string") {
        document.title = translatedTitle;
        const ogTitle = document.querySelector('meta[data-meta="og:title"]');
        const twitterTitle = document.querySelector('meta[data-meta="twitter:title"]');
        if (ogTitle) {
          ogTitle.setAttribute("content", translatedTitle);
        }
        if (twitterTitle) {
          twitterTitle.setAttribute("content", translatedTitle);
        }
      }
    }

    if (descriptionKey) {
      const translatedDescription = t(descriptionKey);
      if (typeof translatedDescription === "string") {
        const descriptionMeta = document.querySelector('meta[data-meta="description"]');
        const ogDescription = document.querySelector('meta[data-meta="og:description"]');
        const twitterDescription = document.querySelector('meta[data-meta="twitter:description"]');
        if (descriptionMeta) {
          descriptionMeta.setAttribute("content", translatedDescription);
        }
        if (ogDescription) {
          ogDescription.setAttribute("content", translatedDescription);
        }
        if (twitterDescription) {
          twitterDescription.setAttribute("content", translatedDescription);
        }
      }
    }

    const ogLocaleMeta = document.querySelector('meta[data-meta="og:locale"]');
    if (ogLocaleMeta) {
      const localeMap = {
        en: "en_US",
        it: "it_IT"
      };
      ogLocaleMeta.setAttribute("content", localeMap[currentLanguage] || "en_US");
    }
  };

  const updateLanguageSwitchers = () => {
    const switchers = [...document.querySelectorAll("[data-lang-switch]")];
    switchers.forEach((switcher) => {
      const options = [...switcher.querySelectorAll("[data-lang-option]")];
      options.forEach((option) => {
        const language = normalizeLanguage(option.getAttribute("data-lang-option"));
        const isActive = language === currentLanguage;
        option.classList.toggle("is-active", isActive);
        option.setAttribute("aria-pressed", String(isActive));
      });
    });
  };

  const dispatchLanguageChange = () => {
    window.dispatchEvent(
      new CustomEvent("i18n:change", {
        detail: { lang: currentLanguage },
      })
    );
  };

  const setLanguage = async (language, options = {}) => {
    const normalized = normalizeLanguage(language) || FALLBACK_LANGUAGE;
    const { persist = true, updateUrl = true, emit = true } = options;

    if (!translationsCache[FALLBACK_LANGUAGE]) {
      await loadTranslations(FALLBACK_LANGUAGE);
    }

    const loaded = translationsCache[normalized] || (await loadTranslations(normalized));
    currentLanguage = loaded ? normalized : FALLBACK_LANGUAGE;

    if (persist) {
      setSavedLanguage(currentLanguage);
    }

    if (updateUrl) {
      updateQueryLanguage(currentLanguage);
    }

    document.documentElement.setAttribute("lang", currentLanguage);
    applyTranslations();
    updateMeta();
    updateLanguageSwitchers();

    if (emit) {
      dispatchLanguageChange();
    }

    return currentLanguage;
  };

  const bindLanguageSwitchers = () => {
    const buttons = [...document.querySelectorAll("[data-lang-option]")];
    buttons.forEach((button) => {
      button.addEventListener("click", async () => {
        const requestedLanguage = normalizeLanguage(button.getAttribute("data-lang-option"));
        if (!requestedLanguage || requestedLanguage === currentLanguage) {
          return;
        }
        await setLanguage(requestedLanguage, { persist: true, updateUrl: true, emit: true });
      });
    });
  };

  const initializeI18n = async () => {
    const preferredLanguage = resolveLanguage();
    await loadTranslations(FALLBACK_LANGUAGE);
    await loadTranslations(preferredLanguage);

    const fromQuery = getQueryLanguage();
    const targetLanguage = fromQuery || preferredLanguage || FALLBACK_LANGUAGE;
    await setLanguage(targetLanguage, { persist: true, updateUrl: true, emit: false });

    bindLanguageSwitchers();
  };

  window.ProfileI18n = {
    SUPPORTED_LANGUAGES,
    FALLBACK_LANGUAGE,
    getSavedLanguage,
    detectBrowserLanguage,
    resolveLanguage,
    initializeI18n,
    loadTranslations,
    setLanguage,
    getLanguage,
    getValue,
    t,
    applyTranslations,
  };
})();
