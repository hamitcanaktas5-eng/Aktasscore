/* AktaşScore — favorites.js */
AS.requireAuth();

let activeTab = 'teams';

// ── TABS ────────────────────────────────────────
const ftabs = document.querySelectorAll('.ftab');
const indicator = document.getElementById('ftab-indicator');

function updateIndicator(el) {
  const wrap = document.querySelector('.tabs-wrap');
  const r = el.getBoundingClientRect(), pr = wrap.getBoundingClientRect();
  indicator.style.left = (r.left - pr.left) + 'px';
  indicator.style.width = r.width + 'px';
}

ftabs.forEach(tab => {
  tab.addEventListener('click', () => {
    ftabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeTab = tab.dataset.tab;
    updateIndicator(tab);
    render();
  });
});
setTimeout(() => updateIndicator(document.querySelector('.ftab.active')), 50);

// ── RENDER ──────────────────────────────────────
function render() {
  const c = document.getElementById('content');
  c.classList.remove('fade-in'); void c.offsetWidth; c.classList.add('fade-in');
  if (activeTab === 'teams') renderTeams();
  else renderNotifs();
}

function renderTeams() {
  const teams = AS.getFavTeams();
  const c = document.getElementById('content');
  if (!teams.length) {
    c.innerHTML = `<div class="empty-state">
      <div class="e-icon">⭐</div>
      <h3>Favori Takım Yok</h3>
      <p>Maç ekranlarında takımların yanındaki yıldıza basarak takımları favorilere ekleyebilirsin.</p>
      <button class="empty-btn" onclick="goTo('home.html')">Maçlara Git</button>
    </div>`;
    return;
  }
  c.innerHTML = `<div class="team-grid">${teams.map(t => `
    <div class="team-card">
      <button class="team-card-remove" data-id="${t.id}" title="Favorilerden Çıkar">
        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
      <div class="team-card-logo">${t.logo}</div>
      <div class="team-card-name">${t.name}</div>
      <div class="team-card-league">${t.league || ''}</div>
    </div>`).join('')}</div>`;

  c.querySelectorAll('.team-card-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const team = teams.find(t => t.id === id);
      AS.toggleFavTeam(team); // removes since it exists
      showToast('💔', `${team.name} favorilerden çıkarıldı`, '', 'neutral');
      render();
    });
  });
}

function renderNotifs() {
  const favMatchIds = AS.getFavMatches();
  const c = document.getElementById('content');
  if (!favMatchIds.length) {
    c.innerHTML = `<div class="empty-state">
      <div class="e-icon">🔔</div>
      <h3>Bildirim Yok</h3>
      <p>Maç kartlarındaki zil ikonuna basarak maç bildirimleri alabilirsin.</p>
      <button class="empty-btn" onclick="goTo('home.html')">Maçlara Git</button>
    </div>`;
    return;
  }
  const matches = favMatchIds.map(id => MATCHES.getMatch(id)).filter(Boolean);
  c.innerHTML = `<div class="notif-list">${matches.map(m => {
    let statusHtml = '', cls = '';
    if (m.status === 'live') { statusHtml = `<span class="notif-status s-live">🔴 ${m.minute}'</span>`; cls = 'live'; }
    else if (m.status === 'finished') { statusHtml = `<span class="notif-status s-finished">MS</span>`; }
    else { statusHtml = `<span class="notif-status s-upcoming">${m.time}</span>`; }
    return `<div class="notif-item ${cls}" data-mid="${m.id}">
      <div class="notif-flag">${m.leagueFlag}</div>
      <div class="notif-info">
        <div class="notif-teams">${m.home.name} — ${m.away.name}</div>
        <div class="notif-league">${m.leagueName} ${statusHtml}</div>
      </div>
      <button class="notif-remove" data-mid="${m.id}">
        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    </div>`;
  }).join('')}`;

  c.querySelectorAll('.notif-item').forEach(item => {
    item.addEventListener('click', e => {
      if (e.target.closest('.notif-remove')) return;
      goTo('match.html?id=' + item.dataset.mid);
    });
  });
  c.querySelectorAll('.notif-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      AS.toggleFavMatch(btn.dataset.mid);
      showToast('🔕', 'Bildirim kapatıldı', '', 'neutral');
      render();
    });
  });
}

function showToast(emoji, title, sub, type = 'goal', ms = 3000) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div'); t.className = `toast ${type}`;
  t.innerHTML = `<div class="toast-emoji">${emoji}</div><div class="toast-body"><div class="toast-title">${title}</div>${sub?`<div class="toast-sub">${sub}</div>`:''}</div>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, ms);
}

function goTo(url) { window.location.href = url; }
render();
