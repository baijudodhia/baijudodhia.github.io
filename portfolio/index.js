window.onLoad = function () {
  setLanguage(parseInt(localStorage.getItem("lang"), 10));

  setTimeout(() => {
    document.getElementById("loading").style.display = "none";
  }, 500);
};

window.setLanguage = function (language = 1) {
  switch (language) {
    case 1:
      document.querySelector("#about-name").setAttribute("text", "Baiju Dodhia");
      break;
    case 2:
      document.querySelector("#about-name").setAttribute("text", "बैजु दोढीया");
      break;
    case 3:
      document.querySelector("#about-name").setAttribute("text", "બૈજુ દોઢીયા");
      break;
    default:
      document.querySelector("#about-name").setAttribute("text", "Baiju Dodhia");
      break;
  }
};

window.goTop = function () {
  const element = document.querySelector(".body");
  element.scrollTop = 0;
};

// Search box: the "Switch theme" action. Same behaviour as the theme switcher component.
document.querySelector("app-search-box")?.addEventListener("toggle-theme", () => {
  const root = document.documentElement;
  const theme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme);
  root.setAttribute("data-theme", theme);
});
