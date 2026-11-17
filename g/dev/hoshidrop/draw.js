// ほしドロップ：12 星座の段階データと描画・エフェクト
var Tiers = [
  { r: 15, c: '#ffd36b', ja: 'おひつじ座', zh: '白羊座' },
  { r: 19, c: '#9be08a', ja: 'おうし座', zh: '金牛座' },
  { r: 24, c: '#ffe27a', ja: 'ふたご座', zh: '双子座' },
  { r: 29, c: '#ff8f7a', ja: 'かに座', zh: '巨蟹座' },
  { r: 35, c: '#ffb84d', ja: 'しし座', zh: '狮子座' },
  { r: 42, c: '#b4e6a0', ja: 'おとめ座', zh: '处女座' },
  { r: 49, c: '#ff9ecf', ja: 'てんびん座', zh: '天秤座' },
  { r: 57, c: '#b08cff', ja: 'さそり座', zh: '天蝎座' },
  { r: 66, c: '#ffc36b', ja: 'いて座', zh: '射手座' },
  { r: 76, c: '#9fc1ff', ja: 'やぎ座', zh: '摩羯座' },
  { r: 87, c: '#7fe0ff', ja: 'みずがめ座', zh: '水瓶座' },
  { r: 100, c: '#c9a3ff', ja: 'うお座', zh: '双鱼座' }
];
var Points = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78];
var Imgs = Tiers.map(function (t, i) { var im = new Image(); im.src = 'img/z' + i + '.webp'; return im; });
var IMG_K = 2.26; // 画像サイズ / 物理半径（紋章の円が半径にぴったり合う）

function drawTier(ctx, t, x, y, r, a, sc) {
  var im = Imgs[t], s = r * IMG_K * (sc || 1);
  ctx.save(); ctx.translate(x, y); ctx.rotate(a || 0);
  if (im.complete && im.naturalWidth) ctx.drawImage(im, -s / 2, -s / 2, s, s);
  else { ctx.fillStyle = Tiers[t].c; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); }
  ctx.restore();
}

function starPath(ctx, x, y, r, rot) {
  ctx.beginPath();
  for (var i = 0; i < 10; i++) {
    var q = rot + i * Math.PI / 5 - Math.PI / 2, d = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(q) * d, y + Math.sin(q) * d);
  }
  ctx.closePath();
}

// ---- エフェクト：星の粒・波紋・得点文字 ----
var Fx = {
  list: [],
  burst: function (x, y, c, r) {
    var n = 8 + Math.round(r / 6);
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 7, v = 1.5 + Math.random() * 3 + r / 40;
      this.list.push({ k: 's', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, life: 1, c: Math.random() < 0.4 ? '#fff6c0' : c, s: 3 + Math.random() * 4, rot: Math.random() * 6 });
    }
    this.list.push({ k: 'o', x: x, y: y, r: r, life: 1, c: c });
  },
  // 連鎖表示は常に 1 つだけ（前のを置き換える）
  combo: function (x, y, str) {
    this.list = this.list.filter(function (p) { return !(p.k === 't' && p.big); });
    this.text(x, y, str, true);
  },
  text: function (x, y, str, big) { this.list.push({ k: 't', x: x, y: y, str: str, life: 1, big: big }); },
  step: function (dt) {
    this.list.forEach(function (p) {
      p.life -= dt * (p.k === 't' ? 1.1 : 1.6);
      if (p.k === 's') { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.vx *= 0.98; p.rot += 0.1; }
      if (p.k === 't') p.y -= dt * 40;
    });
    this.list = this.list.filter(function (p) { return p.life > 0; });
  },
  draw: function (ctx) {
    this.list.forEach(function (p) {
      ctx.globalAlpha = Math.min(1, p.life * 1.5);
      if (p.k === 's') { ctx.fillStyle = p.c; starPath(ctx, p.x, p.y, p.s, p.rot); ctx.fill(); }
      else if (p.k === 'o') {
        ctx.strokeStyle = p.c; ctx.lineWidth = 6 * p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1.6 - p.life * 0.6), 0, 7); ctx.stroke();
      } else {
        var f = p.big ? 30 : 20, pop = 1 + Math.max(0, p.life - 0.8) * 2;
        ctx.font = '800 ' + Math.round(f * pop) + 'px "M PLUS Rounded 1c", "Noto Sans SC", sans-serif'; ctx.textAlign = 'center';
        ctx.lineWidth = 6; ctx.strokeStyle = '#4a2a7a'; ctx.lineJoin = 'round'; ctx.strokeText(p.str, p.x, p.y);
        ctx.fillStyle = p.big ? '#ffd25e' : '#fff'; ctx.fillText(p.str, p.x, p.y);
      }
    });
    ctx.globalAlpha = 1;
  }
};
