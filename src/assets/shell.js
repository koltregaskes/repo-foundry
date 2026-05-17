(function () {
  var skins = ["hud", "term"];
  var accents = ["magenta", "blue", "green", "amber", "violet"];
  var skinKey = "foundry.skin";
  var accentKey = "foundry.accent";
  var root = document.documentElement;

  function isTyping(target) {
    if (!target) return false;
    var tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
  }

  function storedValue(key, allowed, fallback) {
    try {
      var stored = window.localStorage.getItem(key);
      return allowed.includes(stored) ? stored : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function applySkin(skin) {
    var next = skins.includes(skin) ? skin : "hud";
    root.dataset.skin = next;
    document.querySelectorAll("[data-skin-set]").forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.skinSet === next ? "true" : "false");
    });
  }

  function applyAccent(accent) {
    var next = accents.includes(accent) ? accent : "magenta";
    root.dataset.accent = next;
    document.querySelectorAll("[data-accent-set]").forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.accentSet === next ? "true" : "false");
    });
  }

  function persist(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {}
  }

  applySkin(storedValue(skinKey, skins, "hud"));
  applyAccent(storedValue(accentKey, accents, "magenta"));

  document.addEventListener("click", function (event) {
    var skinButton = event.target.closest("[data-skin-set]");
    if (skinButton) {
      applySkin(skinButton.dataset.skinSet);
      persist(skinKey, root.dataset.skin);
      return;
    }

    var accentButton = event.target.closest("[data-accent-set]");
    if (accentButton) {
      applyAccent(accentButton.dataset.accentSet);
      persist(accentKey, root.dataset.accent);
      return;
    }

    if (event.target.closest("[data-shortcut-close]")) {
      toggleHelp(false);
    }
  });

  function focusStep(direction) {
    var focusables = Array.from(
      document.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    ).filter(function (node) {
      return node.offsetParent !== null;
    });
    if (!focusables.length) return;
    var current = focusables.indexOf(document.activeElement);
    var nextIndex = current < 0 ? 0 : (current + direction + focusables.length) % focusables.length;
    focusables[nextIndex].focus();
  }

  function toggleHelp(force) {
    var help = document.querySelector("[data-shortcut-help]");
    if (!help) return;
    var show = typeof force === "boolean" ? force : help.hasAttribute("hidden");
    if (show) {
      help.removeAttribute("hidden");
      help.querySelector("button")?.focus();
    } else {
      help.setAttribute("hidden", "");
    }
  }

  document.addEventListener("keydown", function (event) {
    if (isTyping(event.target)) return;
    var key = event.key.toLowerCase();

    if (key === "t") {
      var nextSkin = root.dataset.skin === "hud" ? "term" : "hud";
      applySkin(nextSkin);
      persist(skinKey, nextSkin);
      return;
    }

    var accentIndex = "12345".indexOf(event.key);
    if (accentIndex >= 0) {
      var nextAccent = accents[accentIndex];
      applyAccent(nextAccent);
      persist(accentKey, nextAccent);
      return;
    }

    if (key === "j") {
      event.preventDefault();
      focusStep(1);
      return;
    }

    if (key === "k") {
      event.preventDefault();
      focusStep(-1);
      return;
    }

    if (event.key === "?") {
      event.preventDefault();
      toggleHelp();
      return;
    }

    if (key === "escape") {
      toggleHelp(false);
    }
  });

  var form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = form.querySelector("[data-contact-status]");
      if (status) {
        status.textContent = "Draft prepared locally. Open GitHub or email with the same public-safe note.";
      }
    });
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.body.classList.add("has-motion");
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -80px 0px" });
  document.querySelectorAll("[data-reveal]").forEach(function (el) {
    observer.observe(el);
  });
})();
