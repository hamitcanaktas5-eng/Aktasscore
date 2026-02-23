/* AktaşScore — match.js */
AS.requireAuth();

const params = new URLSearchParams(location.search);
const matchId = params.get('id') || 'sl1';
const match = MATCHES.getMatch(matchId);

if (!match) { window.location.href = 'home.html'; }

// ── TOPBAR ──────────────────────────────────────
document.getElementById('topbar-league').textContent = match.leagueName;
document.getElementById('topbar-date').textContent = match.date + ' · ' + match.time;

// ── NOTIFICATION TOGGLE ─────────────────────────
const notifBtn = document.getElementById('notif-toggle');
function updateNotifBtn() {
  const active = AS.isFavMatch(match.id);
  notifBtn.classList.toggle('active', active);
  notifBtn.title = active ? 'Bildirimi Kapat' : 'Bildirimi Aç';
}
updateNotifBtn();
notifBtn.addEventListener('click', () => {
  const added = AS.toggleFavMatch(match.id);
  updateNotifBtn();
  showToast(added ? '🔔' : '🔕', added ? 'Maç bildirimleri açıldı' : 'Kapatıldı', '', 'neutral');
});

// ── BACK ────────────────────────────────────────
document.getElementById('back-btn').addEventListener('click', () => {
  if (history.length > 1) history.back(); else window.location.href = 'home.html';
});

// ── HERO ────────────────────────────────────────
document.getElementById('home-logo').textContent = match.home.logo;
document.getElementById('away-logo').textContent = match.away.logo;
document.getElementById('home-name').textContent = match.home.name;
document.getElementById('away-name').textContent = match.away.name;

const hasScore = match.score.home !== null;
if (match.status === 'live') {
  document.getElementById('live-badge').classList.remove('hidden');
  document.getElementById('hero-status').textContent = match.minute + "'";
  document.getElementById('hero-status').style.color = 'var(--red)';
} else if (match.status === 'finished') {
  document.getElementById('hero-status').textContent = 'MAÇ SONU';
  document.getElementById('hero-status').style.color = 'var(--sub)';
} else {
  document.getElementById('hero-status').textContent = match.time;
  document.getElementById('hero-status').style.color = 'var(--green)';
}
document.getElementById('score-home').textContent = hasScore ? match.score.home : '-';
document.getElementById('score-away').textContent = hasScore ? match.score.away : '-';
if (!hasScore) {
  document.getElementById('score-home').style.color = 'var(--sub)';
  document.getElementById('score-away').style.color = 'var(--sub)';
}
if (match.ht) document.getElementById('hero-ht').textContent = 'İY: ' + match.ht;

// Events ribbon
const ribbon = document.getElementById('events-ribbon');
const ribbonEvts = match.events.filter(e => e.type === 'goal' || e.type === 'red');
ribbon.innerHTML = ribbonEvts.map(e => `
  <div class="evt-chip ${e.type}">${e.type==='goal'?'⚽':'🟥'} ${e.player} <span style="opacity:.6">${e.min}'</span></div>
`).join('');

// ── FAV BUTTONS ─────────────────────────────────
function initFavBtn(btnId, team) {
  const btn = document.getElementById(btnId);
  function update() { btn.classList.toggle('active', AS.isFavTeam(team.id)); }
  update();
  btn.addEventListener('click', () => {
    const added = AS.toggleFavTeam(team);
    update();
    showToast(added ? '⭐' : '💔', added ? `${team.name} favorilere eklendi` : `${team.name} favorilerden çıkarıldı`, '', added ? 'goal' : 'neutral');
  });
}
initFavBtn('home-fav-btn', { id: match.home.id, name: match.home.name, logo: match.home.logo, league: match.leagueName });
initFavBtn('away-fav-btn', { id: match.away.id, name: match.away.name, logo: match.away.logo, league: match.leagueName });

// ── TABS ────────────────────────────────────────
const tabs = document.querySelectorAll('.tab');
const indicator = document.getElementById('tab-indicator');

function updateIndicator(tabEl) {
  const parentRect = document.getElementById('tabs').getBoundingClientRect();
  const rect = tabEl.getBoundingClientRect();
  indicator.style.left = (rect.left - parentRect.left) + 'px';
  indicator.style.width = rect.width + 'px';
}
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    updateIndicator(tab);
    renderTab(tab.dataset.tab);
  });
});
setTimeout(() => updateIndicator(document.querySelector('.tab.active')), 50);

// ── RENDER ──────────────────────────────────────
function renderTab(tab) {
  const c = document.getElementById('tab-content');
  c.scrollTop = 0;
  c.classList.remove('fade-in'); void c.offsetWidth; c.classList.add('fade-in');
  if (tab === 'summary') renderSummary();
  else if (tab === 'stats') renderStats();
  else if (tab === 'lineup') renderLineup();
  else if (tab === 'h2h') renderH2H();
}

function renderSummary() {
  const evts = match.events;
  if (!evts.length) {
    document.getElementById('tab-content').innerHTML = `<div style="text-align:center;padding:60px 24px;color:var(--sub)"><div style="font-size:40px;margin-bottom:12px">⚽</div><div style="font-family:var(--font-h);font-size:18px;font-weight:700">Henüz olay yok</div><div style="font-size:13px;margin-top:6px">Maç ${match.status==='upcoming'?'başlamadı':'devam ediyor'}</div></div>`;
    return;
  }
  let html = '<div class="timeline">';
  let htAdded = false;
  evts.forEach(e => {
    if (!htAdded && e.min > 45) {
      htAdded = true;
      html += `<div class="ht-divider"><span class="ht-label">İlk Yarı Sonu${match.ht ? ' · '+match.ht : ''}</span></div>`;
    }
    const icon = {goal:'⚽',yellow:'🟡',red:'🟥',sub:'🔄'}[e.type]||'•';
    const cls  = {goal:'goal-icon',yellow:'yellow-icon',red:'red-icon',sub:''}[e.type]||'';
    if (e.side === 'home') {
      html += `<div class="timeline-item"><div class="tl-home"><span class="tl-name">${e.player}</span><span class="tl-sub">${e.detail}</span></div><div class="tl-center"><div class="tl-icon ${cls}">${icon}</div><span class="tl-min">${e.min}'</span></div><div class="tl-empty"></div></div>`;
    } else {
      html += `<div class="timeline-item"><div class="tl-empty"></div><div class="tl-center"><div class="tl-icon ${cls}">${icon}</div><span class="tl-min">${e.min}'</span></div><div class="tl-away"><span class="tl-name">${e.player}</span><span class="tl-sub">${e.detail}</span></div></div>`;
    }
  });
  if (!htAdded) html += `<div class="ht-divider"><span class="ht-label">İlk Yarı Sonu${match.ht ? ' · '+match.ht : ''}</span></div>`;
  if (match.status === 'live') html += `<div class="ht-divider"><span class="ht-label" style="color:var(--red);border-color:rgba(255,61,87,.3);background:var(--red-dim)">🔴 CANLI · ${match.minute}'</span></div>`;
  html += '</div>';
  document.getElementById('tab-content').innerHTML = html;
}

function renderStats() {
  if (!match.stats.length) {
    document.getElementById('tab-content').innerHTML = `<div style="text-align:center;padding:60px 24px;color:var(--sub)"><div style="font-size:36px;margin-bottom:12px">📊</div><div style="font-family:var(--font-h);font-size:18px;font-weight:700">İstatistik Yok</div><div style="font-size:13px;margin-top:6px">Maç başladığında istatistikler burada görünecek</div></div>`;
    return;
  }
  const poss = match.stats.find(s => s.type === 'possession');
  let html = '';
  if (poss) {
    html += `<div class="possession-row"><div class="possession-labels"><span class="home-col">${poss.home}%</span><span class="mid-label">Topa Sahip Olma</span><span class="away-col">${poss.away}%</span></div><div class="possession-bar-wrap"><div class="pos-home" style="width:${poss.home}%"></div><div class="pos-away" style="width:${poss.away}%"></div></div></div>`;
  }
  html += '<div class="section-title">Maç İstatistikleri</div><div class="stats-list">';
  match.stats.filter(s => s.type !== 'possession').forEach(s => {
    const total = s.home + s.away || 1;
    const hp = Math.round(s.home/total*100), ap = 100-hp;
    html += `<div class="stat-row"><div class="stat-val home">${s.home}</div><div class="stat-bar-wrap"><div class="stat-label">${s.label}</div><div class="stat-bar"><div class="stat-fill-home" style="width:${hp}%"></div><div class="stat-fill-away" style="width:${ap}%"></div></div></div><div class="stat-val away">${s.away}</div></div>`;
  });
  html += '</div>';
  document.getElementById('tab-content').innerHTML = html;
}

function renderLineup() {
  const posClass = p => ({GK:'pos-gk',DEF:'pos-def',MID:'pos-mid',FWD:'pos-fwd'}[p]||'');
  const buildPlayers = pl => pl.map(p=>`<div class="player-row"><div class="player-num">${p.num}</div><div class="player-name">${p.name}</div>${p.event?`<span class="player-event">${p.event}</span>`:''}<div class="player-pos ${posClass(p.pos)}">${p.pos}</div></div>`).join('');

  if (!match.lineup.home.starting.length) {
    document.getElementById('tab-content').innerHTML = `<div style="text-align:center;padding:60px 24px;color:var(--sub)"><div style="font-size:36px;margin-bottom:12px">👥</div><div style="font-family:var(--font-h);font-size:18px;font-weight:700">Kadro Açıklanmadı</div></div>`;
    return;
  }
  document.getElementById('tab-content').innerHTML = `<div class="lineup-wrap">
    <div class="lineup-team-header"><div class="lt-logo">${match.home.logo}</div><div class="lt-name">${match.home.name}</div><div class="lt-formation">${match.home.formation}</div></div>
    <div class="player-list">${buildPlayers(match.lineup.home.starting)}</div>
    <div class="subs-header"><svg viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg><span class="subs-title">Yedekler</span></div>
    <div class="player-list">${buildPlayers(match.lineup.home.subs)}</div>
    <div class="lineup-team-header" style="margin-top:16px"><div class="lt-logo">${match.away.logo}</div><div class="lt-name">${match.away.name}</div><div class="lt-formation">${match.away.formation}</div></div>
    <div class="player-list">${buildPlayers(match.lineup.away.starting)}</div>
    <div class="subs-header"><svg viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg><span class="subs-title">Yedekler</span></div>
    <div class="player-list">${buildPlayers(match.lineup.away.subs)}</div>
  </div>`;
}

function renderH2H() {
  const h2h = match.h2h;
  const total = h2h.wins.home + h2h.wins.draw + h2h.wins.away;
  const rows = h2h.matches.map(m => {
    const hs = m.homeScore>m.awayScore?'color:var(--green)':'', as = m.awayScore>m.homeScore?'color:var(--blue)':'';
    return `<div class="h2h-match"><div class="h2h-team right" style="${hs}">${match.home.name}</div><div class="h2h-center"><div class="h2h-score">${m.homeScore} - ${m.awayScore}</div><div class="h2h-date">${m.date}</div></div><div class="h2h-team" style="${as}">${match.away.name}</div></div>`;
  }).join('');
  document.getElementById('tab-content').innerHTML = `<div class="h2h-wrap">
    <div class="section-title">Son ${total} Karşılaşma</div>
    <div class="h2h-summary">
      <div class="h2h-stat-box home-win"><div class="big-num">${h2h.wins.home}</div><div class="box-label">${match.home.name.split(' ')[0]}</div></div>
      <div class="h2h-stat-box draw"><div class="big-num">${h2h.wins.draw}</div><div class="box-label">Beraberlik</div></div>
      <div class="h2h-stat-box away-win"><div class="big-num">${h2h.wins.away}</div><div class="box-label">${match.away.name.split(' ')[0]}</div></div>
    </div>
    <div class="section-title">Son Maçlar</div>
    <div class="h2h-matches">${rows || '<div style="text-align:center;padding:24px;color:var(--sub);font-size:13px">Geçmiş maç verisi yok</div>'}</div>
  </div>`;
}

function showToast(emoji, title, sub, type = 'goal', ms = 3500) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div'); t.className = `toast ${type}`;
  t.innerHTML = `<div class="toast-emoji">${emoji}</div><div class="toast-body"><div class="toast-title">${title}</div>${sub?`<div class="toast-sub">${sub}</div>`:''}</div>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, ms);
}

renderTab('summary');
