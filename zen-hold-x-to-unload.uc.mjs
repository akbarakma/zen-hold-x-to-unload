const HOLD_PREF = "hold_to_unload.hold_ms";
const DEFAULT_HOLD_MS = 600;

// Inline styles only: Sine loads mod CSS at user origin, which loses to the
// browser's author rules for list-style-image, color and background-color.
const ACCENT_COLOR = "var(--color-accent-primary, var(--zen-primary-color, AccentColor))";
const ARMED_BG = "color-mix(in srgb, " + ACCENT_COLOR + " 24%, transparent)";
const MOON_ICON =
  'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'context-fill\' fill-opacity=\'context-fill-opacity\'%3E%3Cpath d=\'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\'/%3E%3C/svg%3E")';

const readHoldMs = () => {
  try {
    const type = Services.prefs.getPrefType(HOLD_PREF);
    if (type === Services.prefs.PREF_INT) {
      return Services.prefs.getIntPref(HOLD_PREF, DEFAULT_HOLD_MS);
    }
    if (type === Services.prefs.PREF_STRING) {
      const parsed = Number(Services.prefs.getStringPref(HOLD_PREF, ""));
      if (Number.isFinite(parsed) && parsed >= 100) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_HOLD_MS;
};

const gBrowser = window.gBrowser;
const tabContainer = gBrowser?.tabContainer;

if (tabContainer && typeof gBrowser.explicitUnloadTabs === "function") {
  let gesture = null;
  let suppressClickOn = null;
  let suppressTimer = 0;

  const armSuppression = button => {
    suppressClickOn = button;
    clearTimeout(suppressTimer);
    suppressTimer = window.setTimeout(() => (suppressClickOn = null), 1000);
  };

  const paintArmed = button => {
    button.style.backgroundImage = "none";
    button.style.backgroundColor = ARMED_BG;
    button.style.color = ACCENT_COLOR;
    button.style.listStyleImage = MOON_ICON;
  };

  const clearPaint = button => {
    button.style.removeProperty("background-image");
    button.style.removeProperty("background-color");
    button.style.removeProperty("color");
    button.style.removeProperty("list-style-image");
  };

  const cancelGesture = () => {
    if (!gesture) return;
    if (gesture.raf) cancelAnimationFrame(gesture.raf);
    gesture.button.removeEventListener("mouseleave", onButtonMouseleave);
    clearPaint(gesture.button);
    gesture = null;
  };

  const onButtonMouseleave = () => cancelGesture();

  const startGesture = event => {
    if (
      event.button !== 0 ||
      event.shiftKey ||
      event.altKey ||
      event.getModifierState("Accel")
    ) {
      cancelGesture();
      return;
    }
    const button = event.target.closest?.(".tab-close-button");
    const tab = button?.closest("tab");
    // pending = already unloaded; there is nothing to unload again, let the click close it.
    if (!button || !tab || tab.hasAttribute("pending")) {
      cancelGesture();
      return;
    }
    cancelGesture();

    gesture = { button, tab, raf: 0, armed: false };
    button.addEventListener("mouseleave", onButtonMouseleave);

    const holdMs = readHoldMs();
    const start = performance.now();
    const tick = () => {
      if (!gesture || gesture.button !== button) return;
      if (!button.isConnected) {
        cancelGesture();
        return;
      }
      const progress = Math.min(1, (performance.now() - start) / holdMs);
      button.style.backgroundImage = `conic-gradient(${ACCENT_COLOR} ${progress}turn, transparent 0turn)`;
      if (progress >= 1) {
        gesture.raf = 0;
        gesture.armed = true;
        paintArmed(button);
        return;
      }
      gesture.raf = requestAnimationFrame(tick);
    };
    gesture.raf = requestAnimationFrame(tick);
  };

  const onMouseup = event => {
    if (!gesture) return;
    if (event.button !== 0) {
      cancelGesture();
      return;
    }
    const { button, tab, armed } = gesture;
    cancelGesture();
    if (!armed || !tab.isConnected) return;
    armSuppression(button);
    gBrowser.explicitUnloadTabs(
      tab.multiselected ? [...gBrowser.selectedTabs] : [tab]
    );
  };

  const onClickCapture = event => {
    if (!suppressClickOn || event.target !== suppressClickOn) return;
    suppressClickOn = null;
    clearTimeout(suppressTimer);
    event.preventDefault();
    event.stopPropagation();
  };

  const onKeydown = event => {
    if (!gesture || event.key !== "Escape") return;
    armSuppression(gesture.button);
    cancelGesture();
  };

  const onBlur = () => cancelGesture();

  tabContainer.addEventListener("mousedown", startGesture, true);
  tabContainer.addEventListener("click", onClickCapture, true);
  window.addEventListener("mouseup", onMouseup, true);
  window.addEventListener("keydown", onKeydown, true);
  window.addEventListener("blur", onBlur, true);

  window.addUnloadListener?.(() => {
    cancelGesture();
    clearTimeout(suppressTimer);
    tabContainer.removeEventListener("mousedown", startGesture, true);
    tabContainer.removeEventListener("click", onClickCapture, true);
    window.removeEventListener("mouseup", onMouseup, true);
    window.removeEventListener("keydown", onKeydown, true);
    window.removeEventListener("blur", onBlur, true);
  });
}
