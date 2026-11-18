// ほしドロップ：きょうのおだい（每日 3 题）・ほしスタンプ・きせかえ・ラッキー星座・回归奖励
// 方案：research/reviews/2026-11-18_hoshidrop_economy.md
(function () {
  function today() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, ''); } // 日本时间
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h || 1; }
  function rnd(st) { var s = st.s; s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; return (st.s = s >>> 0); }
  function days(a, b) { // 日期键之差（天）
    var f = function (k) { return Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8)); };
    return Math.round((f(b) - f(a)) / 864e5);
  }

  // 题型：e=简单档 n=普通档。累计型跨局计数；单局型（score/reach）取单局成绩
  var Types = {
    merge: { e: { n: 25 }, h: { n: 40 }, ja: '星座を {n} 回 合体させよう', zh: '合并星座 {n} 次' },
    score: { e: { n: 800 }, h: { n: 1500 }, ja: '1回で {n} 点 とろう', zh: '一局拿到 {n} 分' },
    reach: { e: { a: 5 }, h: { a: 6 }, ja: '1回で {a} まで そだてよう', zh: '一局内合成到{a}' },
    make: { e: { a: 3, n: 4 }, h: { a: 4, n: 2 }, ja: '{a} を {n} 回 つくろう', zh: '合成出{a} {n} 次' },
    combo: { e: { c: 2, n: 3 }, h: { c: 3, n: 1 }, ja: '{c}れんさ を {n} 回 出そう', zh: '打出 {c} 连锁 {n} 次' },
    lucky: { ja: 'ラッキー星座 {a} を {n} 回 つくろう', zh: '合成出幸运星座{a} {n} 次' }
  };
  var LuckyN = [0, 8, 6, 4, 3, 2, 1]; // 按幸运星座段数定次数（1~6 段才出题）

  // きせかえ：纯配色（背景渐变、罐子描边、星粒）；need = 累计印章
  var Skins = [
    { ja: 'ゆめいろ', zh: '梦幻色', bg: ['#f3eeff', '#ffeaf3'], jar: '#5b3f86', star: '#9b7fd6', need: 0 },
    { ja: 'さくらミルク', zh: '樱花牛奶', bg: ['#ffe3ee', '#ffc9dc'], jar: '#c2557f', star: '#f29bbb', need: 3 },
    { ja: 'ミントソーダ', zh: '薄荷苏打', bg: ['#d6f7ed', '#c9ecff'], jar: '#2f8f87', star: '#7fd3c5', need: 10 },
    { ja: 'レモンパイ', zh: '柠檬派', bg: ['#fff2bf', '#ffdcb0'], jar: '#b0761c', star: '#f0c24a', need: 20 },
    { ja: 'よぞらブルー', zh: '夜空蓝', bg: ['#d3dcfc', '#c3b9f5'], jar: '#33418f', star: '#7d8cf0', need: 34 },
    { ja: 'ラベンダー', zh: '薰衣草', bg: ['#e6d8ff', '#d6c2ff'], jar: '#6a3fa8', star: '#b48cf0', need: 52 },
    { ja: 'ほしぞらゴールド', zh: '星空金', bg: ['#ffeeb8', '#ead6ff'], jar: '#7a5a12', star: '#e8b93a', need: 75 }
  ];

  var D = window.Daily = { Skins: Skins, Types: Types };
  // 星占い 当天运势第 1 位（Unity 导出的 lucky.json）；取不到时用日期哈希
  var luckyMap = {};
  try { var x = new XMLHttpRequest(); x.open('GET', '../shared/lucky.json', false); x.send(); if (x.status === 200) luckyMap = JSON.parse(x.responseText); } catch (e) {}
  function luckyOf(t) { return luckyMap[t] !== undefined ? luckyMap[t] : hash('hd|lucky|' + t) % 12; }
  var st, stamps, skin, last;

  D.load = function () {
    var t = today();
    D.lucky = luckyOf(t); D.fromFortune = luckyMap[t] !== undefined;
    stamps = Hoshi.load('hoshidrop.stamps', 0); skin = Hoshi.load('hoshidrop.skin', 0); last = Hoshi.load('hoshidrop.last', '');
    st = Hoshi.load('hoshidrop.daily', null);
    if (!st || st.d !== t) {
      st = { d: t, q: pick(t), p: [0, 0, 0], ok: [0, 0, 0], all: 0, back: last && days(last, t) >= 3 ? 1 : 0 };
      Hoshi.save('hoshidrop.daily', st);
    }
    D.q = st.q; D.ok = st.ok; D.p = st.p; D.back = st.back; D.stamps = stamps; D.skin = skin;
  };

  function pick(t) {
    var r = { s: hash('hd|daily|' + t) }, pool = ['merge', 'score', 'reach', 'make', 'combo'], q = [];
    var take = function () { return pool.splice(rnd(r) % pool.length, 1)[0]; };
    var L = luckyOf(t);
    if (L >= 1 && L <= 6) q.push({ t: 'lucky', a: L, n: LuckyN[L] }); else q.push(mk(take(), 'e'));
    q.push(mk(take(), 'e')); q.push(mk(take(), 'h'));
    return q;
  }
  function mk(type, lv) { var o = { t: type }, p = Types[type][lv]; for (var k in p) o[k] = p[k]; return o; }

  D.text = function (i) {
    var g = st.q[i];
    return Hoshi.t(Types[g.t]).replace('{n}', g.n).replace('{c}', g.c).replace('{a}', g.a !== undefined ? Hoshi.t(Tiers[g.a]) : '');
  };
  D.goal = function (i) { var g = st.q[i]; return g.t === 'reach' ? 1 : g.n; };
  D.progress = function (i) { return Math.min(st.p[i], D.goal(i)); };
  D.doneCount = function () { return st.ok[0] + st.ok[1] + st.ok[2]; };

  // 事件：merge {t, combo} / over {score, maxTier}。返回 { done: [题号], all: bool, gain: 印章数 }
  D.on = function (type, v) {
    if (!st || st.d !== today()) D.load();
    var res = { done: [], all: false, gain: 0 };
    st.q.forEach(function (g, i) {
      if (st.ok[i]) return;
      if (type === 'merge') {
        if (g.t === 'merge') st.p[i]++;
        else if ((g.t === 'make' || g.t === 'lucky') && v.t === g.a) st.p[i]++;
        else if (g.t === 'combo' && v.combo === g.c) st.p[i]++;
      } else if (type === 'over') {
        if (g.t === 'score') st.p[i] = Math.max(st.p[i], v.score);
        if (g.t === 'reach' && v.maxTier >= g.a) st.p[i] = 1;
      }
      if (st.p[i] >= D.goal(i)) { st.ok[i] = 1; res.done.push(i); res.gain += st.back ? 2 : 1; }
    });
    if (!st.all && D.doneCount() === 3) { st.all = 1; res.all = true; res.gain += 1; }
    if (res.gain) { stamps += res.gain; Hoshi.save('hoshidrop.stamps', stamps); D.stamps = stamps; }
    if (type === 'over') { last = today(); Hoshi.save('hoshidrop.last', last); }
    Hoshi.save('hoshidrop.daily', st);
    return res;
  };

  // きょうのベスト：返回是否刷新
  D.dayBest = function (score) {
    var b = Hoshi.load('hoshidrop.dayBest', { d: '', s: 0 }), t = today();
    if (b.d !== t) b = { d: t, s: 0 };
    var up = score > b.s && score > 0; if (up) { b.s = score; Hoshi.save('hoshidrop.dayBest', b); }
    return up;
  };

  D.unlocked = function (i) { return stamps >= Skins[i].need; };
  D.nextSkin = function () { for (var i = 0; i < Skins.length; i++) if (stamps < Skins[i].need) return i; return -1; };
  D.setSkin = function (i) { if (D.unlocked(i)) { skin = D.skin = i; Hoshi.save('hoshidrop.skin', i); } };
  D.cur = function () { return Skins[skin] || Skins[0]; };

  D.load();
})();
