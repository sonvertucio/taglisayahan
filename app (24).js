(() => {
  'use strict';

  const familyCell = (item, secondary = '') => `
    <div class="family-cell">
      <img src="${TAG.logo(item)}" alt="${TAG.escapeHTML(item.name)} emblem">
      <div><strong>${TAG.escapeHTML(item.name)}</strong><small>${secondary || `${item.wins} wins • ${item.momentum}% momentum`}</small></div>
    </div>`;

  const categoryBars = (item) => {
    const total = Object.values(item.categories).reduce((sum, value) => sum + value, 0) || 1;
    return `<div class="category-mini" aria-label="Category contribution">
      <i style="width:${(item.categories.sports / total) * 100}%;background:#f2c14e"></i>
      <i style="width:${(item.categories.academic / total) * 100}%;background:#d55c79"></i>
      <i style="width:${(item.categories.cultural / total) * 100}%;background:#8ea8ff"></i>
    </div>`;
  };

  const leaderboardRows = (state, full = false) => {
    const ranked = TAG.ranked(state.families);
    const top = ranked[0]?.points || 1;
    return ranked.map((item, index) => {
    return `<div class="leader-row" style="--family:${item.color}" data-reveal>
      <div class="rank-mark">${TAG.medal(index + 1)}</div>
      ${familyCell(item, `W ${item.wins} • L ${item.losses} • ${item.streak} streak`)}
      ${full ? `<div class="bar-stack"><div class="bar-label"><span>Chase</span><span>${Math.round((item.points / top) * 100)}%</span></div><div class="bar-track"><i style="--value:${(item.points / top) * 100}%;--family:${item.color}"></i></div></div>` : categoryBars(item)}
      <div class="points-cell"><span data-score="${item.id}" data-value="0" data-target="${item.points}">${TAG.formatPoints(item.points)}</span><small class="muted"> pts</small></div>
      <div class="movement ${item.streak < 2 ? 'hold' : ''}">${item.streak >= 3 ? `↗ ${item.streak}` : '—'}</div>
    </div>`;
    }).join('');
  };

  const renderHome = (state) => {
    const list = TAG.ranked(state.families);
    const leader = list[0];
    document.getElementById('hero-emblem').innerHTML = `<img src="${TAG.logo(leader)}" alt="${TAG.escapeHTML(leader.name)} emblem">`;
    document.getElementById('champion-tag').innerHTML = `<small>Current Leader</small><strong>${TAG.escapeHTML(leader.name)}</strong><span>${TAG.formatPoints(leader.points)} points • ${leader.momentum}% momentum</span>`;
    document.getElementById('home-leaderboard').innerHTML = leaderboardRows(state);
    document.getElementById('home-schedule').innerHTML = state.schedule.map((item) => `<div class="schedule-item"><span class="schedule-time">${item.time}</span><div><strong>${TAG.escapeHTML(item.event)}</strong><small>${TAG.escapeHTML(item.venue)}</small></div><span class="status-chip ${item.status === 'Next' ? 'green' : item.status === 'Featured' ? 'gold' : ''}">${item.status}</span></div>`).join('');
    const news = state.announcements[0];
    document.getElementById('news-ticker').innerHTML = `<strong>${TAG.escapeHTML(news.title)}</strong><span>— ${TAG.escapeHTML(news.body)}</span>`;
    document.getElementById('family-grid').innerHTML = list.map((item, index) => `<a class="family-card" style="--family:${item.color}" data-rank="#${String(index + 1).padStart(2, '0')}" data-tilt data-reveal href="pages/families.html#${item.id}"><div class="family-art"><img src="${TAG.logo(item)}" alt="${TAG.escapeHTML(item.name)} official family emblem"></div><div class="family-card-content"><div class="rank-line"><span>Championship Rank ${index + 1}</span><span>${item.momentum}% momentum</span></div><h3>${TAG.escapeHTML(item.name)}</h3><p>${TAG.escapeHTML(item.motto)}</p><div class="card-score"><strong>${TAG.formatPoints(item.points)}</strong><span>${item.wins} event wins</span></div></div></a>`).join('');
    const total = state.families.reduce((sum, item) => sum + item.points, 0);
    const gap = list[0].points - list[1].points;
    const completed = new Set(state.results.map((result) => result.eventId)).size;
    const metrics = [
      ['Verified Events', completed, 'Results recorded in the arena'],
      ['Points Awarded', TAG.formatPoints(total), 'Across all five families'],
      ['Battle for First', `${TAG.formatPoints(gap)} pts`, `${list[1].name} is in striking distance`],
      ['Top Momentum', `${leader.momentum}%`, `${leader.name} sets the pace`]
    ];
    document.getElementById('home-metrics').innerHTML = metrics.map(([label, value, caption]) => `<div class="metric-card" data-reveal><small>${label}</small><strong>${value}</strong><span>${TAG.escapeHTML(caption)}</span></div>`).join('');
    document.getElementById('announcement-grid').innerHTML = state.announcements.slice(0, 3).map((item, index) => `<article class="announcement-card" data-index="0${index + 1}" data-reveal><span class="status-chip ${item.type === 'breaking' ? 'gold' : ''}">${item.type}</span><h3>${TAG.escapeHTML(item.title)}</h3><p>${TAG.escapeHTML(item.body)}</p><time datetime="${item.createdAt}">${TAG.timeAgo(item.createdAt)}</time></article>`).join('');
    TAG.setupMotion();
  };

  const initHome = (state) => {
    const intro = document.getElementById('intro-screen');
    const seen = sessionStorage.getItem('taglisayahan_intro_seen');
    setTimeout(() => intro?.classList.add('done'), seen ? 120 : 1750);
    sessionStorage.setItem('taglisayahan_intro_seen', '1');
    TAG.setupParticles(document.getElementById('hero-particles'), { density: 52, speed: .22 });
    TAG.countdown(document.getElementById('championship-countdown'), state.meta.countdownTarget);
    renderHome(state);
    TAG.subscribe(renderHome);
  };

  let leaderboardScores = {};

  const renderPodium = (state) => {
    const ranked = TAG.ranked(state.families).slice(0, 3);
    const slots = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
    const placeLabels = { 1: 'CHAMPION', 2: 'RUNNER UP', 3: 'THIRD PLACE' };
    const podium = document.getElementById('leaderboard-podium');
    if (!podium) return;
    podium.innerHTML = slots.map((item) => {
      const rank = ranked.findIndex((family) => family.id === item.id) + 1;
      return `<article class="podium-slot podium-${rank}" style="--family:${item.color}" data-rank="${rank}" data-reveal><div class="podium-aura"></div><div class="podium-crown">${rank === 1 ? '♛' : rank === 2 ? '◆' : '✦'}</div><div class="podium-crest"><img src="${TAG.logo(item)}" alt="${TAG.escapeHTML(item.name)} official family emblem"></div><span class="podium-rank">0${rank}</span><div class="podium-copy"><small>${placeLabels[rank]}</small><h3>${TAG.escapeHTML(item.name)}</h3><strong data-podium-score="${item.id}" data-value="0">${TAG.formatPoints(item.points)}</strong><span>championship points</span></div><div class="podium-bar"><i style="height:${Math.max(30, Math.round((item.points / ranked[0].points) * 100))}%"></i></div></article>`;
    }).join('');
  };

  const animateLeaderboardScores = (state) => {
    const nextScores = Object.fromEntries(state.families.map((item) => [item.id, item.points]));
    document.querySelectorAll('[data-score], [data-podium-score]').forEach((element) => {
      const id = element.dataset.score || element.dataset.podiumScore;
      element.dataset.value = leaderboardScores[id] ?? 0;
      TAG.animateNumber(element, nextScores[id] || 0, 1050);
    });
    leaderboardScores = nextScores;
  };

  const renderLeaderboard = (state) => {
    renderPodium(state);
    document.getElementById('full-leaderboard').innerHTML = leaderboardRows(state, true);
    document.getElementById('ranking-updated').textContent = `Updated ${TAG.timeAgo(state.meta.updatedAt)}`;
    document.getElementById('result-history').innerHTML = state.results.length ? state.results.map((result) => {
      const winner = TAG.family(result.winner, state);
      return `<tr><td><strong>${TAG.escapeHTML(result.event)}</strong></td><td><span class="status-chip">${TAG.escapeHTML(result.category)}</span></td><td>${familyCell(winner)}</td><td>${TAG.timeAgo(result.recordedAt)}</td><td class="points-award">+${TAG.formatPoints(result.points[0])}</td></tr>`;
    }).join('') : '<tr><td colspan="5" class="empty-state">No verified results have been recorded.</td></tr>';
    animateLeaderboardScores(state);
    TAG.setupMotion();
  };

  const initLeaderboard = (state) => {
    TAG.setupParticles(document.getElementById('leaderboard-particles'), { density: 32, speed: .16 });
    TAG.setupParticles(document.getElementById('leaderboard-stage-particles'), { density: 58, speed: .22 });
    renderLeaderboard(state); TAG.subscribe(renderLeaderboard);
  };

  const renderFamilies = (state) => {
    const ranked = TAG.ranked(state.families);
    document.getElementById('family-profiles').innerHTML = ranked.map((item, index) => {
      const total = Math.max(...Object.values(item.categories));
      const badges = TAG.achievements(item, state);
      return `<article class="panel family-profile" id="${item.id}" style="--family:${item.color}" data-reveal>
        <div class="profile-top"><div class="profile-emblem"><img src="${TAG.logo(item)}" alt="${TAG.escapeHTML(item.name)} emblem"></div><div class="profile-copy"><div class="rank-line"><span>Rank ${index + 1}</span><span>•</span><span>${item.momentum}% momentum</span></div><h2>${TAG.escapeHTML(item.name)}</h2><p>“${TAG.escapeHTML(item.motto)}”</p><div class="profile-score"><span>Points<b>${TAG.formatPoints(item.points)}</b></span><span>Record<b>${item.wins}–${item.losses}</b></span></div></div></div>
        <div class="profile-stats"><div><b>${item.wins}</b><small>Wins</small></div><div><b>${item.losses}</b><small>Losses</small></div><div><b>${item.championships}</b><small>Titles</small></div><div><b>${item.streak}</b><small>Streak</small></div></div>
        <div class="power-bars">${Object.entries(item.categories).map(([name, value]) => `<div class="power-row"><span>${name[0].toUpperCase() + name.slice(1)}</span><div class="bar-track"><i style="--value:${(value / total) * 100}%;--family:${item.color}"></i></div><b>${TAG.formatPoints(value)}</b></div>`).join('')}</div>
        <div class="badge-row">${badges.map((badge) => `<span class="badge"><i>${badge.icon}</i>${badge.name}</span>`).join('')}</div>
      </article>`;
    }).join('');
    TAG.setupMotion();
    if (location.hash) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' }), 120);
  };

  const initFamilies = (state) => { renderFamilies(state); TAG.subscribe(renderFamilies); };

  const drawCategoryChart = (canvas, state) => {
    if (!canvas) return;
    const ratio = Math.min(devicePixelRatio, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight || 325;
    canvas.width = width * ratio; canvas.height = height * ratio;
    const context = canvas.getContext('2d'); context.scale(ratio, ratio);
    const ranked = TAG.ranked(state.families);
    const maximum = Math.max(...ranked.flatMap((item) => Object.values(item.categories))) * 1.12;
    const margins = { top: 20, right: 20, bottom: 72, left: 42 };
    const plotWidth = width - margins.left - margins.right;
    const plotHeight = height - margins.top - margins.bottom;
    context.clearRect(0, 0, width, height);
    context.font = '11px Segoe UI'; context.fillStyle = '#847c7a'; context.textAlign = 'right';
    for (let index = 0; index <= 4; index += 1) {
      const y = margins.top + (plotHeight / 4) * index;
      context.strokeStyle = 'rgba(255,255,255,.065)'; context.beginPath(); context.moveTo(margins.left, y); context.lineTo(width - margins.right, y); context.stroke();
      context.fillText(TAG.formatPoints(Math.round(maximum * (1 - index / 4))), margins.left - 8, y + 4);
    }
    const groupWidth = plotWidth / ranked.length;
    const barWidth = Math.min(22, groupWidth / 4.2);
    const colors = { sports: '#f2c14e', academic: '#d55c79', cultural: '#8ea8ff' };
    ranked.forEach((item, familyIndex) => {
      const center = margins.left + groupWidth * familyIndex + groupWidth / 2;
      Object.entries(item.categories).forEach(([name, value], categoryIndex) => {
        const barHeight = (value / maximum) * plotHeight;
        const x = center + (categoryIndex - 1) * (barWidth + 4) - barWidth / 2;
        const gradient = context.createLinearGradient(0, margins.top + plotHeight - barHeight, 0, margins.top + plotHeight);
        gradient.addColorStop(0, colors[name]); gradient.addColorStop(1, `${colors[name]}55`);
        context.fillStyle = gradient; context.beginPath(); context.roundRect(x, margins.top + plotHeight - barHeight, barWidth, barHeight, 4); context.fill();
      });
      context.save(); context.translate(center, height - margins.bottom + 16); context.rotate(-.42); context.fillStyle = '#aaa19f'; context.textAlign = 'right'; context.font = '10px Segoe UI'; context.fillText(item.name, 0, 0); context.restore();
    });
  };

  const renderAnalytics = (state) => {
    const list = TAG.ranked(state.families);
    const categoryLeaders = ['sports', 'academic', 'cultural'].map((category) => [...state.families].sort((a, b) => b.categories[category] - a.categories[category])[0]);
    const strongestWinRate = [...state.families].sort((a, b) => (b.wins / (b.wins + b.losses)) - (a.wins / (a.wins + a.losses)))[0];
    const insights = [
      ['Sports leader', categoryLeaders[0].name, `${TAG.formatPoints(categoryLeaders[0].categories.sports)} sports points`],
      ['Academic leader', categoryLeaders[1].name, `${TAG.formatPoints(categoryLeaders[1].categories.academic)} academic points`],
      ['Cultural leader', categoryLeaders[2].name, `${TAG.formatPoints(categoryLeaders[2].categories.cultural)} cultural points`],
      ['Best win rate', strongestWinRate.name, `${Math.round((strongestWinRate.wins / (strongestWinRate.wins + strongestWinRate.losses)) * 100)}% across recorded battles`]
    ];
    document.getElementById('analytics-insights').innerHTML = insights.map(([label, title, text]) => `<div class="insight"><small>${label}</small><strong>${TAG.escapeHTML(title)}</strong><p>${text}</p></div>`).join('');
    document.getElementById('projection-list').innerHTML = TAG.projections(state).map((item) => `<div class="projection-row" style="--family:${item.color}">${familyCell(item)}<div><small>Best case</small><span class="projection-value">${TAG.formatPoints(item.best)}</span></div><div><small>Average</small><span class="projection-value">${TAG.formatPoints(item.average)}</span></div><div><small>Trend</small><span class="projection-value">${TAG.formatPoints(item.trend)}</span></div><div class="probability"><div><small>Title probability</small><b>${item.probability}%</b></div><div class="bar-track"><i style="--value:${item.probability}%"></i></div></div></div>`).join('');
    const chart = document.getElementById('category-chart');
    drawCategoryChart(chart, state);
    if (!chart.dataset.observed) {
      chart.dataset.observed = '1';
      new ResizeObserver(() => drawCategoryChart(chart, TAG.state)).observe(chart);
    }
    TAG.setupMotion();
  };

  const initAnalytics = (state) => { renderAnalytics(state); TAG.subscribe(renderAnalytics); };

  let selectedFamilyId = null;
  const renderStrategy = (state) => {
    const list = TAG.ranked(state.families);
    if (!selectedFamilyId || !TAG.family(selectedFamilyId, state)) selectedFamilyId = list[0].id;
    const selected = TAG.family(selectedFamilyId, state);
    const rankIndex = list.findIndex((item) => item.id === selected.id);
    const ahead = rankIndex > 0 ? list[rankIndex - 1] : null;
    const remaining = TAG.events.categories.flatMap((group) => group.events.map((event) => ({ ...event, category: group.id }))).filter((event) => !state.results.some((result) => result.eventId === event.id));
    const opportunities = remaining.sort((a, b) => b.placements[0] - a.placements[0]).slice(0, 4);
    const weakest = Object.entries(selected.categories).sort((a, b) => a[1] - b[1])[0][0];
    const strongest = Object.entries(selected.categories).sort((a, b) => b[1] - a[1])[0][0];
    document.getElementById('strategy-picker').innerHTML = list.map((item) => `<button class="family-pick ${item.id === selected.id ? 'active' : ''}" style="--family:${item.color}" type="button" data-family-pick="${item.id}"><img src="${TAG.logo(item)}" alt=""><span>${TAG.escapeHTML(item.name)}</span></button>`).join('');
    document.getElementById('strategy-board').style.setProperty('--family', selected.color);
    document.getElementById('strategy-board').innerHTML = `<article class="panel strategy-rank"><div><img class="strategy-emblem" src="${TAG.logo(selected)}" alt="${TAG.escapeHTML(selected.name)} emblem"><h2>${TAG.escapeHTML(selected.name)}</h2><p>${TAG.escapeHTML(selected.motto)}</p></div><div><div class="giant-rank">#${rankIndex + 1}</div><strong>${TAG.formatPoints(selected.points)} championship points</strong></div></article><div class="strategy-cards">
      <article class="panel strategy-card"><span class="kicker">Overtake target</span><h3>${ahead ? TAG.escapeHTML(ahead.name) : 'Defend the lead'}</h3><p>${ahead ? `${TAG.formatPoints(ahead.points - selected.points + 1)} more points are needed to move into rank ${rankIndex}.` : `${TAG.formatPoints(selected.points - list[1].points)} points currently protect first place.`}</p></article>
      <article class="panel strategy-card"><span class="kicker">Remaining arena</span><h3>${remaining.length} event entries</h3><p>High-value placements remain available across sports, academic, and cultural events.</p></article>
      <article class="panel strategy-card"><span class="kicker">Highest opportunities</span><div class="opportunity-list">${opportunities.map((event) => `<div><span>${TAG.escapeHTML(event.name)}</span><b>${TAG.formatPoints(event.placements[0])}</b></div>`).join('') || '<p>All configured events have results.</p>'}</div></article>
      <article class="panel strategy-card"><span class="kicker">Suggested focus</span><h3>Build ${weakest} power</h3><p>Protect the family’s advantage in ${strongest} events while prioritizing high-value ${weakest} placements to create a more balanced title run.</p></article>
    </div>`;
    document.querySelectorAll('[data-family-pick]').forEach((button) => button.addEventListener('click', () => { selectedFamilyId = button.dataset.familyPick; renderStrategy(TAG.state); }));
  };

  const initStrategy = (state) => { selectedFamilyId = new URLSearchParams(location.search).get('family'); renderStrategy(state); TAG.subscribe(renderStrategy); };

  const initGuidelines = () => {
    const body = document.getElementById('points-table');
    const rows = TAG.events.categories.flatMap((group) => group.events.map((event) => ({ ...event, category: group.name })));
    body.innerHTML = rows.map((event) => `<tr><td><strong>${TAG.escapeHTML(event.name)}</strong></td><td>${event.category}</td>${event.placements.map((points) => `<td class="points-award">${TAG.formatPoints(points)}</td>`).join('')}</tr>`).join('');
    const input = document.getElementById('guideline-search');
    const search = () => {
      const query = input.value.trim().toLowerCase();
      let matches = 0;
      document.querySelectorAll('.guideline-block, .event-rule').forEach((block) => {
        const haystack = `${block.dataset.search || ''} ${block.textContent}`.toLowerCase();
        const visible = !query || haystack.includes(query);
        block.style.display = visible ? '' : 'none';
        if (visible) matches += 1;
      });
      TAG.notify(query ? `${matches} guideline section${matches === 1 ? '' : 's'} found` : 'All guideline sections restored', matches ? 'success' : 'danger');
    };
    document.getElementById('search-guidelines').addEventListener('click', search);
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter') search(); });
    input.addEventListener('search', search);
  };

  const init = async () => {
    try {
      const state = await TAG.load();
      const page = document.body.dataset.page;
      ({ home: initHome, leaderboard: initLeaderboard, families: initFamilies, analytics: initAnalytics, strategy: initStrategy, guidelines: initGuidelines }[page] || (() => {}))(state);
    } catch (error) {
      console.error(error);
      document.getElementById('main')?.insertAdjacentHTML('afterbegin', '<div class="container"><div class="empty-state">The championship data could not be loaded. Please refresh the page.</div></div>');
    }
  };

  addEventListener('DOMContentLoaded', init);
})();
