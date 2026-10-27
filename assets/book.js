(function () {
  'use strict';
  var root = document.documentElement;
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // font size + theme controls
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.tool'); if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'font-inc' || act === 'font-dec') {
      var cur = parseFloat(getComputedStyle(root).getPropertyValue('--fs')) || 1;
      cur = Math.min(1.8, Math.max(0.8, cur + (act === 'font-inc' ? 0.1 : -0.1)));
      root.style.setProperty('--fs', cur.toFixed(2)); store('fs', cur.toFixed(2));
    } else if (act === 'theme') {
      var dark = root.dataset.theme ? root.dataset.theme === 'dark' :
        window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark'; store('theme', root.dataset.theme);
    }
  });

  var body = document.body;

  // reader pages: jump box + arrow keys
  if (body.dataset.order) {
    var order = body.dataset.order.split(','), total = order.length;
    var cur = location.pathname.split('/').pop().replace('.html', '');
    var idx = order.indexOf(cur);
    var input = document.querySelector('.page-input');
    function jump() {
      var v = parseInt(input.value, 10);
      if (v >= 1 && v <= total) location.href = order[v - 1] + '.html'; else input.value = idx + 1;
    }
    if (input) {
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') jump(); });
      input.addEventListener('change', jump);
    }
    var rtl = root.dir === 'rtl';
    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.altKey || e.ctrlKey || e.metaKey) return;
      var step = 0;
      if (e.key === 'ArrowRight') step = rtl ? -1 : 1;
      else if (e.key === 'ArrowLeft') step = rtl ? 1 : -1;
      if (step && order[idx + step]) location.href = order[idx + step] + '.html';
    });
  }

  // index page: search
  if (body.dataset.search) {
    var q = document.getElementById('q'), res = document.getElementById('results'), data = null, loading = false;
    function norm(s) {
      return s.normalize('NFC')
        .replace(/[ً-ٰٟ॑-॔‌‍]/g, '')   // harakat, Devanagari accents, ZWJ/ZWNJ
        .replace(/़/g, '')                                           // nukta
        .replace(/[يىی]/g, 'ی').replace(/ك/g, 'ک').replace(/[ہه]/g, 'ہ')
        .toLowerCase();
    }
    function esc(s) { return s.replace(/[&<>]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c]; }); }
    function run() {
      var term = norm(q.value.trim());
      if (!term) { res.hidden = true; res.innerHTML = ''; return; }
      var out = [];
      for (var i = 0; i < data.length && out.length < 40; i++) {
        var d = data[i], nx = norm(d.x), pos = nx.indexOf(term);
        if (pos < 0 && norm(d.t).indexOf(term) < 0) continue;
        var snip = d.x.substr(Math.max(0, pos - 30), 90);
        out.push('<a href="' + d.p + '.html"><strong>' + esc(d.t) + '</strong><small>' +
          (d.n ? res.dataset.page + ' ' + d.n + ' · ' : '') + esc(snip) + '…</small></a>');
      }
      res.innerHTML = out.length ? out.join('') : '<div class="none">' + res.dataset.none + '</div>';
      res.hidden = false;
    }
    q.addEventListener('input', function () {
      if (data) return run();
      if (loading) return; loading = true;
      fetch(body.dataset.search).then(function (r) { return r.json(); }).then(function (j) { data = j; run(); });
    });
  }
})();
