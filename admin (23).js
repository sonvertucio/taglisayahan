(() => {
  'use strict';

  const LOCAL_CREDENTIAL_HASH = 'bab2f44d7224e7981ba4c0bd34cdf17dda7ac72a86f9c7fd512563b9e02caaa3';
  let currentEvent = null;
  let pendingResult = null;

  const digest = async (value) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map((byte) => byte.toString(16).padStart(2, '0')).join('');

  const signIn = async (username, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem(TAG.TOKEN_KEY, data.token);
        return { ok: true, mode: 'live' };
      }
      if (response.status !== 404) return { ok: false };
    } catch { /* static fallback */ }
    if (await digest(`${username}:${password}`) === LOCAL_CREDENTIAL_HASH) {
      sessionStorage.setItem(TAG.TOKEN_KEY, 'local-demo-session');
      return { ok: true, mode: 'device' };
    }
    return { ok: false };
  };

  const smallLeaderboard = (state) => TAG.ranked(state.families).map((family, index) => `<div class="leader-row" style="--family:${family.color}"><div class="rank-mark">${TAG.medal(index + 1)}</div><div class="family-cell"><img src="${TAG.logo(family)}" alt=""><div><strong>${TAG.escapeHTML(family.name)}</strong><small>${family.wins} wins • ${family.momentum}% momentum</small></div></div><div class="category-mini"><i style="width:${family.momentum}%;--family:${family.color}"></i></div><div class="points-cell">${TAG.formatPoints(family.points)}<small class="muted"> pts</small></div><div class="movement ${family.streak < 3 ? 'hold' : ''}">${family.streak >= 3 ? `↗ ${family.streak}` : '—'}</div></div>`).join('');

  const renderDashboard = (state) => {
    const list = TAG.ranked(state.families);
    const total = state.families.reduce((sum, family) => sum + family.points, 0);
    const metrics = [
      ['Current Leader', list[0].name, `${TAG.formatPoints(list[0].points)} points`],
      ['Verified Results', state.results.length, 'Recorded event outcomes'],
      ['Total Points', TAG.formatPoints(total), 'Across the championship'],
      ['Lead Margin', TAG.formatPoints(list[0].points - list[1].points), `${list[1].name} in second`]
    ];
    document.getElementById('admin-metrics').innerHTML = metrics.map(([label, value, caption]) => `<div class="metric-card"><small>${label}</small><strong>${TAG.escapeHTML(value)}</strong><span>${TAG.escapeHTML(caption)}</span></div>`).join('');
    document.getElementById('admin-leaderboard').innerHTML = smallLeaderboard(state);
    document.getElementById('admin-activity').innerHTML = state.announcements.slice(0, 5).map((item) => `<div class="insight"><small>${item.type} • ${TAG.timeAgo(item.createdAt)}</small><strong>${TAG.escapeHTML(item.title)}</strong><p>${TAG.escapeHTML(item.body)}</p></div>`).join('');
    document.getElementById('announcement-list').innerHTML = state.announcements.slice(0, 6).map((item) => `<div class="insight"><small>${item.type} • ${TAG.timeAgo(item.createdAt)}</small><strong>${TAG.escapeHTML(item.title)}</strong><p>${TAG.escapeHTML(item.body)}</p></div>`).join('');
  };

  const renderSettings = (state) => {
    const date = new Date(state.meta.countdownTarget);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('countdown-target').value = local;
    document.getElementById('event-status').value = state.meta.status;
  };

  const setSyncStatus = (mode, message) => {
    const element = document.getElementById('sync-status');
    element.innerHTML = `<i style="background:${mode === 'live' ? 'var(--success)' : 'var(--gold-400)'}"></i><span>${message || (mode === 'live' ? 'Live synchronized' : 'Device mode')}</span>`;
  };

  const updateWorkflow = () => {
    const categoryId = document.getElementById('result-category').value;
    const eventId = document.getElementById('result-event').value;
    const selections = [...document.querySelectorAll('[data-placement]')].map((select) => select.value);
    const complete = currentEvent && selections.length === 5 && selections.every(Boolean) && new Set(selections).size === selections.length;
    document.querySelectorAll('.workflow-step').forEach((step) => {
      const number = Number(step.dataset.step);
      step.classList.toggle('active', number === 1 || (number === 2 && categoryId) || (number === 3 && eventId) || (number === 4 && complete));
    });
    document.getElementById('review-result').disabled = !complete;
    if (!currentEvent) return;
    document.getElementById('score-preview').innerHTML = currentEvent.placements.map((points, index) => {
      const family = TAG.family(selections[index]);
      return `<div class="preview-item">${family ? `<img src="${TAG.logo(family)}" alt=""><span>${TAG.escapeHTML(family.name)}</span>` : `<span>${['Champion','1st Runner Up','2nd Runner Up','3rd Runner Up','4th Runner Up'][index]}</span>`}<b>+${TAG.formatPoints(points)}</b></div>`;
    }).join('');
    const exists = TAG.state.results.some((result) => result.eventId === currentEvent.id);
    document.getElementById('result-note').textContent = exists ? 'A result already exists for this event. Submitting will safely replace its prior points and announcement.' : 'All placement values come from the official TAGLISAYAHAN 2026 guidelines.';
  };

  const loadEvent = (eventId) => {
    currentEvent = TAG.event(eventId);
    const placementGrid = document.getElementById('placement-grid');
    const bonusList = document.getElementById('bonus-list');
    if (!currentEvent) {
      placementGrid.innerHTML = ''; bonusList.innerHTML = ''; updateWorkflow(); return;
    }
    const labels = ['Champion', '1st Runner Up', '2nd Runner Up', '3rd Runner Up', '4th Runner Up'];
    placementGrid.innerHTML = currentEvent.placements.map((points, index) => `<div class="placement-row"><label for="placement-${index}">${labels[index]}</label><select id="placement-${index}" data-placement="${index}" required>${TAG.familyOptions()}</select><span class="placement-points">+${TAG.formatPoints(points)}</span></div>`).join('');
    bonusList.innerHTML = (currentEvent.bonuses || []).map((bonus, index) => `<div class="bonus-row"><div class="form-field"><label>${TAG.escapeHTML(bonus.name)} recipient (optional)</label><select data-bonus-family="${index}">${TAG.familyOptions()}</select></div><div class="form-field"><label>Official bonus</label><input value="${TAG.formatPoints(bonus.points)} points" readonly></div><input type="hidden" data-bonus-name="${index}" value="${TAG.escapeHTML(bonus.name)}"><input type="hidden" data-bonus-points="${index}" value="${bonus.points}"></div>`).join('');
    document.querySelectorAll('[data-placement], [data-bonus-family]').forEach((select) => select.addEventListener('change', updateWorkflow));
    updateWorkflow();
  };

  const setupResultForm = () => {
    const categorySelect = document.getElementById('result-category');
    const eventSelect = document.getElementById('result-event');
    categorySelect.innerHTML += TAG.events.categories.map((category) => `<option value="${category.id}">${category.name}</option>`).join('');
    categorySelect.addEventListener('change', () => {
      const category = TAG.category(categorySelect.value);
      eventSelect.innerHTML = `<option value="">Select an event</option>${(category?.events || []).map((event) => `<option value="${event.id}">${TAG.escapeHTML(event.name)}</option>`).join('')}`;
      eventSelect.disabled = !category;
      loadEvent(''); updateWorkflow();
    });
    eventSelect.addEventListener('change', () => loadEvent(eventSelect.value));
    document.getElementById('result-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const placements = [...document.querySelectorAll('[data-placement]')].map((select) => select.value);
      if (new Set(placements).size !== placements.length) { TAG.notify('Each family can occupy only one placement.', 'danger'); return; }
      const bonuses = [...document.querySelectorAll('[data-bonus-family]')].map((select, index) => ({ familyId: select.value, name: document.querySelector(`[data-bonus-name="${index}"]`).value, points: Number(document.querySelector(`[data-bonus-points="${index}"]`).value) })).filter((bonus) => bonus.familyId);
      pendingResult = { categoryId: categorySelect.value, eventId: eventSelect.value, placements, bonuses };
      document.getElementById('confirm-summary').innerHTML = `<p>Verify the official result for <strong>${TAG.escapeHTML(currentEvent.name)}</strong>.</p><div class="preview-list">${placements.map((id, index) => { const family = TAG.family(id); return `<div class="preview-item"><img src="${TAG.logo(family)}" alt=""><span>${TAG.escapeHTML(family.name)}</span><b>+${TAG.formatPoints(currentEvent.placements[index])}</b></div>`; }).join('')}</div>`;
      document.getElementById('confirm-modal').classList.add('open');
    });
    document.getElementById('cancel-result').addEventListener('click', () => document.getElementById('confirm-modal').classList.remove('open'));
    document.getElementById('confirm-result').addEventListener('click', async () => {
      if (!pendingResult) return;
      const button = document.getElementById('confirm-result'); button.disabled = true; button.textContent = 'Publishing…';
      try {
        const { sync } = await TAG.recordResult(pendingResult);
        setSyncStatus(sync.mode, sync.mode === 'live' ? 'Result synchronized live' : 'Saved on this device');
        TAG.notify(`${currentEvent.name} result published`, 'success');
        document.getElementById('result-form').reset();
        document.getElementById('result-event').disabled = true;
        loadEvent('');
        document.getElementById('confirm-modal').classList.remove('open');
      } catch (error) { TAG.notify(error.message || 'Result could not be saved.', 'danger'); }
      finally { pendingResult = null; button.disabled = false; button.textContent = 'Confirm & publish'; }
    });
  };

  const importAreas = ['results', 'brackets', 'families', 'announcements', 'schedule', 'settings', 'full'];
  const numberOr = (value, fallback = 0) => {
    const number = Number(String(value ?? '').replace(/,/g, '').trim());
    return Number.isFinite(number) ? number : fallback;
  };
  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const cells = (line) => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((item) => item.trim().replace(/^\"|\"$/g, '').replace(/\"\"/g, '\"'));
    const headers = cells(lines[0]).map((header) => header.toLowerCase().replace(/\s+/g, ''));
    return lines.slice(1).map((line) => Object.fromEntries(cells(line).map((value, index) => [headers[index] || `column${index + 1}`, value])));
  };
  const readImportFile = async (file) => {
    const text = await file.text();
    if (/\.csv$/i.test(file.name) || file.type === 'text/csv') return parseCSV(text);
    try { return JSON.parse(text); } catch { throw new Error('This file is not valid JSON.'); }
  };
  const allEvents = () => TAG.events.categories.flatMap((group) => group.events.map((item) => ({ ...item, categoryId: group.id })));
  const findImportedEvent = (value) => {
    const query = String(value || '').trim().toLowerCase();
    return allEvents().find((item) => item.id.toLowerCase() === query || item.name.toLowerCase() === query || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === query);
  };
  const findImportedFamily = (value, state) => {
    const query = String(value || '').trim().toLowerCase();
    return state.families.find((item) => item.id.toLowerCase() === query || item.name.toLowerCase() === query);
  };
  const splitList = (value) => Array.isArray(value) ? value : String(value || '').split(/[|;>]+/).map((item) => item.trim()).filter(Boolean);
  const parsePlacements = (row, state) => {
    let values = row.placements;
    if (typeof values === 'string' && values.trim().startsWith('[')) {
      try { values = JSON.parse(values); } catch { /* use delimited fallback */ }
    }
    if (!Array.isArray(values)) values = values ? splitList(values) : [row.family1, row.family2, row.family3, row.family4, row.family5];
    return values.filter(Boolean).map((value) => findImportedFamily(value, state)?.id || value);
  };
  const normalizeResultRows = (payload, state) => {
    const rows = Array.isArray(payload) ? payload : payload.results || payload.data || [];
    if (!Array.isArray(rows) || !rows.length) throw new Error('Results import needs at least one row.');
    return rows.map((row) => {
      const importedEvent = findImportedEvent(row.eventId || row.event);
      if (!importedEvent) throw new Error(`Unknown event: ${row.eventId || row.event || 'missing event'}`);
      const placements = parsePlacements(row, state);
      if (placements.length !== 5 || placements.some((id) => !findImportedFamily(id, state))) throw new Error(`Result for ${importedEvent.name} must contain five valid family placements.`);
      const categoryQuery = String(row.categoryId || row.category || importedEvent.categoryId).toLowerCase();
      const categoryId = TAG.events.categories.find((group) => group.id.toLowerCase() === categoryQuery || group.name.toLowerCase() === categoryQuery)?.id || importedEvent.categoryId;
      const bonusRecipient = row.bonusFamily || row.bonusRecipient || '';
      const bonusPoints = numberOr(row.bonusPoints, 0);
      const rawBonuses = Array.isArray(row.bonuses) ? row.bonuses : splitList(row.bonuses).map((name) => ({ name }));
      const bonuses = rawBonuses.map((bonus) => ({ name: typeof bonus === 'string' ? bonus : bonus.name, familyId: findImportedFamily(typeof bonus === 'string' ? bonusRecipient : (bonus.familyId || bonus.recipient || bonusRecipient), state)?.id || '', points: numberOr(typeof bonus === 'string' ? bonusPoints : (bonus.points || bonusPoints), 0) })).filter((bonus) => bonus.familyId && bonus.points);
      return { categoryId, eventId: importedEvent.id, placements, bonuses, recordedAt: row.recordedAt || undefined };
    });
  };
  const validateBracket = (eventId, bracket, state) => {
    if (!findImportedEvent(eventId)) throw new Error(`Unknown bracket event: ${eventId}`);
    if (!bracket || !Array.isArray(bracket.matches)) throw new Error(`Bracket ${eventId} needs a matches array.`);
    const allowed = new Set(['TBD', 'BYE', '']);
    const matchIds = new Set();
    bracket.matches.forEach((match) => {
      if (!match.id || !match.bracket) throw new Error('Every bracket match needs id and bracket.');
      if (matchIds.has(match.id)) throw new Error(`Duplicate bracket match ID: ${match.id}`);
      matchIds.add(match.id);
      if (!['winners', 'losers', 'grand'].includes(match.bracket)) throw new Error(`Unknown bracket lane in ${match.id}.`);
      [match.teamA, match.teamB, match.winner, match.loser].filter(Boolean).forEach((id) => { if (!allowed.has(id) && !findImportedFamily(id, state)) throw new Error(`Unknown family in bracket ${match.id}: ${id}`); });
    });
    return bracket;
  };
  const normalizeBrackets = (payload, state) => {
    const source = payload.brackets || payload;
    const next = {};
    const normalizeMatch = (row, index) => ({ ...row, id: row.id || `M${index + 1}`, bracket: row.bracket || 'winners', round: row.round || 'Winner R1', status: row.status || 'Upcoming', teamA: findImportedFamily(row.teamA, state)?.id || row.teamA || 'TBD', teamB: findImportedFamily(row.teamB, state)?.id || row.teamB || 'TBD', winner: findImportedFamily(row.winner, state)?.id || row.winner || null, loser: findImportedFamily(row.loser, state)?.id || row.loser || null, scoreA: row.scoreA === undefined || row.scoreA === '' ? null : numberOr(row.scoreA, null), scoreB: row.scoreB === undefined || row.scoreB === '' ? null : numberOr(row.scoreB, null) });
    if (Array.isArray(source)) {
      source.forEach((row) => {
        const eventId = findImportedEvent(row.eventId || row.event)?.id;
        if (!eventId) throw new Error(`Unknown bracket event: ${row.eventId || row.event || 'missing event'}`);
        next[eventId] ||= { format: 'Double Elimination', updatedAt: new Date().toISOString(), matches: [] };
        next[eventId].matches.push(normalizeMatch(row, next[eventId].matches.length));
      });
    } else if (source && typeof source === 'object' && source.eventId && source.matches) {
      const eventId = findImportedEvent(source.eventId)?.id || source.eventId;
      next[eventId] = { ...TAG.clone(source), matches: source.matches.map(normalizeMatch) };
      delete next[eventId].eventId;
    } else if (source && typeof source === 'object') Object.entries(source).forEach(([eventId, bracket]) => { const normalizedEventId = findImportedEvent(eventId)?.id || eventId; next[normalizedEventId] = { ...TAG.clone(bracket), matches: (bracket.matches || []).map(normalizeMatch) }; });
    else throw new Error('Bracket import needs an object keyed by event ID or rows with eventId.');
    Object.entries(next).forEach(([eventId, bracket]) => validateBracket(eventId, bracket, state));
    return next;
  };
  const normalizeFamilies = (payload, state) => {
    const rows = Array.isArray(payload) ? payload : payload.families || payload.data || [];
    if (!Array.isArray(rows) || !rows.length) throw new Error('Families import needs at least one row.');
    const next = TAG.clone(state);
    rows.forEach((row) => {
      const current = findImportedFamily(row.id || row.family || row.name, next);
      if (!current) throw new Error(`Unknown family: ${row.id || row.name || 'missing family'}`);
      ['points', 'wins', 'losses', 'championships', 'streak', 'momentum'].forEach((key) => { if (row[key] !== undefined && row[key] !== '') current[key] = numberOr(row[key], current[key]); });
      current.categories = current.categories || {};
      ['sports', 'academic', 'cultural'].forEach((key) => { if (row[key] !== undefined && row[key] !== '') current.categories[key] = numberOr(row[key], current.categories[key] || 0); });
      ['motto', 'color'].forEach((key) => { if (row[key]) current[key] = String(row[key]).trim(); });
      // Logo paths are intentionally not imported: official family artwork is protected.
    });
    return next;
  };
  const normalizeAnnouncements = (payload, state) => {
    const rows = Array.isArray(payload) ? payload : payload.announcements || payload.data || [];
    if (!Array.isArray(rows) || !rows.length) throw new Error('Announcements import needs at least one row.');
    const next = TAG.clone(state); const now = new Date().toISOString();
    next.announcements = rows.map((row, index) => ({ id: row.id || `import-a-${Date.now()}-${index}`, type: row.type || 'update', title: String(row.title || row.headline || '').trim(), body: String(row.body || row.message || '').trim(), createdAt: row.createdAt || now })).filter((row) => row.title && row.body).slice(0, 12);
    if (!next.announcements.length) throw new Error('Announcements need a title and body.');
    return next;
  };
  const normalizeSchedule = (payload, state) => {
    const rows = Array.isArray(payload) ? payload : payload.schedule || payload.data || [];
    if (!Array.isArray(rows) || !rows.length) throw new Error('Schedule import needs at least one row.');
    const next = TAG.clone(state);
    next.schedule = rows.map((row) => ({ time: String(row.time || '').trim(), event: String(row.event || row.eventName || '').trim(), venue: String(row.venue || '').trim(), status: String(row.status || 'Upcoming').trim() })).filter((row) => row.time && row.event);
    if (!next.schedule.length) throw new Error('Schedule rows need time and event.');
    return next;
  };
  const normalizeSettings = (payload, state) => {
    const source = payload.meta || payload.settings || payload;
    const next = TAG.clone(state);
    if (source.countdownTarget) {
      const date = new Date(source.countdownTarget);
      if (Number.isNaN(date.getTime())) throw new Error('Invalid countdownTarget date.');
      next.meta.countdownTarget = date.toISOString();
    }
    if (source.status) next.meta.status = String(source.status);
    if (!source.countdownTarget && !source.status) throw new Error('Settings import needs countdownTarget or status.');
    return next;
  };
  const normalizeFullState = (payload, state) => {
    const source = payload.state || payload;
    if (!Array.isArray(source.families) || !Array.isArray(source.results)) throw new Error('Full state import needs families and results arrays.');
    const next = TAG.clone(source);
    next.meta = { ...state.meta, ...(source.meta || {}) }; next.schedule = source.schedule || state.schedule || []; next.announcements = source.announcements || state.announcements || []; next.brackets = source.brackets || state.brackets || {};
    const ids = new Set(state.families.map((item) => item.id));
    if (next.families.length !== ids.size || next.families.some((item) => !ids.has(item.id))) throw new Error('Full state must contain the five official family IDs.');
    next.families = next.families.map((item) => ({ ...item, logo: state.families.find((family) => family.id === item.id).logo, categories: item.categories || {} }));
    next.results.forEach((result) => { const importedEvent = findImportedEvent(result.eventId); if (!importedEvent || !Array.isArray(result.placements) || result.placements.length !== 5 || result.placements.some((id) => !ids.has(id))) throw new Error(`Invalid result in full state: ${result.eventId || 'missing event'}`); });
    Object.entries(next.brackets).forEach(([eventId, bracket]) => validateBracket(eventId, bracket, next));
    return next;
  };
  const buildImportedState = (area, payload, state) => {
    if (!importAreas.includes(area)) throw new Error('Unknown import area.');
    if (area === 'results') {
      const next = TAG.clone(state);
      normalizeResultRows(payload, next).forEach((result) => TAG.applyResultToState(next, result));
      return next;
    }
    if (area === 'brackets') return { ...TAG.clone(state), brackets: { ...TAG.clone(state).brackets, ...normalizeBrackets(payload, state) } };
    if (area === 'families') return normalizeFamilies(payload, state);
    if (area === 'announcements') return normalizeAnnouncements(payload, state);
    if (area === 'schedule') return normalizeSchedule(payload, state);
    if (area === 'settings') return normalizeSettings(payload, state);
    return normalizeFullState(payload, state);
  };
  const applyImportedPayload = async (area, payload, statusElement) => {
    const next = buildImportedState(area, payload, TAG.state);
    const sync = await TAG.persist(next);
    if (statusElement) statusElement.textContent = `Applied ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${sync.mode === 'live' ? 'live sync' : 'device save'}`;
    setSyncStatus(sync.mode); TAG.notify(`${area === 'full' ? 'Full state' : area[0].toUpperCase() + area.slice(1)} imported successfully`, 'success');
  };
  const setupImports = () => {
    const select = document.getElementById('manual-data-area');
    const openArea = (area) => {
      document.querySelectorAll('[data-view]').forEach((item) => item.classList.toggle('active', item.dataset.view === 'data'));
      document.querySelectorAll('.admin-view').forEach((view) => view.classList.toggle('active', view.id === 'view-data'));
      document.getElementById('admin-view-title').textContent = 'Data Import & Export';
      if (select) select.value = area;
      document.getElementById('view-data')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    document.querySelectorAll('[data-import-open]').forEach((button) => button.addEventListener('click', () => openArea(button.dataset.importOpen)));
    document.querySelectorAll('[data-import-action]').forEach((button) => button.addEventListener('click', async () => {
      const card = button.closest('[data-import-area]'); const fileInput = card?.querySelector('[data-import-file]'); const status = card?.querySelector('[data-import-status]');
      if (!fileInput?.files?.[0]) { openArea(card?.dataset.importArea || 'results'); TAG.notify('Choose a JSON or CSV file first.', 'danger'); return; }
      button.disabled = true; button.textContent = 'Validating…';
      try { await applyImportedPayload(card.dataset.importArea, await readImportFile(fileInput.files[0]), status); fileInput.value = ''; }
      catch (error) { if (status) status.textContent = error.message; TAG.notify(error.message || 'Import rejected.', 'danger'); }
      finally { button.disabled = false; button.textContent = `Import ${card.dataset.importArea === 'announcements' ? 'dispatches' : card.dataset.importArea}`; }
    }));
    document.getElementById('apply-manual-data').addEventListener('click', async () => {
      const area = select.value; const note = document.getElementById('manual-data-note'); const text = document.getElementById('manual-json').value.trim();
      if (!text) { TAG.notify('Paste a JSON payload first.', 'danger'); return; }
      try { await applyImportedPayload(area, JSON.parse(text), note); }
      catch (error) { note.textContent = error.message; TAG.notify(error.message || 'JSON rejected.', 'danger'); }
    });
    document.getElementById('export-data').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(TAG.state, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `taglisayahan-2026-state-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); TAG.notify('Current state exported as JSON', 'success');
    });
  };

  const setupViews = () => document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll('.admin-view').forEach((view) => view.classList.toggle('active', view.id === `view-${button.dataset.view}`));
    const titles = { dashboard: 'Championship Overview', results: 'Record Official Result', data: 'Data Import & Export', announcements: 'Arena Announcements', settings: 'Arena Settings' };
    document.getElementById('admin-view-title').textContent = titles[button.dataset.view];
  }));

  const setupForms = () => {
    document.getElementById('announcement-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const state = TAG.clone(TAG.state);
      state.announcements.unshift({ id: `a-${Date.now()}`, type: document.getElementById('announcement-type').value, title: document.getElementById('announcement-title').value.trim(), body: document.getElementById('announcement-body').value.trim(), createdAt: new Date().toISOString() });
      state.announcements = state.announcements.slice(0, 12);
      const sync = await TAG.persist(state);
      setSyncStatus(sync.mode); event.target.reset(); TAG.notify('Announcement published', 'success');
    });
    document.getElementById('settings-form').addEventListener('submit', async (event) => {
      event.preventDefault(); const state = TAG.clone(TAG.state);
      state.meta.countdownTarget = new Date(document.getElementById('countdown-target').value).toISOString();
      state.meta.status = document.getElementById('event-status').value;
      const sync = await TAG.persist(state); setSyncStatus(sync.mode); TAG.notify('Arena settings saved', 'success');
    });
    document.getElementById('reset-data').addEventListener('click', async () => {
      if (!confirm('Restore the packaged sample dataset? Current standings on this device will be replaced.')) return;
      const response = await fetch('../data/sample-data.json', { cache: 'no-store' });
      const sample = await response.json(); const sync = await TAG.persist(sample); setSyncStatus(sync.mode); renderSettings(sample); TAG.notify('Sample dataset restored', 'success');
    });
  };

  const openAdmin = (mode) => {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-shell').hidden = false;
    setSyncStatus(mode || (sessionStorage.getItem(TAG.TOKEN_KEY) === 'local-demo-session' ? 'device' : 'live'));
  };

  const init = async () => {
    const state = await TAG.load();
    renderDashboard(state); renderSettings(state); setupViews(); setupResultForm(); setupForms(); setupImports();
    TAG.subscribe((newState) => { renderDashboard(newState); renderSettings(newState); updateWorkflow(); });
    if (sessionStorage.getItem(TAG.TOKEN_KEY)) openAdmin();
    document.getElementById('login-form').addEventListener('submit', async (event) => {
      event.preventDefault(); const button = document.getElementById('login-button'); button.disabled = true; button.textContent = 'Verifying…';
      const result = await signIn(document.getElementById('username').value.trim(), document.getElementById('password').value);
      if (result.ok) { openAdmin(result.mode); TAG.notify('Welcome to the command center', 'success'); }
      else TAG.notify('Incorrect username or password.', 'danger');
      button.disabled = false; button.textContent = 'Enter command center';
    });
    document.getElementById('logout-button').addEventListener('click', () => { sessionStorage.removeItem(TAG.TOKEN_KEY); location.reload(); });
  };

  addEventListener('DOMContentLoaded', () => init().catch((error) => { console.error(error); TAG.notify('Command center could not load.', 'danger'); }));
})();
