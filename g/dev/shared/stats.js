// 匿名利用統計：只上传「当天某计数 +1」，不带任何用户 ID / LINE 信息（存到 Firestore stats/{环境}_{游戏}_{日期}）
// 留存：本机记住首次游玩日，之后每天第一次打开时记一次「第 N 天回来」（r1/r3/r7/r14/r30），新用户记 new
// 用法：Stats.init('hd'); Stats.hit('games');
(function () {
  var KEY = 'AIzaSyDhV3mzkpzMXTr8SPDkwVooFWavyEkfftQ', PROJECT = 'star-fortune-bdf8a';
  var FIELDS = ['open', 'new', 'r1', 'r2', 'r3', 'r7', 'r14', 'r30', 'games', 'daily1', 'daily3', 'promo', 'share', 'skin', 'lucky'];
  var game = '', env = /\/app\//.test(location.pathname) ? 'app' : /\/review\//.test(location.pathname) ? 'review' : 'dev';
  function today() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, ''); }
  function days(a, b) {
    var f = function (k) { return Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8)); };
    return Math.round((f(b) - f(a)) / 864e5);
  }
  function get(k, d) { try { var v = localStorage.getItem('hoshi.stats.' + game + '.' + k); return v === null ? d : v; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem('hoshi.stats.' + game + '.' + k, v); } catch (e) {} }

  function send(fields) {
    if (!game || location.protocol !== 'https:') return; // 本地调试不上传
    var doc = 'projects/' + PROJECT + '/databases/(default)/documents/stats/' + env + '_' + game + '_' + today();
    var body = { writes: [{ transform: { document: doc, fieldTransforms: fields.map(function (f) { return { fieldPath: f, increment: { integerValue: '1' } }; }) } }] };
    try {
      fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents:commit?key=' + KEY,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(function () {});
    } catch (e) {}
  }

  window.Stats = {
    init: function (g) {
      game = g;
      var t = today(), first = get('first', ''), last = get('last', '');
      if (last === t) return;
      set('last', t);
      var f = ['open'];
      if (!first) { set('first', t); f.push('new'); }
      else { var d = days(first, t); if ([1, 2, 3, 7, 14, 30].indexOf(d) >= 0) f.push('r' + d); }
      send(f);
    },
    hit: function (name) { if (FIELDS.indexOf(name) >= 0) send([name]); }
  };
})();
