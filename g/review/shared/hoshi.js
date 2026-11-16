// 星シリーズ共通 SDK：LINE(LIFF) 初期化・分享・存储・互推栏・音效
(function () {
  var H = {};
  var zh = /^zh/i.test(navigator.language || '');
  H.lang = zh ? 'zh' : 'ja';
  H.t = function (o) { return o[H.lang] || o.ja; };

  // ---- 存储（隐私模式等异常时静默失败）----
  H.load = function (k, def) {
    try { var v = localStorage.getItem('hoshi.' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
  };
  H.save = function (k, v) { try { localStorage.setItem('hoshi.' + k, JSON.stringify(v)); } catch (e) {} };

  // ---- LINE ----
  H.inClient = false;
  H.name = '';
  H.miniUrl = '';
  // ids: { dev: 'liffId', review: 'liffId', app: 'liffId' }，按部署目录选择
  H.init = function (ids) {
    return new Promise(function (resolve) {
      var path = location.pathname;
      var env = path.indexOf('/app/') >= 0 ? 'app' : path.indexOf('/review/') >= 0 ? 'review' : 'dev';
      var id = ids && ids[env];
      if (!id) { resolve(); return; }
      H.miniUrl = 'https://miniapp.line.me/' + id;
      var start = function () {
        liff.init({ liffId: id }).then(function () {
          H.inClient = liff.isInClient();
          if (!liff.isLoggedIn()) { resolve(); return; }
          liff.getProfile().then(function (p) { H.name = p.displayName || ''; resolve(); }).catch(function () { resolve(); });
        }).catch(function () { resolve(); });
      };
      var s = document.createElement('script');
      s.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      s.onload = start;
      s.onerror = function () { resolve(); };
      document.head.appendChild(s);
      setTimeout(resolve, 4000); // LIFF 卡住时不阻塞游戏
    });
  };

  H.share = function (text) {
    var url = H.miniUrl || location.href.split('?')[0];
    var msg = text + '\n' + url;
    if (window.liff && H.inClient && liff.isApiAvailable('shareTargetPicker')) {
      liff.shareTargetPicker([{ type: 'text', text: msg }]).catch(function () {});
    } else if (navigator.share) {
      navigator.share({ text: msg }).catch(function () {});
    } else {
      window.open('https://line.me/R/share?text=' + encodeURIComponent(msg), '_blank');
    }
  };

  H.open = function (url) {
    if (window.liff && H.inClient) liff.openWindow({ url: url, external: false });
    else location.href = url;
  };

  // ---- 互推栏：读取 ../games.json，显示除自己以外的游戏 ----
  H.promo = function (el, selfId) {
    fetch('../games.json?v=' + Math.floor(Date.now() / 600000)).then(function (r) { return r.json(); }).then(function (list) {
      el.innerHTML = '';
      list.filter(function (g) { return g.id !== selfId; }).forEach(function (g) {
        var a = document.createElement('button');
        a.className = 'promo-card';
        a.innerHTML = '<img src="../' + g.icon + '" alt=""><div><b>' + H.t(g.name) + '</b><span>' + H.t(g.desc) +
          '</span></div><em>' + H.t({ ja: 'あそぶ', zh: '去玩' }) + '</em>';
        a.onclick = function () { H.open(g.url); };
        el.appendChild(a);
      });
    }).catch(function () { el.innerHTML = ''; });
  };

  // ---- 音效：WebAudio 合成，首次触摸后启用 ----
  var ctx = null;
  H.muted = H.load('muted', false);
  H.tone = function (freq, dur, type, vol) {
    if (H.muted) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur);
      g.gain.setValueAtTime(vol || 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur);
    } catch (e) {}
  };

  window.Hoshi = H;
})();
