/* =========================================================
   BOY OR GIRL? — Baby Shower Experience
   Vanilla JS: confetti, particles, parallax, meter, countdown,
   scroll reveal, guessing game, Formspree form.
   ========================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     ⚙️  CONFIG — EDIT THIS BLOCK
     --------------------------------------------------------- */
  const CONFIG = {
    FORMSPREE_ENDPOINT: 'https://formspree.io/f/xeaggonj',

    // Countdown target (local time). Format: YYYY-MM-DDTHH:MM:SS
    EVENT_DATETIME: '2026-12-20T14:00:00',

    // Text shown in the hero. Leave '' to keep the HTML placeholder.
    DATE_TEXT: 'Sunday, 20 December 2026',
    LOCATION_TEXT: 'Sunrise Gardens, Eldoret',
    TIME_TEXT: '2:00 PM',
  };

  const BLUE_PINK = ['#FF8FB1', '#FFD1DC', '#4DA8FF', '#A8D8FF', '#176BFF', '#B79CFF', '#FFFFFF'];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rand = (a, b) => Math.random() * (b - a) + a;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  /* ---------------------------------------------------------
     0. Fill hero details from CONFIG
     --------------------------------------------------------- */
  const fills = { date: CONFIG.DATE_TEXT, location: CONFIG.LOCATION_TEXT, time: CONFIG.TIME_TEXT };
  $$('[data-fill]').forEach(el => { const v = fills[el.dataset.fill]; if (v) el.textContent = v; });

  /* ---------------------------------------------------------
     1. Image fallback — if a photo fails, show a cute emoji tile
     --------------------------------------------------------- */
  $$('img[data-fallback]').forEach(img => {
    const swap = () => {
      const d = document.createElement('div');
      d.className = 'img-fallback';
      d.setAttribute('role', 'img');
      d.setAttribute('aria-label', img.alt || '');
      d.textContent = img.dataset.fallback;
      img.replaceWith(d);
    };
    img.addEventListener('error', swap, { once: true });
    if (img.complete && img.naturalWidth === 0) swap();
  });

  /* ---------------------------------------------------------
     2. Confetti engine (lightweight canvas)
     --------------------------------------------------------- */
  const cCanvas = $('#confetti');
  const cCtx = cCanvas.getContext('2d');
  let confetti = [];
  let confettiRunning = false;

  function sizeCanvas(c) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Fire confetti. Options: x,y origin (px), count, spread, power, palette */
  function burst({ x = innerWidth / 2, y = innerHeight / 2, count = 80, spread = Math.PI * 2, angle = -Math.PI / 2, power = 10, palette = BLUE_PINK } = {}) {
    if (reduceMotion) count = Math.min(count, 12);
    if (isMobile) count = Math.round(count * .6);
    for (let i = 0; i < count; i++) {
      const a = angle + rand(-spread / 2, spread / 2);
      const v = rand(power * .4, power);
      confetti.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        w: rand(6, 12), h: rand(4, 8), rot: rand(0, 6.28), vr: rand(-.3, .3),
        color: pick(palette), life: 0, max: rand(90, 170),
        shape: pick(['rect', 'rect', 'circle', 'heart'])
      });
    }
    if (!confettiRunning) { confettiRunning = true; requestAnimationFrame(confettiLoop); }
  }

  function drawHeart(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, s / 4);
    ctx.bezierCurveTo(-s / 2, -s / 3, -s, s / 3, 0, s);
    ctx.bezierCurveTo(s, s / 3, s / 2, -s / 3, 0, s / 4);
    ctx.fill();
  }

  function confettiLoop() {
    cCtx.clearRect(0, 0, innerWidth, innerHeight);
    confetti = confetti.filter(p => p.life < p.max && p.y < innerHeight + 40);
    for (const p of confetti) {
      p.vy += .22; p.vx *= .985; p.vy *= .985;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
      cCtx.save();
      cCtx.globalAlpha = Math.min(1, (p.max - p.life) / 30);
      cCtx.translate(p.x, p.y); cCtx.rotate(p.rot);
      cCtx.fillStyle = p.color;
      if (p.shape === 'rect') cCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      else if (p.shape === 'circle') { cCtx.beginPath(); cCtx.arc(0, 0, p.h / 1.4, 0, 6.28); cCtx.fill(); }
      else drawHeart(cCtx, p.h * 1.3);
      cCtx.restore();
    }
    if (confetti.length) requestAnimationFrame(confettiLoop);
    else { confettiRunning = false; cCtx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  const PINK_ONLY = ['#FF8FB1', '#FFD1DC', '#FFFFFF', '#ff6f9f'];
  const BLUE_ONLY = ['#4DA8FF', '#A8D8FF', '#176BFF', '#FFFFFF'];

  /* ---------------------------------------------------------
     3. Ambient particle field (sparkles, hearts, stars) + cursor
     --------------------------------------------------------- */
  const pCanvas = $('#particles');
  const pCtx = pCanvas.getContext('2d');
  const particles = [];
  const GLYPHS = ['✦', '✧', '♥', '★', '•'];
  let mouse = { x: -999, y: -999 };

  function makeParticle(initial) {
    return {
      x: rand(0, innerWidth), y: initial ? rand(0, innerHeight) : innerHeight + 20,
      s: rand(8, 20), vy: rand(.15, .6), vx: rand(-.2, .2), drift: rand(0, 6.28),
      g: pick(GLYPHS), c: pick(BLUE_PINK), a: rand(.2, .65)
    };
  }
  function initParticles() {
    particles.length = 0;
    const n = reduceMotion ? 0 : (isMobile ? 18 : 40);
    for (let i = 0; i < n; i++) particles.push(makeParticle(true));
  }
  function particleLoop(t) {
    pCtx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of particles) {
      p.drift += .01;
      p.x += p.vx + Math.sin(p.drift) * .3;
      p.y -= p.vy;
      // cursor reaction: gently push away
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 120) { p.x += dx / d * 2.2; p.y += dy / d * 2.2; }
      if (p.y < -30) Object.assign(p, makeParticle(false));
      pCtx.globalAlpha = p.a * (.7 + .3 * Math.sin(t / 400 + p.drift));
      pCtx.fillStyle = p.c;
      pCtx.font = `${p.s}px sans-serif`;
      pCtx.fillText(p.g, p.x, p.y);
    }
    requestAnimationFrame(particleLoop);
  }

  const glow = $('#cursor-glow');
  addEventListener('pointermove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px';
    // tint the glow by horizontal position: pink (left) → blue (right)
    const r = e.clientX / innerWidth;
    glow.style.background = `radial-gradient(circle, ${r < .4 ? 'rgba(255,143,177,.4)' : r > .6 ? 'rgba(77,168,255,.4)' : 'rgba(183,156,255,.4)'}, transparent 70%)`;
  }, { passive: true });

  // Sparkle trail inside key sections (hero, guess, register)
  let lastTrail = 0;
  ['#hero', '#guess', '#register'].forEach(sel => {
    const el = $(sel); if (!el || reduceMotion) return;
    el.addEventListener('pointermove', e => {
      const now = performance.now(); if (now - lastTrail < 90) return; lastTrail = now;
      burst({ x: e.clientX, y: e.clientY, count: 2, power: 2.5, spread: Math.PI * 2 });
    }, { passive: true });
  });

  /* ---------------------------------------------------------
     4. Floating question marks in the hero
     --------------------------------------------------------- */
  const qWrap = $('#qmarks');
  function spawnQ() {
    if (!qWrap || document.hidden) return;
    const q = document.createElement('span');
    q.className = 'qm';
    q.textContent = '?';
    q.style.left = rand(5, 92) + '%';
    q.style.top = rand(10, 85) + '%';
    q.style.fontSize = rand(30, 90) + 'px';
    qWrap.appendChild(q);
    setTimeout(() => q.remove(), 4000);
  }
  if (!reduceMotion) setInterval(spawnQ, isMobile ? 1300 : 800);

  /* ---------------------------------------------------------
     5. Parallax (balloons, clouds, emojis) + nav state
     --------------------------------------------------------- */
  const parallaxEls = $$('[data-speed]');
  const nav = $('.nav');
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      if (y < innerHeight * 1.2) {
        parallaxEls.forEach(el => { el.style.translate = `0 ${-y * parseFloat(el.dataset.speed)}px`; });
      }
      nav.classList.toggle('scrolled', y > 40);
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     6. Scroll reveal
     --------------------------------------------------------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------------------------------------------------------
     7. Hero CTA — smooth scroll + burst
     --------------------------------------------------------- */
  $('#joinBtn').addEventListener('click', e => {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 90, power: 12 });
    setTimeout(() => $('#register').scrollIntoView({ behavior: 'smooth' }), 350);
  });

  /* ---------------------------------------------------------
     8. Gender Suspense Meter
        Drifts slowly; every few seconds it "almost chooses"
        a side, then snaps back to the middle.
     --------------------------------------------------------- */
  const needle = $('#meter-needle');
  const mText = $('#meter-text');
  const mMid = $('#meter-mid');
  const teases = [
    'The secret is still safe... 🤫',
    'Ooh, it\'s leaning... 👀',
    'Nope! Still a mystery! 😜',
    'Almost... almost... 😳',
    'Plot twist: nobody knows! 🌀',
    'Shhh, the baby isn\'t telling! 🍼'
  ];
  let meterBusy = false;
  function setNeedle(pct) { needle.style.left = pct + '%'; }
  function meterDrift() {
    if (meterBusy) return;
    setNeedle(rand(30, 70));
    needle.textContent = pick(['❓', '🤔', '❓', '👀']);
  }
  function meterTease() {
    if (document.hidden) return;
    meterBusy = true;
    const side = Math.random() < .5 ? 'girl' : 'boy';
    mText.textContent = side === 'girl' ? 'Ooh... it\'s leaning pink... 💗' : 'Ooh... it\'s leaning blue... 💙';
    needle.classList.add('snap');
    setNeedle(side === 'girl' ? 6 : 94);
    needle.textContent = side === 'girl' ? '💗' : '💙';
    setTimeout(() => {
      needle.classList.add('shake');
      mText.textContent = 'Just kidding! 😜 Still a secret!';
      mMid.textContent = '🤫';
    }, 900);
    setTimeout(() => {
      setNeedle(50);
      needle.textContent = '❓';
      needle.classList.remove('shake');
    }, 1500);
    setTimeout(() => {
      needle.classList.remove('snap');
      mText.textContent = pick(teases);
      mMid.textContent = '❓';
      meterBusy = false;
    }, 2400);
  }
  setInterval(meterDrift, 2800);
  setInterval(meterTease, 9000);
  setTimeout(meterDrift, 600);

  /* ---------------------------------------------------------
     9. Countdown
     --------------------------------------------------------- */
  const target = new Date(CONFIG.EVENT_DATETIME).getTime();
  const cd = { d: $('#cd-days'), h: $('#cd-hours'), m: $('#cd-mins'), s: $('#cd-secs') };
  const prev = {};
  const pad = n => String(n).padStart(2, '0');
  function setNum(key, val) {
    if (prev[key] === val) return;
    prev[key] = val;
    const el = cd[key]; el.textContent = val;
    el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
  }
  function updateCountdown() {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5); diff %= 864e5;
    const h = Math.floor(diff / 36e5); diff %= 36e5;
    const m = Math.floor(diff / 6e4); diff %= 6e4;
    const s = Math.floor(diff / 1e3);
    setNum('d', pad(d)); setNum('h', pad(h)); setNum('m', pad(m)); setNum('s', pad(s));
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------------------------------------------------------
     10. Guess the gender
     --------------------------------------------------------- */
  const guessSection = $('#guess');
  const guessMsg = $('#guess-msg');
  const scoreBox = $('#guess-score');
  const score = { girl: 0, boy: 0 };
  let votePending = false;
  const guessLines = {
    girl: ['Your guess has been noted! 😄', 'Team Girl! Bows incoming! 🎀', 'Pink power! 💗 Noted!'],
    boy: ['Your guess has been noted! 😄', 'Team Boy! Tiny sneakers ahead! 👟', 'Blue crew! 💙 Noted!']
  };

  $$('.guess__card').forEach(card => {
    const side = card.dataset.guess;
    const palette = side === 'girl' ? PINK_ONLY : BLUE_ONLY;
    // hover: sprinkle confetti + glow the section
    card.addEventListener('pointerenter', () => {
      const r = card.getBoundingClientRect();
      burst({ x: r.left + r.width / 2, y: r.top + 20, count: 22, power: 6, spread: Math.PI, palette });
      guessSection.classList.add('pick-' + side);
    });
    card.addEventListener('pointerleave', () => {
      if (!$('.guess__card.chosen')) guessSection.classList.remove('pick-' + side);
    });
    // click: big celebration + message
    card.addEventListener('click', async () => {
      if (votePending) return;
      $$('.guess__card').forEach(c => c.classList.remove('chosen'));
      card.classList.add('chosen');
      guessSection.classList.remove('pick-girl', 'pick-boy');
      guessSection.classList.add('pick-' + side);
      const r = card.getBoundingClientRect();
      burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 120, power: 14, palette });
      score[side]++;
      $('#score-girl').textContent = score.girl;
      $('#score-boy').textContent = score.boy;
      scoreBox.hidden = false; scoreBox.classList.add('in');
      guessMsg.textContent = pick(guessLines[side]);
      guessMsg.classList.remove('pop'); void guessMsg.offsetWidth; guessMsg.classList.add('pop');
      // preselect the same guess in the RSVP form
      const val = side === 'girl' ? 'Team Girl' : 'Team Boy';
      const radio = $(`input[name="gender_guess"][value="${val}"]`);
      if (radio) radio.checked = true;

      votePending = true;
      $$('.guess__card').forEach(c => { c.disabled = true; });
      guessMsg.textContent = 'Sending your vote... 💌';
      guessMsg.classList.remove('pop');
      try {
        const vote = new FormData();
        vote.append('_subject', 'New Baby Shower Gender Vote 💙💗');
        vote.append('form_type', 'Gender Vote');
        vote.append('gender_guess', val);
        const response = await fetch(CONFIG.FORMSPREE_ENDPOINT, {
          method: 'POST',
          body: vote,
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error((data.errors && data.errors.map(error => error.message).join(', ')) || 'Something went wrong.');
        }
        guessMsg.textContent = pick(guessLines[side]);
        guessMsg.classList.add('pop');
      } catch (error) {
        guessMsg.textContent = `Couldn't submit your vote. ${error.message} Please try again. 💔`;
      } finally {
        votePending = false;
        $$('.guess__card').forEach(c => { c.disabled = false; });
      }
    });
  });

  /* ---------------------------------------------------------
     11. Surprise: click anywhere for a tiny burst; konami-lite
     --------------------------------------------------------- */
  document.addEventListener('click', e => {
    if (e.target.closest('button, a, input, select, textarea, label')) return;
    burst({ x: e.clientX, y: e.clientY, count: 16, power: 6, palette: pick([PINK_ONLY, BLUE_ONLY, BLUE_PINK]) });
  });
  // Surprise on first scroll into the footer
  const footerIO = new IntersectionObserver(([en]) => {
    if (en.isIntersecting) {
      burst({ x: innerWidth * .2, y: innerHeight, count: 60, angle: -Math.PI / 3, spread: .8, power: 16, palette: PINK_ONLY });
      burst({ x: innerWidth * .8, y: innerHeight, count: 60, angle: -2 * Math.PI / 3, spread: .8, power: 16, palette: BLUE_ONLY });
      footerIO.disconnect();
    }
  }, { threshold: .5 });
  footerIO.observe($('.footer'));

  /* ---------------------------------------------------------
     12. Footer floating hearts / stars / footprints
     --------------------------------------------------------- */
  const fx = $('#footer-fx');
  const fxGlyphs = ['❤️', '💗', '💙', '⭐', '✨', '🐾'];
  if (fx && !reduceMotion) {
    const n = isMobile ? 12 : 22;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'fx';
      s.textContent = pick(fxGlyphs);
      s.style.left = rand(0, 100) + '%';
      s.style.fontSize = rand(16, 36) + 'px';
      s.style.animationDuration = rand(5, 11) + 's';
      s.style.animationDelay = -rand(0, 10) + 's';
      fx.appendChild(s);
    }
  }

  /* ---------------------------------------------------------
     13. RSVP form — validation + Formspree submit
     --------------------------------------------------------- */
  const form = $('#rsvp-form');
  const status = $('#form-status');
  const submitBtn = $('#submitBtn');
  const success = $('#success');

  // Let CONFIG override the action if the HTML still has the placeholder
  if (form.getAttribute('action').includes('YOUR_FORMSPREE_ENDPOINT_HERE') &&
      !CONFIG.FORMSPREE_ENDPOINT.includes('YOUR_FORMSPREE_ENDPOINT_HERE')) {
    form.setAttribute('action', CONFIG.FORMSPREE_ENDPOINT);
  }
  const endpointReady = () => !form.getAttribute('action').includes('YOUR_FORMSPREE_ENDPOINT_HERE');

  const rules = {
    name: v => v.trim().length >= 2 ? '' : 'Please tell us your name 😊',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email',
    phone: v => /^[+()\d\s-]{7,20}$/.test(v.trim()) ? '' : 'Please enter a valid phone number',
    guests: v => v ? '' : 'How many are coming?',
    gender_guess: () => form.querySelector('input[name="gender_guess"]:checked') ? '' : 'Pick a team (or keep it a surprise!)'
  };

  function showError(name, msg) {
    const out = form.querySelector(`.error[data-for="${name}"]`);
    if (out) out.textContent = msg;
    const field = out ? out.closest('.field') : null;
    if (field) field.classList.toggle('invalid', !!msg);
  }
  function validate() {
    let ok = true, first = null;
    for (const name in rules) {
      const el = form.elements[name];
      const val = name === 'gender_guess' ? '' : el.value;
      const msg = rules[name](val);
      showError(name, msg);
      if (msg) { ok = false; first = first || (name === 'gender_guess' ? form.querySelector('.radio input') : el); }
    }
    if (first) first.focus();
    return ok;
  }
  // live validation on blur
  ['name', 'email', 'phone', 'guests'].forEach(n => {
    form.elements[n].addEventListener('blur', e => showError(n, rules[n](e.target.value)));
  });
  $$('input[name="gender_guess"]').forEach(r => r.addEventListener('change', () => showError('gender_guess', '')));

  function celebrate() {
    form.hidden = true; success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        burst({ x: rand(innerWidth * .15, innerWidth * .85), y: rand(innerHeight * .2, innerHeight * .6), count: 70, power: 11, palette: i % 2 ? PINK_ONLY : BLUE_ONLY });
      }, i * 280);
    }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = ''; status.classList.remove('err');
    if (form.elements._gotcha.value) return;   // bot caught by honeypot
    if (!validate()) return;

    if (!endpointReady()) {
      status.textContent = 'The RSVP form is not connected yet. Please try again later.';
      status.classList.add('err');
      return;
    }

    submitBtn.disabled = true;
    const original = submitBtn.textContent;
    submitBtn.textContent = 'Sending... 💌';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (res.ok) { form.reset(); celebrate(); }
      else {
        const data = await res.json().catch(() => ({}));
        throw new Error((data.errors && data.errors.map(x => x.message).join(', ')) || 'Something went wrong.');
      }
    } catch (err) {
      status.textContent = 'Oops! ' + err.message + ' Please try again. 💔';
      status.classList.add('err');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = original;
    }
  });

  $('#againBtn').addEventListener('click', () => {
    success.hidden = true; form.hidden = false;
    $('#register').scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------------------------------------------------------
     14. Init + resize
     --------------------------------------------------------- */
  function resize() { sizeCanvas(cCanvas); sizeCanvas(pCanvas); }
  addEventListener('resize', () => { resize(); initParticles(); });
  resize();
  initParticles();
  if (particles.length) requestAnimationFrame(particleLoop);

  // Welcome pop shortly after load
  setTimeout(() => burst({ x: innerWidth / 2, y: innerHeight * .35, count: 70, power: 11 }), 600);
})();
