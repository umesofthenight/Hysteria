/* Local page interactions and optional Discord content.
   No analytics, cookies, or persistent browser storage. */
(() => {
  "use strict";
  const pageLoader = document.getElementById("page-loading");
  const progress = document.getElementById("scroll-progress");
  const progressFill = document.getElementById("scroll-progress-fill");
  const backToTop = document.getElementById("back-to-top");
  const pageTop = document.getElementById("page-top");
  const mobileCTA = document.querySelector(".mobile-cta");
  const root = document.documentElement;
  const mobileProgressLayout = window.matchMedia("(max-width: 760px)");
  let scheduled = false;
  let previousCTAHeight = -1;

  function updateScrollUI() {
    scheduled = false;
    // Measure the real join bar, including wrapped text and the device safe area.
    const ctaHeight = mobileCTA ? Math.ceil(mobileCTA.getBoundingClientRect().height) : 0;
    if (ctaHeight !== previousCTAHeight) {
      root.style.setProperty("--mobile-cta-height", ctaHeight + "px");
      previousCTAHeight = ctaHeight;
    }
    const scroller = document.scrollingElement || root;
    const viewportHeight = root.clientHeight || window.innerHeight;
    const scrollRange = Math.max(0, scroller.scrollHeight - viewportHeight);
    const offset = Math.max(0, scroller.scrollTop);
    const fraction = scrollRange > 0 ? Math.min(1, offset / scrollRange) : 0;
    if (progress && progressFill) {
      progress.hidden = scrollRange <= 0;
      progressFill.style.setProperty("--scroll-fraction", String(fraction));
      const orientation = mobileProgressLayout.matches ? "horizontal" : "vertical";
      if (progress.getAttribute("aria-orientation") !== orientation) {
        progress.setAttribute("aria-orientation", orientation);
      }
      const percent = String(Math.round(fraction * 100));
      if (progress.getAttribute("aria-valuenow") !== percent) {
        progress.setAttribute("aria-valuenow", percent);
        progress.setAttribute("aria-valuetext", percent + "% of page");
      }
    }
    if (backToTop) {
      const visible = offset > Math.min(400, viewportHeight * 0.6);
      // Avoid hiding a keyboard-focused control if the user scrolls by another means.
      backToTop.hidden = !visible && document.activeElement !== backToTop;
    }
  }

  function scheduleScrollUI() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateScrollUI);
  }

  if (backToTop && pageTop) {
    backToTop.addEventListener("click", () => {
      pageTop.focus({ preventScroll: true });
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      scheduleScrollUI();
    });
    backToTop.addEventListener("blur", scheduleScrollUI);
  }

  window.addEventListener("scroll", scheduleScrollUI, { passive: true });
  window.addEventListener("resize", scheduleScrollUI, { passive: true });
  window.addEventListener("pageshow", scheduleScrollUI);
  document.addEventListener("toggle", scheduleScrollUI, true);
  if ("ResizeObserver" in window) {
    const observer = new window.ResizeObserver(scheduleScrollUI);
    observer.observe(document.body);
    if (mobileCTA) observer.observe(mobileCTA);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleScrollUI);
  updateScrollUI();

  function finishPageLoading() {
    if (pageLoader) pageLoader.hidden = true;
    scheduleScrollUI();
  }
  if (pageLoader && document.readyState !== "complete") pageLoader.hidden = false;
  window.addEventListener("load", finishPageLoading, { once: true });
  window.addEventListener("pagehide", finishPageLoading);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted || document.readyState === "complete") finishPageLoading();
  });

  const consent = document.getElementById("widget-consent");
  const controls = document.getElementById("widget-controls");
  const active = document.getElementById("widget-active");
  const frameHost = document.getElementById("widget-frame");
  const status = document.getElementById("widget-status");
  const allow = document.getElementById("widget-allow");
  const decline = document.getElementById("widget-decline");
  const revoke = document.getElementById("widget-revoke");
  const widgetLoader = document.getElementById("widget-loading");
  const widgetLoadingLabel = document.getElementById("widget-loading-label");
  // Policy and error pages still receive the page controls above.
  if (![consent, controls, active, frameHost, status, allow, decline, revoke, widgetLoader, widgetLoadingLabel].every(Boolean)) return;

  let currentFrame = null;
  let loadingTimer = null;
  controls.hidden = false;

  function clearLoadingTimer() {
    if (loadingTimer !== null) window.clearTimeout(loadingTimer);
    loadingTimer = null;
  }

  function turnOff(message, restoreFocus = false) {
    currentFrame = null;
    clearLoadingTimer();
    frameHost.replaceChildren();
    frameHost.setAttribute("aria-busy", "false");
    widgetLoader.hidden = true;
    active.hidden = true;
    consent.hidden = false;
    status.textContent = message;
    if (restoreFocus) allow.focus();
    scheduleScrollUI();
  }

  allow.addEventListener("click", () => {
    if (currentFrame) return;
    const frame = document.createElement("iframe");
    currentFrame = frame;
    frame.title = "Hysteria Discord server widget";
    frame.width = "350";
    frame.height = "500";
    frame.setAttribute("sandbox", "allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts");
    frame.setAttribute("referrerpolicy", "no-referrer");
    frame.setAttribute("allow", "camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'");
    frame.addEventListener("load", () => {
      if (currentFrame !== frame) return;
      clearLoadingTimer();
      frameHost.setAttribute("aria-busy", "false");
      widgetLoader.hidden = true;
      // An iframe load event does not prove its cross-origin content is available.
      status.textContent = "The widget is enabled. If it is blank, use the Discord invite below. You can turn it off at any time.";
      scheduleScrollUI();
    }, { once: true });

    consent.hidden = true;
    active.hidden = false;
    widgetLoader.hidden = false;
    widgetLoadingLabel.textContent = "Loading Discord widget";
    frameHost.setAttribute("aria-busy", "true");
    status.textContent = "Loading the widget. You can turn it off and withdraw consent at any time.";
    loadingTimer = window.setTimeout(() => {
      if (currentFrame !== frame) return;
      loadingTimer = null;
      frameHost.setAttribute("aria-busy", "false");
      widgetLoader.hidden = true;
      status.textContent = "Discord has not responded yet. Try the invite below or turn off the widget.";
    }, 12000);
    // This is the only remote resource URL, assigned only after explicit consent.
    frame.src = "https://discord.com/widget?id=1515611113042087958&theme=dark";
    frameHost.replaceChildren(frame);
    revoke.focus();
    scheduleScrollUI();
  });

  decline.addEventListener("click", () => {
    turnOff("The widget is off. You can still join through the Discord invite.");
  });
  revoke.addEventListener("click", () => {
    turnOff("Consent withdrawn. The widget is off. Any cookies Discord already set can be removed in your browser's privacy settings.", true);
  });
  window.addEventListener("pagehide", () => turnOff("The widget is off. Allow it again to load it."));
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) turnOff("The widget is off. Allow it again to load it.");
  });
})();
