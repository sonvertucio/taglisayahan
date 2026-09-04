(() => {
  'use strict';

  let selectedEventId = '';
  let selectedFamilyId = '';
  let selectedMatchId = '';
  let boardObserver;

  const winnersRounds = ['Winner R1', 'Winner Semi', 'Winner Final'];
  const losersRounds = ['Loser R1', 'Loser R2', 'Loser R3', 'Loser Final'];
  const connections = [['M1', 'M4'], ['M2', 'M4'], ['M3', 'M4'], ['M4', 'M5'], ['M5', 'M8'], ['L1', 'L3'], ['L2', 'L3'], ['L3', 'L4'], ['L4', 'M6'], ['M6', 'M7'], ['M7', 'M8'], ['M8', 'M9']];

  const fallbackBracket = (state) => {
    const ids = TAG.ranked(state.families).map((item) => item.id);
    const [a, b, c, d, e] = ids;
    return {
      format: 'Double Elimination',
      updatedAt: state.meta.updatedAt,
      currentMatch: 'M1',
      matches: [
        { id: 'M1', bracket: 'winners', round: 'Winner R1', label: 'M1', teamA: a, teamB: b, status: 'Upcoming' },
        { id: 'M2', bracket: 'winners', round: 'Winner R1', label: 'M2', teamA: c, teamB: d, status: 'Upcoming' },
        { id: 'M3', bracket: 'winners', round: 'Winner R1', label: 'M3', teamA: e, teamB: 'BYE', status: 'Upcoming' },
        { id: 'M4', bracket: 'winners', round: 'Winner Semi', label: 'M4', teamA: 'TBD', teamB: 'TBD', status: 'Upcoming' },
        { id: 'M5', bracket: 'winners', round: 'Winner Final', label: 'M5', teamA: 'TBD', teamB: 'TBD', status: 'Upcoming' },
        { id: 'L1', bracket: 'losers', round: 'Loser R1', label: 'L1', teamA: 'TBD', teamB: 'TBD', status: 'Upcoming' },
        { id: 'L2', bracket: 'losers', round: 'Loser R1', label: 'L2', teamA: 'TBD', teamB: 'TBD', status: 'Upcoming' },
        { id: 'L3', bracket: 'losers', round: 'Loser R2', label: 'L3', teamA: 'TBD', teamB: 'TBD', status: 'Upcoming' },
        { id: 'L4', bracket: 'losers', round: 'Loser Final', label: 'L4 • If first loss', teamA: 'TBD', teamB: 'TBD', status: 'Conditional' },
        { id: 'M6', bracket: 'losers', round: 'Loser R3', label: 'M6', teamA: 'TBD', teamB: 'TBD', status: 'Upcoming' },
        { id: 'M7', bracket: 'losers', round: 'Loser Final', label: 'M7', teamA: 'TBD', teamB: 'TBD', status: 'Upcoming' },
        { id: 'M8', bracket: 'grand', round: 'Grand Final', label: 'M8', teamA: 'TBD', teamB: 'TBD', status: 'Upcoming' },
        { id: 'M9', bracket: 'grand', round: 'Bracket Reset', label: 'M9 • if needed', teamA: 'TBD', teamB: 'TBD', status: 'Conditional' }
      ]
    };
  };

  const eventMatches = (state) => {
    const supplied = TAG.bracketFor(selectedEventId, state);
    return supplied?.matches?.length ? supplied : fallbackBracket(state);
  };
  const familyName = (id, state) => {
    if (id === 'BYE') return 'BYE';
    if (id === 'TBD' || !id) return 'TBD';
    return TAG.family(id, state)?.name || id;
  };
  const statusTone = (status = '') => ({ Live: 'live', Final: 'done', Upcoming: 'next', Conditional: 'conditional' }[status] || 'next');
  const statusLabel = (status = '') => ({ Live: 'Live now', Final: 'Verified', Upcoming: 'Next route', Conditional: 'If needed' }[status] || status);

  const teamRow = (id, score, match, state, side) => {
    const item = TAG.family(id, state);
    const winner = match.winner === id;
    const selected = id === selectedFamilyId;
    return `<div class="bracket-team-row ${selected ? 'is-selected' : ''} ${winner ? 'is-winner' : ''}" data-team="${TAG.escapeHTML(id || '')}">
      <span class="bracket-team-crest">${item ? TAG.familyLogo(item) : `<i class="bracket-placeholder">${id === 'BYE' ? '∅' : '?'}</i>`}</span>
      <span class="bracket-team-name">${TAG.escapeHTML(familyName(id, state))}</span>
      <b class="bracket-team-score">${Number.isFinite(score) ? score : '—'}</b>
      ${winner ? '<em>W</em>' : ''}
    </div>`;
  };

  const matchCard = (match, state) => `<article class="bracket-match ${statusTone(match.status)} ${match.id === selectedMatchId ? 'is-focus' : ''} ${match.teamA === selectedFamilyId || match.teamB === selectedFamilyId ? 'has-family' : ''}" data-match="${match.id}" tabindex="0" role="button" aria-label="${TAG.escapeHTML(`${match.label} ${match.round}`)}">
    <div class="bracket-match-top"><strong>${TAG.escapeHTML(match.label || match.id)}</strong><span class="status-chip ${statusTone(match.status) === 'live' ? 'gold' : ''}"><i></i>${statusLabel(match.status)}</span></div>
    ${teamRow(match.teamA, match.scoreA, match, state, 'a')}
    ${teamRow(match.teamB, match.scoreB, match, state, 'b')}
    ${match.scheduled ? `<small class="bracket-scheduled">${TAG.escapeHTML(match.scheduled)}</small>` : ''}
  </article>`;

  const roundColumn = (round, matches, state, index) => `<div class="bracket-column" data-round="${index}"><div class="bracket-column-title">${TAG.escapeHTML(round)}</div><div class="bracket-match-stack">${matches.filter((match) => match.round === round).map((match) => matchCard(match, state)).join('') || '<div class="bracket-slot-empty">Open slot</div>'}</div></div>`;

  const renderBoard = (state, bracket) => {
    const matches = bracket.matches || [];
    const winnerMatches = matches.filter((match) => match.bracket === 'winners');
    const loserMatches = matches.filter((match) => match.bracket === 'losers');
    const grandMatches = matches.filter((match) => match.bracket === 'grand');
    document.getElementById('bracket-board').innerHTML = `<div class="bracket-lane winners-lane"><div class="bracket-lane-title"><span class="bracket-lane-mark">W</span><div><strong>Winner’s Bracket</strong><small>Two lives start here — protect the upper path.</small></div></div><div class="bracket-columns">${winnersRounds.map((round, index) => roundColumn(round, winnerMatches, state, index)).join('')}</div></div>
      <div class="bracket-lane losers-lane"><div class="bracket-lane-title"><span class="bracket-lane-mark">L</span><div><strong>Loser’s Bracket</strong><small>One last life — every loss changes the route.</small></div></div><div class="bracket-columns">${losersRounds.map((round, index) => roundColumn(round, loserMatches, state, index)).join('')}</div></div>
      <div class="bracket-lane grand-lane"><div class="bracket-lane-title"><span class="bracket-lane-mark">✦</span><div><strong>Grand Final</strong><small>Winner’s bracket advantage meets the last challenger.</small></div></div><div class="bracket-columns">${['Grand Final', 'Bracket Reset'].map((round, index) => roundColumn(round, grandMatches, state, index)).join('')}</div></div><svg class="bracket-lines" id="bracket-lines" aria-hidden="true"></svg>`;
    document.querySelectorAll('[data-match]').forEach((card) => {
      card.addEventListener('click', () => { selectedMatchId = card.dataset.match; render(state); });
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectedMatchId = card.dataset.match; render(state); } });
    });
    drawConnectors();
  };

  const drawConnectors = () => {
    const board = document.getElementById('bracket-board');
    const svg = document.getElementById('bracket-lines');
    if (!board || !svg) return;
    const rect = board.getBoundingClientRect();
    const width = Math.max(board.scrollWidth, rect.width);
    const height = Math.max(board.scrollHeight, rect.height);
    svg.setAttribute('width', width); svg.setAttribute('height', height); svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = connections.map(([fromId, toId]) => {
      const from = board.querySelector(`[data-match="${fromId}"]`);
      const to = board.querySelector(`[data-match="${toId}"]`);
      if (!from || !to) return '';
      const a = from.getBoundingClientRect(); const b = to.getBoundingClientRect();
      const x1 = a.right - rect.left; const y1 = a.top + a.height / 2 - rect.top;
      const x2 = b.left - rect.left; const y2 = b.top + b.height / 2 - rect.top;
      const bend = x1 + Math.max(24, (x2 - x1) * .5);
      const tone = from.classList.contains('live') || to.classList.contains('live') ? 'live' : 'base';
      return `<path class="bracket-connector ${tone}" d="M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}"/>`;
    }).join('');
  };

  const renderFamilyPicker = (state) => {
    const list = TAG.ranked(state.families);
    if (!selectedFamilyId || !TAG.family(selectedFamilyId, state)) selectedFamilyId = list[0]?.id || '';
    document.getElementById('bracket-family-picker').innerHTML = list.map((item) => `<button type="button" class="family-pick ${item.id === selectedFamilyId ? 'active' : ''}" style="--family:${item.color}" data-family-pick="${item.id}"><img src="${TAG.logo(item)}" alt=""><span>${TAG.escapeHTML(item.name)}</span></button>`).join('');
    document.querySelectorAll('[data-family-pick]').forEach((button) => button.addEventListener('click', () => { selectedFamilyId = button.dataset.familyPick; render(state); }));
  };

  const probability = (selected, opponent, state) => {
    const a = TAG.family(selected, state); const b = TAG.family(opponent, state);
    if (!a || !b) return 0;
    const score = Math.max(5, (b.points - a.points) * .018 + (b.momentum - a.momentum) * .45 + 22);
    return Math.max(8, Math.min(92, Math.round(score)));
  };

  const renderIntel = (state, bracket) => {
    const selected = TAG.family(selectedFamilyId, state);
    const matches = bracket.matches || [];
    const relevant = matches.filter((match) => match.teamA === selectedFamilyId || match.teamB === selectedFamilyId);
    const losses = relevant.filter((match) => match.status === 'Final' && match.loser === selectedFamilyId).length;
    const wins = relevant.filter((match) => match.status === 'Final' && match.winner === selectedFamilyId).length;
    const live = matches.find((match) => match.status === 'Live' && (match.teamA === selectedFamilyId || match.teamB === selectedFamilyId));
    const upcoming = matches.find((match) => ['Upcoming', 'Conditional'].includes(match.status) && (match.teamA === selectedFamilyId || match.teamB === selectedFamilyId));
    const focus = live || upcoming;
    const opponent = focus ? (focus.teamA === selectedFamilyId ? focus.teamB : focus.teamA) : '';
    const potential = losses >= 2 ? [] : [...new Set(matches.flatMap((match) => [match.teamA, match.teamB]).filter((id) => id && !['TBD', 'BYE', selectedFamilyId].includes(id)))].filter((id) => !focus || id === opponent || !relevant.some((match) => match.status === 'Final' && match.winner === id));
    const stateLabel = losses >= 2 ? 'Eliminated' : live ? 'In a live match' : losses === 1 ? 'Last life active' : 'Winner’s bracket';
    const round = focus?.round || (losses >= 2 ? 'Run complete' : 'Awaiting opponent');
    document.getElementById('bracket-intel').innerHTML = `<article class="bracket-intel-card family-status" style="--family:${selected?.color || 'var(--gold-400)'}"><div class="bracket-intel-label"><span class="kicker">Selected family</span><span class="status-chip ${losses >= 2 ? '' : 'green'}"><i></i>${stateLabel}</span></div><div class="bracket-selected-lockup">${selected ? TAG.familyLogo(selected, 'bracket-intel-logo') : ''}<div><strong>${TAG.escapeHTML(selected?.name || 'Choose a family')}</strong><small>${round}</small></div></div><div class="life-meter"><span>Lives used</span><div>${[0, 1].map((life) => `<i class="${life < losses ? 'used' : 'open'}"></i>`).join('')}</div><b>${Math.max(0, 2 - losses)} remaining</b></div></article>
      <article class="bracket-intel-card live-opponent"><span class="kicker">Live / next opponent</span><div class="opponent-lockup">${opponent && TAG.family(opponent, state) ? TAG.familyLogo(TAG.family(opponent, state), 'bracket-intel-logo') : '<span class="bracket-question">?</span>'}<div><strong>${TAG.escapeHTML(opponent ? familyName(opponent, state) : 'Opponent not locked')}</strong><small>${live ? `Live in ${live.label}` : upcoming ? `Potential in ${upcoming.label}` : 'Waiting for a route update'}</small></div></div><p>${live ? 'The next point changes the upper-bracket route in real time.' : 'The bracket will reveal the opponent as the previous match is verified.'}</p></article>
      <article class="bracket-intel-card possible-opponents"><div class="bracket-intel-label"><span class="kicker">Possible opponents</span><strong>${potential.length || 0} in path</strong></div>${potential.slice(0, 3).map((id) => `<div class="opponent-probability" style="--family:${TAG.family(id, state)?.color || 'var(--gold-400)'}"><span>${TAG.family(id, state) ? TAG.familyLogo(TAG.family(id, state), 'mini-crest') : '<i class="bracket-placeholder">?</i>'}<b>${TAG.escapeHTML(familyName(id, state))}</b></span><span><i style="width:${probability(selectedFamilyId, id, state)}%"></i><small>${probability(selectedFamilyId, id, state)}%</small></span></div>`).join('') || '<p class="muted">No possible opponent is locked yet.</p>'}</article>`;
  };

  const renderDetail = (state, bracket) => {
    const matches = bracket.matches || [];
    const match = matches.find((item) => item.id === selectedMatchId) || matches.find((item) => item.id === bracket.currentMatch) || matches.find((item) => item.status === 'Live') || matches[0];
    if (!match) return;
    selectedMatchId = match.id;
    const opponent = match.teamA === selectedFamilyId ? match.teamB : match.teamA === selectedFamilyId ? match.teamA : '';
    const consequence = match.status === 'Final' ? `${familyName(match.winner, state)} advances; ${familyName(match.loser, state)} drops a life and moves to the loser route.` : match.status === 'Conditional' ? 'This card activates only if the upper-bracket finalist takes a first loss in the grand final.' : match.status === 'Live' ? 'Live match: the winner stays on the current lane while the loser is routed to the next available life.' : 'This match unlocks when the previous bracket nodes are verified by the command center.';
    document.getElementById('bracket-detail').innerHTML = `<div class="bracket-detail-copy"><div class="bracket-detail-head"><span class="status-chip ${statusTone(match.status) === 'live' ? 'gold' : ''}"><i></i>${statusLabel(match.status)}</span><span class="match-id">${TAG.escapeHTML(match.id)}</span></div><h2>${TAG.escapeHTML(match.round)}</h2><p>${TAG.escapeHTML(consequence)}</p></div><div class="bracket-detail-teams">${teamRow(match.teamA, match.scoreA, match, state, 'a')}${teamRow(match.teamB, match.scoreB, match, state, 'b')}</div><div class="bracket-detail-note"><span class="kicker">Selected family route</span><strong>${opponent ? `Possible opponent: ${TAG.escapeHTML(familyName(opponent, state))}` : 'Click a match to inspect its route'}</strong><small>${match.scheduled ? TAG.escapeHTML(match.scheduled) : 'Scores are updated by the admin command center.'}</small></div>`;
  };

  const render = (state) => {
    const eligible = TAG.bracketEligibleEvents();
    const eventSelect = document.getElementById('bracket-event-select');
    if (!selectedEventId || !eligible.some((item) => item.id === selectedEventId)) selectedEventId = eligible.find((item) => item.id === 'mobile-legends')?.id || eligible[0]?.id || 'mobile-legends';
    if (eventSelect && eventSelect.options.length !== eligible.length) eventSelect.innerHTML = eligible.map((item) => `<option value="${item.id}">${TAG.escapeHTML(item.name)}</option>`).join('');
    if (eventSelect) eventSelect.value = selectedEventId;
    const bracket = eventMatches(state);
    const selectedEvent = TAG.event(selectedEventId);
    document.getElementById('bracket-title').textContent = `${selectedEvent?.name || 'Team event'} · ${bracket.format || 'Double Elimination'}`;
    document.getElementById('bracket-updated').textContent = `Updated ${TAG.timeAgo(bracket.updatedAt || state.meta.updatedAt)}`;
    renderFamilyPicker(state); renderIntel(state, bracket); renderBoard(state, bracket); renderDetail(state, bracket);
    if (!document.body.dataset.bracketMotion) { document.body.dataset.bracketMotion = '1'; TAG.setupMotion(); }
    if (!boardObserver) { boardObserver = new ResizeObserver(drawConnectors); const board = document.getElementById('bracket-board'); if (board) boardObserver.observe(board); }
  };

  const init = async () => {
    const state = await TAG.load();
    const eventSelect = document.getElementById('bracket-event-select');
    eventSelect.addEventListener('change', () => { selectedEventId = eventSelect.value; selectedMatchId = ''; render(TAG.state); });
    render(state);
    TAG.subscribe(render);
  };

  addEventListener('DOMContentLoaded', () => init().catch((error) => { console.error(error); document.getElementById('bracket-board').innerHTML = '<div class="bracket-empty">Bracket data could not be loaded. Refresh the arena and try again.</div>'; }));
})();
