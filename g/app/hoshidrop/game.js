// ほしドロップ：同じ星がくっつくと大きくなる落下合成ゲーム
(function () {
  var M = Matter, W = 360;
  var T = {
    howto: { ja: 'タップした場所に星を落とそう。\n同じ星がくっつくと1つ大きくなるよ。\nあふれたらおしまい！', zh: '点击的位置会落下星星。\n相同的星星碰在一起会变大。\n溢出线外就结束！' },
    play: { ja: 'あそぶ', zh: '开始' }, best: { ja: 'ベスト', zh: '最高' }, next: { ja: 'つぎ', zh: '下一个' },
    over: { ja: 'あふれちゃった！', zh: '溢出来了！' }, again: { ja: 'もう一回', zh: '再来一次' },
    share: { ja: '友だちに自慢する', zh: '分享给好友' }, more: { ja: '他のゲームもあそぶ', zh: '其他游戏' },
    record: { ja: '自己ベスト更新！', zh: '刷新最高分！' },
    shareText: { ja: 'ほしドロップで {0}点！「{1}」まで育てたよ。この記録、超えられる？', zh: '我在ほしドロップ拿了 {0} 分！合成到了「{1}」，你能超过吗？' }
  };
  var cv = document.getElementById('cv'), ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var S, H, dpr, ox = 0, oy = 0, left = 12, right = W - 12, top, bottom, dropY, dangerY;
  var engine, balls, parts, score, shown, best = Hoshi.load('hoshidrop.best', 0), maxTier;
  var cur, next, aimX = W / 2, cooldown = 0, overTimer = 0, running = false, shake = 0, last = 0, acc = 0, queue = [];

  function fmt(s, a, b) { return s.replace('{0}', a).replace('{1}', b); }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    // 宽屏时保持竖屏比例并居中；瓶子高度有上限，多出的空间留在上方
    S = Math.min(innerWidth / W, innerHeight / (W * 1.55)); ox = (innerWidth / S - W) / 2; H = innerHeight / S;
    bottom = H - 52; top = Math.max(130, bottom - 480); oy = top - 130;
    dangerY = top + 10; dropY = top - 26;
  }

  function pick() { var r = Math.random(); return r < 0.3 ? 0 : r < 0.58 ? 1 : r < 0.8 ? 2 : r < 0.92 ? 3 : 4; }

  function reset() {
    engine = M.Engine.create(); engine.gravity.y = 1.3;
    var o = { isStatic: true, friction: 0.2 };
    M.Composite.add(engine.world, [
      M.Bodies.rectangle(W / 2, bottom + 30, W, 60, o),
      M.Bodies.rectangle(left - 30, H / 2, 60, H * 2, o),
      M.Bodies.rectangle(right + 30, H / 2, 60, H * 2, o)
    ]);
    M.Events.on(engine, 'collisionStart', collide);
    M.Events.on(engine, 'collisionActive', collide);
    balls = []; parts = []; queue = []; score = 0; shown = 0; maxTier = 0; overTimer = 0;
    cur = pick(); next = pick();
  }

  function addBall(t, x, y) {
    var b = M.Bodies.circle(x, y, Tiers[t].r, { restitution: 0.15, friction: 0.06, density: 0.0012 });
    b.tier = t; b.born = performance.now(); b.seed = Math.random() * 3000;
    M.Composite.add(engine.world, b); balls.push(b);
    if (t > maxTier) maxTier = t;
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
      score += Points[t + 1] || Points[10];
      burst(x, y, Tiers[Math.min(t + 1, 10)].c, 10 + t * 2);
      Hoshi.tone(380 + t * 70, 0.18, 'triangle', 0.12);
      if (t >= 5) shake = Math.min(12, t);
      if (t < 10) addBall(t + 1, x, y); else score += 200; // 银河相遇：消失 + 大奖
    });
    queue = [];
  }

  function burst(x, y, c, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 7, v = 1 + Math.random() * 3.5;
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 1, c: c });
    }
  }

  function drop() {
    if (!running || cooldown > 0) return;
    var r = Tiers[cur].r, x = Math.max(left + r, Math.min(right - r, aimX));
    addBall(cur, x, dropY);
    Hoshi.tone(260, 0.1, 'sine', 0.1);
    cur = next; next = pick(); cooldown = 0.45;
  }

  function step(dt) {
    cooldown = Math.max(0, cooldown - dt);
    var danger = false, now = performance.now();
    balls.forEach(function (b) { if (now - b.born > 1200 && b.position.y - Tiers[b.tier].r < dangerY) danger = true; });
    overTimer = danger ? overTimer + dt : 0;
    if (overTimer > 2) gameOver();
    parts.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= dt * 1.6; });
    parts = parts.filter(function (p) { return p.life > 0; });
    shown += (score - shown) * Math.min(1, dt * 10);
    shake *= 0.85;
  }

  function render() {
    ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, 0);
    ctx.clearRect(0, 0, innerWidth / S, H);
    ctx.translate(ox, 0);
    ctx.save();
    if (shake > 0.3) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    // 瓶子
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(left, top, right - left, bottom - top);
    ctx.strokeStyle = 'rgba(255,216,119,.7)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.lineTo(right, bottom); ctx.lineTo(right, top); ctx.stroke();
    // 危险线
    ctx.strokeStyle = overTimer > 0 && Math.floor(performance.now() / 150) % 2 ? '#ff5577' : 'rgba(255,120,160,.35)';
    ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(left, dangerY); ctx.lineTo(right, dangerY); ctx.stroke(); ctx.setLineDash([]);
    // 瞄准线 + 手上的星
    if (running) {
      var r = Tiers[cur].r, x = Math.max(left + r, Math.min(right - r, aimX));
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(x, dropY); ctx.lineTo(x, bottom); ctx.stroke();
      if (cooldown <= 0) drawTier(ctx, cur, x, dropY, r, 0, false);
    }
    var now = performance.now();
    balls.forEach(function (b) {
      drawTier(ctx, b.tier, b.position.x, b.position.y, Tiers[b.tier].r, b.angle, (now + b.seed) % 3200 < 130);
    });
    parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
    ctx.restore();
    hud();
  }

  function hud() {
    ctx.save(); ctx.translate(0, oy);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(Math.round(shown), 16, 38);
    ctx.fillStyle = '#c9bdf2'; ctx.font = '12px sans-serif';
    ctx.fillText(Hoshi.t(T.best) + " " + best, 16, 56);
    ctx.textAlign = 'right'; ctx.fillText(Hoshi.t(T.next), W - 62, 30);
    drawTier(ctx, next, W - 34, 36, 18, 0, false);
    // 进化表
    var n = Tiers.length, sx = (right - left) / n;
    for (var i = 0; i < n; i++) {
      ctx.globalAlpha = i <= maxTier ? 1 : 0.3;
      drawTier(ctx, i, left + sx * (i + 0.5), bottom + 26 - oy, Math.min(sx * 0.42, 6 + i * 0.9), 0, false);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function loop(ts) {
    var dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
    if (running) {
      acc += dt;
      while (acc >= 1 / 60) { M.Engine.update(engine, 1000 / 60); merge(); acc -= 1 / 60; }
      step(dt);
    }
    render();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    var rec = score > best;
    if (rec) { best = score; Hoshi.save('hoshidrop.best', best); }
    Hoshi.tone(200, 0.5, 'sawtooth', 0.08);
    $('final').textContent = score;
    $('overBest').textContent = rec ? Hoshi.t(T.record) : Hoshi.t(T.best) + ' ' + best;
    $('over').classList.remove('hidden');
    Hoshi.promo($('promo'), 'hoshidrop');
  }

  function start() {
    reset(); running = true;
    $('start').classList.add('hidden'); $('over').classList.add('hidden');
  }

  function aim(e) { aimX = e.clientX / S - ox; }
  cv.addEventListener('pointerdown', function (e) { aim(e); });
  cv.addEventListener('pointermove', function (e) { aim(e); });
  cv.addEventListener('pointerup', function (e) { aim(e); drop(); });

  // 文案
  $('howto').innerText = Hoshi.t(T.howto);
  $('play').textContent = Hoshi.t(T.play);
  $('bestLabel').textContent = best > 0 ? Hoshi.t(T.best) + ' ' + best : '';
  $('overTitle').textContent = Hoshi.t(T.over);
  $('again').textContent = Hoshi.t(T.again);
  $('share').textContent = Hoshi.t(T.share);
  $('promoHead').textContent = Hoshi.t(T.more);
  $('play').onclick = start; $('again').onclick = start;
  $('share').onclick = function () { Hoshi.share(fmt(Hoshi.t(T.shareText), score, Hoshi.t(Tiers[maxTier]))); };

  // 标题画面的进化表
  var cc = $('chart').getContext('2d');
  for (var i = 0; i < Tiers.length; i++) drawTier(cc, i, 16 + i * 28.8, 40, 7 + i * 0.75, 0, false);

  resize(); addEventListener('resize', resize);
  reset(); requestAnimationFrame(loop);
  Hoshi.init(window.LIFF_IDS);
})();
