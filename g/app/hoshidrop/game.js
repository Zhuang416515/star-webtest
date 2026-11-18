// ほしドロップ：物理・ルール・描画（画面遷移は ui.js）
(function () {
  var M = Matter, W = 360;
  var cv = document.getElementById('cv'), ctx = cv.getContext('2d');
  var S, H, dpr, ox, left = 14, right = W - 14, top, bottom, dropY, dangerY;
  var engine, balls, queue, cur, next, aimX = W / 2, cooldown, overTimer, shake = 0, last = 0, acc = 0;
  var stars = [];
  var G = window.Game = { running: false, score: 0, maxTier: 0, combo: 0, seen: Hoshi.load('hoshidrop.seen', []) };
  var comboT = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    S = Math.min(innerWidth / W, innerHeight / (W * 1.5)); ox = (innerWidth / S - W) / 2; H = innerHeight / S;
    var hud = 78 / S; // HUD の高さ
    bottom = H - 50; top = Math.max(hud + 76, bottom - 470); // 瓶子稍矮：乱投 2~4 分钟会满
    dangerY = top + 6; dropY = top - 40;
    stars = [];
    for (var i = 0; i < 40; i++) stars.push({ x: Math.random() * innerWidth / S, y: Math.random() * H * 0.7, s: 0.6 + Math.random() * 1.6, p: Math.random() * 7 });
  }

  function pick() { var r = Math.random(); return r < 0.25 ? 0 : r < 0.5 ? 1 : r < 0.72 ? 2 : r < 0.88 ? 3 : 4; }

  G.clear = function () { balls = null; Fx.list = []; };
  G.reset = function () {
    engine = M.Engine.create(); engine.gravity.y = 1.3;
    var o = { isStatic: true, friction: 0.2 };
    M.Composite.add(engine.world, [
      M.Bodies.rectangle(W / 2, bottom + 30, W, 60, o),
      M.Bodies.rectangle(left - 30, H / 2, 60, H * 3, o),
      M.Bodies.rectangle(right + 30, H / 2, 60, H * 3, o)
    ]);
    M.Events.on(engine, 'collisionStart', collide);
    M.Events.on(engine, 'collisionActive', collide);
    balls = []; queue = []; Fx.list = [];
    G.score = 0; G.maxTier = 0; G.combo = 0; overTimer = 0; cooldown = 0;
    cur = pick(); next = pick(); see(cur); see(next);
    G.emit('score'); G.emit('next', next);
  };

  G.emit = function () {}; // ui.js が上書き
  function see(t) {
    if (G.seen[t]) return false;
    G.seen[t] = 1; Hoshi.save('hoshidrop.seen', G.seen); return true;
  }

  function addBall(t, x, y, merged) {
    var b = M.Bodies.circle(x, y, Tiers[t].r, { restitution: 0.12, friction: 0.08, density: 0.0012 });
    b.tier = t; b.born = performance.now(); b.merged = merged; b.seed = Math.random() * 9;
    M.Composite.add(engine.world, b); balls.push(b);
    if (t > G.maxTier) G.maxTier = t;
    return b;
  }

  function collide(ev) {
    ev.pairs.forEach(function (p) {
      var a = p.bodyA, b = p.bodyB;
      if (a.tier === undefined || a.tier !== b.tier || a.dead || b.dead) return;
      a.dead = b.dead = true; queue.push([a, b]);
    });
  }

  function merge() {
    queue.forEach(function (q) {
      var a = q[0], b = q[1], t = a.tier, x = (a.position.x + b.position.x) / 2, y = (a.position.y + b.position.y) / 2;
      M.Composite.remove(engine.world, a); M.Composite.remove(engine.world, b);
      balls = balls.filter(function (z) { return z !== a && z !== b; });
      G.combo = comboT > 0 ? G.combo + 1 : 1; comboT = 0.9;
      var nt = Math.min(t + 1, 11), pts = (t < 11 ? Points[nt] : 500) * Math.min(G.combo, 5);
      G.score += pts;
      Fx.burst(x, y, Tiers[nt].c, Tiers[nt].r);
      Fx.text(x, y - Tiers[nt].r * 0.4, '+' + pts, false);
      if (G.combo >= 2) Fx.combo(x, y - Tiers[nt].r - 18, G.combo + Hoshi.t({ ja: 'れんさ！', zh: '连击！' }), true);
      chime(t, G.combo);
      if (t >= 5) shake = Math.min(14, t + 2);
      if (navigator.vibrate) navigator.vibrate(t >= 6 ? 25 : 10);
      if (t < 11) { addBall(nt, x, y, true); if (see(nt)) G.emit('new', nt); }
      G.emit('score');
    });
    queue = [];
  }

  // ド・レ・ミ・ソ・ラ…の音階で、大きくなるほど高く
  var scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26];
  function chime(t, c) {
    var f = 440 * Math.pow(2, (scale[t] + Math.min(c - 1, 4) * 2) / 12);
    Hoshi.tone(f, 0.22, 'triangle', 0.13);
    setTimeout(function () { Hoshi.tone(f * 1.5, 0.18, 'sine', 0.07); }, 60);
  }

  G.aim = function (x) { aimX = x; };
  // テスト用：盤面の状態
  G.state = function () {
    return { cur: cur, cd: cooldown, left: left, right: right, top: top, bottom: bottom, danger: overTimer,
      balls: (balls || []).map(function (b) { return { t: b.tier, x: b.position.x, y: b.position.y }; }) };
  };
  G.drop = function () {
    if (!G.running || cooldown > 0) return;
    var r = Tiers[cur].r, x = Math.max(left + r, Math.min(right - r, aimX));
    addBall(cur, x, dropY);
    Hoshi.tone(330, 0.08, 'sine', 0.1);
    cur = next; next = pick(); see(next); cooldown = 0.5;
    G.emit('next', next);
  };

  function step(dt) {
    cooldown = Math.max(0, cooldown - dt); comboT = Math.max(0, comboT - dt);
    var danger = false, now = performance.now();
    balls.forEach(function (b) { if (now - b.born > 1200 && b.position.y - Tiers[b.tier].r < dangerY) danger = true; });
    overTimer = danger ? overTimer + dt : 0;
    if (overTimer > 2) { G.running = false; G.emit('over'); }
  }

  function bg(now) {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i]; ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(now / 900 + s.p));
      ctx.fillStyle = '#fff6d8'; starPath(ctx, s.x, s.y, s.s * 2, 0); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function jar(now) {
    var w = right - left, rr = 26;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(left, top - 4); ctx.lineTo(left, bottom - rr); ctx.quadraticCurveTo(left, bottom, left + rr, bottom);
    ctx.lineTo(right - rr, bottom); ctx.quadraticCurveTo(right, bottom, right, bottom - rr); ctx.lineTo(right, top - 4);
    var g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(1, 'rgba(255,220,240,.30)');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = '#4a2a7a'; ctx.lineWidth = 10; ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke();
    // ガラスの光
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(left + 14, top + 30); ctx.lineTo(left + 14, top + 120); ctx.stroke();
    ctx.restore();
    // あふれライン
    var hot = overTimer > 0, blink = hot && Math.floor(now / 140) % 2;
    ctx.strokeStyle = blink ? '#ff3d7f' : hot ? '#ffd25e' : 'rgba(255,255,255,.45)'; ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(left + 6, dangerY); ctx.lineTo(right - 6, dangerY); ctx.stroke(); ctx.setLineDash([]);
    // 進化の輪（下）
    var n = Tiers.length, sx = w / n;
    for (var i = 0; i < n; i++) {
      ctx.globalAlpha = G.seen[i] ? 1 : 0.25;
      drawTier(ctx, i, left + sx * (i + 0.5), bottom + 26, sx * 0.44, 0); // 进化条：统一放大，看得清
    }
    ctx.globalAlpha = 1;
  }

  function render(now) {
    ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, 0);
    ctx.clearRect(0, 0, innerWidth / S, H);
    bg(now);
    ctx.translate(ox, 0);
    ctx.save();
    if (shake > 0.3) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    if (balls) jar(now);
    if (G.running && balls) {
      var r = Tiers[cur].r, x = Math.max(left + r, Math.min(right - r, aimX));
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.setLineDash([3, 7]);
      ctx.beginPath(); ctx.moveTo(x, dropY + r); ctx.lineTo(x, bottom); ctx.stroke(); ctx.setLineDash([]);
      var k = cooldown > 0 ? 1 - cooldown / 0.5 : 1; // 次の星がポンと出る
      drawTier(ctx, cur, x, dropY + Math.sin(now / 300) * 2, r, 0, k < 1 ? k * k : 1);
    }
    (balls || []).forEach(function (b) {
      var p = (now - b.born) / 320, sc = 1;
      if (b.merged && p < 1) sc = 1 + 0.35 * Math.sin(p * Math.PI) * (1 - p * 0.5) - (p < 0.15 ? 0.3 * (1 - p / 0.15) : 0);
      drawTier(ctx, b.tier, b.position.x, b.position.y, Tiers[b.tier].r, b.angle, sc);
    });
    Fx.draw(ctx);
    ctx.restore();
  }

  function loop(ts) {
    var dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
    if (G.running) {
      acc += dt;
      while (acc >= 1 / 60) { M.Engine.update(engine, 1000 / 60); merge(); acc -= 1 / 60; }
      step(dt);
    } else acc = 0;
    Fx.step(dt); shake *= 0.85;
    render(ts);
    requestAnimationFrame(loop);
  }

  function aim(e) { aimX = e.clientX / S - ox; }
  cv.addEventListener('pointerdown', aim);
  cv.addEventListener('pointermove', aim);
  cv.addEventListener('pointerup', function (e) { aim(e); G.drop(); });

  resize(); addEventListener('resize', resize);
  requestAnimationFrame(loop);
})();
