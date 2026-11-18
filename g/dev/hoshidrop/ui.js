// ほしドロップ：タイトル・図鑑・遊び方・ポーズ・結果画面
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var G = window.Game, best = Hoshi.load('hoshidrop.best', 0);
  var T = {
    catch: { ja: '星座をあわせて おおきく育てよう', zh: '合并星座，让它们长大吧' },
    play: { ja: 'あそぶ', zh: '开始游戏' }, book: { ja: 'ずかん', zh: '图鉴' }, help: { ja: 'あそびかた', zh: '玩法' },
    sound: { ja: 'サウンド', zh: '声音' }, next: { ja: 'つぎ', zh: '下一个' }, ok: { ja: 'わかった！', zh: '知道了！' },
    h1: { ja: 'タップした場所に星座が落ちるよ', zh: '点击的位置会落下星座' },
    h2: { ja: '同じ星座がくっつくと次の星座に！', zh: '相同星座碰到一起会进化！' },
    h3: { ja: '点線より上にあふれたらおしまい', zh: '超过虚线就结束啦' },
    paused: { ja: 'ひとやすみ', zh: '暂停中' }, resume: { ja: 'つづける', zh: '继续' }, restart: { ja: 'さいしょから', zh: '重新开始' },
    toTitle: { ja: 'タイトルへ', zh: '回到标题' }, over: { ja: 'あふれちゃった！', zh: '溢出来啦！' }, reach: { ja: 'とどいた星座', zh: '到达的星座' },
    again: { ja: 'もう一回！', zh: '再来一次！' }, share: { ja: '自慢する', zh: '炫耀一下' }, more: { ja: '星シリーズの他のゲーム', zh: '星系列的其他游戏' },
    best: { ja: 'ベスト', zh: '最高' }, record: { ja: '★ 自己ベスト更新！ ★', zh: '★ 刷新最高分！ ★' },
    found: { ja: 'はっけん！', zh: '发现！' }, prog: { ja: 'あつめた星座 {0} / 12', zh: '已收集 {0} / 12' },
    skin: { ja: 'きせかえ', zh: '换装' }, lucky: { ja: 'ラッキー星座 {0} 得点×2', zh: '幸运星座 {0} 得分×2' },
    fortune1: { ja: '星占い1位', zh: '星占い第1' },
    stamps: { ja: 'ほしスタンプ ★{0}', zh: '星星印章 ★{0}' }, toNext: { ja: '　つぎのきせかえまで あと{0}', zh: '　距下一套换装还差 {0}' },
    allSkins: { ja: '　きせかえ ぜんぶ解放！', zh: '　换装已全部解锁！' }, back: { ja: 'おかえり！きょうはスタンプ2ばい', zh: '欢迎回来！今天印章双倍' },
    odai: { ja: 'きょうのおだい {0}/3', zh: '今日任务 {0}/3' }, clear: { ja: 'おだい クリア！ ★+{0}', zh: '任务完成！ ★+{0}' },
    allClear: { ja: 'ぜんぶクリア！ ★+1', zh: '全部完成！ ★+1' }, left: { ja: 'あと{0}', zh: '还差 {0}' },
    dayBest: { ja: 'きょうのベスト更新！', zh: '刷新今日最佳！' }, fortune: { ja: '今日の運勢をチェック ☆ 星占い', zh: '查看今日运势 ☆ 星占い' },
    need: { ja: '★{0}で解放', zh: '★{0} 解锁' }, skinProg: { ja: 'ほしスタンプ ★{0}', zh: '星星印章 ★{0}' },
    shareText: { ja: 'ほしドロップで {0}点！「{1}」まで育てたよ✨ この記録、超えられる？', zh: '我在ほしドロップ拿了 {0} 分！合成到了「{1}」✨ 你能超过吗？' }
  };
  // 中文环境：圆体字库没有简体字，整体换成 Noto Sans SC 粗体，避免字体混排
  if (Hoshi.lang === 'zh') {
    var l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@900&display=swap';
    document.head.appendChild(l); document.documentElement.classList.add('zh');
  }
  var fmt = function (s, a, b) { return s.replace('{0}', a).replace('{1}', b); };
  document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = Hoshi.t(T[el.dataset.t]); });

  // ロゴ：1 文字ずつ跳ねる
  $('logo').innerHTML = 'ほしドロップ'.split('').map(function (c, i) {
    return '<span style="animation-delay:' + (i * 0.12) + 's">' + c + '</span>';
  }).join('');

  function show(id, on) { $(id).classList.toggle('hide', !on); }
  function bestText() {
    $('titleBest').textContent = Hoshi.t(T.best) + ' ' + best;
    $('hudBest').textContent = best;
    show('record', best > 0);
  }
  bestText();

  // ---- きょうのおだい ----
  function dailyCard() {
    Daily.load();
    var L = Daily.lucky;
    $('luckyChip').innerHTML = '<img src="img/z' + L + '.webp" alt="">' + fmt(Hoshi.t(T.lucky), Hoshi.t(Tiers[L])) + (Daily.fromFortune ? '<small>' + Hoshi.t(T.fortune1) + '</small>' : '');
    var h = '';
    for (var i = 0; i < 3; i++) {
      var ok = Daily.ok[i], g = Daily.goal(i);
      h += '<div class="drow' + (ok ? ' ok' : '') + '"><span>' + Daily.text(i) + '</span><b>' + (ok ? '✓' : g > 1 ? Daily.progress(i) + '/' + g : '') + '</b></div>';
    }
    $('dailyRows').innerHTML = h;
    var n = Daily.nextSkin(), line = fmt(Hoshi.t(T.stamps), '<em>' + Daily.stamps + '</em>');
    line += n < 0 ? Hoshi.t(T.allSkins) : fmt(Hoshi.t(T.toNext), Daily.Skins[n].need - Daily.stamps);
    if (Daily.back && Daily.doneCount() < 3) line = '<span class="back">' + Hoshi.t(T.back) + '</span>';
    $('stampLine').innerHTML = line;
    var seenSkin = Hoshi.load('hoshidrop.skinSeen', 0), unlocked = 0;
    Daily.Skins.forEach(function (k, i) { if (Daily.unlocked(i)) unlocked = i; });
    show('skinDot', unlocked > seenSkin);
  }
  dailyCard();
  Stats.init('hd');

  // ---- きせかえ ----
  function skins() {
    var h = '';
    Daily.Skins.forEach(function (k, i) {
      var on = Daily.unlocked(i);
      h += '<div class="cell' + (on ? '' : ' locked') + (Daily.skin === i ? ' sel' : '') + '" data-i="' + i + '">' +
        '<div class="sw" style="background:linear-gradient(180deg,' + k.bg[0] + ',' + k.bg[1] + ');border-color:' + k.jar + (on ? '' : ';opacity:.45') + '"><img src="img/z' + [0, 6, 3, 2, 7, 5, 11][i] + '.webp" alt=""></div>' +
        Hoshi.t(k) + '<i>' + (on ? '' : fmt(Hoshi.t(T.need), k.need)) + '</i></div>';
    });
    $('skinGrid').innerHTML = h;
    $('skinProg').textContent = fmt(Hoshi.t(T.skinProg), Daily.stamps);
    $('skinGrid').querySelectorAll('.cell').forEach(function (c) {
      c.onclick = function () { var i = +c.dataset.i; if (!Daily.unlocked(i)) return; click(); if (Daily.skin !== i) Stats.hit('skin'); Daily.setSkin(i); skins(); };
    });
    var top = 0; Daily.Skins.forEach(function (k, i) { if (Daily.unlocked(i)) top = i; });
    Hoshi.save('hoshidrop.skinSeen', top); show('skinDot', false);
    show('skins', true);
  }
  $('skinBtn').onclick = function () { click(); skins(); };

  function toastMsg(img, text) {
    $('toastImg').src = img; $('toastName').textContent = text;
    $('toast').classList.add('on'); clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $('toast').classList.remove('on'); }, 2200);
  }
  function dailyResult(r) {
    r.done.forEach(function () { Stats.hit('daily1'); }); if (r.all) Stats.hit('daily3');
    if (!r.done.length && !r.all) return;
    var msg = r.done.length ? fmt(Hoshi.t(T.clear), r.done.length * (Daily.back ? 2 : 1)) : '';
    if (r.all) msg = (msg ? msg + '　' : '') + Hoshi.t(T.allClear);
    toastMsg('img/star.webp', msg); $('toast').querySelector('em').style.display = 'none';
    [659, 880, 1319].forEach(function (f, i) { setTimeout(function () { Hoshi.tone(f, 0.18, 'triangle', 0.1); }, i * 80); });
  }

  // ---- サウンド ----
  function soundIcon() { $('soundBtn').innerHTML = '<svg><use href="#i-' + (Hoshi.muted ? 'mute' : 'sound') + '"/></svg>'; }
  $('soundBtn').onclick = function () { Hoshi.muted = !Hoshi.muted; Hoshi.save('muted', Hoshi.muted); soundIcon(); Hoshi.tone(523, 0.12, 'triangle', 0.1); };
  soundIcon();
  var click = function () { Hoshi.tone(660, 0.07, 'sine', 0.08); };

  // ---- 図鑑 ----
  function book() {
    var n = 0, html = '';
    for (var i = 0; i < 12; i++) {
      var on = !!G.seen[i]; if (on) n++;
      html += '<div class="cell' + (on ? '' : ' lock') + '"><img src="img/z' + i + '.webp" alt="">' +
        (on ? Hoshi.t(Tiers[i]) : '？？？') + '<i>Lv.' + (i + 1) + '</i></div>';
    }
    $('grid').innerHTML = html;
    $('bookProg').textContent = fmt(Hoshi.t(T.prog), n);
    show('book', true);
  }
  $('bookBtn').onclick = function () { click(); book(); };
  $('helpBtn').onclick = function () { click(); show('help', true); };
  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.onclick = function () { click(); b.closest('.modal').classList.add('hide'); };
  });

  // ---- 進行 ----
  function start() {
    click();
    ['title', 'over', 'pause', 'book', 'help'].forEach(function (id) { show(id, false); });
    show('hud', true); bestText();
    G.reset(); G.running = true;
    if (!Hoshi.load('hoshidrop.helped', false)) {
      Hoshi.save('hoshidrop.helped', true); G.running = false; show('help', true); $('help').dataset.resume = '1';
      var ok = $('help').querySelector('[data-close]'); ok.disabled = true; // 防止连点「あそぶ」直接跳过引导
      setTimeout(function () { ok.disabled = false; }, 700);
    }
  }
  function toTitle() {
    click(); G.running = false; G.clear();
    ['over', 'pause', 'hud'].forEach(function (id) { show(id, false); });
    bestText(); dailyCard(); show('title', true);
  }
  $('play').onclick = start; $('again').onclick = start; $('restart').onclick = start;
  $('toTitle').onclick = toTitle; $('overTitle').onclick = toTitle;
  function pause() { G.running = false; show('pause', true); }
  $('pauseBtn').onclick = function () { click(); pause(); };
  // 切出 LINE / 锁屏时自动暂停
  document.addEventListener('visibilitychange', function () { if (document.hidden && G.running) pause(); });
  $('resume').onclick = function () { click(); show('pause', false); G.running = true; };
  // 初回の遊び方を閉じたらゲーム再開
  $('help').addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-close') && $('help').dataset.resume) { delete $('help').dataset.resume; G.running = true; }
  });

  // ---- ゲームからの通知 ----
  var toastTimer;
  G.emit = function (type, v) {
    if (type === 'score') $('score').textContent = G.score;
    else if (type === 'merge') dailyResult(Daily.on('merge', v));
    else if (type === 'next') $('nextImg').src = 'img/z' + v + '.webp';
    else if (type === 'new') {
      toastMsg('img/z' + v + '.webp', Hoshi.t(Tiers[v]) + ' ' + Hoshi.t(T.found));
      $('toast').querySelector('em').style.display = '';
      [784, 988, 1175].forEach(function (f, i) { setTimeout(function () { Hoshi.tone(f, 0.2, 'triangle', 0.1); }, i * 90); });
    } else if (type === 'over') over();
  };

  function over() {
    var gen = G.gen; $('pauseBtn').disabled = true;
    var s = G.score, rec = s > best;
    Stats.hit('games');
    var dr = Daily.on('over', { score: s, maxTier: G.maxTier }), dayUp = Daily.dayBest(s);
    if (rec) { best = s; Hoshi.save('hoshidrop.best', best); }
    [523, 440, 349].forEach(function (f, i) { setTimeout(function () { Hoshi.tone(f, 0.3, 'triangle', 0.1); }, i * 160); });
    setTimeout(function () {
      $('pauseBtn').disabled = false;
      if (gen !== G.gen) return; // 已经开了新的一局
      show('hud', false); show('over', true);
      $('overBest').innerHTML = rec ? '<span class="newrec">' + Hoshi.t(T.record) + '</span>' :
        dayUp ? '<span class="newrec">' + Hoshi.t(T.dayBest) + '</span>' : Hoshi.t(T.best) + ' ' + best;
      overDaily(); dailyResult(dr);
      $('reachImg').src = 'img/z' + G.maxTier + '.webp';
      $('reachName').textContent = Hoshi.t(Tiers[G.maxTier]);
      countUp($('final'), s);
      Hoshi.promo($('promo'), 'hoshidrop');
    }, 700);
  }
  function overDaily() {
    var n = Daily.doneCount(), h = fmt(Hoshi.t(T.odai), n) + ' ' + '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);
    if (n < 3) { // 离完成最近的一题
      var bi = -1, bl = 1e9;
      for (var i = 0; i < 3; i++) if (!Daily.ok[i] && Daily.goal(i) > 1) { var left = Daily.goal(i) - Daily.progress(i); if (left < bl) { bl = left; bi = i; } }
      if (bi >= 0) h += '<br><small>' + Daily.text(bi) + '　<b class="left">' + fmt(Hoshi.t(T.left), bl) + '</b></small>';
    } else h += '<button class="b small" id="toFortune">' + Hoshi.t(T.fortune) + '</button>';
    $('overDaily').innerHTML = h;
    var b = $('toFortune'); if (b) b.onclick = function () { click(); Stats.hit('lucky'); Hoshi.open('https://miniapp.line.me/2012616308-afvj7xfX'); };
  }
  function countUp(el, to) {
    var t0 = performance.now();
    (function f(now) {
      var p = Math.max(0, Math.min(1, (now - t0) / 900)); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }
  $('share').onclick = function () { click(); Stats.hit('share'); Hoshi.share(fmt(Hoshi.t(T.shareText), G.score, Hoshi.t(Tiers[G.maxTier]))); };

  // 動作確認用（#demo / #over / #book）
  var d = location.hash.slice(1);
  if (d === 'demo') {
    Hoshi.save('hoshidrop.helped', true); start(); var n = 0;
    var iv = setInterval(function () { G.aim(40 + Math.random() * 280); G.drop(); if (++n > 45) clearInterval(iv); }, 520);
  } else if (d === 'over') { start(); G.score = 1234; G.maxTier = 7; over(); }
  else if (d === 'book') { G.seen = [1, 1, 1, 1, 1, 1, 1]; book(); }
  Hoshi.init(window.LIFF_IDS);
})();
