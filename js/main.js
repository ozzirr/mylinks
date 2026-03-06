(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    document.body.classList.add("reduce-motion");
  }

  const revealElements = [...document.querySelectorAll("[data-reveal]")];

  const showElement = (element) => {
    element.classList.add("is-visible");
  };

  const initReveal = () => {
    if (!revealElements.length) {
      return;
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealElements.forEach(showElement);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          showElement(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    revealElements.forEach((element) => observer.observe(element));
  };

  const initTypewriter = () => {
    const target = document.querySelector("[data-typewriter]");
    if (!target) {
      return;
    }

    const roles = (target.dataset.roles || "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!roles.length) {
      return;
    }

    if (reduceMotion) {
      target.textContent = roles[0];
      return;
    }

    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timerId = null;

    const typeSpeed = 72;
    const deleteSpeed = 44;
    const holdDelay = 1320;
    const betweenDelay = 260;

    const tick = () => {
      const role = roles[roleIndex];

      if (deleting) {
        charIndex -= 1;
        target.textContent = role.slice(0, charIndex);

        if (charIndex <= 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
          timerId = window.setTimeout(tick, betweenDelay);
          return;
        }

        timerId = window.setTimeout(tick, deleteSpeed);
        return;
      }

      charIndex += 1;
      target.textContent = role.slice(0, charIndex);

      if (charIndex >= role.length) {
        deleting = true;
        timerId = window.setTimeout(tick, holdDelay);
        return;
      }

      timerId = window.setTimeout(tick, typeSpeed);
    };

    target.textContent = "";
    timerId = window.setTimeout(tick, 320);

    window.addEventListener("beforeunload", () => {
      if (timerId) {
        window.clearTimeout(timerId);
      }
    });
  };

  const initHeroParallax = () => {
    const heroMedia = document.querySelector(".hero-media");
    const heroImage = document.querySelector(".hero-image");
    if (!heroMedia || !heroImage || reduceMotion) {
      return;
    }

    let frameId = null;

    const updateShift = () => {
      frameId = null;
      const mediaTop = heroMedia.getBoundingClientRect().top;
      const scrolled = Math.max(0, -mediaTop);
      const shift = -Math.min(18, scrolled * 0.16);
      heroImage.style.setProperty("--hero-shift", `${shift.toFixed(2)}px`);
    };

    const requestShiftUpdate = () => {
      if (frameId !== null) {
        return;
      }
      frameId = window.requestAnimationFrame(updateShift);
    };

    updateShift();
    window.addEventListener("scroll", requestShiftUpdate, { passive: true });
    window.addEventListener("resize", requestShiftUpdate);
  };

  const enhanceExternalLink = (link) => {
    if (link.dataset.externalReady === "true") {
      return;
    }

    link.dataset.externalReady = "true";
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");

    if (reduceMotion) {
      return;
    }

    const setOpening = () => {
      link.classList.add("is-opening");
      window.setTimeout(() => link.classList.remove("is-opening"), 220);
    };

    link.addEventListener("pointerdown", setOpening);
    link.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        setOpening();
      }
    });
  };

  const initExternalLinks = (scope = document) => {
    const links = [...scope.querySelectorAll("a[data-external='true']")];
    links.forEach((link) => {
      enhanceExternalLink(link);
    });
  };

  const formatDate = (value) => {
    try {
      return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Recently updated";
    }
  };

  const formatTime = (value = Date.now()) => {
    try {
      return new Date(value).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "--";
    }
  };

  const initGithubActivity = async () => {
    const shell = document.querySelector("[data-github-activity]");
    if (!shell) {
      return;
    }

    const list = shell.querySelector("[data-github-list]");
    const status = shell.querySelector("[data-github-status]");
    const publicReposNode = shell.querySelector("[data-github-public]");
    const syncNode = shell.querySelector("[data-github-sync]");
    const username = (shell.dataset.githubUser || "").trim();
    if (!list || !username) {
      return;
    }

    const setStatus = (text) => {
      if (status) {
        status.textContent = text;
      }
    };

    const setSync = (text) => {
      if (syncNode) {
        syncNode.textContent = text;
      }
    };

    setSync(formatTime());

    try {
      // Public endpoint works on static hosting; can be replaced with authenticated proxy later.
      const [reposResponse, userResponse] = await Promise.all([
        fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=8`, {
          headers: { Accept: "application/vnd.github+json" },
        }),
        fetch(`https://api.github.com/users/${username}`, {
          headers: { Accept: "application/vnd.github+json" },
        }),
      ]);

      if (!reposResponse.ok) {
        throw new Error(`GitHub request failed: ${reposResponse.status}`);
      }

      const repos = await reposResponse.json();
      if (!Array.isArray(repos) || repos.length === 0) {
        return;
      }

      if (userResponse.ok) {
        const profile = await userResponse.json();
        if (publicReposNode && typeof profile.public_repos === "number") {
          publicReposNode.textContent = String(profile.public_repos);
        }
      }

      const nonForkRepos = repos.filter((repo) => !repo.fork);
      const featuredRepos = (nonForkRepos.length ? nonForkRepos : repos).slice(0, 2);

      const fragment = document.createDocumentFragment();
      featuredRepos.forEach((repo) => {
        const card = document.createElement("a");
        card.className = "github-card";
        card.href = repo.html_url;
        card.dataset.external = "true";
        card.dataset.track = `github_repo_${repo.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

        const title = document.createElement("h3");
        title.className = "github-name";
        title.textContent = repo.name;

        const description = document.createElement("p");
        description.className = "github-desc";
        description.textContent = repo.description || "Repository update in progress.";

        const meta = document.createElement("p");
        meta.className = "github-meta";

        const language = document.createElement("span");
        language.textContent = repo.language || "Multi-stack";

        const updated = document.createElement("span");
        updated.textContent = formatDate(repo.pushed_at || repo.updated_at);

        meta.append(language, updated);
        card.append(title, description, meta);
        fragment.append(card);
      });

      list.replaceChildren(fragment);
      initExternalLinks(list);
      setStatus("Live from GitHub");
      setSync(formatTime());
    } catch {
      setStatus("Curated snapshot");
    }
  };

  const initVisitorCounter = async () => {
    const card = document.querySelector("[data-visitor-counter]");
    if (!card) {
      return;
    }

    const countNode = card.querySelector("[data-visitor-count]");
    const statusNode = card.querySelector("[data-visitor-status]");
    const namespace = (card.dataset.counterNamespace || "ozzirr.github.io").trim();
    const key = (card.dataset.counterKey || "mylinks_profile").trim();

    const setStatus = (text) => {
      if (statusNode) {
        statusNode.textContent = text;
      }
    };

    try {
      const url = `https://api.countapi.xyz/hit/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Counter request failed: ${response.status}`);
      }
      const payload = await response.json();
      if (countNode && typeof payload.value === "number") {
        const visits = new Intl.NumberFormat("en-US").format(payload.value);
        countNode.textContent = `${visits} visits`;
      }
      setStatus("Updated live");
    } catch {
      setStatus("Snapshot mode");
    }
  };

  const initContactForm = () => {
    const form = document.querySelector("[data-contact-form]");
    if (!form) {
      return;
    }

    const fields = [...form.querySelectorAll("input, select, textarea")];
    const status = form.querySelector("[data-form-status]");

    const setStatus = (state, message) => {
      if (!status) {
        return;
      }
      status.hidden = false;
      status.dataset.state = state;
      status.textContent = message;
    };

    const validateField = (field) => {
      if (field.checkValidity()) {
        field.classList.remove("field-error");
        field.setAttribute("aria-invalid", "false");
        return true;
      }

      field.classList.add("field-error");
      field.setAttribute("aria-invalid", "true");
      return false;
    };

    fields.forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => {
        if (field.classList.contains("field-error")) {
          validateField(field);
        }
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const allValid = fields.every((field) => validateField(field));
      if (!allValid) {
        setStatus("error", "Please check the highlighted fields.");
        return;
      }

      const data = new FormData(form);
      const values = Object.fromEntries(data.entries());
      const mailtoTarget = form.dataset.mailto || "mailto:ing.and.rizzo@gmail.com";
      const fullName = String(values.fullName || "").trim();
      const requestType = String(values.requestType || "").trim();
      const message = String(values.message || "").trim();

      const subject = encodeURIComponent(`[Website Inquiry] ${requestType} - ${fullName}`);
      const body = encodeURIComponent(
        [
          `Name: ${fullName}`,
          `Request type: ${requestType}`,
          "",
          "Message:",
          message,
        ].join("\n")
      );

      setStatus("success", "Opening your email draft...");

      window.setTimeout(() => {
        window.location.href = `${mailtoTarget}?subject=${subject}&body=${body}`;
      }, reduceMotion ? 0 : 170);

      form.reset();
      fields.forEach((field) => {
        field.classList.remove("field-error");
        field.setAttribute("aria-invalid", "false");
      });
    });
  };

  const initFooterYear = () => {
    const yearNode = document.getElementById("year");
    if (yearNode) {
      yearNode.textContent = String(new Date().getFullYear());
    }
  };

  const initTrackingStub = () => {
    window.ProfileHub = window.ProfileHub || {};
    window.ProfileHub.track = window.ProfileHub.track || ((eventName, payload = {}) => {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, payload);
      }
    });

    if (window.ProfileHub.boundTracking) {
      return;
    }

    window.ProfileHub.boundTracking = true;
    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }
      const element = event.target.closest("[data-track]");
      if (!element) {
        return;
      }
      const eventName = element.getAttribute("data-track");
      if (eventName) {
        window.ProfileHub.track(eventName, { location: window.location.pathname });
      }
    });
  };

  const init = () => {
    initReveal();
    initTypewriter();
    initHeroParallax();
    initExternalLinks();
    initGithubActivity();
    initVisitorCounter();
    initContactForm();
    initFooterYear();
    initTrackingStub();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
