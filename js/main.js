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

  const initCubeArcadeGame = () => {
    const root = document.querySelector("[data-arcade-game]");
    const canvas = root?.querySelector("[data-arcade-canvas]");
    const scoreNode = root?.querySelector("[data-arcade-score]");
    const stageNode = root?.querySelector("[data-arcade-stage]");
    const statusNode = root?.querySelector("[data-arcade-status]");
    const actionButton = root?.querySelector("[data-arcade-action]");

    if (
      !root ||
      !(canvas instanceof HTMLCanvasElement) ||
      !scoreNode ||
      !stageNode ||
      !statusNode ||
      !(actionButton instanceof HTMLButtonElement)
    ) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const world = {
      width: canvas.width,
      height: canvas.height,
      groundY: canvas.height - 32
    };
    const bestScoreKey = "mylinks.arcade.best-score.v2";
    const keyMap = {
      ArrowUp: true,
      w: true,
      W: true,
      " ": true,
      Enter: true
    };
    const stageDefinitions = [
      {
        id: "studio",
        name: { it: "2R Studio", en: "2R Studio" },
        shortLabel: { it: "Studio", en: "Studio" },
        intro: { it: "2R SRL warm up", en: "2R SRL warm up" },
        accent: "#f0b48d",
        accentSoft: "#ffe2cc",
        skyTop: "#281825",
        skyBottom: "#87515b",
        horizon: "#4b2936",
        ground: "#2e1c24",
        lane: "#6e4651",
        props: ["palm", "sign", "sun"],
        collectibles: ["2R", "QA", "WEB"],
        signs: ["2R SRL", "SALENTO", "BUILD"]
      },
      {
        id: "odora",
        name: { it: "Odora Lab", en: "Odora Lab" },
        shortLabel: { it: "Odora", en: "Odora" },
        intro: { it: "Discovery e rituale", en: "Discovery and ritual" },
        accent: "#f3c29f",
        accentSoft: "#ffe7d0",
        skyTop: "#2d1a2d",
        skyBottom: "#6a4156",
        horizon: "#492a3d",
        ground: "#2b1b28",
        lane: "#7b5560",
        props: ["bottle", "flower", "sign"],
        collectibles: ["ODO", "UX", "SCENT"],
        signs: ["ODORA", "DISCOVERY", "RITUAL"]
      },
      {
        id: "balance",
        name: { it: "Balance City", en: "Balance City" },
        shortLabel: { it: "Balance", en: "Balance" },
        intro: { it: "Fintech in corsa", en: "Fintech sprint" },
        accent: "#8fd4b0",
        accentSoft: "#d5ffe8",
        skyTop: "#12202c",
        skyBottom: "#31536d",
        horizon: "#1b3242",
        ground: "#15212b",
        lane: "#48737d",
        props: ["tower", "coin", "sign"],
        collectibles: ["BAL", "APP", "€"],
        signs: ["BALANCE", "NET WORTH", "FLOW"]
      },
      {
        id: "ops",
        name: { it: "AI Ops", en: "AI Ops" },
        shortLabel: { it: "AI Ops", en: "AI Ops" },
        intro: { it: "QA, release e sistemi", en: "QA, release and systems" },
        accent: "#82c7ff",
        accentSoft: "#d8f0ff",
        skyTop: "#0f1628",
        skyBottom: "#29466e",
        horizon: "#17263d",
        ground: "#101927",
        lane: "#3f5871",
        props: ["server", "node", "sign"],
        collectibles: ["AI", "PM", "REL"],
        signs: ["BANKING", "STARTUP", "OPS"]
      }
    ];

    let frameId = null;
    let previousTimestamp = 0;
    let score = 0;
    let bestScore = 0;
    let distance = 0;
    let speed = 2.35;
    let scoreCarry = 0;
    let stageFlash = 0;
    let activeMessage = "";
    let messageUntil = 0;
    let stageIndex = 0;
    let spawnCursor = world.width + 28;
    let blocks = [];
    let enemies = [];
    let collectibles = [];
    let props = [];
    let particles = [];

    const player = {
      x: 72,
      y: world.groundY - 28,
      width: 18,
      height: 28,
      vy: 0,
      onGround: true,
      jumpBuffer: 0,
      coyote: 0,
      runCycle: 0,
      squash: 1,
      stretch: 1
    };

    const state = {
      status: "ready"
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const randomBetween = (min, max) => min + Math.random() * (max - min);
    const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];
    const getLanguage = () => (getCurrentLanguage() === "it" ? "it" : "en");
    const getStageByIndex = (index = 0) => stageDefinitions[((index % stageDefinitions.length) + stageDefinitions.length) % stageDefinitions.length];
    const getStageIndex = (value = distance) => Math.floor(value / 220) % stageDefinitions.length;
    const getStage = () => getStageByIndex(stageIndex);

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

    const roundedRectPath = (x, y, width, height, radius) => {
      const safeRadius = Math.min(radius, width / 2, height / 2);
      context.beginPath();
      context.moveTo(x + safeRadius, y);
      context.arcTo(x + width, y, x + width, y + height, safeRadius);
      context.arcTo(x + width, y + height, x, y + height, safeRadius);
      context.arcTo(x, y + height, x, y, safeRadius);
      context.arcTo(x, y, x + width, y, safeRadius);
      context.closePath();
    };

    const fillRoundedRect = (x, y, width, height, radius, color, alpha = 1) => {
      context.save();
      context.globalAlpha = alpha;
      roundedRectPath(x, y, width, height, radius);
      context.fillStyle = color;
      context.fill();
      context.restore();
    };

    const strokeRoundedRect = (x, y, width, height, radius, color, lineWidth = 1, alpha = 1) => {
      context.save();
      context.globalAlpha = alpha;
      roundedRectPath(x, y, width, height, radius);
      context.lineWidth = lineWidth;
      context.strokeStyle = color;
      context.stroke();
      context.restore();
    };

    const drawText = (text, x, y, size, color, align = "left", weight = 700, alpha = 1) => {
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = color;
      context.font = `${weight} ${size}px "Avenir Next", "Segoe UI", sans-serif`;
      context.textAlign = align;
      context.textBaseline = "middle";
      context.fillText(text, x, y);
      context.restore();
    };

    const showMessage = (text, duration = 1450) => {
      activeMessage = text;
      messageUntil = performance.now() + duration;
      updateHud();
    };

    const addParticles = (x, y, color, amount = 8, spread = 1) => {
      if (reduceMotion) {
        return;
      }

      for (let index = 0; index < amount; index += 1) {
        particles.push({
          x,
          y,
          vx: randomBetween(-1.3, 1.3) * spread,
          vy: randomBetween(-2.4, -0.6),
          size: randomBetween(1.6, 3.8),
          color,
          life: randomBetween(18, 34)
        });
      }
    };

    const addBlock = (x, y, width, height) => {
      blocks.push({ x, y, width, height });
    };

    const addEnemy = (x, y, kind = "bug") => {
      const stage = getStage();
      const labels = kind === "bug" ? ["BUG", "TEST"] : ["BLOCK", "LEGACY"];
      enemies.push({
        x,
        y,
        width: 16,
        height: 16,
        label: pickRandom(labels),
        accent: stage.accent,
        kind,
        bob: randomBetween(0, Math.PI * 2)
      });
    };

    const addCollectible = (x, y) => {
      const stage = getStage();
      collectibles.push({
        x,
        y,
        width: 16,
        height: 16,
        label: pickRandom(stage.collectibles),
        color: stage.accent,
        glow: stage.accentSoft,
        bob: randomBetween(0, Math.PI * 2)
      });
    };

    const addProp = (x) => {
      const stage = getStage();
      const kind = pickRandom(stage.props);
      props.push({
        x,
        kind,
        layer: Math.random() > 0.5 ? "mid" : "far",
        label: pickRandom(stage.signs),
        wobble: randomBetween(0, Math.PI * 2)
      });
    };

    const spawnChunk = () => {
      const difficulty = clamp(distance / 850, 0, 1);
      const stage = getStage();
      const x = spawnCursor;
      const patterns =
        difficulty < 0.2
          ? ["flat", "bug", "block", "coin"]
          : ["flat", "bug", "block", "stair", "double", "mixed", "coin"];
      const pattern = pickRandom(patterns);
      const elevatedY = world.groundY - 26;
      const highY = world.groundY - 42;

      if (Math.random() > 0.18) {
        addProp(x + randomBetween(24, 64));
      }

      if (pattern === "flat") {
        if (Math.random() > 0.35) {
          addCollectible(x + 46, world.groundY - 52);
        }
        spawnCursor += 94;
        return;
      }

      if (pattern === "coin") {
        addCollectible(x + 38, world.groundY - 48);
        if (Math.random() > 0.5) {
          addCollectible(x + 62, world.groundY - 72);
        }
        spawnCursor += 88;
        return;
      }

      if (pattern === "bug") {
        addEnemy(x + 50, world.groundY - 16, "bug");
        if (Math.random() > 0.42) {
          addCollectible(x + 56, world.groundY - 58);
        }
        spawnCursor += 92;
        return;
      }

      if (pattern === "block") {
        addBlock(x + 36, elevatedY, 28, 18);
        addCollectible(x + 42, elevatedY - 28);
        if (difficulty > 0.45 && Math.random() > 0.5) {
          addEnemy(x + 78, world.groundY - 16, "blocker");
        }
        spawnCursor += 102;
        return;
      }

      if (pattern === "stair") {
        addBlock(x + 22, elevatedY, 24, 18);
        addBlock(x + 48, highY, 24, 18);
        addCollectible(x + 54, highY - 28);
        spawnCursor += 96;
        return;
      }

      if (pattern === "double") {
        addEnemy(x + 34, world.groundY - 16, "bug");
        addEnemy(x + 66, world.groundY - 16, "blocker");
        addCollectible(x + 50, world.groundY - 70);
        spawnCursor += 112;
        return;
      }

      addBlock(x + 28, elevatedY, 28, 18);
      addEnemy(x + 76, world.groundY - 16, "blocker");
      addCollectible(x + 34, elevatedY - 30);
      if (difficulty > 0.55) {
        addCollectible(x + 82, world.groundY - 60);
      }
      spawnCursor += 116;
      void stage;
    };

    const seedWorld = () => {
      blocks = [];
      enemies = [];
      collectibles = [];
      props = [];
      particles = [];
      spawnCursor = world.width + 28;

      props.push(
        { x: 72, kind: "sign", layer: "far", label: "MYLINKS", wobble: 0.4 },
        { x: 150, kind: "palm", layer: "far", label: "", wobble: 1.4 }
      );
      addCollectible(186, world.groundY - 54);

      for (let index = 0; index < 7; index += 1) {
        spawnChunk();
      }
    };

    const bestScoreLabel = () => `${getLanguage() === "it" ? "Best" : "Best"} ${bestScore}`;

    const getStatusText = () => {
      if (state.status === "gameover") {
        return `${t("snake.gameOver", "Game over")} · ${bestScoreLabel()}`;
      }

      if (state.status === "ready") {
        return t("snake.ready", "Ready");
      }

      if (messageUntil > performance.now()) {
        return activeMessage;
      }

      return getStage().shortLabel[getLanguage()];
    };

    const updateHud = () => {
      scoreNode.textContent = String(Math.floor(score));
      stageNode.textContent = getStage().name[getLanguage()];
      statusNode.textContent = getStatusText();
      actionButton.textContent = t(
        state.status === "running" ? "snake.restart" : "snake.start",
        state.status === "running" ? "Restart" : "Play"
      );
    };

    const queueJump = () => {
      if (state.status !== "running") {
        return;
      }
      player.jumpBuffer = 7;
    };

    const startGame = () => {
      score = 0;
      distance = 0;
      speed = 2.35;
      scoreCarry = 0;
      stageIndex = 0;
      stageFlash = 1;
      state.status = "running";
      player.y = world.groundY - player.height;
      player.vy = 0;
      player.onGround = true;
      player.jumpBuffer = 0;
      player.coyote = 0;
      player.runCycle = 0;
      player.squash = 1;
      player.stretch = 1;
      seedWorld();
      showMessage(getStage().intro[getLanguage()], 1400);
      updateHud();
      canvas.focus({ preventScroll: true });
    };

    const finishRun = () => {
      state.status = "gameover";
      if (Math.floor(score) > bestScore) {
        bestScore = Math.floor(score);
        persistBestScore();
      }
      addParticles(player.x + player.width * 0.5, player.y + player.height * 0.6, "#ffd2b8", 16, 1.3);
      updateHud();
    };

    const isOverlapping = (a, b) =>
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y;

    const updateWorld = (delta) => {
      const currentStageIndex = getStageIndex(distance);
      if (currentStageIndex !== stageIndex) {
        stageIndex = currentStageIndex;
        stageFlash = 1;
        showMessage(getStage().intro[getLanguage()], 1500);
      }

      speed = 2.35 + clamp(distance / 300, 0, 2.7);
      distance += speed * delta * 0.55;
      scoreCarry += delta * 0.9;

      while (scoreCarry >= 1) {
        score += 1;
        scoreCarry -= 1;
      }

      const travel = speed * delta;

      blocks.forEach((block) => {
        block.x -= travel;
      });

      enemies.forEach((enemy) => {
        enemy.x -= travel;
        enemy.bob += delta * 0.1;
      });

      collectibles.forEach((collectible) => {
        collectible.x -= travel;
        collectible.bob += delta * 0.1;
      });

      props.forEach((prop) => {
        prop.x -= travel * (prop.layer === "far" ? 0.34 : 0.58);
        prop.wobble += delta * 0.025;
      });

      particles.forEach((particle) => {
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vy += 0.16 * delta;
        particle.life -= delta;
      });

      blocks = blocks.filter((block) => block.x + block.width > -28);
      enemies = enemies.filter((enemy) => enemy.x + enemy.width > -24);
      collectibles = collectibles.filter((collectible) => collectible.x + collectible.width > -24);
      props = props.filter((prop) => prop.x > -80);
      particles = particles.filter((particle) => particle.life > 0);

      while (spawnCursor < world.width + 180) {
        spawnChunk();
      }
    };

    const updatePlayer = (delta) => {
      const previousY = player.y;
      const previousBottom = previousY + player.height;

      if (player.jumpBuffer > 0) {
        player.jumpBuffer -= delta;
      }

      if (player.coyote > 0) {
        player.coyote -= delta;
      }

      if (player.jumpBuffer > 0 && (player.onGround || player.coyote > 0)) {
        player.vy = -6.35;
        player.onGround = false;
        player.coyote = 0;
        player.jumpBuffer = 0;
        player.stretch = 1.16;
        player.squash = 0.88;
        addParticles(player.x + 6, world.groundY - 2, getStage().accent, 6, 0.8);
      }

      player.vy += 0.34 * delta;
      player.y += player.vy * delta;
      player.runCycle += delta * 0.22 * clamp(speed, 1.5, 5.2);

      let landed = false;
      const groundTop = world.groundY - player.height;

      if (player.y >= groundTop) {
        player.y = groundTop;
        player.vy = 0;
        landed = true;
      }

      const playerBounds = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height
      };
      const sortedBlocks = [...blocks].sort((a, b) => a.y - b.y);

      sortedBlocks.forEach((block) => {
        const overlapsX = playerBounds.x + playerBounds.width > block.x + 2 && playerBounds.x < block.x + block.width - 2;
        if (!overlapsX) {
          return;
        }

        const currentBottom = player.y + player.height;
        const landedOnTop = previousBottom <= block.y + 4 && currentBottom >= block.y && player.vy >= 0;
        const hitFromBelow = previousY >= block.y + block.height - 3 && player.y <= block.y + block.height && player.vy < 0;

        if (landedOnTop) {
          player.y = block.y - player.height;
          player.vy = 0;
          landed = true;
          return;
        }

        if (hitFromBelow) {
          player.y = block.y + block.height;
          player.vy = 1.6;
          addParticles(block.x + block.width * 0.5, block.y + block.height, getStage().accent, 4, 0.6);
          return;
        }

        if (isOverlapping(playerBounds, block)) {
          finishRun();
        }
      });

      if (landed) {
        if (!player.onGround) {
          addParticles(player.x + player.width * 0.5, player.y + player.height, getStage().accentSoft, 6, 0.6);
        }
        player.onGround = true;
        player.coyote = 6;
        player.squash = 1.12;
        player.stretch = 0.92;
      } else {
        if (player.onGround) {
          player.coyote = 6;
        }
        player.onGround = false;
      }

      player.squash += (1 - player.squash) * 0.18;
      player.stretch += (1 - player.stretch) * 0.18;

      const playerRect = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height
      };

      enemies = enemies.filter((enemy) => {
        if (!isOverlapping(playerRect, enemy)) {
          return true;
        }

        const stomp = previousBottom <= enemy.y + 6 && player.vy > 0;
        if (stomp) {
          player.vy = -4.2;
          score += 18;
          showMessage(`${enemy.label} cleared`, 720);
          addParticles(enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5, enemy.accent, 10, 1.1);
          return false;
        }

        finishRun();
        return true;
      });

      collectibles = collectibles.filter((collectible) => {
        if (!isOverlapping(playerRect, collectible)) {
          return true;
        }

        score += 32;
        showMessage(collectible.label, 900);
        addParticles(collectible.x + 8, collectible.y + 8, collectible.glow, 10, 1);
        return false;
      });
    };

    const drawSkyline = (stage) => {
      context.fillStyle = stage.horizon;
      for (let index = 0; index < 6; index += 1) {
        const x = index * 62 + ((distance * 0.12) % 62) * -1;
        const height = 20 + (index % 3) * 12;
        fillRoundedRect(x, world.groundY - height - 18, 48, height + 18, 14, stage.horizon, 0.76);
      }
    };

    const drawProp = (prop) => {
      const stage = getStage();
      const yBase = prop.layer === "far" ? world.groundY - 24 : world.groundY - 12;
      const alpha = prop.layer === "far" ? 0.34 : 0.56;
      const accent = prop.layer === "far" ? stage.accentSoft : stage.accent;

      context.save();
      context.globalAlpha = alpha;
      context.translate(prop.x, yBase);

      if (prop.kind === "palm") {
        context.fillStyle = stage.lane;
        context.fillRect(0, -24, 4, 26);
        context.fillStyle = accent;
        for (let index = 0; index < 4; index += 1) {
          context.beginPath();
          context.moveTo(2, -22);
          context.quadraticCurveTo(index < 2 ? -12 : 16, -34 - index * 2, index < 2 ? -18 : 20, -18 - index);
          context.lineTo(2, -18);
          context.fill();
        }
      } else if (prop.kind === "sun") {
        context.beginPath();
        context.fillStyle = accent;
        context.arc(18, -18, 14, 0, Math.PI * 2);
        context.fill();
      } else if (prop.kind === "bottle") {
        fillRoundedRect(0, -30, 18, 24, 6, accent, 1);
        fillRoundedRect(5, -36, 8, 10, 3, stage.accentSoft, 1);
      } else if (prop.kind === "flower") {
        context.fillStyle = stage.lane;
        context.fillRect(8, -28, 2, 30);
        for (let index = 0; index < 4; index += 1) {
          context.beginPath();
          context.fillStyle = accent;
          context.arc(9 + Math.cos(index * (Math.PI / 2)) * 6, -30 + Math.sin(index * (Math.PI / 2)) * 6, 4, 0, Math.PI * 2);
          context.fill();
        }
      } else if (prop.kind === "tower") {
        fillRoundedRect(0, -34, 14, 36, 5, accent, 1);
        fillRoundedRect(16, -24, 10, 26, 5, stage.accentSoft, 0.8);
      } else if (prop.kind === "coin") {
        context.beginPath();
        context.fillStyle = accent;
        context.arc(10, -18, 10, 0, Math.PI * 2);
        context.fill();
        drawText("€", 10, -18, 9, stage.skyTop, "center", 800);
      } else if (prop.kind === "server") {
        fillRoundedRect(0, -30, 22, 26, 6, accent, 1);
        fillRoundedRect(4, -24, 14, 4, 3, stage.skyTop, 0.74);
        fillRoundedRect(4, -16, 14, 4, 3, stage.skyTop, 0.74);
      } else if (prop.kind === "node") {
        context.strokeStyle = accent;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(2, -10);
        context.lineTo(12, -24);
        context.lineTo(24, -12);
        context.stroke();
        [0, 1, 2].forEach((offset) => {
          context.beginPath();
          context.fillStyle = stage.accentSoft;
          context.arc(offset === 0 ? 2 : offset === 1 ? 12 : 24, offset === 0 ? -10 : offset === 1 ? -24 : -12, 4, 0, Math.PI * 2);
          context.fill();
        });
      } else {
        context.fillStyle = stage.lane;
        context.fillRect(10, -22, 3, 24);
        fillRoundedRect(0, -34, 28, 14, 5, accent, 1);
        drawText(prop.label, 14, -27, 6, stage.skyTop, "center", 800);
      }

      if (prop.kind === "sign") {
        context.fillStyle = stage.lane;
        context.fillRect(12, -20, 3, 22);
        fillRoundedRect(0, -34, 28, 14, 5, accent, 1);
        drawText(prop.label, 14, -27, 6, stage.skyTop, "center", 800);
      }

      context.restore();
    };

    const drawGround = (stage) => {
      context.fillStyle = stage.ground;
      context.fillRect(0, world.groundY, world.width, world.height - world.groundY);
      context.fillStyle = stage.lane;
      context.fillRect(0, world.groundY - 6, world.width, 6);

      context.strokeStyle = "rgba(255, 255, 255, 0.08)";
      context.lineWidth = 1;
      for (let x = -((distance * 0.5) % 20); x < world.width + 20; x += 20) {
        context.beginPath();
        context.moveTo(x, world.groundY + 8);
        context.lineTo(x + 10, world.groundY + 8);
        context.stroke();
      }
    };

    const drawBlock = (block) => {
      const stage = getStage();
      fillRoundedRect(block.x, block.y, block.width, block.height, 4, stage.lane, 1);
      fillRoundedRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4, 3, stage.accent, 0.42);
      context.strokeStyle = "rgba(255,255,255,0.12)";
      context.lineWidth = 1;
      context.strokeRect(block.x + 0.5, block.y + 0.5, block.width - 1, block.height - 1);
    };

    const drawEnemy = (enemy) => {
      const yOffset = Math.sin(enemy.bob) * 0.8;
      fillRoundedRect(enemy.x, enemy.y + yOffset, enemy.width, enemy.height, 5, "#251923", 1);
      fillRoundedRect(enemy.x + 2, enemy.y + 2 + yOffset, enemy.width - 4, enemy.height - 4, 4, enemy.accent, 0.82);
      context.fillStyle = "#120d18";
      context.fillRect(enemy.x + 4, enemy.y + 5 + yOffset, 2, 2);
      context.fillRect(enemy.x + 10, enemy.y + 5 + yOffset, 2, 2);
      drawText(enemy.label.slice(0, 1), enemy.x + enemy.width / 2, enemy.y + enemy.height / 2 + 2 + yOffset, 8, "#120d18", "center", 900);
    };

    const drawCollectible = (collectible) => {
      const yOffset = Math.sin(collectible.bob) * 3;
      context.save();
      context.shadowColor = collectible.glow;
      context.shadowBlur = 12;
      fillRoundedRect(collectible.x, collectible.y + yOffset, collectible.width, collectible.height, 6, collectible.color, 1);
      context.restore();
      fillRoundedRect(collectible.x + 2, collectible.y + 2 + yOffset, collectible.width - 4, collectible.height - 4, 4, "#120d18", 0.22);
      drawText(collectible.label, collectible.x + collectible.width / 2, collectible.y + collectible.height / 2 + yOffset + 1, 6, "#120d18", "center", 900);
    };

    const drawPlayer = () => {
      const runBounce = player.onGround ? Math.sin(player.runCycle) * 1.4 : -1;
      const drawX = player.x;
      const drawY = player.y + runBounce;
      const stage = getStage();

      context.save();
      context.translate(drawX + player.width / 2, drawY + player.height / 2);
      context.scale(player.stretch, player.squash);
      context.translate(-(drawX + player.width / 2), -(drawY + player.height / 2));

      fillRoundedRect(drawX + 4, drawY + 20, 4, 8, 2, "#f2d8c6");
      fillRoundedRect(drawX + 10, drawY + 20, 4, 8, 2, "#f2d8c6");
      fillRoundedRect(drawX + 2, drawY + 22, 7, 4, 2, "#4d2e2c");
      fillRoundedRect(drawX + 9, drawY + 22, 7, 4, 2, "#4d2e2c");
      fillRoundedRect(drawX + 2, drawY + 8, 14, 14, 4, stage.accent, 1);
      fillRoundedRect(drawX + 4, drawY + 10, 10, 10, 3, "#1c1420", 0.18);
      drawText("AR", drawX + 9, drawY + 15, 7, "#140f17", "center", 900);
      fillRoundedRect(drawX + 4, drawY, 10, 10, 4, "#f0c8ae");
      fillRoundedRect(drawX + 4, drawY - 1, 10, 4, 3, "#2d1b1f");
      fillRoundedRect(drawX + 5, drawY + 5, 8, 2, 2, "#784f3a");

      context.restore();
    };

    const drawParticles = () => {
      particles.forEach((particle) => {
        fillRoundedRect(particle.x, particle.y, particle.size, particle.size, 2, particle.color, clamp(particle.life / 28, 0, 1));
      });
    };

    const drawStageBanner = () => {
      if (stageFlash <= 0) {
        return;
      }

      const stage = getStage();
      const alpha = clamp(stageFlash, 0, 1);
      fillRoundedRect(78, 18, 164, 28, 14, "rgba(14, 11, 18, 0.82)", alpha);
      strokeRoundedRect(78, 18, 164, 28, 14, stage.accentSoft, 1, alpha);
      drawText(stage.name[getLanguage()], 160, 32, 12, stage.accentSoft, "center", 800, alpha);
    };

    const render = () => {
      const stage = getStage();
      const sky = context.createLinearGradient(0, 0, 0, world.height);
      sky.addColorStop(0, stage.skyTop);
      sky.addColorStop(1, stage.skyBottom);
      context.clearRect(0, 0, world.width, world.height);
      context.fillStyle = sky;
      context.fillRect(0, 0, world.width, world.height);

      context.globalAlpha = 0.18;
      context.fillStyle = stage.accentSoft;
      context.beginPath();
      context.arc(world.width - 46, 42, 20, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;

      drawSkyline(stage);
      props.forEach(drawProp);
      drawGround(stage);
      blocks.forEach(drawBlock);
      collectibles.forEach(drawCollectible);
      enemies.forEach(drawEnemy);
      drawPlayer();
      drawParticles();
      drawStageBanner();

      if (state.status !== "running") {
        fillRoundedRect(78, 132, 164, 38, 14, "rgba(10, 8, 14, 0.76)", 1);
        strokeRoundedRect(78, 132, 164, 38, 14, stage.accentSoft, 1, 0.54);
        drawText(
          state.status === "gameover" ? t("snake.gameOver", "Game over") : getStage().intro[getLanguage()],
          160,
          146,
          11,
          stage.accentSoft,
          "center",
          800
        );
        drawText(
          state.status === "gameover"
            ? `${bestScoreLabel()}`
            : getLanguage() === "it"
              ? "Tap o Play per iniziare"
              : "Tap or Play to start",
          160,
          158,
          8,
          "#f6dfd2",
          "center",
          700
        );
      }
    };

    const onFrame = (timestamp) => {
      const delta = previousTimestamp ? Math.min(2.2, (timestamp - previousTimestamp) / 16.6667) : 1;
      previousTimestamp = timestamp;

      if (state.status === "running") {
        updateWorld(delta);
        updatePlayer(delta);
      } else {
        collectibles.forEach((collectible) => {
          collectible.bob += delta * 0.05;
        });
        props.forEach((prop) => {
          prop.wobble += delta * 0.01;
        });
      }

      if (stageFlash > 0) {
        stageFlash -= delta * 0.028;
      }

      render();
      updateHud();
      frameId = window.requestAnimationFrame(onFrame);
    };

    const handleAction = () => {
      if (state.status === "running") {
        startGame();
        return;
      }
      startGame();
    };

    const handleCanvasInput = (event) => {
      if (event.cancelable) {
        event.preventDefault();
      }

      if (state.status !== "running") {
        startGame();
        return;
      }

      queueJump();
    };

    const handleKeydown = (event) => {
      if (!keyMap[event.key] || event.repeat) {
        return;
      }

      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select")) {
        return;
      }

      event.preventDefault();
      if (state.status !== "running") {
        startGame();
        return;
      }

      queueJump();
    };

    bestScore = loadBestScore();
    seedWorld();
    updateHud();
    render();

    actionButton.addEventListener("click", handleAction);
    canvas.addEventListener("pointerdown", handleCanvasInput);
    canvas.addEventListener("keydown", handleKeydown);
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("i18n:change", () => {
      updateHud();
      render();
    });

    frameId = window.requestAnimationFrame(onFrame);
    void frameId;
  };

  const initProjectCube = () => {
    const scene = document.querySelector("[data-cube-scene]");
    const cube = document.querySelector("[data-project-cube]");
    const loading = document.querySelector("[data-cube-loading]");
    if (!scene || !cube) return;

    // Cube State
    let targetX = -18;
    let targetY = 0;
    let currentX = -18;
    let currentY = 0;
    let velocityX = 0;
    let velocityY = 0;
    
    let dragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let pointerId = null;
    let moved = false;
    let pauseUntil = 0;
    let ready = false;

    const lerp = (start, end, factor) => start + (end - start) * factor;
    const wrapAngle = (value) => ((((value + 180) % 360) + 360) % 360) - 180;

    const faceTargets = {
      connect: { x: -18, y: 0 },
      odora: { x: -18, y: -90 },
      balance: { x: -18, y: 180 },
      generale: { x: -18, y: 90 },
      game: { x: -90, y: 0 },
      bottom: { x: 90, y: 0 }
    };

    // Project Overlay Logic
    const overlay = document.getElementById("project-detail-overlay");
    const overlayBody = document.getElementById("project-detail-body");
    const closeOverlay = overlay.querySelector(".project-overlay-close");

    const openProjectDetail = (id) => {
      const data = getValue(`cube.projectDetails.${id}`);
      if (!data) return;

      const visitText = t("cube.viewProject", "Visit Project");
      const url = id === "odora" ? "https://odora.it/?utm_source=mylinks" : 
                  id === "balance" ? "https://ctrlbalance.com/?utm_source=mylinks" :
                  "https://generale-elettrica.com/?utm_source=mylinks";

      overlayBody.innerHTML = `
        <div class="project-detail">
            <p class="project-detail-kicker">${data.kicker}</p>
            <h2 class="project-detail-title">${data.title || id.charAt(0).toUpperCase() + id.slice(1)}</h2>
            <div class="project-detail-tags">
                ${(data.tags || []).map(t => `<span class="project-detail-tag">${t}</span>`).join("")}
            </div>
            <p class="project-detail-copy">${data.description}</p>
            <div class="project-detail-actions">
                <a href="${url}" class="project-detail-cta" target="_blank">${visitText}</a>
            </div>
        </div>
      `;

      overlay.classList.add("is-active");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };

    const closeProjectDetail = () => {
      overlay.classList.remove("is-active");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    document.querySelectorAll("[data-project-trigger]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openProjectDetail(btn.dataset.projectTrigger);
      });
    });

    closeOverlay.addEventListener("click", closeProjectDetail);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeProjectDetail();
    });

    initCubeArcadeGame();

    // Rotation & Interaction
    const applyRotation = () => {
      cube.style.setProperty("--cube-rx", `${currentX.toFixed(2)}deg`);
      cube.style.setProperty("--cube-ry", `${currentY.toFixed(2)}deg`);
      
      const faces = cube.querySelectorAll(".cube-face");
      faces.forEach(face => {
        const gx = ((currentY % 90) / 90) * 100;
        const gy = ((currentX % 90) / 90) * 100;
        face.style.setProperty("--gloss-x", `${gx}%`);
        face.style.setProperty("--gloss-y", `${gy}%`);
      });
    };

    const onFrame = (timestamp) => {
      const isOpening = document.body.classList.contains("is-cube-stage-opening");

      if (dragging) {
        currentX = lerp(currentX, targetX, 0.15);
        currentY = lerp(currentY, targetY, 0.15);
      } else {
        const shouldAutoRotate = !reduceMotion && timestamp > pauseUntil && !isOpening;
        if (shouldAutoRotate) {
          targetY = wrapAngle(targetY + 0.1);
        }
        
        velocityX *= 0.95;
        velocityY *= 0.95;
        targetX += velocityY;
        targetY += velocityX;

        currentX = lerp(currentX, targetX, 0.1);
        currentY = lerp(currentY, targetY, 0.1);
      }

      applyRotation();
      requestAnimationFrame(onFrame);
    };

    scene.addEventListener("pointerdown", (e) => {
      if (isInteractiveTarget(e.target)) return;
      dragging = true;
      moved = false;
      pointerId = e.pointerId;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      velocityX = 0;
      velocityY = 0;
      cube.classList.add("is-dragging");
      scene.setPointerCapture(e.pointerId);
    });

    scene.addEventListener("pointermove", (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      velocityX = dx * 0.15;
      velocityY = -dy * 0.15;
      targetY += dx * 0.4;
      targetX -= dy * 0.4;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });

    scene.addEventListener("pointerup", (e) => {
      if (e.pointerId !== pointerId) return;
      dragging = false;
      cube.classList.remove("is-dragging");
      scene.releasePointerCapture(e.pointerId);
      pauseUntil = performance.now() + 1500;
    });

    const isInteractiveTarget = (target) =>
      target instanceof Element &&
      Boolean(target.closest("a, button, input, [data-cube-interactive]"));

    const rotateToFace = (faceName) => {
      const t = faceTargets[faceName];
      if (!t) return;
      targetX = t.x;
      targetY = t.y;
      pauseUntil = performance.now() + 3000;
    };

    // Init Logic
    requestAnimationFrame(onFrame);
    
    // Remove loading state with a professional transition
    setTimeout(() => {
        scene.classList.remove("is-loading");
        setTimeout(() => {
            if (loading) loading.style.display = "none";
        }, 600);
    }, 1500);

    window.ProfileHub = window.ProfileHub || {};
    window.ProfileHub.cube = { rotateToFace };
  };

  const initCubeStage = () => {
    const body = document.body;
    const closeBtn = document.querySelector("[data-cube-stage-close]");
    const cubeSection = document.getElementById("project-cube");
    const cubeScene = document.querySelector("[data-cube-scene]");

    if (!body || !cubeSection) return;

    const openCubeStage = ({ scroll = true, face = null } = {}) => {
      body.classList.remove("is-cube-stage-closed");
      body.classList.add("is-cube-stage-open");
      body.classList.add("is-cube-stage-opening");

      setTimeout(() => {
        body.classList.remove("is-cube-stage-opening");
      }, 1000);

      if (face && window.ProfileHub && window.ProfileHub.cube) {
        window.ProfileHub.cube.rotateToFace(face);
      }

      if (scroll) {
        cubeSection.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    const closeCubeStage = () => {
      body.classList.remove("is-cube-stage-open");
      body.classList.add("is-cube-stage-closed");
    };

    if (cubeScene) {
      cubeScene.addEventListener("click", () => {
        if (!body.classList.contains("is-cube-stage-closed")) return;
        openCubeStage({ scroll: true, face: "balance" });
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closeCubeStage);
    }

    window.ProfileHub = window.ProfileHub || {};
    window.ProfileHub.showCube = openCubeStage;
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
