(() => {
  'use strict';

  const ROOT = document.body?.dataset.root || '';
  const STORE_KEY = 'taglisayahan_2026_state_v2';
  const TOKEN_KEY = 'taglisayahan_admin_token';
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('taglisayahan-live') : null;
  let cache = null;
  let eventsCache = null;
  const listeners = new Set();
  let motionObserver = null;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  })[char]);

  const fetchJSON = async (path) => {
    const response = await fetch(`${ROOT}${path}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    return response.json();
  };

  const getLocal = () => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)); }
    catch { return null; }
  };

  const requestRemote = async () => {
    try {
      const response = await fetch('/api/state', { cache: 'no-store', signal: AbortSignal.timeout(2200) });
      if (!response.ok) return null;
      const payload = await response.json();
      return payload?.state || null;
    } catch { return null; }
  };

  const load = async ({ refresh = false } = {}) => {
    if (cache && !refresh) return cache;
    const [sample, events, remote] = await Promise.all([
      fetchJSON('data/sample-data.json'),
      eventsCache ? Promise.resolve(eventsCache) : fetchJSON('data/events.json'),
      requestRemote()
    ]);
    eventsCache = events;
    const local = getLocal();
    cache = remote || local || sample;
    if (!localStorage.getItem(STORE_KEY)) localStorage.setItem(STORE_KEY, JSON.stringify(cache));
    return cache;
  };

  const persist = async (state, { sync = true } = {}) => {
    state.meta.updatedAt = new Date().toISOString();
    cache = clone(state);
    localStorage.setItem(STORE_KEY, JSON.stringify(cache));
    channel?.postMessage({ type: 'state', state: cache });
    listeners.forEach((listener) => listener(cache));
    if (!sync) return { mode: 'device' };
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return { mode: 'device' };
    try {
      const response = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ state: cache }),
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) throw new Error('Cloud sync rejected');
      return { mode: 'live' };
    } catch { return { mode: 'device' }; }
  };

  const ranked = (families = cache?.families || []) => [...families]
    .sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name));

  const family = (id, state = cache) => state?.families.find((item) => item.id === id);
  const event = (id) => eventsCache?.categories.flatMap((category) => category.events)
    .find((item) => item.id === id);
  const category = (id) => eventsCache?.categories.find((item) => item.id === id);
  const logo = (item) => `${ROOT}${item.logo}`;
  const formatPoints = (number) => Number(number || 0).toLocaleString('en-US');
  const initials = (name) => name.split(' ').map((part) => part[0]).join('').slice(0, 2);
  const medal = (rank) => ['01', '02', '03'][rank - 1] || String(rank).padStart(2, '0');

  const timeAgo = (iso) => {
    const difference = Math.max(0, Date.now() - new Date(iso).getTime());
    const minutes = Math.floor(difference / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const findPlacementLabel = (index) => ['Champion', '1st Runner Up', '2nd Runner Up', '3rd Runner Up', '4th Runner Up'][index];

  // Shared UI/data helpers keep public and admin views on the same vocabulary.
  const familyOptions = (selected = '', state = cache) => `<option value="">Select family</option>${(state?.families || []).map((item) => `<option value="${item.id}"${selected === item.id ? ' selected' : ''}>${escapeHTML(item.name)}</option>`).join('')}`;
  const bracketFor = (eventId, state = cache) => state?.brackets?.[eventId] || null;
  const bracketEligibleEvents = () => eventsCache?.categories.flatMap((group) => group.events.filter((item) => item.bracketEligible).map((item) => ({ ...item, category: group.id, categoryName: group.name }))) || [];
  const familyLogo = (item, className = '', alt = '') => item ? `<img class="${className}" src="${logo(item)}" alt="${escapeHTML(alt || `${item.name} official family emblem`)}">` : '';

  const applyResultToState = (state, { categoryId, eventId, placements, bonuses = [], recordedAt } = {}) => {
    const selectedEvent = event(eventId);
    if (!selectedEvent) throw new Error('Event not found');
    if (!category(categoryId)) throw new Error('Event category not found');
    if (!Array.isArray(placements) || placements.length !== 5) throw new Error('Exactly five placement families are required.');
    if (new Set(placements).size !== placements.length) throw new Error('Each family can occupy only one placement.');
    if (placements.some((id) => !family(id, state))) throw new Error('Select a family for every placement.');

    const oldRanks = Object.fromEntries(ranked(state.families).map((item, index) => [item.id, index + 1]));
    const priorIndex = state.results.findIndex((result) => result.eventId === eventId);
    if (priorIndex >= 0) {
      const prior = state.results[priorIndex];
      prior.placements.forEach((familyId, index) => {
        const team = family(familyId, state);
        const points = Number(prior.points?.[index] || 0);
        if (team) {
          team.categories = team.categories || {};
          team.points = Math.max(0, Number(team.points || 0) - points);
          team.categories[prior.category] = Math.max(0, Number(team.categories?.[prior.category] || 0) - points);
          if (index === 0) team.wins = Math.max(0, Number(team.wins || 0) - 1);
          else team.losses = Math.max(0, Number(team.losses || 0) - 1);
        }
      });
      (prior.bonuses || []).forEach((bonus) => {
        const team = family(bonus.familyId, state);
        if (team) {
          team.points = Math.max(0, Number(team.points || 0) - Number(bonus.points || 0));
          team.categories[prior.category] = Math.max(0, Number(team.categories?.[prior.category] || 0) - Number(bonus.points || 0));
        }
      });
      state.results.splice(priorIndex, 1);
    }

    placements.forEach((familyId, index) => {
      const team = family(familyId, state);
      const points = Number(selectedEvent.placements[index] || 0);
      team.categories = team.categories || {};
      team.points = Number(team.points || 0) + points;
      team.categories[categoryId] = Number(team.categories?.[categoryId] || 0) + points;
      if (index === 0) {
        team.wins = Number(team.wins || 0) + 1;
        team.streak = Number(team.streak || 0) + 1;
        team.momentum = Math.min(100, Number(team.momentum || 0) + 4);
      } else {
        team.losses = Number(team.losses || 0) + 1;
        team.streak = Math.max(0, Number(team.streak || 0) - 1);
        team.momentum = Math.max(20, Number(team.momentum || 0) - 1);
      }
    });

    const appliedBonuses = bonuses.filter((bonus) => bonus.familyId && Number(bonus.points) > 0).map((bonus) => {
      const team = family(bonus.familyId, state);
      if (!team) throw new Error('Bonus recipient must be a valid family.');
      const points = Number(bonus.points);
      team.points = Number(team.points || 0) + points;
      team.categories[categoryId] = Number(team.categories?.[categoryId] || 0) + points;
      return { familyId: bonus.familyId, name: bonus.name || 'Official bonus', points };
    });

    const now = recordedAt || new Date().toISOString();
    const result = {
      id: `r-${Date.now()}`,
      eventId,
      event: selectedEvent.name,
      category: categoryId,
      winner: placements[0],
      placements,
      points: selectedEvent.placements,
      bonuses: appliedBonuses,
      recordedAt: now
    };
    state.results.unshift(result);

    const winner = family(placements[0], state);
    const newRank = ranked(state.families).findIndex((item) => item.id === winner.id) + 1;
    const movement = oldRanks[winner.id] - newRank;
    state.announcements = Array.isArray(state.announcements) ? state.announcements : [];
    state.announcements.unshift({
      id: `a-${Date.now()}`,
      type: 'breaking',
      title: `${winner.name} captures ${selectedEvent.name}`,
      body: `${findPlacementLabel(0)} — +${formatPoints(selectedEvent.placements[0])} points${movement > 0 ? `, climbing ${movement} rank${movement > 1 ? 's' : ''}` : ''}.`,
      createdAt: now
    });
    state.announcements = state.announcements.slice(0, 12);
    return { state, result };
  };

  const recordResult = async ({ categoryId, eventId, placements, bonuses = [] }) => {
    const applied = applyResultToState(clone(cache), { categoryId, eventId, placements, bonuses });
    return { state: applied.state, sync: await persist(applied.state), result: applied.result };
  };

  const projections = (state = cache) => {
    const list = ranked(state.families);
    const eventCount = Math.max(1, eventsCache.categories.flatMap((item) => item.events).length - state.results.length);
    const raw = list.map((item) => {
      const categoryAverage = Object.values(item.categories).reduce((sum, value) => sum + value, 0) / 3;
      const form = item.momentum / 100;
      return {
        ...item,
        best: Math.round(item.points + eventCount * 80 * (0.7 + form * 0.5)),
        average: Math.round(item.points + eventCount * 46 * (0.7 + form * 0.35)),
        trend: Math.round(item.points + eventCount * 42 * form + categoryAverage * 0.025),
        rawProbability: Math.exp((item.points - list[list.length - 1].points) / 750 + form)
      };
    });
    const total = raw.reduce((sum, item) => sum + item.rawProbability, 0);
    return raw.map((item) => ({ ...item, probability: Math.round((item.rawProbability / total) * 100) }));
  };

  const achievements = (item, state = cache) => {
    const badges = [];
    const rank = ranked(state.families).findIndex((team) => team.id === item.id) + 1;
    if (rank === 1) badges.push({ icon: '♛', name: 'Championship Leader' });
    if (item.wins >= 7) badges.push({ icon: '◆', name: 'Battle Master' });
    if (item.streak >= 3) badges.push({ icon: '↗', name: 'Winning Streak' });
    const dominant = Object.entries(item.categories).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (dominant === 'sports') badges.push({ icon: '⚡', name: 'Sports Power' });
    if (dominant === 'academic') badges.push({ icon: '✦', name: 'Academic Dominance' });
    if (dominant === 'cultural') badges.push({ icon: '★', name: 'Cultural Force' });
    if (item.championships >= 4) badges.push({ icon: '∞', name: 'Dynasty' });
    return badges.slice(0, 4);
  };

  const setupShell = () => {
    const header = document.getElementById('site-header');
    if (header) {
      const page = document.body.dataset.page || 'home';
      const nav = [
        ['home', 'Arena', `${ROOT}index.html`],
        ['leaderboard', 'Leaderboard', `${ROOT}pages/leaderboard.html`],
        ['bracket', 'Brackets', `${ROOT}pages/bracket.html`],
        ['families', 'Families', `${ROOT}pages/families.html`],
        ['analytics', 'Analytics', `${ROOT}pages/analytics.html`],
        ['strategy', 'Strategy', `${ROOT}pages/strategy.html`],
        ['guidelines', 'Guidelines', `${ROOT}pages/guidelines.html`]
      ];
      header.innerHTML = `
        <a class="skip-link" href="#main">Skip to content</a>
        <div class="nav-shell">
          <a class="brand-lockup" href="${ROOT}index.html" aria-label="TAGLISAYAHAN 2026 home">
            <img src="${ROOT}assets/images/sacci-logo.png" alt="SACCI seal">
            <span><b>TAGLISAYAHAN</b><small>2026 • SACCI</small></span>
          </a>
          <button class="nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false"><span></span><span></span><span></span></button>
          <nav class="main-nav" aria-label="Primary navigation">
            ${nav.map(([id, label, href]) => `<a href="${href}"${page === id ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
          </nav>
          <div class="nav-actions">
            <span class="live-pill"><i></i> LIVE</span>
            <a class="icon-button" href="${ROOT}led-mode/index.html" aria-label="Open LED big screen mode" title="LED Mode">▣</a>
            <a class="button button-gold button-sm" href="${ROOT}admin/index.html">Admin</a>
          </div>
        </div>`;
      const toggle = header.querySelector('.nav-toggle');
      toggle?.addEventListener('click', () => {
        const opened = header.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', String(opened));
      });
    }

    const footer = document.getElementById('site-footer');
    if (footer) footer.innerHTML = `
      <div class="footer-grid">
        <div class="footer-brand"><img src="${ROOT}assets/images/sacci-logo.png" alt=""><div><strong>ST. ANTHONY COLLEGE<br>CALAPAN CITY, INC.</strong><span>TAGLISAYAHAN 2026 Championship System</span></div></div>
        <div><span class="footer-label">Experience</span><a href="${ROOT}pages/leaderboard.html">Live standings</a><a href="${ROOT}pages/bracket.html">Bracket intelligence</a><a href="${ROOT}pages/guidelines.html">Official guidelines</a><a href="${ROOT}led-mode/index.html">LED arena mode</a></div>
        <div><span class="footer-label">System Developer</span><strong>DR. EMELSON C. VERTUCIO, LPT</strong><span>Management Information System Officer</span></div>
      </div>
      <div class="footer-bottom"><span>© 2026 St. Anthony College Calapan City, Inc.</span><span>Tagisan • Talino • Saya • Paligsahan</span></div>`;
    document.documentElement.classList.add('ready');
  };

  const setupMotion = () => {
    motionObserver ||= new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        motionObserver.unobserve(entry.target);
      }
    }), { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]:not([data-motion-bound])').forEach((element) => { element.dataset.motionBound = '1'; motionObserver.observe(element); });

    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('[data-tilt]:not([data-tilt-bound])').forEach((card) => {
        card.dataset.tiltBound = '1';
        card.addEventListener('pointermove', (event) => {
          const bounds = card.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - 0.5;
          const y = (event.clientY - bounds.top) / bounds.height - 0.5;
          card.style.setProperty('--ry', `${x * 7}deg`);
          card.style.setProperty('--rx', `${y * -7}deg`);
          card.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
          card.style.setProperty('--my', `${(y + 0.5) * 100}%`);
        });
        card.addEventListener('pointerleave', () => {
          card.style.setProperty('--ry', '0deg'); card.style.setProperty('--rx', '0deg');
        });
      });
    }
  };

  const setupParticles = (canvas, { density = 42, speed = 0.18 } = {}) => {
    if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const context = canvas.getContext('2d');
    let particles = [];
    let frame;
    const resize = () => {
      const ratio = Math.min(devicePixelRatio, 2);
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: density }, () => ({
        x: Math.random() * canvas.clientWidth,
        y: Math.random() * canvas.clientHeight,
        radius: Math.random() * 1.7 + 0.35,
        velocity: Math.random() * speed + 0.05,
        alpha: Math.random() * 0.55 + 0.16
      }));
    };
    const draw = () => {
      context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      particles.forEach((particle) => {
        particle.y -= particle.velocity;
        particle.x += Math.sin(particle.y * 0.01) * 0.08;
        if (particle.y < -4) { particle.y = canvas.clientHeight + 4; particle.x = Math.random() * canvas.clientWidth; }
        context.beginPath(); context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(242, 193, 78, ${particle.alpha})`; context.fill();
      });
      frame = requestAnimationFrame(draw);
    };
    new ResizeObserver(resize).observe(canvas);
    resize(); draw();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(frame); else draw();
    });
  };

  const animateNumber = (element, target, duration = 850) => {
    if (!element) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { element.textContent = formatPoints(target); return; }
    const start = performance.now();
    const from = Number(element.dataset.value || 0);
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatPoints(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(tick); else element.dataset.value = target;
    };
    requestAnimationFrame(tick);
  };

  const countdown = (element, iso) => {
    if (!element) return;
    const update = () => {
      let seconds = Math.floor((new Date(iso).getTime() - Date.now()) / 1000);
      if (seconds <= 0) {
        element.innerHTML = '<strong class="countdown-live">CHAMPIONSHIP LIVE</strong>';
        return;
      }
      const days = Math.floor(seconds / 86400); seconds %= 86400;
      const hours = Math.floor(seconds / 3600); seconds %= 3600;
      const minutes = Math.floor(seconds / 60); seconds %= 60;
      element.innerHTML = [[days, 'Days'], [hours, 'Hours'], [minutes, 'Mins'], [seconds, 'Secs']]
        .map(([value, label]) => `<span><b>${String(value).padStart(2, '0')}</b><small>${label}</small></span>`).join('');
    };
    update(); setInterval(update, 1000);
  };

  const notify = (message, tone = 'default') => {
    let stack = document.querySelector('.toast-stack');
    if (!stack) { stack = document.createElement('div'); stack.className = 'toast-stack'; document.body.append(stack); }
    const toast = document.createElement('div'); toast.className = `toast toast-${tone}`; toast.textContent = message;
    stack.append(toast); requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 250); }, 3300);
  };

  channel?.addEventListener('message', ({ data }) => {
    if (data?.type === 'state' && data.state) {
      cache = data.state;
      localStorage.setItem(STORE_KEY, JSON.stringify(cache));
      listeners.forEach((listener) => listener(cache));
    }
  });
  addEventListener('storage', (event) => {
    if (event.key === STORE_KEY && event.newValue) {
      try { cache = JSON.parse(event.newValue); listeners.forEach((listener) => listener(cache)); } catch { /* ignore */ }
    }
  });

  document.addEventListener('DOMContentLoaded', () => { setupShell(); setupMotion(); });

  window.TAG = {
    ROOT, STORE_KEY, TOKEN_KEY, load, persist, ranked, family, event, category, logo,
    formatPoints, initials, medal, timeAgo, escapeHTML, familyOptions, familyLogo, bracketFor, bracketEligibleEvents,
    applyResultToState, recordResult, projections,
    achievements, setupMotion, setupParticles, animateNumber, countdown, notify,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    get state() { return cache; },
    get events() { return eventsCache; },
    clone
  };
})();
