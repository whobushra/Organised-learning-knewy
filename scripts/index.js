/**
 * Sets .active on the matching nav <li>. Uses data-nav keys so we are not
 * tied to filename parsing (extensionless URLs, trailing slashes, subpaths).
 */
function setActiveNav() {
  var path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
  var p = path.toLowerCase();

  var activeKey = "home";
  if (p.indexOf("/topics/") !== -1) {
    activeKey = "courses";
  } else if (p.endsWith("/index2.html") || p.endsWith("/index2")) {
    activeKey = "courses";
  } else if (
    p.indexOf("feedback.html") !== -1 ||
    p.indexOf("/components/feedback") !== -1 ||
    p.endsWith("/feedback")
  ) {
    activeKey = "contact";
  } else if (p.endsWith("/about.html") || p.endsWith("/about")) {
    activeKey = "about";
  } else if (
    p.endsWith("/login.html") ||
    p.indexOf("/components/login") !== -1 ||
    p.endsWith("/login")
  ) {
    activeKey = "none";
  } else if (p.endsWith("/index.html") || p === "/" || p === "") {
    activeKey = "home";
  }

  document.querySelectorAll(".site-nav li").forEach(function (li) {
    li.classList.remove("active");
  });

  if (activeKey === "none") {
    return;
  }

  var link = document.querySelector('.site-nav a[data-nav="' + activeKey + '"]');
  if (link && link.closest("li")) {
    link.closest("li").classList.add("active");
  }
}

$(function () {
  var base = (window.__SITE_BASE__ || "/").replace(/\/?$/, "/");
  $("#head-container").load(base + "components/header.html", function () {
    setActiveNav();
  });
  $("#foot-container").load(base + "components/footer.html");

  var link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.getElementsByTagName("head")[0].appendChild(link);
  }
  link.href = base + "favicon.svg";
});
