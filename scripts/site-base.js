/**
 * GitHub Pages project sites live at username.github.io/REPO/ — root-absolute
 * paths like /topics/... resolve to github.io/topics/... (404).
 * Sets window.__SITE_BASE__ and <base href> to /REPO/ on github.io, else /.
 * Must load synchronously in <head> before stylesheets (use inline duplicate on
 * pages that cannot reference this file by a stable relative path).
 */
(function () {
  var b = "/";
  if (location.hostname.endsWith("github.io")) {
    var m = location.pathname.match(/^\/([^/]+)\//);
    if (m) {
      b = "/" + m[1] + "/";
    }
  }
  window.__SITE_BASE__ = b;
  var el = document.createElement("base");
  el.href = b;
  var head = document.head;
  if (head) {
    head.insertBefore(el, head.firstChild);
  }
})();
