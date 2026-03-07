(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const roleKeyFromLabel = (label = "") => {
    const normalized = label.trim().toLowerCase();
    if (normalized === "ai integration") {
      return "ai-integration";
    }
    if (normalized === "digital advisory") {
      return "digital-advisory";
    }
    if (normalized === "project management") {
      return "project-management";
    }
    if (normalized === "hospitality") {
      return "hospitality";
    }
    return normalized.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

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

  const initRoleRotator = () => {
    const rotator = document.querySelector("[data-role-rotator]");
    if (!rotator) {
      return;
    }

    const textNode = rotator.querySelector(".role-rotator-text");
    if (!textNode) {
      return;
    }

    const roles = (rotator.dataset.roles || "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!roles.length) {
      return;
    }

    if (reduceMotion) {
      textNode.textContent = roles[0];
      rotator.dataset.currentRoleKey = roleKeyFromLabel(roles[0]);
      return;
    }

    const maxLength = roles.reduce((max, role) => Math.max(max, role.length), 0);
    rotator.style.setProperty("--role-width", `${maxLength + 2}ch`);

    let roleIndex = 0;
    let timerId = null;
    const outDuration = 260;
    const holdDuration = 1800;

    const swapRole = () => {
      textNode.classList.add("is-out");

      timerId = window.setTimeout(() => {
        roleIndex = (roleIndex + 1) % roles.length;
        textNode.textContent = roles[roleIndex];
        rotator.dataset.currentRoleKey = roleKeyFromLabel(roles[roleIndex]);
        textNode.classList.remove("is-out");
        textNode.classList.add("is-in");

        window.setTimeout(() => {
          textNode.classList.remove("is-in");
        }, 220);

        timerId = window.setTimeout(swapRole, holdDuration);
      }, outDuration);
    };

    textNode.textContent = roles[0];
    rotator.dataset.currentRoleKey = roleKeyFromLabel(roles[0]);
    timerId = window.setTimeout(swapRole, holdDuration);

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
      const shift = -Math.min(11, scrolled * 0.1);
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

  const initCarousels = () => {
    const carousels = [...document.querySelectorAll("[data-carousel]")];
    if (!carousels.length) {
      return;
    }

    carousels.forEach((carousel) => {
      const track = carousel.querySelector("[data-carousel-track]");
      const prevButton = carousel.querySelector("[data-carousel-prev]");
      const nextButton = carousel.querySelector("[data-carousel-next]");
      if (!track || !prevButton || !nextButton) {
        return;
      }

      const getStep = () => {
        const firstCard = track.querySelector(".link-card");
        if (!firstCard) {
          return Math.max(240, track.clientWidth * 0.8);
        }

        const styles = window.getComputedStyle(track);
        const gapValue = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
        return firstCard.getBoundingClientRect().width + gapValue;
      };

      const updateButtons = () => {
        const maxScroll = track.scrollWidth - track.clientWidth - 2;
        prevButton.disabled = track.scrollLeft <= 2;
        nextButton.disabled = track.scrollLeft >= maxScroll;
      };

      const scrollByStep = (direction) => {
        track.scrollBy({
          left: getStep() * direction,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      };

      prevButton.addEventListener("click", () => scrollByStep(-1));
      nextButton.addEventListener("click", () => scrollByStep(1));
      track.addEventListener("scroll", updateButtons, { passive: true });
      window.addEventListener("resize", updateButtons);
      updateButtons();
    });
  };

  const initFocusModal = () => {
    const modal = document.querySelector("[data-focus-modal]");
    if (!modal) {
      return;
    }

    const titleNode = modal.querySelector("[data-focus-title]");
    const descriptionNode = modal.querySelector("[data-focus-description]");
    const cta = modal.querySelector("[data-focus-cta]");
    const closeTriggers = [...modal.querySelectorAll("[data-focus-close]")];
    const focusItems = [...document.querySelectorAll("[data-focus-key]")];
    const roleTrigger = document.querySelector("[data-role-modal-trigger]");

    if (!titleNode || !descriptionNode || !cta || (!focusItems.length && !roleTrigger)) {
      return;
    }

    const details = {
      "tech-strategy": {
        title: "Tech Strategy",
        description:
          "I help businesses define digital priorities, simplify operations, and design practical execution plans. From positioning and service architecture to process improvement and delivery structure, the goal is clarity and momentum.",
      },
      "ai-integration": {
        title: "AI Integration",
        description:
          "I design AI-powered systems that connect tools, data and workflows. This includes automations, internal copilots, content pipelines, operational support systems and custom business flows built to reduce manual work.",
      },
      "digital-advisory": {
        title: "Digital Advisory",
        description:
          "I help businesses align positioning, digital presence, and execution priorities. The focus is practical strategy: fewer assumptions, clearer decisions, and consistent delivery across channels.",
      },
      "project-management": {
        title: "Project Management",
        description:
          "I structure projects with clear scope, milestones, and ownership so teams can execute faster and with less friction. From planning to delivery, the goal is reliable progress and measurable outcomes.",
      },
      hospitality: {
        title: "Hospitality",
        description:
          "I build digital experiences for hospitality projects, from positioning and online presence to guest-facing systems, booking flows, branding and property presentation. The focus is conversion, clarity and premium perception.",
      },
    };

    let lastTrigger = null;

    const closeModal = ({ restoreFocus = true } = {}) => {
      modal.classList.remove("is-open");
      document.body.style.overflow = "";

      const completeClose = () => {
        modal.hidden = true;
        if (restoreFocus && lastTrigger) {
          lastTrigger.focus();
        }
      };

      if (reduceMotion) {
        completeClose();
        return;
      }

      window.setTimeout(completeClose, 220);
    };

    const openModal = (key, trigger) => {
      const payload = details[key];
      if (!payload) {
        return;
      }

      titleNode.textContent = payload.title;
      descriptionNode.textContent = payload.description;
      lastTrigger = trigger;
      modal.hidden = false;
      document.body.style.overflow = "hidden";

      if (reduceMotion) {
        modal.classList.add("is-open");
        return;
      }

      window.requestAnimationFrame(() => {
        modal.classList.add("is-open");
      });
    };

    focusItems.forEach((item) => {
      item.addEventListener("click", () => {
        item.classList.add("is-opening");
        window.setTimeout(() => item.classList.remove("is-opening"), 180);
        openModal(item.dataset.focusKey, item);
      });
    });

    if (roleTrigger) {
      roleTrigger.addEventListener("click", () => {
        roleTrigger.classList.add("is-opening");
        window.setTimeout(() => roleTrigger.classList.remove("is-opening"), 180);
        const currentKey = roleTrigger.dataset.currentRoleKey || "ai-integration";
        openModal(currentKey, roleTrigger);
      });
    }

    closeTriggers.forEach((node) => {
      node.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        closeModal();
      }
    });

    cta.addEventListener("click", (event) => {
      event.preventDefault();
      closeModal({ restoreFocus: false });

      const target = document.getElementById("contact");
      if (target) {
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      }
    });
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
    initRoleRotator();
    initHeroParallax();
    initExternalLinks();
    initCarousels();
    initFocusModal();
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
