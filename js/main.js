(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const i18n = window.ProfileI18n || null;

  const t = (key, fallback, variables = {}) => {
    if (!i18n || typeof i18n.t !== "function") {
      return fallback !== undefined ? fallback : key;
    }
    const value = i18n.t(key, variables);
    if (typeof value !== "string") {
      return fallback !== undefined ? fallback : key;
    }
    return value;
  };

  const getValue = (key, fallback = undefined) => {
    if (!i18n || typeof i18n.getValue !== "function") {
      return fallback;
    }
    const value = i18n.getValue(key);
    return value === undefined ? fallback : value;
  };

  const getCurrentLanguage = () => {
    if (!i18n || typeof i18n.getLanguage !== "function") {
      return "en";
    }
    return i18n.getLanguage();
  };

  if (reduceMotion) {
    document.body.classList.add("reduce-motion");
  }

  const revealElements = [...document.querySelectorAll("[data-reveal]")];

  const roleKeyFromLabel = (label = "") => {
    const normalized = label.trim().toLowerCase();
    const map = {
      "ai integration": "ai-integration",
      "integrazione ai": "ai-integration",
      "digital advisory": "digital-advisory",
      "consulenza digitale": "digital-advisory",
      "project management": "project-management",
      "gestione progetti": "project-management"
    };
    if (map[normalized]) {
      return map[normalized];
    }
    return normalized.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

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
        rootMargin: "0px 0px -10% 0px"
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

    const roleKeys = (rotator.dataset.roleKeys || "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);

    let roles = [];
    let roleIndex = 0;
    let timerId = null;

    const clearTimer = () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    };

    const resolveRoles = () => {
      const translated = getValue("hero.roles");
      if (Array.isArray(translated) && translated.length) {
        return translated.map((role) => String(role));
      }

      if (roleKeys.length) {
        return roleKeys.map((key) => key.replace(/-/g, " "));
      }

      const rawRoles = (rotator.dataset.roles || "")
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean);
      return rawRoles;
    };

    const updateCurrentRole = () => {
      const key = roleKeys[roleIndex] || roleKeyFromLabel(roles[roleIndex]);
      rotator.dataset.currentRoleKey = key;
      textNode.textContent = roles[roleIndex] || "";
    };

    const startRotation = () => {
      clearTimer();
      roles = resolveRoles();
      roleIndex = 0;

      if (!roles.length) {
        return;
      }

      const maxLength = roles.reduce((max, role) => Math.max(max, role.length), 0);
      rotator.style.setProperty("--role-width", `${maxLength + 2}ch`);
      updateCurrentRole();

      if (reduceMotion) {
        return;
      }

      const outDuration = 260;
      const holdDuration = 1800;

      const swapRole = () => {
        textNode.classList.add("is-out");

        timerId = window.setTimeout(() => {
          roleIndex = (roleIndex + 1) % roles.length;
          updateCurrentRole();
          textNode.classList.remove("is-out");
          textNode.classList.add("is-in");

          window.setTimeout(() => {
            textNode.classList.remove("is-in");
          }, 220);

          timerId = window.setTimeout(swapRole, holdDuration);
        }, outDuration);
      };

      timerId = window.setTimeout(swapRole, holdDuration);
    };

    startRotation();
    window.addEventListener("i18n:change", startRotation);
    window.addEventListener("beforeunload", clearTimer);
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

  const initProjectCube = () => {
    const scene = document.querySelector("[data-cube-scene]");
    const cube = document.querySelector("[data-project-cube]");
    const loading = document.querySelector("[data-cube-loading]");
    if (!scene || !cube) {
      return;
    }

    let rotateX = -18;
    let rotateY = 0;
    let dragging = false;
    let moved = false;
    let pointerId = null;
    let lastX = 0;
    let lastY = 0;
    let rafId = null;
    let previousTimestamp = 0;
    let pauseUntil = 0;
    let pausedByFocus = false;
    let pausedByHover = false;
    let ready = false;
    let loadFallbackId = null;
    let snapResetId = null;

    const faceImages = [...scene.querySelectorAll("img")];
    const wrapAngle = (value) => ((((value + 180) % 360) + 360) % 360) - 180;
    const faceTargets = {
      balance: { x: -18, y: 0 },
      odora: { x: -18, y: -90 },
      generale: { x: -18, y: 180 },
      cta: { x: -18, y: 90 },
      contact: { x: 90, y: 0 }
    };

    faceImages.forEach((image) => {
      image.setAttribute("draggable", "false");
    });

    const applyRotation = () => {
      cube.style.setProperty("--cube-rx", `${rotateX.toFixed(2)}deg`);
      cube.style.setProperty("--cube-ry", `${rotateY.toFixed(2)}deg`);
    };

    const setReady = () => {
      if (ready) {
        return;
      }
      ready = true;
      if (loadFallbackId !== null) {
        window.clearTimeout(loadFallbackId);
      }
      scene.classList.remove("is-loading");
      scene.setAttribute("aria-busy", "false");
      if (loading) {
        loading.setAttribute("hidden", "");
      }
    };

    const waitForImage = (image) =>
      new Promise((resolve) => {
        image.loading = "eager";
        const finish = () => {
          if (typeof image.decode === "function") {
            image.decode().catch(() => {}).finally(resolve);
            return;
          }
          resolve();
        };

        if (image.complete) {
          if (image.naturalWidth > 0) {
            finish();
            return;
          }
          resolve();
          return;
        }

        const cleanup = () => {
          image.removeEventListener("load", onLoad);
          image.removeEventListener("error", onError);
        };

        const onLoad = () => {
          cleanup();
          finish();
        };

        const onError = () => {
          cleanup();
          resolve();
        };

        image.addEventListener("load", onLoad, { once: true });
        image.addEventListener("error", onError, { once: true });
      });

    const releasePauseSoon = () => {
      pauseUntil = window.performance.now() + 2200;
    };

    const rotateToFace = (faceName) => {
      const target = faceTargets[faceName];
      if (!target) {
        return;
      }

      if (snapResetId !== null) {
        window.clearTimeout(snapResetId);
      }

      pauseUntil = window.performance.now() + 4200;
      rotateX = target.x;
      rotateY = target.y;
      cube.classList.add("is-snapping");
      applyRotation();

      snapResetId = window.setTimeout(() => {
        cube.classList.remove("is-snapping");
        snapResetId = null;
      }, reduceMotion ? 0 : 900);
    };

    const resetToFace = (faceName) => {
      const target = faceTargets[faceName];
      if (!target) {
        return;
      }
      pauseUntil = window.performance.now() + 4200;
      rotateX = target.x;
      rotateY = target.y;
      cube.classList.remove("is-snapping");
      applyRotation();
    };

    const onFrame = (timestamp) => {
      if (!previousTimestamp) {
        previousTimestamp = timestamp;
      }

      const delta = timestamp - previousTimestamp;
      previousTimestamp = timestamp;

      const isClosed = document.body.classList.contains("is-cube-stage-closed");
      const shouldAutoRotate = !reduceMotion && !dragging && (isClosed || (!pausedByFocus && !pausedByHover)) && timestamp > pauseUntil;
      if (shouldAutoRotate) {
        rotateY = wrapAngle(rotateY + delta * 0.016);
        applyRotation();
      }

      rafId = window.requestAnimationFrame(onFrame);
    };

    const endDrag = () => {
      dragging = false;
      pointerId = null;
      releasePauseSoon();
    };

    applyRotation();

    loadFallbackId = window.setTimeout(() => {
      setReady();
    }, 1800);

    Promise.all(faceImages.map(waitForImage)).finally(() => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(setReady);
      });
    });

    scene.addEventListener("mouseenter", () => {
      pausedByHover = true;
    });
    scene.addEventListener("mouseleave", () => {
      pausedByHover = false;
      releasePauseSoon();
    });
    scene.addEventListener("focusin", () => {
      pausedByFocus = true;
    });
    scene.addEventListener("focusout", () => {
      pausedByFocus = false;
      releasePauseSoon();
    });

    scene.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary) {
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      if (event.target instanceof Element && event.target.closest("[data-cube-interactive]")) {
        return;
      }

      dragging = true;
      moved = false;
      pointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      pausedByHover = true;
      if (snapResetId !== null) {
        window.clearTimeout(snapResetId);
        snapResetId = null;
      }
      cube.classList.remove("is-snapping");
      cube.classList.add("is-dragging");
      scene.classList.add("is-dragging");
      scene.setPointerCapture(event.pointerId);
    });

    scene.addEventListener("pointermove", (event) => {
      if (!dragging || event.pointerId !== pointerId) {
        return;
      }

      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        moved = true;
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      rotateY = wrapAngle(rotateY + deltaX * 0.42);
      rotateX = wrapAngle(rotateX - deltaY * 0.32);
      lastX = event.clientX;
      lastY = event.clientY;
      applyRotation();
    });

    scene.addEventListener(
      "touchmove",
      (event) => {
        if (!dragging || !event.cancelable) {
          return;
        }
        event.preventDefault();
      },
      { passive: false }
    );

    scene.addEventListener("pointerup", (event) => {
      if (event.pointerId !== pointerId) {
        return;
      }
      cube.classList.remove("is-dragging");
      scene.classList.remove("is-dragging");
      pausedByHover = false;
      scene.releasePointerCapture(event.pointerId);
      endDrag();
    });

    scene.addEventListener("pointercancel", (event) => {
      if (event.pointerId !== pointerId) {
        return;
      }
      cube.classList.remove("is-dragging");
      scene.classList.remove("is-dragging");
      pausedByHover = false;
      endDrag();
    });

    scene.addEventListener(
      "click",
      (event) => {
        if (!moved) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );

    scene.addEventListener("dragstart", (event) => {
      event.preventDefault();
    });

    rafId = window.requestAnimationFrame(onFrame);
    window.ProfileHub = window.ProfileHub || {};
    window.ProfileHub.cube = {
      rotateToFace,
      resetToFace,
      unpause(delay = 600) {
        pausedByHover = false;
        pausedByFocus = false;
        pauseUntil = Math.min(pauseUntil, window.performance.now() + delay);
      }
    };
    window.addEventListener("beforeunload", () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (snapResetId !== null) {
        window.clearTimeout(snapResetId);
      }
    });
  };

  const initCubeSnake = () => {
    const root = document.querySelector("[data-snake-game]");
    const canvas = root?.querySelector("[data-snake-canvas]");
    const scoreNode = root?.querySelector("[data-snake-score]");
    const statusNode = root?.querySelector("[data-snake-status]");
    const actionButton = root?.querySelector("[data-snake-action]");

    if (!root || !(canvas instanceof HTMLCanvasElement) || !scoreNode || !statusNode || !(actionButton instanceof HTMLButtonElement)) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const groundHeight = 42;
    const groundY = height - groundHeight;
    const gravity = 0.0009;
    const jumpVelocity = -0.37;
    const keyMap = {
      ArrowUp: "jump",
      w: "jump",
      W: "jump",
      " ": "jump",
      Enter: "jump"
    };

    const fontFamily = '"Manrope", "Avenir Next", "Segoe UI", sans-serif';
    const bestScoreKey = "mylinks.runner.best-score";
    const brandNames = ["2ERRE", "WEB", "AI", "FLOW", "OPS"];
    const stageThresholds = {
      salento: 0,
      roma: 260,
      digital: 620
    };

    let runner = null;
    let obstacles = [];
    let scenery = [];
    let particles = [];
    let score = 0;
    let bestScore = 0;
    let started = false;
    let gameOver = false;
    let frameId = null;
    let lastTimestamp = 0;
    let spawnCooldown = 0;
    let sceneryCooldown = 0;
    let speed = 0.138;
    let horizonOffset = 0;
    let distance = 0;
    let stageAnnouncement = 0;
    let stageKey = "salento";
    let flashAlpha = 0;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const randomBetween = (min, max) => min + Math.random() * (max - min);
    const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

    const loadBestScore = () => {
      try {
        const raw = window.localStorage.getItem(bestScoreKey);
        const parsed = Number.parseInt(raw || "0", 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
      } catch {
        return 0;
      }
    };

    const persistBestScore = () => {
      try {
        window.localStorage.setItem(bestScoreKey, String(bestScore));
      } catch {
        return;
      }
    };

    const roundRectPath = (x, y, w, h, radius) => {
      const safeRadius = Math.min(radius, w / 2, h / 2);
      context.beginPath();
      context.moveTo(x + safeRadius, y);
      context.arcTo(x + w, y, x + w, y + h, safeRadius);
      context.arcTo(x + w, y + h, x, y + h, safeRadius);
      context.arcTo(x, y + h, x, y, safeRadius);
      context.arcTo(x, y, x + w, y, safeRadius);
      context.closePath();
    };

    const fillRoundedRect = (x, y, w, h, radius, color) => {
      roundRectPath(x, y, w, h, radius);
      context.fillStyle = color;
      context.fill();
    };

    const strokeRoundedRect = (x, y, w, h, radius, color, lineWidth = 1) => {
      roundRectPath(x, y, w, h, radius);
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      context.stroke();
    };

    const drawText = (text, x, y, size, color, align = "left", weight = 700, alpha = 1) => {
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = color;
      context.font = `${weight} ${size}px ${fontFamily}`;
      context.textAlign = align;
      context.textBaseline = "middle";
      context.fillText(text, x, y);
      context.restore();
    };

    const getStageProfile = (value = distance) => {
      const language = getCurrentLanguage();
      const labels =
        language === "it"
          ? {
              salento: { badge: "Studio", title: "Warm up" },
              roma: { badge: "Build", title: "System sprint" },
              digital: { badge: "Scale", title: "Cloud ops" }
            }
          : {
              salento: { badge: "Studio", title: "Warm up" },
              roma: { badge: "Build", title: "System sprint" },
              digital: { badge: "Scale", title: "Cloud ops" }
            };

      if (value >= stageThresholds.digital) {
        return {
          key: "digital",
          accent: "#edd1bf",
          secondary: "#d39c84",
          skyTop: "#1a1620",
          skyBottom: "#4a2c36",
          horizon: "#3e2732",
          ground: "#221920",
          lane: "#6b4c48",
          grid: "rgba(237, 209, 191, 0.18)",
          label: labels.digital.badge,
          title: labels.digital.title,
          billboardFill: "#241c28",
          billboardStroke: "rgba(237, 209, 191, 0.28)"
        };
      }

      if (value >= stageThresholds.roma) {
        return {
          key: "roma",
          accent: "#edd1bf",
          secondary: "#d39c84",
          skyTop: "#d8b59d",
          skyBottom: "#8c5f53",
          horizon: "#735047",
          ground: "#3a2a28",
          lane: "#8c6655",
          grid: "rgba(255, 230, 214, 0.18)",
          label: labels.roma.badge,
          title: labels.roma.title,
          billboardFill: "#33262d",
          billboardStroke: "rgba(232, 189, 167, 0.28)"
        };
      }

      return {
        key: "salento",
        accent: "#edd1bf",
        secondary: "#d8a289",
        skyTop: "#efd2bf",
        skyBottom: "#c68568",
        horizon: "#9a6d62",
        ground: "#473634",
        lane: "#8f6858",
        grid: "rgba(237, 209, 191, 0.14)",
        label: labels.salento.badge,
        title: labels.salento.title,
        billboardFill: "#2a2028",
        billboardStroke: "rgba(232, 189, 167, 0.22)"
      };
    };

    const getStatusLabel = () => {
      if (gameOver) {
        return `${t("snake.gameOver", "Game over")} · ${bestScoreLabel()}`;
      }

      if (started) {
        return getStageProfile().label;
      }

      return t("snake.ready", "Ready");
    };

    const bestScoreLabel = () => {
      const language = getCurrentLanguage();
      return language === "it" ? `Best ${bestScore}` : `Best ${bestScore}`;
    };

    const updateHud = () => {
      scoreNode.textContent = String(score);
      statusNode.textContent = getStatusLabel();
      actionButton.textContent = t(started ? "snake.restart" : "snake.start", started ? "Restart" : "Start");
    };

    const emitParticles = (x, y, count, palette, forceX = 0) => {
      for (let index = 0; index < count; index += 1) {
        particles.push({
          x,
          y,
          vx: forceX + randomBetween(-0.08, 0.12),
          vy: randomBetween(-0.28, -0.06),
          size: randomBetween(1.5, 4.6),
          color: pickRandom(palette),
          life: randomBetween(260, 580),
          maxLife: randomBetween(260, 580)
        });
      }
    };

    const spawnScenery = () => {
      const activeStage = getStageProfile();
      const stageOptions = {
        salento: ["palm", "lighthouse", "trullo", "billboard"],
        roma: ["colosseum-mini", "cypress", "arch", "billboard"],
        digital: ["tower", "signal", "chip", "billboard"]
      };
      const kind = pickRandom(stageOptions[activeStage.key]);
      const layer = Math.random() > 0.42 ? "mid" : "far";

      scenery.push({
        kind,
        layer,
        x: width + randomBetween(10, 84),
        y: groundY,
        width: kind === "billboard" ? randomBetween(30, 46) : randomBetween(22, 40),
        height: randomBetween(24, 54),
        scale: layer === "mid" ? randomBetween(0.92, 1.15) : randomBetween(0.64, 0.9),
        label: kind === "billboard" ? pickRandom(brandNames) : "",
        color: activeStage.accent,
        accent: activeStage.secondary
      });
    };

    const spawnObstacle = () => {
      const activeStage = getStageProfile();
      const progress = clamp(score / 30, 0, 1);
      const stageOptions = {
        salento:
          score < 6
            ? [{ style: "beach-bag", width: 18, height: 18 }]
            : [
                { style: "beach-bag", width: 18 + progress * 2, height: 18 + progress * 3 },
                { style: "crate", width: 18 + progress * 2, height: 22 + progress * 4 }
              ],
        roma:
          score < 12
            ? [{ style: "column", width: 16, height: 26 }]
            : [
                { style: "column", width: 16 + progress * 2, height: 28 + progress * 5 },
                { style: "arch-block", width: 20 + progress * 3, height: 18 + progress * 3 }
              ],
        digital:
          score < 20
            ? [{ style: "briefcase", width: 22, height: 16 }]
            : [
                { style: "data-block", width: 20 + progress * 2, height: 22 + progress * 4 },
                { style: "briefcase", width: 22 + progress * 3, height: 16 + progress * 2 },
                { style: "fragrance", width: 16 + progress * 2, height: 22 + progress * 3 }
              ]
      };

      const config = pickRandom(stageOptions[activeStage.key]);
      const heightValue = Math.round(config.height + Math.random() * Math.max(2, 4 * progress));

      obstacles.push({
        x: width + 6,
        y: groundY - heightValue,
        width: Math.round(config.width),
        height: heightValue,
        style: config.style,
        counted: false
      });
    };

    const drawSalentoBackdrop = () => {
      context.save();
      const seaGradient = context.createLinearGradient(0, groundY - 58, 0, groundY + 8);
      seaGradient.addColorStop(0, "rgba(123, 116, 136, 0.42)");
      seaGradient.addColorStop(1, "rgba(53, 46, 60, 0.94)");
      context.fillStyle = seaGradient;
      context.fillRect(0, groundY - 54, width, 54);

      context.fillStyle = "rgba(248, 219, 176, 0.9)";
      context.beginPath();
      context.arc(width * 0.76, groundY - 44, 15, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = "rgba(255, 236, 215, 0.2)";
      context.lineWidth = 1;
      for (let row = 0; row < 5; row += 1) {
        const y = groundY - 48 + row * 9;
        context.beginPath();
        context.moveTo((-horizonOffset * 0.4) % 18, y);
        for (let x = 0; x < width + 18; x += 18) {
          context.quadraticCurveTo(x + 6, y - 1.4, x + 12, y);
        }
        context.stroke();
      }

      context.fillStyle = "rgba(99, 74, 70, 0.76)";
      context.beginPath();
      context.moveTo(0, groundY - 24);
      context.quadraticCurveTo(28, groundY - 32, 66, groundY - 26);
      context.quadraticCurveTo(94, groundY - 38, 132, groundY - 30);
      context.quadraticCurveTo(166, groundY - 40, 216, groundY - 26);
      context.lineTo(216, groundY);
      context.lineTo(0, groundY);
      context.closePath();
      context.fill();
      context.restore();
    };

    const drawRomaBackdrop = () => {
      context.save();
      context.fillStyle = "rgba(109, 82, 74, 0.84)";
      context.fillRect(0, groundY - 52, width, 52);

      context.fillStyle = "rgba(70, 46, 42, 0.9)";
      const baseX = 54;
      const baseY = groundY - 28;
      const bodyWidth = 108;
      const bodyHeight = 40;
      fillRoundedRect(baseX, baseY - bodyHeight, bodyWidth, bodyHeight, 12, "rgba(92, 66, 58, 0.94)");
      context.fillStyle = "rgba(255, 230, 208, 0.16)";
      for (let row = 0; row < 2; row += 1) {
        for (let column = 0; column < 5; column += 1) {
          context.beginPath();
          context.arc(baseX + 14 + column * 18, baseY - 9 - row * 15, 5.2, Math.PI, 0);
          context.fill();
        }
      }

      context.fillStyle = "rgba(63, 43, 41, 0.94)";
      context.beginPath();
      context.moveTo(0, groundY - 18);
      context.lineTo(22, groundY - 34);
      context.lineTo(30, groundY);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(width - 14, groundY - 12);
      context.lineTo(width - 24, groundY - 34);
      context.lineTo(width - 34, groundY);
      context.closePath();
      context.fill();
      context.restore();
    };

    const drawDigitalBackdrop = () => {
      context.save();
      context.fillStyle = "rgba(28, 21, 31, 0.96)";
      context.fillRect(0, groundY - 58, width, 58);

      context.strokeStyle = "rgba(237, 209, 191, 0.14)";
      context.lineWidth = 1;
      for (let y = groundY - 56; y < groundY; y += 10) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      for (let x = ((-horizonOffset * 0.6) % 18) - 18; x < width + 18; x += 18) {
        context.beginPath();
        context.moveTo(x, groundY - 58);
        context.lineTo(x, groundY);
        context.stroke();
      }

      const towerWidths = [14, 10, 18, 13, 16, 11];
      let currentX = 18;
      towerWidths.forEach((towerWidth, index) => {
        const towerHeight = 16 + (index % 3) * 10 + towerWidth;
        fillRoundedRect(currentX, groundY - towerHeight, towerWidth, towerHeight, 3, "rgba(56, 38, 47, 0.94)");
        fillRoundedRect(currentX + 3, groundY - towerHeight + 4, 2, 2, 1, "rgba(237, 209, 191, 0.42)");
        fillRoundedRect(currentX + towerWidth - 5, groundY - towerHeight + 12, 2, 2, 1, "rgba(237, 209, 191, 0.42)");
        currentX += towerWidth + 18;
      });

      const glow = context.createRadialGradient(width * 0.72, groundY - 34, 4, width * 0.72, groundY - 34, 42);
      glow.addColorStop(0, "rgba(216, 162, 137, 0.16)");
      glow.addColorStop(1, "rgba(216, 162, 137, 0)");
      context.fillStyle = glow;
      context.fillRect(width * 0.45, groundY - 78, 100, 100);
      context.restore();
    };

    const drawBackdrop = (activeStage) => {
      context.clearRect(0, 0, width, height);

      const sky = context.createLinearGradient(0, 0, 0, groundY);
      sky.addColorStop(0, activeStage.skyTop);
      sky.addColorStop(1, activeStage.skyBottom);
      context.fillStyle = sky;
      context.fillRect(0, 0, width, groundY);

      if (activeStage.key === "salento") {
        drawSalentoBackdrop();
      } else if (activeStage.key === "roma") {
        drawRomaBackdrop();
      } else {
        drawDigitalBackdrop();
      }

      context.fillStyle = activeStage.ground;
      context.fillRect(0, groundY, width, groundHeight);

      context.strokeStyle = activeStage.grid;
      context.lineWidth = activeStage.key === "digital" ? 1 : 1.4;
      for (let x = -horizonOffset; x < width + 24; x += 24) {
        context.beginPath();
        context.moveTo(x, groundY + 8.5);
        context.lineTo(x + 12, groundY + 8.5);
        context.stroke();
      }

      context.strokeStyle = "rgba(255, 255, 255, 0.12)";
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(0, groundY + 0.5);
      context.lineTo(width, groundY + 0.5);
      context.stroke();
    };

    const drawSceneryItem = (item, activeStage) => {
      const baseY = groundY;
      const scale = item.scale;
      const x = item.x;
      const y = baseY;
      const alpha = item.layer === "far" ? 0.5 : 0.9;

      context.save();
      context.globalAlpha = alpha;

      if (item.kind === "billboard") {
        const boardWidth = item.width * scale;
        const boardHeight = item.height * 0.52 * scale;
        const postHeight = 16 * scale;
        fillRoundedRect(x, y - boardHeight - postHeight - 4, boardWidth, boardHeight, 6, activeStage.billboardFill);
        strokeRoundedRect(x, y - boardHeight - postHeight - 4, boardWidth, boardHeight, 6, activeStage.billboardStroke, 1);
        fillRoundedRect(x + boardWidth * 0.46, y - postHeight - 4, 4 * scale, postHeight, 2, "rgba(45, 29, 26, 0.86)");
        drawText(item.label, x + boardWidth / 2, y - boardHeight / 2 - postHeight - 4, 6.5 * scale, "#f3eadc", "center", 800);
      } else if (item.kind === "palm") {
        fillRoundedRect(x + 6 * scale, y - 26 * scale, 4 * scale, 26 * scale, 2, "rgba(90, 51, 35, 0.92)");
        context.fillStyle = "rgba(39, 94, 58, 0.86)";
        for (let leaf = 0; leaf < 4; leaf += 1) {
          context.beginPath();
          context.ellipse(x + 8 * scale, y - 26 * scale, 14 * scale, 4 * scale, (-0.6 + leaf * 0.4), 0, Math.PI * 2);
          context.fill();
        }
      } else if (item.kind === "lighthouse") {
        fillRoundedRect(x + 5 * scale, y - 30 * scale, 10 * scale, 30 * scale, 4, "rgba(245, 236, 222, 0.76)");
        fillRoundedRect(x + 7 * scale, y - 34 * scale, 6 * scale, 6 * scale, 2, "rgba(255, 177, 94, 0.86)");
      } else if (item.kind === "trullo") {
        fillRoundedRect(x + 3 * scale, y - 16 * scale, 18 * scale, 16 * scale, 4, "rgba(233, 224, 214, 0.74)");
        context.fillStyle = "rgba(84, 63, 53, 0.92)";
        context.beginPath();
        context.moveTo(x, y - 16 * scale);
        context.lineTo(x + 12 * scale, y - 30 * scale);
        context.lineTo(x + 24 * scale, y - 16 * scale);
        context.closePath();
        context.fill();
      } else if (item.kind === "colosseum-mini") {
        fillRoundedRect(x, y - 20 * scale, 28 * scale, 20 * scale, 7, "rgba(106, 74, 60, 0.84)");
        context.fillStyle = "rgba(248, 215, 172, 0.16)";
        for (let arch = 0; arch < 3; arch += 1) {
          context.beginPath();
          context.arc(x + 6 * scale + arch * 8 * scale, y - 7 * scale, 3 * scale, Math.PI, 0);
          context.fill();
        }
      } else if (item.kind === "cypress") {
        fillRoundedRect(x + 8 * scale, y - 22 * scale, 4 * scale, 22 * scale, 2, "rgba(48, 30, 27, 0.88)");
        context.beginPath();
        context.ellipse(x + 10 * scale, y - 26 * scale, 8 * scale, 18 * scale, 0, 0, Math.PI * 2);
        context.fillStyle = "rgba(41, 62, 43, 0.9)";
        context.fill();
      } else if (item.kind === "arch") {
        fillRoundedRect(x, y - 18 * scale, 26 * scale, 18 * scale, 5, "rgba(125, 89, 70, 0.84)");
        fillRoundedRect(x + 8 * scale, y - 12 * scale, 10 * scale, 12 * scale, 3, activeStage.horizon);
      } else if (item.kind === "tower") {
        fillRoundedRect(x, y - 28 * scale, 18 * scale, 28 * scale, 4, "rgba(16, 47, 61, 0.94)");
        fillRoundedRect(x + 5 * scale, y - 24 * scale, 2 * scale, 2 * scale, 1, "rgba(133, 243, 224, 0.74)");
        fillRoundedRect(x + 11 * scale, y - 16 * scale, 2 * scale, 2 * scale, 1, "rgba(133, 243, 224, 0.74)");
      } else if (item.kind === "signal") {
        fillRoundedRect(x + 8 * scale, y - 24 * scale, 3 * scale, 24 * scale, 2, "rgba(17, 44, 56, 0.94)");
        context.strokeStyle = "rgba(95, 242, 218, 0.72)";
        context.lineWidth = 1.4;
        for (let ring = 0; ring < 3; ring += 1) {
          context.beginPath();
          context.arc(x + 9.5 * scale, y - 24 * scale, 6 * scale + ring * 4 * scale, -1.1, -0.1);
          context.stroke();
        }
      } else if (item.kind === "chip") {
        fillRoundedRect(x + 2 * scale, y - 16 * scale, 20 * scale, 16 * scale, 4, "rgba(15, 51, 65, 0.92)");
        strokeRoundedRect(x + 2 * scale, y - 16 * scale, 20 * scale, 16 * scale, 4, "rgba(92, 244, 222, 0.46)", 1);
      }

      context.restore();
    };

    const drawObstacle = (obstacle, activeStage) => {
      const { x, y, width: obstacleWidth, height: obstacleHeight, style } = obstacle;
      context.save();
      context.shadowBlur = 16;
      context.shadowColor = "rgba(237, 209, 191, 0.16)";

      if (style === "beach-bag") {
        fillRoundedRect(x, y + 4, obstacleWidth, obstacleHeight - 4, 5, "#f1e2d6");
        strokeRoundedRect(x, y + 4, obstacleWidth, obstacleHeight - 4, 5, "rgba(79, 56, 52, 0.5)", 1.2);
        context.strokeStyle = "rgba(121, 79, 67, 0.5)";
        context.lineWidth = 2;
        context.beginPath();
        context.arc(x + obstacleWidth / 2, y + 8, obstacleWidth * 0.22, Math.PI, 0);
        context.stroke();
      } else if (style === "crate") {
        fillRoundedRect(x, y, obstacleWidth, obstacleHeight, 5, "#e2b493");
        context.strokeStyle = "rgba(92, 56, 34, 0.56)";
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(x + 4, y + 4);
        context.lineTo(x + obstacleWidth - 4, y + obstacleHeight - 4);
        context.moveTo(x + obstacleWidth - 4, y + 4);
        context.lineTo(x + 4, y + obstacleHeight - 4);
        context.stroke();
      } else if (style === "column") {
        fillRoundedRect(x + 2, y + 4, obstacleWidth - 4, obstacleHeight - 4, 4, "#f3e6d9");
        fillRoundedRect(x, y, obstacleWidth, 6, 3, "#fff2e8");
        fillRoundedRect(x, y + obstacleHeight - 6, obstacleWidth, 6, 3, "#fff2e8");
        strokeRoundedRect(x + 2, y + 4, obstacleWidth - 4, obstacleHeight - 4, 4, "rgba(89, 66, 61, 0.26)", 1);
      } else if (style === "arch-block") {
        fillRoundedRect(x, y + 6, obstacleWidth, obstacleHeight - 6, 5, "#f0ddd0");
        strokeRoundedRect(x, y + 6, obstacleWidth, obstacleHeight - 6, 5, "rgba(79, 56, 52, 0.28)", 1);
        fillRoundedRect(x + 7, y + 10, obstacleWidth - 14, obstacleHeight - 10, 3, "rgba(115, 80, 71, 0.84)");
      } else if (style === "data-block") {
        fillRoundedRect(x, y, obstacleWidth, obstacleHeight, 5, "#f0ddd0");
        strokeRoundedRect(x, y, obstacleWidth, obstacleHeight, 5, "rgba(88, 58, 56, 0.38)", 1.2);
        context.strokeStyle = "rgba(125, 76, 64, 0.3)";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x + 4, y + 8);
        context.lineTo(x + obstacleWidth - 4, y + 8);
        context.moveTo(x + 4, y + 14);
        context.lineTo(x + obstacleWidth - 4, y + 14);
        context.stroke();
      } else if (style === "briefcase") {
        fillRoundedRect(x, y + 5, obstacleWidth, obstacleHeight - 5, 5, "#f0ddd0");
        fillRoundedRect(x + obstacleWidth * 0.26, y, obstacleWidth * 0.48, 6, 3, "#d6b2a0");
        drawText("AI", x + obstacleWidth / 2, y + obstacleHeight * 0.56, 7, "#5a3f39", "center", 800);
      } else if (style === "fragrance") {
        fillRoundedRect(x + 2, y + 6, obstacleWidth - 4, obstacleHeight - 6, 6, "#fff2e8");
        strokeRoundedRect(x + 2, y + 6, obstacleWidth - 4, obstacleHeight - 6, 6, "rgba(90, 56, 52, 0.24)", 1);
        fillRoundedRect(x + obstacleWidth * 0.3, y, obstacleWidth * 0.4, 7, 2, "#d6b2a0");
        drawText("O", x + obstacleWidth / 2, y + obstacleHeight * 0.62, 8, "#6b4b44", "center", 800);
      } else {
        fillRoundedRect(x, y, obstacleWidth, obstacleHeight, 5, activeStage.accent);
      }

      strokeRoundedRect(x, y + Math.min(6, obstacleHeight * 0.18), obstacleWidth, Math.max(10, obstacleHeight - Math.min(6, obstacleHeight * 0.18)), 5, "rgba(69, 45, 44, 0.18)", 1);

      context.restore();
    };

    const drawRunner = () => {
      if (!runner) {
        return;
      }

      const verticalStretch = clamp(1 - runner.velocityY * 0.12, 0.9, 1.15);
      const shadowWidth = runner.jumping ? 12 : 16;
      const legSwing = runner.jumping ? 0 : Math.sin(runner.phase) * 3.4;

      context.save();
      context.globalAlpha = 0.28;
      context.fillStyle = "#000";
      context.beginPath();
      context.ellipse(runner.x + runner.width / 2, groundY + 2, shadowWidth, 4, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();

      context.save();
      context.translate(runner.x, runner.y);
      context.scale(1, verticalStretch);

      fillRoundedRect(4, 7, 10, 14, 5, "#503b3a");
      fillRoundedRect(5, 20, 4, 10, 2, "#e2b493");
      fillRoundedRect(10, 20, 4, 10, 2, "#e2b493");
      fillRoundedRect(4 + legSwing * 0.22, 20, 4, 10, 2, "#2e272d");
      fillRoundedRect(10 - legSwing * 0.22, 20, 4, 10, 2, "#2e272d");
      fillRoundedRect(2, 10, 4, 9, 2, "#e2b493");
      fillRoundedRect(12, 10, 4, 9, 2, "#e2b493");
      fillRoundedRect(1.5 + legSwing * 0.24, 11, 4, 8, 2, "#d39c84");
      fillRoundedRect(11.5 - legSwing * 0.24, 11, 4, 8, 2, "#d39c84");

      context.fillStyle = "#e8bf9f";
      context.beginPath();
      context.arc(9, 4.8, 4.6, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "#6d362d";
      context.beginPath();
      context.arc(8.3, 4.2, 4.1, Math.PI, Math.PI * 2);
      context.fill();

      fillRoundedRect(7.8, 3.6, 2.4, 2.2, 1, "#231820");
      fillRoundedRect(13.2, 11.2, 3.2, 6.4, 2, "#edd1bf");
      context.restore();
    };

    const drawParticles = () => {
      particles.forEach((particle) => {
        const alpha = clamp(particle.life / particle.maxLife, 0, 1);
        context.save();
        context.globalAlpha = alpha;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
        context.restore();
      });
    };

    const drawOverlay = (activeStage) => {
      if (started && !gameOver) {
        return;
      }

      context.save();
      context.fillStyle = "rgba(18, 14, 20, 0.34)";
      context.fillRect(0, 0, width, height);

      if (!started && !gameOver) {
        drawText(activeStage.label.toUpperCase(), width / 2, 58, 13, activeStage.accent, "center", 800, 0.96);
        drawText(activeStage.title, width / 2, 77, 11, "#fff2e8", "center", 700, 0.94);
        drawText(t("snake.tapHint", "Tap to jump"), width / 2, 178, 11, "#fff2e8", "center", 700, 0.96);
      }

      if (gameOver) {
        drawText(t("snake.gameOver", "Game over"), width / 2, 62, 17, "#fff2e8", "center", 800, 0.98);
        drawText(`${t("snake.scoreLabel", "Score")} ${score}`, width / 2, 86, 11, activeStage.accent, "center", 800, 0.94);
        drawText(bestScoreLabel(), width / 2, 103, 10, "#fff2e8", "center", 700, 0.9);
        drawText(t("snake.restart", "Restart"), width / 2, 182, 11, "#fff2e8", "center", 800, 0.94);
      }

      context.restore();
    };

    const drawAnnouncement = (activeStage) => {
      if (stageAnnouncement <= 0) {
        return;
      }

      const alpha = clamp(stageAnnouncement / 1100, 0, 1);
      fillRoundedRect(width / 2 - 58, 12, 116, 18, 999, "rgba(10, 14, 16, 0.44)");
      strokeRoundedRect(width / 2 - 58, 12, 116, 18, 999, "rgba(255, 255, 255, 0.12)", 1);
      drawText(activeStage.label.toUpperCase(), width / 2, 21, 8, activeStage.accent, "center", 800, alpha);
    };

    const drawHudCanvas = (activeStage) => {
      drawText(bestScoreLabel(), 12, 14, 8, "rgba(246, 238, 228, 0.78)", "left", 700);
      drawText(activeStage.label.toUpperCase(), width - 12, 14, 8, activeStage.accent, "right", 800);
      drawAnnouncement(activeStage);

      if (flashAlpha > 0) {
        context.save();
        context.globalAlpha = flashAlpha;
        context.fillStyle = "#fff";
        context.fillRect(0, 0, width, height);
        context.restore();
      }
    };

    const drawBoard = () => {
      const activeStage = getStageProfile();
      drawBackdrop(activeStage);

      scenery
        .slice()
        .sort((left, right) => (left.layer === right.layer ? left.x - right.x : left.layer === "far" ? -1 : 1))
        .forEach((item) => drawSceneryItem(item, activeStage));

      obstacles.forEach((obstacle) => drawObstacle(obstacle, activeStage));
      drawParticles();
      drawRunner();
      drawHudCanvas(activeStage);
      drawOverlay(activeStage);
    };

    const resetState = () => {
      bestScore = loadBestScore();
      runner = {
        x: 34,
        y: groundY - 28,
        width: 18,
        height: 28,
        velocityY: 0,
        jumping: false,
        phase: 0
      };
      obstacles = [];
      scenery = [];
      particles = [];
      score = 0;
      gameOver = false;
      started = false;
      lastTimestamp = 0;
      spawnCooldown = 1320;
      sceneryCooldown = 220;
      speed = 0.138;
      horizonOffset = 0;
      distance = 0;
      stageAnnouncement = 1200;
      stageKey = "salento";
      flashAlpha = 0;
      updateHud();
      drawBoard();
    };

    const jump = () => {
      if (!runner || runner.jumping) {
        return;
      }
      runner.velocityY = jumpVelocity;
      runner.jumping = true;
      emitParticles(runner.x + 7, groundY + 1, 7, ["#f3d27f", "#ffd890", "#b58461"], -0.02);
    };

    const triggerGameOver = () => {
      started = false;
      gameOver = true;
      flashAlpha = 0.22;
      emitParticles(runner.x + runner.width * 0.7, runner.y + runner.height * 0.45, 14, ["#fff1d2", "#ffbf86", "#ff8b68"], 0.03);
      if (score > bestScore) {
        bestScore = score;
        persistBestScore();
      }
      updateHud();
      drawBoard();
    };

    const checkCollision = (obstacle) => {
      if (!runner) {
        return false;
      }

      const insetX = 5;
      const insetTop = 4;
      const insetBottom = 3;
      return (
        runner.x + insetX < obstacle.x + obstacle.width &&
        runner.x + runner.width - insetX > obstacle.x &&
        runner.y + insetTop < obstacle.y + obstacle.height &&
        runner.y + runner.height - insetBottom > obstacle.y
      );
    };

    const updateStage = () => {
      const nextStage = getStageProfile().key;
      if (nextStage !== stageKey) {
        stageKey = nextStage;
        stageAnnouncement = 1100;
      }
    };

    const updateParticles = (delta) => {
      particles = particles.filter((particle) => particle.life > 0);
      particles.forEach((particle) => {
        particle.life -= delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vy += 0.0006 * delta;
      });
    };

    const step = (delta) => {
      if (!runner) {
        return;
      }

      distance += delta * speed * 0.08;
      updateStage();

      runner.phase += delta * speed * 0.032;
      runner.velocityY += gravity * delta;
      runner.y += runner.velocityY * delta;

      if (runner.y >= groundY - runner.height) {
        if (runner.jumping) {
          emitParticles(runner.x + 8, groundY + 1, 6, ["#d6a97a", "#9c6746", "#694232"], -0.015);
        }
        runner.y = groundY - runner.height;
        runner.velocityY = 0;
        runner.jumping = false;
      }

      const difficulty = clamp(score / 30, 0, 1);
      const speedCap = 0.19 + difficulty * 0.055;
      speed = Math.min(speedCap, speed + delta * (0.0000016 + difficulty * 0.0000018));
      horizonOffset = (horizonOffset + delta * speed * 0.34) % 24;
      spawnCooldown -= delta;
      sceneryCooldown -= delta;
      stageAnnouncement = Math.max(0, stageAnnouncement - delta);
      flashAlpha = Math.max(0, flashAlpha - delta * 0.0012);

      if (sceneryCooldown <= 0) {
        spawnScenery();
        sceneryCooldown = 300 + Math.random() * 360;
      }

      if (spawnCooldown <= 0) {
        spawnObstacle();
        spawnCooldown = randomBetween(1120 - difficulty * 240, 1480 - difficulty * 320);
      }

      scenery = scenery.filter((item) => item.x + item.width * item.scale > -30);
      scenery.forEach((item) => {
        const parallax = item.layer === "far" ? 0.24 : 0.48;
        item.x -= delta * speed * parallax;
      });

      obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > -12);
      for (const obstacle of obstacles) {
        obstacle.x -= delta * speed;

        if (!obstacle.counted && obstacle.x + obstacle.width < runner.x) {
          obstacle.counted = true;
          score += 1;
          if (score > bestScore) {
            bestScore = score;
            persistBestScore();
          }
          emitParticles(obstacle.x + obstacle.width * 0.35, obstacle.y + 3, 5, [getStageProfile().accent, "#fff1cf"], -0.04);
        }

        if (checkCollision(obstacle)) {
          triggerGameOver();
          return;
        }
      }

      updateParticles(delta);
      updateHud();
      drawBoard();
    };

    const onFrame = (timestamp) => {
      frameId = window.requestAnimationFrame(onFrame);

      if (!started) {
        lastTimestamp = timestamp;
        return;
      }

      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      const delta = Math.min(32, timestamp - lastTimestamp || 16);
      lastTimestamp = timestamp;
      step(delta);
    };

    const restartGame = () => {
      resetState();
      started = true;
      gameOver = false;
      lastTimestamp = 0;
      updateHud();
      drawBoard();
      canvas.focus({ preventScroll: true });
    };

    const handleTap = () => {
      if (gameOver) {
        restartGame();
        return;
      }

      if (!started) {
        restartGame();
        return;
      }

      jump();
    };

    const stopCubeInteraction = (event) => {
      event.stopPropagation();
    };

    actionButton.addEventListener("click", (event) => {
      event.preventDefault();
      stopCubeInteraction(event);
      restartGame();
    });

    canvas.addEventListener("keydown", (event) => {
      const action = keyMap[event.key];
      if (!action) {
        return;
      }

      event.preventDefault();
      handleTap();
    });

    canvas.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      stopCubeInteraction(event);
      canvas.focus({ preventScroll: true });
      handleTap();
    });

    window.addEventListener("i18n:change", () => {
      updateHud();
      drawBoard();
    });
    window.addEventListener("beforeunload", () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    });

    resetState();
    frameId = window.requestAnimationFrame(onFrame);
  };

  const initCubeStage = () => {
    const body = document.body;
    const closeBtn = document.querySelector("[data-cube-stage-close]");
    const cubeSection = document.getElementById("project-cube");
    const cubeScene = document.querySelector("[data-cube-scene]");

    if (!body || !cubeSection) {
      return;
    }

    let openingResetId = null;

    const isOpen = () => body.classList.contains("is-cube-stage-open");

    const openCubeStage = ({ scroll = true, face = null } = {}) => {
      const alreadyOpen = isOpen();

      if (!alreadyOpen) {
        body.classList.remove("is-cube-stage-closed");
        body.classList.add("is-cube-stage-opening");
        window.requestAnimationFrame(() => {
          body.classList.add("is-cube-stage-open");
        });

        if (openingResetId !== null) {
          window.clearTimeout(openingResetId);
        }

        openingResetId = window.setTimeout(() => {
          body.classList.remove("is-cube-stage-opening");
          openingResetId = null;
        }, reduceMotion ? 0 : 820);

        if (face !== false) {
          const targetFace = face || "balance";
          const cubeApi = window.ProfileHub?.cube;
          if (cubeApi && typeof cubeApi.resetToFace === "function") {
            cubeApi.resetToFace(targetFace);
          }
        }
      }

      if (scroll) {
        const delay = alreadyOpen ? 0 : reduceMotion ? 0 : 100;
        window.setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: reduceMotion ? "auto" : "smooth"
          });
        }, delay);
      }

      return { alreadyOpen };
    };

    const closeCubeStage = () => {
      if (!isOpen()) {
        return;
      }
      body.classList.remove("is-cube-stage-open", "is-cube-stage-opening");
      body.classList.add("is-cube-stage-closed");
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    };

    if (cubeScene) {
      cubeScene.addEventListener("click", () => {
        if (!body.classList.contains("is-cube-stage-closed")) {
          return;
        }
        openCubeStage({ scroll: true, face: false });
        const cubeApi = window.ProfileHub?.cube;
        if (cubeApi?.unpause) {
          cubeApi.unpause(800);
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closeCubeStage);
    }

    window.ProfileHub = window.ProfileHub || {};
    window.ProfileHub.stage = {
      isOpen,
      openCubeStage,
      closeCubeStage
    };

    if (window.location.hash === "#project-cube") {
      openCubeStage({ scroll: false });
    }

    window.addEventListener("beforeunload", () => {
      if (openingResetId !== null) {
        window.clearTimeout(openingResetId);
      }
    });
  };

  const initHeroCubeLinks = () => {
    const links = [...document.querySelectorAll("[data-cube-target]")];
    if (!links.length) {
      return;
    }

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const face = link.getAttribute("data-cube-target");
        const cubeApi = window.ProfileHub?.cube;
        if (!face || !cubeApi || typeof cubeApi.rotateToFace !== "function") {
          return;
        }
        cubeApi.rotateToFace(face);
      });
    });
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
      if (!track) {
        return;
      }

      const hasManualControls = Boolean(prevButton && nextButton);
      const autoMode = carousel.dataset.carouselAuto === "true";
      let autoplayFrame = null;
      let resumeTimer = null;

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
        if (!hasManualControls) {
          return;
        }
        const maxScroll = track.scrollWidth - track.clientWidth - 2;
        prevButton.disabled = track.scrollLeft <= 2;
        nextButton.disabled = track.scrollLeft >= maxScroll;
      };

      const scrollByStep = (direction) => {
        track.scrollBy({
          left: getStep() * direction,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      };

      const stopAutoplay = () => {
        if (autoplayFrame !== null) {
          window.cancelAnimationFrame(autoplayFrame);
          autoplayFrame = null;
        }
      };

      const startAutoplay = () => {
        if (!autoMode || reduceMotion || autoplayFrame !== null) {
          return;
        }

        if (track.dataset.loopReady !== "true") {
          const cards = [...track.children];
          if (cards.length > 1) {
            const fragment = document.createDocumentFragment();
            cards.forEach((card) => {
              const clone = card.cloneNode(true);
              clone.setAttribute("aria-hidden", "true");
              fragment.appendChild(clone);
            });
            track.appendChild(fragment);
            track.dataset.loopReady = "true";
            track.classList.add("is-looping");
            initExternalLinks(track);
          }
        }

        let previousTimestamp = 0;
        const speedPxPerSecond = 26;

        const tick = (timestamp) => {
          if (!autoMode) {
            autoplayFrame = null;
            return;
          }

          if (!previousTimestamp) {
            previousTimestamp = timestamp;
          }

          const deltaSeconds = (timestamp - previousTimestamp) / 1000;
          previousTimestamp = timestamp;
          track.scrollLeft += speedPxPerSecond * deltaSeconds;

          const loopWidth = track.scrollWidth / 2;
          if (loopWidth > 0 && track.scrollLeft >= loopWidth) {
            track.scrollLeft -= loopWidth;
          }

          autoplayFrame = window.requestAnimationFrame(tick);
        };

        autoplayFrame = window.requestAnimationFrame(tick);
      };

      const scheduleResume = () => {
        if (!autoMode || reduceMotion) {
          return;
        }
        if (resumeTimer !== null) {
          window.clearTimeout(resumeTimer);
        }
        resumeTimer = window.setTimeout(() => {
          startAutoplay();
        }, 2600);
      };

      if (hasManualControls) {
        prevButton.addEventListener("click", () => {
          stopAutoplay();
          scrollByStep(-1);
          scheduleResume();
        });
        nextButton.addEventListener("click", () => {
          stopAutoplay();
          scrollByStep(1);
          scheduleResume();
        });
      }

      track.addEventListener("mouseenter", stopAutoplay);
      track.addEventListener("mouseleave", scheduleResume);
      track.addEventListener("pointerdown", () => {
        stopAutoplay();
        scheduleResume();
      });
      track.addEventListener("touchstart", stopAutoplay, { passive: true });
      track.addEventListener("wheel", () => {
        stopAutoplay();
        scheduleResume();
      }, { passive: true });
      track.addEventListener("focusin", stopAutoplay);
      track.addEventListener("focusout", scheduleResume);

      if (autoMode) {
        track.addEventListener(
          "scroll",
          () => {
            const loopWidth = track.scrollWidth / 2;
            if (loopWidth > 0 && track.scrollLeft >= loopWidth) {
              track.scrollLeft -= loopWidth;
            }
          },
          { passive: true }
        );
      }

      track.addEventListener("scroll", updateButtons, { passive: true });
      window.addEventListener("resize", updateButtons);
      updateButtons();
      startAutoplay();
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

    let lastTrigger = null;

    const getRoleDetails = (key) => {
      const safeKey = key || "ai-integration";
      const fallbackTitle = safeKey.replace(/-/g, " ");
      return {
        title: t(`focusModal.roles.${safeKey}.title`, fallbackTitle),
        description: t(`focusModal.roles.${safeKey}.description`, "")
      };
    };

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
      const payload = getRoleDetails(key);
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
          block: "start"
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
    const requestTypeField = form.querySelector("#requestType");

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
        setStatus("error", t("status.invalidContact", "Please check the highlighted fields."));
        return;
      }

      const data = new FormData(form);
      const values = Object.fromEntries(data.entries());
      const mailtoTarget = form.dataset.mailto || "mailto:andre@example.com";
      const fullName = String(values.fullName || "").trim();
      const requestType = requestTypeField?.selectedOptions?.[0]?.textContent?.trim() || String(values.requestType || "").trim();
      const message = String(values.message || "").trim();

      const subjectPrefix = t("email.contact.subjectPrefix", "Website Inquiry");
      const subject = encodeURIComponent(`[${subjectPrefix}] ${requestType} - ${fullName}`);
      const body = encodeURIComponent(
        [
          `${t("email.contact.labelName", "Name")}: ${fullName}`,
          `${t("email.contact.labelRequestType", "Request type")}: ${requestType}`,
          "",
          `${t("email.contact.labelMessage", "Message")}:`,
          message
        ].join("\n")
      );

      setStatus("success", t("status.openingContact", "Opening your email draft..."));

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

  const initStayPage = () => {
    const root = document.querySelector("[data-stay-page]");
    if (!root) {
      return null;
    }

    const stays = window.ProfileStays;
    if (!stays || typeof stays !== "object") {
      return null;
    }

    const stayKeys = Object.keys(stays);
    if (!stayKeys.length) {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    const requestedPlace = String(params.get("place") || "").trim().toLowerCase();
    const activePlace = Object.prototype.hasOwnProperty.call(stays, requestedPlace) ? requestedPlace : stayKeys[0];
    const stay = stays[activePlace];
    if (!stay) {
      return null;
    }

    const titleNode = root.querySelector("[data-stay-title]");
    const subtitleNode = root.querySelector("[data-stay-subtitle]");
    const coverNode = root.querySelector("[data-stay-cover]");
    const shortDescriptionNode = root.querySelector("[data-stay-short-description]");
    const longDescriptionNode = root.querySelector("[data-stay-long-description]");
    const locationBadge = root.querySelector("[data-stay-badge-location]");
    const guestsBadge = root.querySelector("[data-stay-badge-guests]");
    const airbnbLinks = [...root.querySelectorAll("[data-stay-airbnb], [data-stay-airbnb-inline], [data-stay-airbnb-sticky]")];
    const amenitiesList = root.querySelector("[data-stay-amenities]");
    const factsList = root.querySelector("[data-stay-facts]");
    const idealList = root.querySelector("[data-stay-ideal]");
    const gallerySection = root.querySelector("[data-stay-gallery-section]");
    const notesSection = root.querySelector("[data-stay-notes-section]");
    const notesList = root.querySelector("[data-stay-notes]");
    const gallery = root.querySelector("[data-stay-gallery]");
    const form = root.querySelector("[data-stay-booking-form]");
    const formStatus = root.querySelector("[data-stay-form-status]");
    const lightbox = document.querySelector("[data-stay-lightbox]");
    const lightboxImage = lightbox ? lightbox.querySelector("[data-stay-lightbox-image]") : null;
    const lightboxCaption = lightbox ? lightbox.querySelector("[data-stay-lightbox-caption]") : null;
    const lightboxClose = lightbox ? [...lightbox.querySelectorAll("[data-stay-lightbox-close]")] : [];

    const bookingEmail = stay.bookingEmail || "andre@example.com";
    const airbnbUrl = stay.airbnbUrl || "https://www.airbnb.com/";
    const detailData = stay.details || {};

    const resolveStayLocale = () => {
      const language = getCurrentLanguage();
      const localized = stay.i18n?.[language] || stay.i18n?.en || {};
      return localized;
    };

    const hasAmenity = (key) => Array.isArray(stay.amenities) && stay.amenities.includes(key);

    const renderStay = () => {
      const localized = resolveStayLocale();
      const displayTitle = localized.title || "";
      const displaySubtitle = localized.subtitle || "";
      const displayShortDescription = localized.shortDescription || "";
      const displayLongDescription = localized.longDescription || "";
      const displayLocation = localized.location || "";
      const displayNotes = Array.isArray(localized.houseNotes) ? localized.houseNotes : [];

      if (titleNode) {
        titleNode.textContent = displayTitle;
      }
      if (subtitleNode) {
        subtitleNode.textContent = displaySubtitle;
      }
      if (coverNode) {
        coverNode.src = stay.cover || "";
        coverNode.alt = displayTitle || t("stay.defaults.stayImage", "Stay image");
      }
      if (shortDescriptionNode) {
        shortDescriptionNode.textContent = displayShortDescription;
      }
      if (longDescriptionNode) {
        longDescriptionNode.textContent = displayLongDescription;
      }
      if (locationBadge) {
        locationBadge.textContent = displayLocation || t("stay.facts.location", "Location");
      }
      if (guestsBadge) {
        guestsBadge.textContent = t("stay.badges.guests", "{count} guests", { count: detailData.guests || 1 });
      }
      airbnbLinks.forEach((link) => {
        link.href = airbnbUrl;
      });

      const facts = [
        ["propertyType", t(`stay.propertyTypes.${detailData.propertyType}`, detailData.propertyType || "-")],
        ["maxGuests", detailData.guests || "-"],
        ["bedrooms", detailData.bedrooms || "-"],
        ["beds", detailData.beds || "-"],
        ["bathrooms", detailData.bathrooms || "-"],
        ["wifi", hasAmenity("fastWifi") ? t("stay.factsValues.included", "Included") : t("stay.factsValues.onRequest", "On request")],
        [
          "workspace",
          hasAmenity("dedicatedWorkspace")
            ? t("stay.factsValues.included", "Included")
            : t("stay.factsValues.optional", "Optional")
        ],
        ["parking", hasAmenity("privateParking") ? t("stay.factsValues.available", "Available") : t("stay.factsValues.nearby", "Nearby options")],
        [
          "airConditioning",
          hasAmenity("airConditioning") ? t("stay.factsValues.included", "Included") : t("stay.factsValues.onRequest", "On request")
        ],
        ["beachDistance", detailData.beachDistance || "-"],
        ["location", displayLocation || "-"],
        ["registrationId", detailData.registrationCode || "-"]
      ];

      if (amenitiesList) {
        amenitiesList.innerHTML = (stay.amenities || [])
          .map((key) => `<li class="stay-amenity">${t(`stay.amenities.${key}`, key)}</li>`)
          .join("");
      }

      if (factsList) {
        factsList.innerHTML = facts
          .map(([labelKey, value]) => `<div class="stay-fact"><dt>${t(`stay.facts.${labelKey}`, labelKey)}</dt><dd>${value}</dd></div>`)
          .join("");
      }

      if (idealList) {
        idealList.innerHTML = (stay.idealFor || [])
          .map((key) => `<li class="stay-ideal-item">${t(`stay.ideal.${key}`, key)}</li>`)
          .join("");
        idealList.parentElement?.toggleAttribute("hidden", !idealList.innerHTML.trim());
      }

      if (notesSection && notesList) {
        if (!displayNotes.length) {
          notesSection.hidden = true;
        } else {
          notesSection.hidden = false;
          notesList.innerHTML = displayNotes.map((item) => `<li>${item}</li>`).join("");
        }
      }

      if (gallery) {
        const images = (stay.gallery || []).filter(Boolean);
        if (gallerySection) {
          gallerySection.hidden = images.length === 0;
        }
        gallery.innerHTML = images
          .map((imageSrc, index) => {
            const sequence = index + 1;
            return `
              <button
                type="button"
                class="stay-gallery-item${index === 0 ? " is-featured" : ""}"
                data-stay-gallery-open
                data-image-src="${imageSrc}"
                data-image-caption="${displayTitle} · ${sequence}"
              >
                <img src="${imageSrc}" alt="${displayTitle} ${sequence}" loading="lazy" />
              </button>
            `;
          })
          .join("");
      }

      if (i18n && typeof i18n.applyTranslations === "function") {
        i18n.applyTranslations(root);
      }

      const pageTitle = t("meta.stayPageTitle", "{stayTitle} | Andre Rizzo", { stayTitle: displayTitle || "Stay" });
      const pageDescription = t("meta.stayPageDescription", "{subtitle} {shortDescription}", {
        subtitle: displaySubtitle,
        shortDescription: displayShortDescription
      });

      document.title = pageTitle;
      const descMeta = document.querySelector('meta[data-meta="description"]');
      const ogTitle = document.querySelector('meta[data-meta="og:title"]');
      const ogDescription = document.querySelector('meta[data-meta="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      const twitterTitle = document.querySelector('meta[data-meta="twitter:title"]');
      const twitterDescription = document.querySelector('meta[data-meta="twitter:description"]');

      if (descMeta) {
        descMeta.setAttribute("content", pageDescription);
      }
      if (ogTitle) {
        ogTitle.setAttribute("content", pageTitle);
      }
      if (ogDescription) {
        ogDescription.setAttribute("content", pageDescription);
      }
      if (ogImage) {
        ogImage.setAttribute("content", stay.cover || "");
      }
      if (twitterTitle) {
        twitterTitle.setAttribute("content", pageTitle);
      }
      if (twitterDescription) {
        twitterDescription.setAttribute("content", pageDescription);
      }
    };

    if (gallery && lightbox && lightboxImage && lightboxCaption) {
      const openImage = (source, caption) => {
        lightboxImage.src = source;
        lightboxImage.alt = caption;
        lightboxCaption.textContent = caption;
        lightbox.hidden = false;
        document.body.style.overflow = "hidden";

        if (reduceMotion) {
          lightbox.classList.add("is-open");
          return;
        }
        window.requestAnimationFrame(() => {
          lightbox.classList.add("is-open");
        });
      };

      const closeImage = () => {
        lightbox.classList.remove("is-open");
        document.body.style.overflow = "";

        const completeClose = () => {
          lightbox.hidden = true;
          lightboxImage.src = "";
          lightboxImage.alt = "";
        };

        if (reduceMotion) {
          completeClose();
          return;
        }
        window.setTimeout(completeClose, 180);
      };

      gallery.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) {
          return;
        }
        const trigger = event.target.closest("[data-stay-gallery-open]");
        if (!trigger) {
          return;
        }
        openImage(
          trigger.getAttribute("data-image-src") || "",
          trigger.getAttribute("data-image-caption") || t("stay.defaults.stayImage", "Stay image")
        );
      });

      lightboxClose.forEach((node) => {
        node.addEventListener("click", closeImage);
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !lightbox.hidden) {
          closeImage();
        }
      });
    }

    if (form && formStatus) {
      const checkInField = form.querySelector("#stayCheckIn");
      const checkOutField = form.querySelector("#stayCheckOut");
      const guestsField = form.querySelector("#stayGuests");
      const fullNameField = form.querySelector("#stayFullName");
      const emailField = form.querySelector("#stayEmail");
      const messageField = form.querySelector("#stayMessage");
      const fields = [checkInField, checkOutField, guestsField, fullNameField, emailField, messageField].filter(Boolean);

      const setFormStatus = (state, message) => {
        formStatus.hidden = false;
        formStatus.dataset.state = state;
        formStatus.textContent = message;
      };

      const markField = (field, isValid) => {
        if (!field) {
          return;
        }
        field.classList.toggle("field-error", !isValid);
        field.setAttribute("aria-invalid", String(!isValid));
      };

      const validateDateOrder = () => {
        if (!checkInField || !checkOutField || !checkInField.value || !checkOutField.value) {
          return true;
        }

        const isValid = checkOutField.value > checkInField.value;
        markField(checkInField, isValid);
        markField(checkOutField, isValid);
        return isValid;
      };

      const validateField = (field) => {
        if (!field) {
          return true;
        }
        const isValid = field.checkValidity();
        markField(field, isValid);
        return isValid;
      };

      if (guestsField) {
        const maxGuests = Math.max(1, Number(detailData.guests) || 1);
        const singular = t("stay.form.guestSingular", "guest");
        const plural = t("stay.form.guestPlural", "guests");
        guestsField.innerHTML = [
          `<option value="" selected disabled>${t("stay.form.guestsPlaceholder", "Select guests")}</option>`,
          ...Array.from({ length: maxGuests }, (_, idx) => {
            const value = idx + 1;
            return `<option value="${value}">${value} ${value > 1 ? plural : singular}</option>`;
          })
        ].join("");
      }

      if (checkInField) {
        const today = new Date().toISOString().split("T")[0];
        checkInField.min = today;
        checkInField.addEventListener("change", () => {
          if (checkOutField) {
            checkOutField.min = checkInField.value || today;
          }
          validateDateOrder();
        });
      }

      if (checkOutField) {
        checkOutField.addEventListener("change", validateDateOrder);
      }

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

        const validFields = fields.every((field) => validateField(field));
        const validDates = validateDateOrder();

        if (!validFields || !validDates) {
          setFormStatus("error", t("status.invalidBooking", "Please check your booking details."));
          return;
        }

        const localized = resolveStayLocale();
        const values = Object.fromEntries(new FormData(form).entries());
        const subject = encodeURIComponent(`${t("email.stay.subjectPrefix", "Booking request")} - ${localized.title}`);
        const body = encodeURIComponent(
          [
            t("email.stay.greeting", "Hello,"),
            t("email.stay.intro", "I would like to request availability for the following stay:"),
            "",
            `${t("email.stay.lineProperty", "Property")}: ${localized.title}`,
            `${t("email.stay.lineCheckIn", "Check-in")}: ${values.checkIn}`,
            `${t("email.stay.lineCheckOut", "Check-out")}: ${values.checkOut}`,
            `${t("email.stay.lineGuests", "Guests")}: ${values.guests}`,
            `${t("email.stay.lineName", "Name")}: ${values.fullName}`,
            `${t("email.stay.lineEmail", "Email")}: ${values.email}`,
            "",
            `${t("email.stay.lineMessage", "Message")}:`,
            String(values.message || "").trim() || "-",
            "",
            t("email.stay.closing", "Please let me know availability and next steps.")
          ].join("\n")
        );

        setFormStatus("success", t("status.openingBooking", "Opening your booking email draft..."));
        window.setTimeout(() => {
          window.location.href = `mailto:${bookingEmail}?subject=${subject}&body=${body}`;
        }, reduceMotion ? 0 : 150);
      });
    }

    renderStay();
    initExternalLinks(root);

    const rerenderOnLanguageChange = () => {
      renderStay();
    };
    window.addEventListener("i18n:change", rerenderOnLanguageChange);

    return renderStay;
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

  const initCubeContactForm = () => {
    const form = document.querySelector("[data-cube-contact-form]");
    if (!form) {
      return;
    }

    const mailtoTarget = form.dataset.mailto || "mailto:andre@example.com";
    const fields = [...form.querySelectorAll("input, textarea")];
    const status = form.querySelector("[data-cube-contact-status]");
    const submitBtn = form.querySelector("[type=submit]");

    const setStatus = (state, message) => {
      if (!status) {
        return;
      }
      status.hidden = false;
      status.dataset.state = state;
      status.textContent = message;
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const allValid = fields.every((f) => f.checkValidity());
      if (!allValid) {
        fields.forEach((f) => {
          if (!f.checkValidity()) {
            f.classList.add("field-error");
          }
        });
        setStatus("error", t("cube.contactError", "Compila tutti i campi richiesti."));
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());
      const fullName = String(data.fullName || "").trim();
      const email = String(data.email || "").trim();
      const phone = String(data.phone || "").trim();
      const message = String(data.message || "").trim();
      const subject = encodeURIComponent(`[mylinks] ${fullName || "New message"}`);
      const body = encodeURIComponent(
        [
          `Name: ${fullName}`,
          `Email: ${email}`,
          `Phone: ${phone || "-"}`,
          "",
          "Message:",
          message
        ].join("\n")
      );

      submitBtn.disabled = true;
      setStatus("success", t("cube.contactSending", "Opening email draft..."));
      form.reset();
      fields.forEach((f) => f.classList.remove("field-error"));

      try {
        window.setTimeout(() => {
          window.location.href = `${mailtoTarget}?subject=${subject}&body=${body}`;
        }, reduceMotion ? 0 : 170);

        window.setTimeout(() => {
          setStatus("success", t("cube.contactSuccess", "Opening your email app..."));
          submitBtn.disabled = false;
        }, reduceMotion ? 0 : 190);
      } catch (_err) {
        submitBtn.disabled = false;
        setStatus("error", t("cube.contactFail", "Couldn't open the email draft. Please try again."));
      }
    });

    fields.forEach((field) => {
      field.addEventListener("input", () => {
        field.classList.remove("field-error");
      });
    });
  };

  const init = async () => {
    if (i18n && typeof i18n.initializeI18n === "function") {
      await i18n.initializeI18n();
      i18n.applyTranslations();
    }

    initReveal();
    initRoleRotator();
    initHeroParallax();
    initProjectCube();
    initCubeSnake();
    initCubeStage();
    initHeroCubeLinks();
    initExternalLinks();
    initCarousels();
    initFocusModal();
    initContactForm();
    initCubeContactForm();
    initStayPage();
    initFooterYear();
    initTrackingStub();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      void init();
    });
  } else {
    void init();
  }
})();
