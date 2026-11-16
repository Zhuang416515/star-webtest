// ほしドロップ：11 段階の星の見た目（すべてコードで描画）
var Tiers = [
  { r: 15, c: '#b9a7ff', ja: 'ほしくず', zh: '星尘' },
  { r: 20, c: '#ffd86b', ja: 'こぼし星', zh: '小星星' },
  { r: 26, c: '#ff9ecf', ja: 'こんぺいとう', zh: '金平糖' },
  { r: 33, c: '#7fd1ff', ja: 'ながれぼし', zh: '流星' },
  { r: 41, c: '#fff1a8', ja: 'みかづき', zh: '新月' },
  { r: 50, c: '#ffe07a', ja: 'まんげつ', zh: '满月' },
  { r: 59, c: '#8ff0d0', ja: 'すいせい', zh: '彗星' },
  { r: 69, c: '#ffb36b', ja: 'わくせい', zh: '行星' },
  { r: 80, c: '#6aa8ff', ja: 'あおいほし', zh: '蓝星' },
  { r: 92, c: '#ff7a4a', ja: 'たいよう', zh: '太阳' },
  { r: 106, c: '#a07bff', ja: 'ぎんが', zh: '银河' }
];
var Points = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 100];

function shade(hex, k) {
  var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  var f = function (v) { return Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); };
  return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
}

// 在 (x,y) 画第 t 段，半径 r，旋转 a
function drawTier(ctx, t, x, y, r, a, blink) {
  var tier = Tiers[t];
  ctx.save();
  ctx.translate(x, y);
  // 光晕
  if (t >= 9) {
    var halo = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 1.35);
    halo.addColorStop(0, t === 9 ? 'rgba(255,160,80,.45)' : 'rgba(170,130,255,.45)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, r * 1.35, 0, 7); ctx.fill();
  }
  ctx.rotate(a);
  // 行星环（背面）
  if (t === 7) ring(ctx, r, false);
  var g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, shade(tier.c, 0.55)); g.addColorStop(0.7, tier.c); g.addColorStop(1, shade(tier.c, -0.25));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  deco(ctx, t, r);
  if (t === 7) ring(ctx, r, true);
  ctx.rotate(-a);
  face(ctx, r, blink);
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 0.48, r * 0.2, r * 0.12, -0.6, 0, 7); ctx.fill();
  ctx.restore();
}

function ring(ctx, r, front) {
  ctx.strokeStyle = 'rgba(255,240,200,.9)'; ctx.lineWidth = r * 0.14;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 1.45, r * 0.38, -0.35, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); ctx.stroke();
}

function deco(ctx, t, r) {
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  if (t === 2) { // 金平糖：小突起
    for (var i = 0; i < 8; i++) { var q = i * Math.PI / 4; ctx.beginPath(); ctx.arc(Math.cos(q) * r * 0.92, Math.sin(q) * r * 0.92, r * 0.18, 0, 7); ctx.fill(); }
  } else if (t === 4) { // 新月：阴影
    ctx.fillStyle = 'rgba(80,60,150,.35)'; ctx.beginPath(); ctx.arc(r * 0.45, -r * 0.1, r * 0.8, 0, 7); ctx.fill();
  } else if (t === 5 || t === 8) { // 坑 / 云
    for (var j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc((j - 1) * r * 0.5, r * (j === 1 ? 0.55 : 0.35), r * 0.13, 0, 7); ctx.fill(); }
  } else if (t === 6) { // 彗星尾
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.9); ctx.lineTo(-r * 0.9, -r * 0.2); ctx.lineTo(-r * 0.4, -r * 0.4); ctx.fill();
  } else if (t === 9) { // 太阳光芒
    ctx.strokeStyle = 'rgba(255,230,140,.8)'; ctx.lineWidth = r * 0.08;
    for (var k = 0; k < 12; k++) { var p = k * Math.PI / 6; ctx.beginPath(); ctx.moveTo(Math.cos(p) * r * 0.8, Math.sin(p) * r * 0.8); ctx.lineTo(Math.cos(p) * r * 0.97, Math.sin(p) * r * 0.97); ctx.stroke(); }
  } else if (t === 10) { // 银河漩涡
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = r * 0.07;
    for (var m = 0; m < 2; m++) { ctx.beginPath(); for (var s = 0; s < 30; s++) { var q2 = s * 0.25 + m * Math.PI, d = r * s / 34; ctx.lineTo(Math.cos(q2) * d, Math.sin(q2) * d); } ctx.stroke(); }
  }
}

function face(ctx, r, blink) {
  var ey = -r * 0.02, ex = r * 0.3, es = Math.max(2, r * 0.11);
  ctx.fillStyle = '#3b2a5c';
  if (blink) {
    ctx.fillRect(-ex - es, ey, es * 2, es * 0.4); ctx.fillRect(ex - es, ey, es * 2, es * 0.4);
  } else {
    ctx.beginPath(); ctx.arc(-ex, ey, es, 0, 7); ctx.arc(ex, ey, es, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-ex + es * 0.35, ey - es * 0.35, es * 0.35, 0, 7); ctx.arc(ex + es * 0.35, ey - es * 0.35, es * 0.35, 0, 7); ctx.fill();
  }
  ctx.strokeStyle = '#3b2a5c'; ctx.lineWidth = Math.max(1.2, r * 0.05);
  ctx.beginPath(); ctx.arc(0, r * 0.12, r * 0.13, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,160,.45)';
  ctx.beginPath(); ctx.ellipse(-r * 0.5, r * 0.18, r * 0.14, r * 0.08, 0, 0, 7); ctx.ellipse(r * 0.5, r * 0.18, r * 0.14, r * 0.08, 0, 0, 7); ctx.fill();
}
