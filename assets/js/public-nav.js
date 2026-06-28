document.addEventListener("DOMContentLoaded", () => {
  const headers = document.querySelectorAll(".public-header");

  if (!headers.length) return;

  const setOpenState = (header, open) => {
    header.classList.toggle("nav-open", open);
    document.body.classList.toggle("public-nav-open", open);

    const toggle = header.querySelector(".public-nav-toggle");
    const panel = header.querySelector(".public-nav-panel");
    const overlay = header.querySelector(".public-nav-overlay");

    if (panel && window.innerWidth <= 900) {
      panel.style.setProperty("transform", open ? "translateX(0px)" : "translateX(calc(100% + 24px))", "important");
      panel.style.setProperty("opacity", open ? "1" : "0", "important");
      panel.style.setProperty("pointer-events", open ? "auto" : "none", "important");
    }

    if (overlay && window.innerWidth <= 900) {
      overlay.style.setProperty("opacity", open ? "1" : "0", "important");
      overlay.style.setProperty("pointer-events", open ? "auto" : "none", "important");
    }

    if (toggle) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
  };

  headers.forEach(header => {
    const toggle = header.querySelector(".public-nav-toggle");
    const panel = header.querySelector(".public-nav-panel");
    const overlay = header.querySelector(".public-nav-overlay");

    if (!toggle || !panel) return;

    const closeMenu = () => setOpenState(header, false);

    toggle.addEventListener("click", () => {
      setOpenState(header, !header.classList.contains("nav-open"));
    });

    if (overlay) {
      overlay.addEventListener("click", closeMenu);
    }

    panel.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) {
        closeMenu();
        const panel = header.querySelector(".public-nav-panel");
        const overlay = header.querySelector(".public-nav-overlay");
        if (panel) {
          panel.style.removeProperty("transform");
          panel.style.removeProperty("opacity");
          panel.style.removeProperty("pointer-events");
        }
        if (overlay) {
          overlay.style.removeProperty("opacity");
          overlay.style.removeProperty("pointer-events");
        }
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  });
});