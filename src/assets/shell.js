(function () {
  var themeToggle = document.querySelector("[data-theme-toggle]");
  var storageKey = "repo-foundry-theme";

  function currentTheme() {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
  }

  function applyTheme(theme) {
    var nextTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    if (themeToggle) {
      themeToggle.textContent = nextTheme === "dark" ? "Dark mode" : "Light mode";
      themeToggle.setAttribute("aria-pressed", nextTheme === "dark" ? "true" : "false");
    }
  }

  applyTheme(currentTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var nextTheme = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch (error) {}
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
