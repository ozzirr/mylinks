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
      generale: { x: -18, y: 180 }
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

      const cubeHidden = document.body.classList.contains("is-cube-stage-closed");
      const shouldAutoRotate = !reduceMotion && !dragging && !pausedByFocus && !pausedByHover && !cubeHidden && timestamp > pauseUntil;
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
      pausedByHover = false;
      scene.releasePointerCapture(event.pointerId);
      endDrag();
    });

    scene.addEventListener("pointercancel", (event) => {
      if (event.pointerId !== pointerId) {
        return;
      }
      cube.classList.remove("is-dragging");
      pausedByHover = false;
      endDrag();
    });

    scene.addEventListener(
      "click",
      (event) => {
        if (!moved) {
          return;
        }
        const target = event.target;
        if (target instanceof Element && target.closest("a")) {
          event.preventDefault();
          event.stopPropagation();
        }
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
      resetToFace
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
    const groundHeight = 38;
    const groundY = height - groundHeight;
    const gravity = 0.0009;
    const jumpVelocity = -0.34;
    const keyMap = {
      ArrowUp: "jump",
      w: "jump",
      W: "jump",
      " ": "jump",
      Enter: "jump"
    };

    let runner = null;
    let obstacles = [];
    let score = 0;
    let started = false;
    let gameOver = false;
    let frameId = null;
    let lastTimestamp = 0;
    let spawnCooldown = 0;
    let speed = 0.16;
    let horizonOffset = 0;

    const drawRoundedRect = (x, y, w, h, radius, color) => {
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(x + radius, y);
      context.arcTo(x + w, y, x + w, y + h, radius);
      context.arcTo(x + w, y + h, x, y + h, radius);
      context.arcTo(x, y + h, x, y, radius);
      context.arcTo(x, y, x + w, y, radius);
      context.closePath();
      context.fill();
    };

    const drawBoard = () => {
      context.clearRect(0, 0, width, height);

      const sky = context.createLinearGradient(0, 0, 0, groundY);
      sky.addColorStop(0, "#102616");
      sky.addColorStop(1, "#0a140d");
      context.fillStyle = sky;
      context.fillRect(0, 0, width, groundY);

      context.fillStyle = "#0c1f11";
      context.fillRect(0, groundY, width, groundHeight);

      context.strokeStyle = "rgba(188, 235, 168, 0.16)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, groundY + 0.5);
      context.lineTo(width, groundY + 0.5);
      context.stroke();

      context.strokeStyle = "rgba(188, 235, 168, 0.08)";
      context.lineWidth = 1.4;
      for (let x = -horizonOffset; x < width + 24; x += 24) {
        context.beginPath();
        context.moveTo(x, groundY + 9);
        context.lineTo(x + 12, groundY + 9);
        context.stroke();
      }

      obstacles.forEach((obstacle) => {
        drawRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 6, "#b8f36c");
      });

      if (!runner) {
        return;
      }

      drawRoundedRect(runner.x, runner.y, runner.width, runner.height, 7, "#7dff92");
      drawRoundedRect(runner.x + runner.width - 6, runner.y + 4, 3, 3, 1.5, "#06200a");
      drawRoundedRect(runner.x + 5, runner.y + runner.height, 5, 8, 2, "#7dff92");
      drawRoundedRect(runner.x + runner.width - 10, runner.y + runner.height, 5, 8, 2, "#7dff92");
    };

    const getStatusLabel = () => {
      if (gameOver) {
        return t("snake.gameOver", "Game over");
      }
      if (started) {
        return t("snake.running", "Running");
      }
      return t("snake.ready", "Ready");
    };

    const updateHud = () => {
      scoreNode.textContent = String(score);
      statusNode.textContent = getStatusLabel();
      actionButton.textContent = t(started ? "snake.restart" : "snake.start", started ? "Restart" : "Start");
    };

    const spawnObstacle = () => {
      const heightValue = 20 + Math.floor(Math.random() * 26);
      const widthValue = 12 + Math.floor(Math.random() * 12);

      obstacles.push({
        x: width + 6,
        y: groundY - heightValue,
        width: widthValue,
        height: heightValue,
        counted: false
      });
    };

    const resetState = () => {
      runner = {
        x: 34,
        y: groundY - 24,
        width: 18,
        height: 24,
        velocityY: 0,
        jumping: false
      };
      obstacles = [];
      score = 0;
      gameOver = false;
      started = false;
      lastTimestamp = 0;
      spawnCooldown = 850;
      speed = 0.16;
      horizonOffset = 0;
      updateHud();
      drawBoard();
    };

    const jump = () => {
      if (!runner || runner.jumping) {
        return;
      }
      runner.velocityY = jumpVelocity;
      runner.jumping = true;
    };

    const triggerGameOver = () => {
      started = false;
      gameOver = true;
      updateHud();
      drawBoard();
    };

    const checkCollision = (obstacle) => {
      if (!runner) {
        return false;
      }

      return (
        runner.x < obstacle.x + obstacle.width &&
        runner.x + runner.width > obstacle.x &&
        runner.y < obstacle.y + obstacle.height &&
        runner.y + runner.height > obstacle.y
      );
    };

    const step = (delta) => {
      if (!runner) {
        return;
      }

      runner.velocityY += gravity * delta;
      runner.y += runner.velocityY * delta;

      if (runner.y >= groundY - runner.height) {
        runner.y = groundY - runner.height;
        runner.velocityY = 0;
        runner.jumping = false;
      }

      speed = Math.min(0.26, speed + delta * 0.0000035);
      horizonOffset = (horizonOffset + delta * speed * 0.24) % 24;
      spawnCooldown -= delta;

      if (spawnCooldown <= 0) {
        spawnObstacle();
        spawnCooldown = 820 + Math.random() * 560 - Math.min(220, score * 8);
      }

      obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > -8);

      for (const obstacle of obstacles) {
        obstacle.x -= delta * speed;

        if (!obstacle.counted && obstacle.x + obstacle.width < runner.x) {
          obstacle.counted = true;
          score += 1;
        }

        if (checkCollision(obstacle)) {
          triggerGameOver();
          return;
        }
      }

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

    window.addEventListener("i18n:change", updateHud);
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
    const trigger = document.querySelector("[data-cube-stage-trigger]");
    const closeBtn = document.querySelector("[data-cube-stage-close]");
    const cubeSection = document.getElementById("project-cube");

    if (!body || !trigger || !cubeSection) {
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

        const targetFace = face || "balance";
        const cubeApi = window.ProfileHub?.cube;
        if (cubeApi && typeof cubeApi.resetToFace === "function") {
          cubeApi.resetToFace(targetFace);
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

    trigger.addEventListener("click", () => {
      const cubeApi = window.ProfileHub?.cube;
      if (cubeApi && typeof cubeApi.resetToFace === "function") {
        cubeApi.resetToFace("balance");
      }
      openCubeStage({ scroll: true });
    });

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

    let pendingRotationId = null;

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const face = link.getAttribute("data-cube-target");
        const cubeApi = window.ProfileHub?.cube;
        const stageApi = window.ProfileHub?.stage;
        if (!face || !cubeApi || typeof cubeApi.rotateToFace !== "function") {
          return;
        }

        const wasClosed = stageApi && typeof stageApi.isOpen === "function" ? !stageApi.isOpen() : false;
        stageApi?.openCubeStage({ scroll: true });

        if (pendingRotationId !== null) {
          window.clearTimeout(pendingRotationId);
        }

        const rotate = () => {
          cubeApi.rotateToFace(face);
          pendingRotationId = null;
        };

        if (reduceMotion) {
          rotate();
          return;
        }

        pendingRotationId = window.setTimeout(rotate, wasClosed ? 420 : 140);
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
      const mailtoTarget = form.dataset.mailto || "mailto:ing.and.rizzo@gmail.com";
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

    const bookingEmail = stay.bookingEmail || "ing.and.rizzo@gmail.com";
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
