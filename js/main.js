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

  const initExternalLinks = () => {
    const links = [...document.querySelectorAll("a[data-external='true']")];
    links.forEach((link) => {
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
    });
  };

  const initMusicControl = () => {
    const control = document.querySelector("[data-music-control]");
    if (!control) {
      return;
    }

    const toggle = control.querySelector("[data-music-toggle]");
    const label = control.querySelector("[data-music-label]");
    const audio = control.querySelector("[data-music-audio]");

    if (!toggle || !label || !audio) {
      return;
    }

    const audioSrc = (control.dataset.audioSrc || "").trim();
    const playlistUrl = (control.dataset.playlistUrl || "").trim();
    const autoStart = control.dataset.autostart === "true";
    const IDLE_LABEL = "\u266a My playlist";
    const PLAYING_LABEL = "Now playing";

    const setLabel = (text) => {
      label.textContent = text;
    };

    const setPlayingState = (isPlaying) => {
      toggle.classList.toggle("is-active", isPlaying);
      toggle.setAttribute("aria-pressed", String(isPlaying));
      toggle.setAttribute("aria-label", isPlaying ? "Pause audio" : "Play playlist");
    };

    if (audioSrc) {
      audio.src = audioSrc;
      audio.loop = true;
      audio.preload = "metadata";
      audio.volume = 0.78;
      setLabel(IDLE_LABEL);
      setPlayingState(false);
    } else {
      setLabel(IDLE_LABEL);
      setPlayingState(false);
    }

    let unlocked = false;
    const unlockAudioContext = () => {
      if (unlocked || !audioSrc) {
        return;
      }
      unlocked = true;
      audio.load();

      if (autoStart) {
        audio
          .play()
          .then(() => {
            setPlayingState(true);
            setLabel(PLAYING_LABEL);
          })
          .catch(() => {
            setPlayingState(false);
            setLabel(IDLE_LABEL);
          });
      }
    };

    document.addEventListener("pointerdown", unlockAudioContext, { once: true, passive: true });
    document.addEventListener("keydown", unlockAudioContext, { once: true });

    const openPlaylistFallback = () => {
      if (!playlistUrl) {
        setLabel(IDLE_LABEL);
        return;
      }
      window.open(playlistUrl, "_blank", "noopener,noreferrer");
      setLabel(IDLE_LABEL);
    };

    const tryPlay = async () => {
      if (!audioSrc) {
        openPlaylistFallback();
        return;
      }

      try {
        await audio.play();
        setPlayingState(true);
        setLabel(PLAYING_LABEL);
      } catch {
        setPlayingState(false);
        setLabel(IDLE_LABEL);
      }
    };

    toggle.addEventListener("click", (event) => {
      event.preventDefault();

      if (!audioSrc) {
        openPlaylistFallback();
        return;
      }

      if (audio.paused) {
        tryPlay();
      } else {
        audio.pause();
        setPlayingState(false);
        setLabel(IDLE_LABEL);
      }
    });

    audio.addEventListener("play", () => {
      setPlayingState(true);
      setLabel(PLAYING_LABEL);
    });

    audio.addEventListener("pause", () => {
      if (audio.ended) {
        return;
      }
      setPlayingState(false);
      setLabel(IDLE_LABEL);
    });

    audio.addEventListener("error", () => {
      setPlayingState(false);
      setLabel(IDLE_LABEL);
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
      const subject = encodeURIComponent(`New request: ${values.requestType}`);
      const body = encodeURIComponent(
        [
          `Full name: ${values.fullName}`,
          `Request type: ${values.requestType}`,
          "",
          "Message:",
          values.message,
        ].join("\n")
      );

      setStatus("success", "Opening your email client...");

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

    document.querySelectorAll("[data-track]").forEach((element) => {
      element.addEventListener("click", () => {
        const eventName = element.getAttribute("data-track");
        if (eventName) {
          window.ProfileHub.track(eventName, { location: window.location.pathname });
        }
      });
    });
  };

  const init = () => {
    initReveal();
    initTypewriter();
    initHeroParallax();
    initExternalLinks();
    initMusicControl();
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
