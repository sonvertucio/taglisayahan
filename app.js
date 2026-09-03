
const STORAGE_KEY = 'taglisayahan_2026_state_v4';
const ADMIN_KEY = 'tag_admin_session_v4';
const DEFAULT_DEPLOY_URL = location.origin && location.origin.startsWith('http') ? location.origin : 'https://your-netlify-site.netlify.app';

const seedState = {
  meta: {
    title: 'TAGLISAYAHAN 2026',
    school: 'St. Anthony College Calapan City, Inc. • Bayanan I Campus',
    tagline: 'IN SACCI, WE TRANSFORM!',
    deployUrl: DEFAULT_DEPLOY_URL,
    adminPassword: 'SACCI2026',
    version: 'V4 Final Production'
  },
  pointsMatrix: {
    Champion: 10,
    'Runner Up': 7,
    'Third Place': 5,
    'Fourth Place': 3,
    Participation: 1
  },
  families: [
    { id:'phoenix', name:'Golden Phoenix', code:'GP', icon:'🪽', motto:'Rise. Lead. Conquer.', sports:38, academic:34, cultural:27, wins:7, losses:3, momentum:88, achievements:['Opening Day Dominator','Triple Crown Threat'], points:0 },
    { id:'titans', name:'Royal Titans', code:'RT', icon:'🛡️', motto:'Power with pride.', sports:32, academic:39, cultural:24, wins:6, losses:4, momentum:79, achievements:['Quiz Masters','Wall of Defense'], points:0 },
    { id:'dragons', name:'Crimson Dragons', code:'CD', icon:'🐉', motto:'Burn the gap.', sports:29, academic:26, cultural:37, wins:5, losses:5, momentum:72, achievements:['Stage Kings'], points:0 },
    { id:'lions', name:'Maroon Lions', code:'ML', icon:'🦁', motto:'Heart of champions.', sports:35, academic:28, cultural:30, wins:6, losses:4, momentum:76, achievements:['Fast Break Fury'], points:0 }
  ],
  events: [
    { id:'ev1', name:'Basketball Finals', category:'Sports', date:'2026-10-12', time:'09:00', venue:'SACCI Gymnasium', status:'Upcoming', weight:1.5, participants:['Golden Phoenix','Royal Titans','Crimson Dragons','Maroon Lions'] },
    { id:'ev2', name:'Mobile Legends Tournament', category:'Esports', date:'2026-10-13', time:'13:00', venue:'Esports Arena', status:'Live', weight:1.7, participants:['Golden Phoenix','Royal Titans','Crimson Dragons','Maroon Lions'] },
    { id:'ev3', name:'Quiz Bee', category:'Academic', date:'2026-10-14', time:'10:30', venue:'Audio Visual Room', status:'Upcoming', weight:1.2, participants:['Golden Phoenix','Royal Titans','Crimson Dragons','Maroon Lions'] },
    { id:'ev4', name:'Cheerdance', category:'Cultural', date:'2026-10-15', time:'15:00', venue:'Main Court', status:'Upcoming', weight:1.4, participants:['Golden Phoenix','Royal Titans','Crimson Dragons','Maroon Lions'] },
    { id:'ev5', name:'Badminton Doubles', category:'Sports', date:'2026-10-16', time:'08:00', venue:'Badminton Hall', status:'Upcoming', weight:1.0, participants:['Golden Phoenix','Royal Titans','Crimson Dragons','Maroon Lions'] },
    { id:'ev6', name:'Poster Making', category:'Academic', date:'2026-10-16', time:'11:00', venue:'Art Room', status:'Upcoming', weight:1.0, participants:['Golden Phoenix','Royal Titans','Crimson Dragons','Maroon Lions'] }
  ],
  results: [
    { id:'rs1', eventId:'ev0', eventName:'Opening Parade', category:'Cultural', date:'2026-10-11', placements:{'Champion':'Crimson Dragons','Runner Up':'Maroon Lions','Third Place':'Golden Phoenix','Fourth Place':'Royal Titans'}, notes:'Opening ceremony crowd favorite.' },
    { id:'rs2', eventId:'ev00', eventName:'Chess', category:'Academic', date:'2026-10-11', placements:{'Champion':'Royal Titans','Runner Up':'Golden Phoenix','Third Place':'Maroon Lions','Fourth Place':'Crimson Dragons'}, notes:'Strategic comeback by Titans.' }
  ],
  announcements: [
    { id:'an1', title:'Welcome to TAGLISAYAHAN 2026', body:'The public portal is now live for students, families, teachers, and spectators.', date:'2026-10-10 08:00' },
    { id:'an2', title:'LED Mode Activated', body:'The gymnasium big-screen mode is ready for live rankings, next event, and champion reveals.', date:'2026-10-10 09:00' }
  ],
  liveMatch: {
    title:'Mobile Legends Tournament',
    familyA:'Golden Phoenix',
    familyB:'Royal Titans',
    scoreA:2,
    scoreB:1,
    bestOf:'BO5',
    endTime:'2026-10-13T14:30:00'
  },
  bracket: {
    semifinals:[
      { teamA:'Golden Phoenix', scoreA:2, teamB:'Crimson Dragons', scoreB:0, winner:'Golden Phoenix' },
      { teamA:'Royal Titans', scoreA:2, teamB:'Maroon Lions', scoreB:1, winner:'Royal Titans' }
    ],
    finals:[
      { teamA:'Golden Phoenix', scoreA:0, teamB:'Royal Titans', scoreB:0, winner:'' }
    ],
    thirdPlace:[
      { teamA:'Crimson Dragons', scoreA:0, teamB:'Maroon Lions', scoreB:0, winner:'' }
    ]
  }
};

function clone(v){ return JSON.parse(JSON.stringify(v)); }
function money(n){ return Number(n||0).toLocaleString(); }
function uid(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }
function nowStamp(){
  const d = new Date();
  return d.toLocaleDateString([], {year:'numeric', month:'short', day:'numeric'}) + ' ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}
function getState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){
    const seeded = clone(seedState);
    recalculateState(seeded);
    saveState(seeded);
    return seeded;
  }
  const parsed = JSON.parse(raw);
  recalculateState(parsed);
  return parsed;
}
function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('tag-state-changed'));
}
function resetState(){
  localStorage.removeItem(STORAGE_KEY);
  const state = getState();
  saveState(state);
  return state;
}
function isAdmin(){ return localStorage.getItem(ADMIN_KEY) === 'true'; }
function loginAdmin(password){
  const state = getState();
  if(password === state.meta.adminPassword){
    localStorage.setItem(ADMIN_KEY, 'true');
    return true;
  }
  return false;
}
function logoutAdmin(){ localStorage.removeItem(ADMIN_KEY); }

function recalculateState(state){
  state.families.forEach(f => {
    f.points = 0;
    f.categoryPoints = { Sports:0, Academic:0, Cultural:0, Esports:0 };
    f.resultHistory = [];
  });
  const familyMap = Object.fromEntries(state.families.map(f => [f.name, f]));
  (state.results || []).forEach(result => {
    const ev = (state.events || []).find(e => e.id === result.eventId);
    const category = result.category || ev?.category || 'General';
    const weight = Number(result.weight || ev?.weight || 1);
    Object.entries(result.placements || {}).forEach(([placement, familyName]) => {
      const fam = familyMap[familyName];
      if(!fam) return;
      const base = Number(state.pointsMatrix[placement] || 0);
      const pts = Math.round(base * weight);
      fam.points += pts;
      if(!fam.categoryPoints[category]) fam.categoryPoints[category] = 0;
      fam.categoryPoints[category] += pts;
      fam.resultHistory.push({ eventName: result.eventName, placement, points: pts, category, date: result.date || '' });
    });
  });
  state.families.sort((a,b)=> b.points - a.points || b.momentum - a.momentum);
  state.families.forEach((f, idx) => { f.rank = idx + 1; });
  const leaderPts = state.families[0]?.points || 0;
  state.families.forEach(f => {
    f.gapToLeader = Math.max(0, leaderPts - f.points);
    f.winRate = Math.round((f.wins / Math.max(1, f.wins + f.losses)) * 100);
    if(f.points >= 28 && !f.achievements.includes('Point Surge')) f.achievements.push('Point Surge');
    if(f.categoryPoints.Esports >= 14 && !f.achievements.includes('Esports Elite')) f.achievements.push('Esports Elite');
  });
}

function addAnnouncement(title, body){
  const state = getState();
  state.announcements.unshift({ id: uid('an'), title, body, date: nowStamp() });
  saveState(state);
}

function submitResult(payload){
  const state = getState();
  const event = state.events.find(e => e.id === payload.eventId);
  const result = {
    id: uid('rs'),
    eventId: payload.eventId,
    eventName: event?.name || payload.eventName,
    category: event?.category || payload.category,
    date: payload.date || new Date().toISOString().slice(0,10),
    weight: Number(event?.weight || 1),
    placements: {
      'Champion': payload.champion,
      'Runner Up': payload.runnerUp,
      'Third Place': payload.thirdPlace,
      'Fourth Place': payload.fourthPlace
    },
    notes: payload.notes || ''
  };
  state.results.unshift(result);
  if(event){ event.status = 'Completed'; }
  recalculateState(state);
  const leader = state.families[0];
  state.announcements.unshift({
    id: uid('an'),
    title: `${result.eventName} completed`,
    body: `${payload.champion} won the ${result.eventName}. ${leader.name} is now ranked #1 with ${leader.points} points.`,
    date: nowStamp()
  });
  saveState(state);
  return state;
}

function updateLiveMatch(payload){
  const state = getState();
  state.liveMatch = { ...state.liveMatch, ...payload };
  saveState(state);
  return state;
}

function upsertEvent(payload){
  const state = getState();
  if(payload.id){
    const idx = state.events.findIndex(e => e.id === payload.id);
    if(idx >= 0) state.events[idx] = { ...state.events[idx], ...payload };
  } else {
    state.events.push({ ...payload, id: uid('ev') });
  }
  saveState(state);
  return state;
}

function getSummary(state){
  const completed = state.events.filter(e => e.status === 'Completed').length;
  const live = state.events.filter(e => e.status === 'Live').length;
  const upcoming = state.events.filter(e => e.status === 'Upcoming').length;
  const totalPoints = state.families.reduce((a,b)=>a+b.points,0);
  const champion = state.families[0] || null;
  const nextEvent = state.events.filter(e => e.status !== 'Completed').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0] || null;
  const remainingPossiblePoints = state.events.filter(e => e.status !== 'Completed').reduce((sum,e)=>sum + Math.round((state.pointsMatrix['Champion'] || 10) * Number(e.weight || 1)),0);
  return { completed, live, upcoming, totalPoints, champion, nextEvent, remainingPossiblePoints };
}

function projectionForFamilies(state){
  const remainingEvents = state.events.filter(e => e.status !== 'Completed');
  const totalWeight = remainingEvents.reduce((s,e)=>s + Number(e.weight || 1), 0);
  return state.families.map((f, index) => {
    const categoryStrength = (Number(f.sports||0) + Number(f.academic||0) + Number(f.cultural||0) + (f.categoryPoints.Esports||0)) / 4;
    const formBonus = (f.momentum || 0) / 100;
    const bestCase = f.points + Math.round(totalWeight * 10 * (0.65 + formBonus * 0.2));
    const avgCase = f.points + Math.round(totalWeight * 10 * (0.42 + formBonus * 0.15));
    const trendCase = f.points + Math.round(totalWeight * 10 * ((categoryStrength/100) * 0.52));
    const championProbability = Math.max(8, Math.min(85, Math.round((1/(index+1))*36 + formBonus*28 + (f.points/(state.families[0].points||1))*18 )));
    return { ...f, bestCase, avgCase, trendCase, championProbability };
  }).sort((a,b)=> b.avgCase - a.avgCase);
}

function eventImpactRows(state){
  return state.results.map(r => {
    const totals = Object.entries(r.placements || {}).map(([placement,fname]) => ({ placement, family: fname, points: Math.round((state.pointsMatrix[placement]||0) * Number(r.weight||1)) }));
    return {
      eventName:r.eventName,
      category:r.category,
      date:r.date,
      champion:r.placements?.Champion || '-',
      maxPoints: Math.round((state.pointsMatrix['Champion']||10) * Number(r.weight||1)),
      totals
    };
  });
}

function setActiveNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if(href === path) a.classList.add('active');
  });
}

function renderLayoutMeta(){
  const state = getState();
  document.querySelectorAll('[data-meta-title]').forEach(el => el.textContent = state.meta.title);
  document.querySelectorAll('[data-meta-tagline]').forEach(el => el.textContent = state.meta.tagline);
  document.querySelectorAll('[data-meta-school]').forEach(el => el.textContent = state.meta.school);
}

function renderHome(){
  const state = getState();
  const summary = getSummary(state);
  const projections = projectionForFamilies(state);
  const champion = summary.champion;
  const homeChamp = document.getElementById('homeChampion');
  if(homeChamp && champion){
    homeChamp.innerHTML = `
      <div class="hero-trophy trophy-reveal">
        <div class="trophy">🏆</div>
      </div>
      <div>
        <h4 style="margin:0 0 6px">Current Champion</h4>
        <div style="font-size:2rem;font-weight:900">${champion.name}</div>
        <div class="mini">${champion.points} pts • Momentum ${champion.momentum}% • Win rate ${champion.winRate}%</div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><span class="mini">Completed events</span><strong>${summary.completed}</strong></div>
        <div class="hero-stat"><span class="mini">Upcoming events</span><strong>${summary.upcoming}</strong></div>
        <div class="hero-stat"><span class="mini">Potential remaining champion points</span><strong>${summary.remainingPossiblePoints}</strong></div>
      </div>`;
  }
  const statWrap = document.getElementById('homeStats');
  if(statWrap){
    statWrap.innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Points Awarded</div><div class="stat-value">${summary.totalPoints}</div><div class="stat-sub">Across all recorded results</div></div>
      <div class="stat-card"><div class="stat-label">Live Events</div><div class="stat-value">${summary.live}</div><div class="stat-sub">Matches and contests in progress</div></div>
      <div class="stat-card"><div class="stat-label">Next Event</div><div class="stat-value" style="font-size:1.15rem">${summary.nextEvent ? summary.nextEvent.name : 'TBA'}</div><div class="stat-sub">${summary.nextEvent ? `${summary.nextEvent.date} • ${summary.nextEvent.time}` : 'Schedule to be updated'}</div></div>
      <div class="stat-card"><div class="stat-label">Projected Favorite</div><div class="stat-value" style="font-size:1.2rem">${projections[0]?.name || '-'}</div><div class="stat-sub">Championship probability ${projections[0]?.championProbability || 0}%</div></div>`;
  }
  renderLeaderboardList('homeLeaderboard', state.families);
  renderAnnouncements('homeAnnouncements', state.announcements.slice(0,5));
  renderUpcoming('homeUpcoming', state.events.filter(e => e.status !== 'Completed').slice(0,5));
  renderMarquee('homeMarquee', state);
  renderQRCode('qrTarget', state.meta.deployUrl);
  const quick = document.getElementById('quickLinks');
  if(quick){
    quick.innerHTML = `
      <a class="pill" href="pages/leaderboard.html">Leaderboard</a>
      <a class="pill" href="pages/families.html">Family War Room</a>
      <a class="pill" href="pages/analytics.html">Analytics</a>
      <a class="pill" href="pages/strategy.html">Strategy Portal</a>
      <a class="pill" href="pages/bracket.html">Brackets</a>
      <a class="pill" href="led-mode/index.html">LED Mode</a>`;
  }
}

function renderMarquee(targetId, state){
  const el = document.getElementById(targetId); if(!el) return;
  const next = getSummary(state).nextEvent;
  const leader = state.families[0];
  const message = `Now streaming: ${state.meta.title} • Current #1: ${leader?.name || '-'} with ${leader?.points || 0} points • Next event: ${next ? `${next.name} at ${next.time} in ${next.venue}` : 'Schedule update soon'} • ${state.meta.tagline}`;
  el.innerHTML = `<span>${message}</span>`;
}

function renderLeaderboardList(targetId, families){
  const el = document.getElementById(targetId); if(!el) return;
  const maxPoints = Math.max(...families.map(f=>f.points), 1);
  el.innerHTML = families.map(f => `
    <div class="rank-item">
      <div class="rank-number">#${f.rank}</div>
      <div class="rank-main">
        <strong>${f.icon} ${f.name}</strong>
        <small>${f.motto}</small>
        <div class="meter"><span style="width:${Math.round((f.points/maxPoints)*100)}%"></span></div>
      </div>
      <div class="rank-points">${f.points} pts<br><small class="mini">Momentum ${f.momentum}%</small></div>
    </div>`).join('');
}

function renderAnnouncements(targetId, items){
  const el = document.getElementById(targetId); if(!el) return;
  el.innerHTML = items.map(a => `<div class="announcement-item"><strong>${a.title}</strong><div>${a.body}</div><div class="mini" style="margin-top:6px">${a.date}</div></div>`).join('');
}

function renderUpcoming(targetId, items){
  const el = document.getElementById(targetId); if(!el) return;
  el.innerHTML = items.map(ev => `<div class="timeline-item"><strong>${ev.name}</strong><div>${ev.category} • ${ev.date} • ${ev.time}</div><div class="mini">${ev.venue} • status: ${ev.status}</div></div>`).join('');
}

function renderLeaderboardPage(){
  const state = getState();
  renderLeaderboardList('leaderboardMain', state.families);
  const table = document.getElementById('leaderboardTable');
  if(table){
    table.innerHTML = state.families.map(f => `
      <tr>
        <td>#${f.rank}</td>
        <td>${f.icon} ${f.name}</td>
        <td>${f.points}</td>
        <td>${f.categoryPoints.Sports || 0}</td>
        <td>${f.categoryPoints.Academic || 0}</td>
        <td>${f.categoryPoints.Cultural || 0}</td>
        <td>${f.categoryPoints.Esports || 0}</td>
        <td>${f.winRate}%</td>
        <td>${f.gapToLeader}</td>
      </tr>`).join('');
  }
}

function renderFamiliesPage(){
  const state = getState();
  const wrap = document.getElementById('familyCards'); if(!wrap) return;
  wrap.innerHTML = state.families.map(f => `
    <div class="family-card">
      <div class="family-head">
        <div class="flex">
          <div class="logo-chip">${f.icon}</div>
          <div><strong style="font-size:1.1rem">${f.name}</strong><div class="mini">${f.motto}</div></div>
        </div>
        <div class="pill">Rank #${f.rank}</div>
      </div>
      <div class="flex" style="justify-content:space-between"><span class="tag">${f.points} points</span><span class="tag">Wins ${f.wins}</span><span class="tag">Momentum ${f.momentum}%</span></div>
      <div class="power-grid">
        <div class="power-box"><strong>${f.categoryPoints.Sports || 0}</strong><span class="mini">Sports Power</span></div>
        <div class="power-box"><strong>${f.categoryPoints.Academic || 0}</strong><span class="mini">Academic Power</span></div>
        <div class="power-box"><strong>${f.categoryPoints.Cultural || 0}</strong><span class="mini">Cultural Power</span></div>
      </div>
      <div class="meter"><span style="width:${f.momentum}%"></span></div>
      <div class="mini" style="margin-top:10px">Achievements: ${(f.achievements || []).join(' • ') || 'None yet'}</div>
      <div style="margin-top:12px">
        <strong>Recent Results</strong>
        <ul class="list-clean" style="margin-top:8px">${(f.resultHistory || []).slice(0,4).map(r=>`<li class="mini">${r.eventName}: ${r.placement} (+${r.points})</li>`).join('') || '<li class="mini">No results yet</li>'}</ul>
      </div>
    </div>`).join('');
}

function renderEventsPage(){
  const state = getState();
  const table = document.getElementById('eventRows');
  if(table){
    table.innerHTML = state.events.map(ev => `
      <tr>
        <td>${ev.name}</td>
        <td>${ev.category}</td>
        <td>${ev.date}</td>
        <td>${ev.time}</td>
        <td>${ev.venue}</td>
        <td>${ev.status}</td>
        <td>${ev.weight}</td>
      </tr>`).join('');
  }
  renderAnnouncements('eventAnnouncements', state.announcements.slice(0,4));
}

function renderAnalyticsPage(){
  const state = getState();
  const projections = projectionForFamilies(state);
  const impact = eventImpactRows(state);
  const proj = document.getElementById('projectionRows');
  if(proj){
    proj.innerHTML = projections.map(f => `
      <tr>
        <td>${f.name}</td>
        <td>${f.points}</td>
        <td>${f.bestCase}</td>
        <td>${f.avgCase}</td>
        <td>${f.trendCase}</td>
        <td>${f.championProbability}%</td>
      </tr>`).join('');
  }
  const compare = document.getElementById('familyCompare');
  if(compare){
    compare.innerHTML = state.families.map(f => `
      <div class="family-card">
        <div class="family-head"><div class="flex"><div class="logo-chip">${f.icon}</div><div><strong>${f.name}</strong><div class="mini">Competitive advantage: ${topCategory(f)}</div></div></div><div class="pill">${f.winRate}% win rate</div></div>
        <div class="mini">Strengths: ${buildStrengths(f)}.</div>
        <div class="mini" style="margin-top:8px">Weaknesses: ${buildWeaknesses(f)}.</div>
        <div class="power-grid">
          <div class="power-box"><strong>${f.momentum}%</strong><span class="mini">Momentum</span></div>
          <div class="power-box"><strong>${f.gapToLeader}</strong><span class="mini">Gap to leader</span></div>
          <div class="power-box"><strong>${(f.achievements||[]).length}</strong><span class="mini">Achievements</span></div>
        </div>
      </div>`).join('');
  }
  const impactWrap = document.getElementById('eventImpactList');
  if(impactWrap){
    impactWrap.innerHTML = impact.map(i => `<div class="timeline-item"><strong>${i.eventName}</strong><div>${i.category} • ${i.date}</div><div class="mini">Champion: ${i.champion} • Max points: ${i.maxPoints}</div></div>`).join('');
  }
}

function topCategory(f){
  const entries = Object.entries(f.categoryPoints || {}).sort((a,b)=>b[1]-a[1]);
  return entries[0]?.[0] || 'Balanced';
}
function buildStrengths(f){
  const tags = [];
  if((f.categoryPoints.Sports||0) >= (f.categoryPoints.Academic||0) && (f.categoryPoints.Sports||0) >= (f.categoryPoints.Cultural||0)) tags.push('strong sports depth');
  if((f.categoryPoints.Academic||0) >= (f.categoryPoints.Sports||0) && (f.categoryPoints.Academic||0) >= (f.categoryPoints.Cultural||0)) tags.push('sharp academic execution');
  if((f.categoryPoints.Cultural||0) >= (f.categoryPoints.Academic||0) && (f.categoryPoints.Cultural||0) >= (f.categoryPoints.Sports||0)) tags.push('high cultural impact');
  if(f.momentum >= 80) tags.push('excellent recent momentum');
  if(f.winRate >= 60) tags.push('consistent finishing ability');
  return tags.join(', ') || 'balanced performance';
}
function buildWeaknesses(f){
  const cats = [{k:'sports',v:f.categoryPoints.Sports||0},{k:'academic',v:f.categoryPoints.Academic||0},{k:'cultural',v:f.categoryPoints.Cultural||0},{k:'esports',v:f.categoryPoints.Esports||0}].sort((a,b)=>a.v-b.v);
  const notes = [`needs more points in ${cats[0].k}`];
  if(f.gapToLeader > 0) notes.push(`must close a ${f.gapToLeader}-point gap`);
  if(f.momentum < 75) notes.push('needs a momentum boost');
  return notes.join(', ');
}

function renderStrategyPage(){
  const state = getState();
  const leader = state.families[0];
  const remaining = state.events.filter(e => e.status !== 'Completed');
  const opportunities = remaining.slice().sort((a,b)=>(b.weight||1)-(a.weight||1));
  const portal = document.getElementById('strategyCards');
  if(portal){
    portal.innerHTML = state.families.map(f => `
      <div class="family-card">
        <div class="family-head"><div class="flex"><div class="logo-chip">${f.icon}</div><div><strong>${f.name}</strong><div class="mini">Rank #${f.rank}</div></div></div><div class="pill">Need ${f.gapToLeader} pts</div></div>
        <div class="mini">To overtake ${leader.name}, ${f.name === leader.name ? 'maintain the lead and convert high-weight events.' : `target high-value events and finish ahead in at least ${Math.max(1, Math.ceil(f.gapToLeader/10))} remaining major events.`}</div>
        <div style="margin-top:12px"><strong>Suggested focus areas</strong><ul class="list-clean" style="margin-top:8px">
          <li class="mini">Primary category to push: ${opportunities[0]?.category || 'Sports'}</li>
          <li class="mini">Best point opportunity: ${opportunities[0]?.name || 'TBA'} (${Math.round((opportunities[0]?.weight||1)*10)} max champion points)</li>
          <li class="mini">Momentum action: ${f.momentum >= 80 ? 'defend lead and avoid low placements' : 'secure a champion finish in the next event'}</li>
        </ul></div>
      </div>`).join('');
  }
  const remain = document.getElementById('remainingEvents');
  if(remain){
    remain.innerHTML = remaining.map(e => `<div class="timeline-item"><strong>${e.name}</strong><div>${e.category} • ${e.date} • ${e.time}</div><div class="mini">Weight ${e.weight} • champion value ${Math.round((state.pointsMatrix.Champion||10)*e.weight)} pts</div></div>`).join('');
  }
}

function renderBracketPage(){
  const state = getState();
  const wrap = document.getElementById('bracketWrap'); if(!wrap) return;
  const renderMatch = m => `
    <div class="match">
      <div class="match-team ${m.winner===m.teamA?'winner':''}"><span>${m.teamA}</span><strong>${m.scoreA}</strong></div>
      <div class="match-team ${m.winner===m.teamB?'winner':''}"><span>${m.teamB}</span><strong>${m.scoreB}</strong></div>
    </div>`;
  wrap.innerHTML = `
    <div class="bracket-col"><h5>Semifinals</h5>${state.bracket.semifinals.map(renderMatch).join('')}</div>
    <div class="bracket-col"><h5>Finals</h5>${state.bracket.finals.map(renderMatch).join('')}</div>
    <div class="bracket-col"><h5>Third Place</h5>${state.bracket.thirdPlace.map(renderMatch).join('')}</div>`;
}

function renderAdminPage(){
  const state = getState();
  const guard = document.getElementById('adminGuard');
  const app = document.getElementById('adminApp');
  if(!isAdmin()){
    guard?.classList.remove('hidden');
    app?.classList.add('hidden');
  } else {
    guard?.classList.add('hidden');
    app?.classList.remove('hidden');
  }
  const loginForm = document.getElementById('adminLoginForm');
  if(loginForm){
    loginForm.onsubmit = e => {
      e.preventDefault();
      const password = document.getElementById('adminPassword').value;
      const ok = loginAdmin(password);
      document.getElementById('loginMsg').textContent = ok ? 'Login successful.' : 'Incorrect password.';
      renderAdminPage();
    };
  }
  document.getElementById('logoutBtn')?.addEventListener('click', ()=>{ logoutAdmin(); renderAdminPage(); });
  if(!isAdmin()) return;
  const eventSelect = document.getElementById('eventId');
  if(eventSelect){
    eventSelect.innerHTML = state.events.map(ev => `<option value="${ev.id}">${ev.name} • ${ev.category} • ${ev.status}</option>`).join('');
  }
  const familyNames = state.families.map(f=>f.name);
  ['champion','runnerUp','thirdPlace','fourthPlace','matchFamilyA','matchFamilyB'].forEach(id => {
    const el = document.getElementById(id); if(!el) return;
    const current = el.value;
    el.innerHTML = familyNames.map(n => `<option ${current===n?'selected':''}>${n}</option>`).join('');
  });
  const resultForm = document.getElementById('resultForm');
  if(resultForm){
    resultForm.onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(resultForm);
      const state2 = submitResult(Object.fromEntries(fd.entries()));
      document.getElementById('resultMsg').textContent = `Saved. ${state2.families[0].name} is now #1 with ${state2.families[0].points} points.`;
      renderAdminPage();
    };
  }
  const eventForm = document.getElementById('eventForm');
  if(eventForm){
    eventForm.onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(eventForm);
      const payload = Object.fromEntries(fd.entries());
      payload.weight = Number(payload.weight || 1);
      upsertEvent(payload);
      document.getElementById('eventMsg').textContent = 'Event saved.';
      eventForm.reset();
      renderAdminPage();
    };
  }
  const liveForm = document.getElementById('liveForm');
  if(liveForm){
    liveForm.onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(liveForm);
      updateLiveMatch({
        title: fd.get('title'),
        familyA: fd.get('familyA'),
        familyB: fd.get('familyB'),
        scoreA: Number(fd.get('scoreA') || 0),
        scoreB: Number(fd.get('scoreB') || 0),
        bestOf: fd.get('bestOf'),
        endTime: fd.get('endTime')
      });
      document.getElementById('liveMsg').textContent = 'Live match updated.';
    };
  }
  const adminResults = document.getElementById('adminResults');
  if(adminResults){
    adminResults.innerHTML = state.results.slice(0,8).map(r => `<div class="timeline-item"><strong>${r.eventName}</strong><div>${r.category} • ${r.date}</div><div class="mini">Champion: ${r.placements.Champion} • Runner Up: ${r.placements['Runner Up']}</div></div>`).join('');
  }
  const adminEvents = document.getElementById('adminEvents');
  if(adminEvents){
    adminEvents.innerHTML = state.events.slice(0,8).map(e => `<div class="timeline-item"><strong>${e.name}</strong><div>${e.category} • ${e.status}</div><div class="mini">${e.date} • ${e.time} • ${e.venue}</div></div>`).join('');
  }
}

function renderLedPage(){
  const state = getState();
  const summary = getSummary(state);
  const champ = summary.champion;
  const champBox = document.getElementById('ledChampion');
  if(champBox && champ){
    champBox.innerHTML = `<div class="led-champ">${champ.icon} ${champ.name}</div><div class="led-next">${champ.points} points • ${champ.winRate}% win rate • momentum ${champ.momentum}%</div>`;
  }
  renderLeaderboardList('ledRanks', state.families.slice(0,4));
  const nextBox = document.getElementById('ledNext');
  if(nextBox){
    const next = summary.nextEvent;
    nextBox.innerHTML = next ? `<strong>${next.name}</strong><div>${next.category}</div><div>${next.date} • ${next.time}</div><div>${next.venue}</div>` : 'Schedule update soon';
  }
  const live = document.getElementById('ledLive');
  if(live){
    const m = state.liveMatch;
    live.innerHTML = `<strong>${m.title}</strong><div style="margin-top:8px">${m.familyA} <span class="glow-text">${m.scoreA}</span> - <span class="glow-text">${m.scoreB}</span> ${m.familyB}</div><div class="mini" style="margin-top:6px">${m.bestOf} • Ends ${countdownText(m.endTime)}</div>`;
  }
  const ann = document.getElementById('ledAnnouncements');
  if(ann){
    ann.innerHTML = state.announcements.slice(0,4).map(a=>`<div class="timeline-item"><strong>${a.title}</strong><div class="mini">${a.body}</div></div>`).join('');
  }
  const med = document.getElementById('medalCeremony');
  if(med){
    const top3 = state.families.slice(0,3);
    med.innerHTML = top3.map((f, idx) => `<div class="rank-item"><div class="rank-number">${['🥇','🥈','🥉'][idx]}</div><div class="rank-main"><strong>${f.name}</strong><small>${f.points} pts</small></div><div class="rank-points">#${f.rank}</div></div>`).join('');
  }
}

function countdownText(endTime){
  if(!endTime) return 'TBA';
  const diff = new Date(endTime) - new Date();
  if(diff <= 0) return 'Ended';
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m remaining`;
}

function renderQRCode(targetId, text){
  const el = document.getElementById(targetId); if(!el) return;
  if(window.QRCode){
    el.innerHTML = '';
    new QRCode(el, { text, width: 120, height: 120 });
  } else {
    el.innerHTML = `<div class="mini">QR library unavailable</div>`;
  }
  const txt = document.getElementById('qrLinkText');
  if(txt) txt.textContent = text;
}

function initInstallPrompt(){
  let deferredPrompt;
  const banner = document.getElementById('installBanner');
  const btn = document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    banner?.style.setProperty('display', 'block');
  });
  btn?.addEventListener('click', async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    banner?.remove();
  });
}

function registerSW(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register((location.pathname.includes('/pages/') || location.pathname.includes('/admin/') || location.pathname.includes('/led-mode/')) ? '../sw.js' : 'sw.js').catch(()=>{});
  }
}

function initSoundButtons(){
  document.querySelectorAll('[data-sound]').forEach(btn => btn.addEventListener('click', playCelebrationTone));
}

function playCelebrationTone(){
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const times = [0, .12, .24, .38, .52];
  const freqs = [392, 523.25, 659.25, 783.99, 1046.5];
  freqs.forEach((f,i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0, ctx.currentTime + times[i]);
    g.gain.linearRampToValueAtTime(.12, ctx.currentTime + times[i] + .02);
    g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + times[i] + .22);
    o.connect(g); g.connect(ctx.destination);
    o.start(ctx.currentTime + times[i]); o.stop(ctx.currentTime + times[i] + .24);
  });
}

function initFireworks(triggerSelector='[data-fireworks]'){
  const canvas = document.getElementById('fireworksCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
  resize(); addEventListener('resize', resize);
  function burst(x = innerWidth/2, y = innerHeight/3){
    for(let i=0;i<90;i++){
      const angle = Math.random()*Math.PI*2;
      const speed = Math.random()*4 + 1.2;
      particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:80+Math.random()*25,size:2+Math.random()*2});
    }
    playCelebrationTone();
  }
  function tick(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += .03; p.life -= 1;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, ${190 + Math.random()*60}, ${60 + Math.random()*60}, ${Math.max(.15, p.life/100)})`;
      ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();
  document.querySelectorAll(triggerSelector).forEach(btn=>btn.addEventListener('click', ()=> burst()));
  if(location.pathname.includes('led-mode')) setTimeout(()=>burst(), 800);
}

function wireReset(){
  document.querySelectorAll('[data-reset-app]').forEach(btn => btn.addEventListener('click', ()=>{
    if(confirm('Reset all demo data to default state?')){ resetState(); location.reload(); }
  }));
}

function boot(){
  setActiveNav();
  renderLayoutMeta();
  registerSW();
  initInstallPrompt();
  initSoundButtons();
  initFireworks();
  wireReset();
  const page = document.body.dataset.page;
  if(page === 'home') renderHome();
  if(page === 'leaderboard') renderLeaderboardPage();
  if(page === 'families') renderFamiliesPage();
  if(page === 'events') renderEventsPage();
  if(page === 'analytics') renderAnalyticsPage();
  if(page === 'strategy') renderStrategyPage();
  if(page === 'bracket') renderBracketPage();
  if(page === 'admin') renderAdminPage();
  if(page === 'led') renderLedPage();
}

window.addEventListener('DOMContentLoaded', boot);
window.addEventListener('tag-state-changed', ()=>{
  const page = document.body.dataset.page;
  if(page === 'home') renderHome();
  if(page === 'leaderboard') renderLeaderboardPage();
  if(page === 'families') renderFamiliesPage();
  if(page === 'events') renderEventsPage();
  if(page === 'analytics') renderAnalyticsPage();
  if(page === 'strategy') renderStrategyPage();
  if(page === 'bracket') renderBracketPage();
  if(page === 'admin') renderAdminPage();
  if(page === 'led') renderLedPage();
});
