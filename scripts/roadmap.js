/**
 * Per-topic roadmap: mark any step complete/incomplete, persist in localStorage,
 * smooth progress bar. Migrates legacy cookie (linear progress) once.
 */
(function () {
  var topicEl = document.getElementById("topic");
  var nodes_container = document.getElementById("roadmap-nodes-container");
  if (!topicEl || typeof roadmap === "undefined" || !nodes_container) {
    return;
  }

  var topic = topicEl.textContent.trim().toLowerCase();
  var STORAGE_KEY = "knewy-roadmap-" + topic;
  var LEGACY_COOKIE = topic + "-roadmap-progress";

  function getCookie(name) {
    var decoded = decodeURIComponent(document.cookie || "");
    var parts = decoded.split(";");
    for (var i = 0; i < parts.length; i++) {
      var c = parts[i].replace(/^\s+/, "");
      if (c.indexOf(name + "=") === 0) {
        return c.substring(name.length + 1);
      }
    }
    return "";
  }

  function loadCompleted() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          return new Set(arr.filter(function (n) {
            return typeof n === "number" && n >= 0 && n < roadmap.length;
          }));
        }
      }
    } catch (e) {
      /* ignore */
    }

    var legacy = getCookie(LEGACY_COOKIE);
    if (legacy && legacy.indexOf("node") === 0) {
      var idx = parseInt(legacy.replace(/^node/, ""), 10);
      var migrated = new Set();
      if (!isNaN(idx)) {
        for (var j = 0; j <= idx && j < roadmap.length; j++) {
          migrated.add(j);
        }
      }
      document.cookie =
        LEGACY_COOKIE + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      if (migrated.size) {
        saveCompleted(migrated);
        return migrated;
      }
    }

    return new Set();
  }

  function saveCompleted(set) {
    var arr = Array.from(set).sort(function (a, b) {
      return a - b;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      /* quota */
    }
  }

  var completed = loadCompleted();

  function updateProgressBar() {
    var total = roadmap.length;
    var done = 0;
    completed.forEach(function (i) {
      if (i >= 0 && i < total) {
        done++;
      }
    });
    var pct = total ? Math.round((done / total) * 100) : 0;

    var fill = document.getElementById("progress-fill");
    var countEl = document.getElementById("progress-count");
    var totalEl = document.getElementById("progress-total");
    var bar = document.getElementById("roadmap-progress-bar");

    if (fill) {
      fill.style.width = pct + "%";
    }
    if (bar) {
      bar.setAttribute("aria-valuenow", String(pct));
      bar.setAttribute("aria-valuetext", done + " of " + total + " completed");
    }
    if (countEl) {
      countEl.textContent = String(done);
    }
    if (totalEl) {
      totalEl.textContent = String(total);
    }
  }

  function setNodeVisual(nodeEl, index, isDone) {
    nodeEl.classList.toggle("is-done", isDone);
    var btn = nodeEl.querySelector(".roadmap-node-check");
    if (btn) {
      btn.setAttribute("aria-pressed", isDone ? "true" : "false");
      btn.setAttribute("aria-label", isDone ? "Mark as not done" : "Mark as done");
    }
  }

  function toggleStep(index) {
    if (index < 0 || index >= roadmap.length) {
      return;
    }
    if (completed.has(index)) {
      completed.delete(index);
    } else {
      completed.add(index);
    }
    saveCompleted(completed);
    var el = document.getElementById("node-" + index);
    if (el) {
      setNodeVisual(el, index, completed.has(index));
    }
    updateProgressBar();
  }

  function findNextIncomplete() {
    for (var i = 0; i < roadmap.length; i++) {
      if (!completed.has(i)) {
        var el = document.getElementById("node-" + i);
        if (el) {
          el.classList.add("roadmap-node--pulse");
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(function () {
            el.classList.remove("roadmap-node--pulse");
          }, 1200);
        }
        return;
      }
    }
    var wrap = document.querySelector(".roadmap-toolbar");
    if (wrap) {
      wrap.classList.add("roadmap-toolbar--celebrate");
      setTimeout(function () {
        wrap.classList.remove("roadmap-toolbar--celebrate");
      }, 800);
    }
  }

  function clearAll() {
    if (!confirm("Clear all progress on this roadmap?")) {
      return;
    }
    completed.clear();
    saveCompleted(completed);
    for (var i = 0; i < roadmap.length; i++) {
      var el = document.getElementById("node-" + i);
      if (el) {
        setNodeVisual(el, i, false);
      }
    }
    updateProgressBar();
  }

  function buildNodes() {
    nodes_container.innerHTML = "";
    nodes_container.classList.add("roadmap-nodes");

    for (var i = 0; i < roadmap.length; i++) {
      (function (idx) {
        var item = roadmap[idx];
        var article = document.createElement("article");
        article.className = "roadmap-node";
        article.id = "node-" + idx;
        article.dataset.nodeIndex = String(idx);

        var isDone = completed.has(idx);

        var checkBtn = document.createElement("button");
        checkBtn.type = "button";
        checkBtn.className = "roadmap-node-check";
        checkBtn.setAttribute("aria-pressed", isDone ? "true" : "false");
        checkBtn.setAttribute(
          "aria-label",
          isDone ? "Mark as not done" : "Mark as done"
        );
        checkBtn.innerHTML =
          '<span class="roadmap-node-check-icon" aria-hidden="true"></span>';

        checkBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleStep(idx);
        });

        var body = document.createElement("div");
        body.className = "roadmap-node-body";

        var h2 = document.createElement("h2");
        h2.className = "roadmap-node-title";
        h2.textContent = item.heading;

        var p = document.createElement("p");
        p.className = "roadmap-node-desc";
        p.textContent = item.content;

        body.appendChild(h2);
        body.appendChild(p);

        if (item.link) {
          var a = document.createElement("a");
          a.className = "roadmap-node-link";
          a.href = item.link;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = "Open resource";
          a.addEventListener("click", function (e) {
            e.stopPropagation();
          });
          body.appendChild(a);
        }

        article.appendChild(checkBtn);
        article.appendChild(body);

        article.addEventListener("click", function (e) {
          if (e.target.closest("a")) {
            return;
          }
          toggleStep(idx);
        });

        nodes_container.appendChild(article);
        setNodeVisual(article, idx, isDone);
      })(i);
    }
  }

  buildNodes();
  updateProgressBar();

  var btnNext = document.getElementById("find-next");
  var btnClear = document.getElementById("clear-progress");
  if (btnNext) {
    btnNext.addEventListener("click", findNextIncomplete);
  }
  if (btnClear) {
    btnClear.addEventListener("click", clearAll);
  }
})();
