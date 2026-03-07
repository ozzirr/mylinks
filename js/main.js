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
      "gestione progetti": "project-management",
      hospitality: "hospitality",
      ospitalita: "hospitality",
      "ospitalità": "hospitality"
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
          behavior: reduceMotion ? "auto" : "smooth"
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
