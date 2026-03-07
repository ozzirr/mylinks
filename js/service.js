(() => {
  const services = {
    "ai-systems": {
      title: "AI Systems",
      subtitle: "AI solutions, assistants and integrations for business operations.",
      what: "I design practical AI systems that connect your tools, information and workflows to reduce friction and accelerate execution.",
      build: [
        "AI assistants for teams",
        "process-aware automations",
        "tool and data integrations",
        "internal knowledge copilots",
        "operational AI workflows",
      ],
      audience: [
        "service companies",
        "growing teams",
        "founders scaling operations",
        "businesses reducing manual work",
      ],
    },
    "web-design": {
      title: "Web Design",
      subtitle: "Premium websites designed for clarity, trust and conversion.",
      what: "I design high-quality websites with clean structure, strong brand perception and focused user journeys that convert.",
      build: [
        "brand-led website design",
        "conversion-focused landing pages",
        "mobile-first page systems",
        "visual hierarchy and UX structure",
        "content-driven site architecture",
      ],
      audience: [
        "professionals and founders",
        "hospitality brands",
        "small and medium businesses",
        "projects needing premium positioning",
      ],
    },
    ecommerce: {
      title: "E-commerce",
      subtitle: "Online stores built to sell better and integrate with business workflows.",
      what: "I build ecommerce experiences that combine design quality, operational clarity and practical integrations across your business stack.",
      build: [
        "storefront UX and structure",
        "catalog and product flows",
        "checkout optimization",
        "marketing and CRM integrations",
        "post-sale operational workflows",
      ],
      audience: [
        "product businesses",
        "retail and lifestyle brands",
        "hospitality commerce projects",
        "teams scaling online sales",
      ],
    },
    "custom-development": {
      title: "Development",
      subtitle: "Custom digital solutions, business tools and tailored implementations.",
      what: "I develop custom digital solutions when off-the-shelf tools are not enough, focusing on reliability, maintainability and business impact.",
      build: [
        "custom business tools",
        "internal dashboards and utilities",
        "workflow-specific web apps",
        "API-driven integrations",
        "tailored implementation layers",
      ],
      audience: [
        "operations-heavy teams",
        "service businesses",
        "founders with specific workflows",
        "companies needing custom execution",
      ],
    },
  };

  const aliases = {
    "ai-systems-integration": "ai-systems",
    "workflow-automation": "ai-systems",
    "intelligent-assistants": "ai-systems",
    "digital-process-design": "custom-development",
  };

  const params = new URLSearchParams(window.location.search);
  const requestedType = (params.get("type") || "").trim();
  const normalizedType = aliases[requestedType] || requestedType;
  const fallbackType = "ai-systems";
  const type = Object.prototype.hasOwnProperty.call(services, normalizedType) ? normalizedType : fallbackType;
  const service = services[type];

  const titleNode = document.querySelector("[data-service-title]");
  const subtitleNode = document.querySelector("[data-service-subtitle]");
  const whatNode = document.querySelector("[data-service-what]");
  const buildNode = document.querySelector("[data-service-build]");
  const audienceNode = document.querySelector("[data-service-audience]");
  const ctaNode = document.querySelector(".service-cta");

  if (!titleNode || !subtitleNode || !whatNode || !buildNode || !audienceNode || !service) {
    return;
  }

  const renderList = (node, items) => {
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      fragment.append(li);
    });
    node.replaceChildren(fragment);
  };

  titleNode.textContent = service.title;
  subtitleNode.textContent = service.subtitle;
  whatNode.textContent = service.what;
  renderList(buildNode, service.build);
  renderList(audienceNode, service.audience);

  document.title = `${service.title} | Andre Rizzo`;

  const description = `${service.subtitle} ${service.what}`;
  const descMeta = document.querySelector('meta[name="description"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');

  if (descMeta) {
    descMeta.setAttribute("content", description);
  }
  if (ogTitle) {
    ogTitle.setAttribute("content", `${service.title} | Andre Rizzo`);
  }
  if (ogDescription) {
    ogDescription.setAttribute("content", description);
  }
  if (twitterTitle) {
    twitterTitle.setAttribute("content", `${service.title} | Andre Rizzo`);
  }
  if (twitterDescription) {
    twitterDescription.setAttribute("content", description);
  }

  if (ctaNode) {
    ctaNode.dataset.track = `service_${type.replace(/-/g, "_")}_lets_talk`;
  }
})();
