/* AktaşScore — home.js */

AS.requireAuth();
const session = AS.getSession();
if (session?.email) {
  document.getElementById('drawer-avatar').textContent = session.email[0].toUpperCase();
  document.getElementById('drawer-email').textContent = session.email;
}

let activeFilter = 'all';
let collapsedLeagues = AS.get('as_collapsed') || [];

// ── DATE STRIP ──────────────────────────────────
function buildDateStrip() {
  const strip = document.getElementById('date-strip');
  const now = new Date();
  const days = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
  const total = MATCHES.getAllMatches().length;
  let html = '';
  for (let i = -3; i <= 5; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    const isToday = i === 0;
    const count = isToday ? total : Math.floor(Math.random() * 16) + 2;
    const key = isToday ? 'today' : `d${i}`;
    const active = (activeDate === key);
    html += `<button class="date-item${isToday?' today':''}${active?' active':''}" data-key="${key}">
      <span class="day-name">${isToday?'BUGÜN':days[d.getDay()]}</span>
      <span class="day-num">${d.getDate()}</span>
      <span class="match-count">${count}</span>
    </button>`;
  }
  strip.innerHTML = html;
  setTimeout(()=>{const a=strip.querySelector('.active');if(a)a.scrollIntoView({inline:'center',block:'nearest'});},50);
  strip.querySelectorAll('.date-item').forEach(b=>b.addEventListener('click',()=>{activeDate=b.dataset.key;buildDateStrip();renderMatches();}));
}
let activeDate = 'today';

// ── RENDER MATCHES ──────────────────────────────
function renderMatches() {
  const list = document.getElementById('match-list');
  const isToday = activeDate === 'today';
  const source = isToday ? MATCHES.leagues : simulateOtherDay();

  const filtered = source.map(lg=>({
    ...lg,
    matches: lg.matches.filter(m=>{
      if(activeFilter==='live') return m.status==='live';
      if(activeFilter==='finished') return m.status==='finished';
      if(activeFilter==='upcoming') return m.status==='upcoming';
      return true;
    })
  })).filter(lg=>lg.matches.length>0);

  if(!filtered.length){
    list.innerHTML=`<div class="empty-state">
      <svg viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V18H9v2h6v-2h-2v-2.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>
      <h3>Maç Bulunamadı</h3><p>Bu filtre için gösterilecek maç yok.</p>
    </div>`;
    return;
  }
  list.innerHTML = filtered.map(buildLeagueGroup).join('');
  bindEvents();
}

function buildLeagueGroup(lg) {
  const collapsed = collapsedLeagues.includes(lg.id);
  return `<div class="league-group${collapsed?' collapsed':''}" data-lid="${lg.id}">
    <div class="league-header">
      <div class="league-flag">${lg.flag}</div>
      <div style="flex:1"><div class="league-name">${lg.name}</div><div class="league-country">${lg.country}</div></div>
      <span class="league-count">${lg.matches.length}</span>
      <svg class="league-toggle" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
    </div>
    <div class="league-matches">${lg.matches.map(buildMatchCard).join('')}</div>
  </div>`;
}

function buildMatchCard(m) {
  const hasScore = m.score.home !== null;
  const homeFav = AS.isFavTeam(m.home.id);
  const awayFav = AS.isFavTeam(m.away.id);
  const matchNotif = AS.isFavMatch(m.id);

  let statusHtml = '';
  if(m.status==='live')      statusHtml=`<span class="score-status status-live">● ${m.minute}'</span>`;
  else if(m.status==='finished') statusHtml=`<span class="score-status status-finished">MS</span>`;
  else                           statusHtml=`<span class="score-status status-upcoming">${m.time}</span>`;

  const sH = hasScore ? m.score.home : '-';
  const sA = hasScore ? m.score.away : '-';
  const sColor = hasScore ? 'var(--text)' : 'var(--sub)';

  return `<div class="match-card${m.status==='live'?' live':''}" data-mid="${m.id}">
    <div class="team home">
      <div class="team-logo">${m.home.logo}</div>
      <span class="team-name">${m.home.name}</span>
      <button class="team-fav${homeFav?' active':''}" data-team-id="${m.home.id}" data-team-name="${m.home.name}" data-team-logo="${m.home.logo}" data-league="${m.leagueName}" title="Takımı Favorile">
        <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
      </button>
    </div>
    <div class="score-block">
      <div class="score-nums">
        <span class="score-num" style="color:${sColor}">${sH}</span>
        <span class="score-sep">:</span>
        <span class="score-num" style="color:${sColor}">${sA}</span>
      </div>
      ${statusHtml}
    </div>
    <div class="team away">
      <button class="team-fav${awayFav?' active':''}" data-team-id="${m.away.id}" data-team-name="${m.away.name}" data-team-logo="${m.away.logo}" data-league="${m.leagueName}" title="Takımı Favorile">
        <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
      </button>
      <span class="team-name">${m.away.name}</span>
      <div class="team-logo">${m.away.logo}</div>
    </div>
    <button class="match-notif${matchNotif?' active':''}" data-mid="${m.id}" title="Bildirimleri Aç">
      <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
    </button>
  </div>`;
}

function bindEvents() {
  // League collapse
  document.querySelectorAll('.league-header').forEach(h=>{
    h.addEventListener('click',()=>{
      const g = h.closest('.league-group'), lid = g.dataset.lid;
      g.classList.toggle('collapsed');
      if(g.classList.contains('collapsed')) { if(!collapsedLeagues.includes(lid)) collapsedLeagues.push(lid); }
      else collapsedLeagues = collapsedLeagues.filter(x=>x!==lid);
      AS.set('as_collapsed', collapsedLeagues);
    });
  });

  // Match card click → detail
  document.querySelectorAll('.match-card').forEach(c=>{
    c.addEventListener('click', e=>{
      if(e.target.closest('.team-fav') || e.target.closest('.match-notif')) return;
      window.location.href = `match.html?id=${c.dataset.mid}`;
    });
  });

  // Team favorite
  document.querySelectorAll('.team-fav').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      const team = { id:btn.dataset.teamId, name:btn.dataset.teamName, logo:btn.dataset.teamLogo, league:btn.dataset.league };
      const added = AS.toggleFavTeam(team);
      btn.classList.toggle('active', added);
      showToast(added?'⭐':'💔', added?`${team.name} favorilere eklendi`:`${team.name} favorilerden çıkarıldı`, '', added?'goal':'neutral');
    });
  });

  // Match notification bell
  document.querySelectorAll('.match-notif').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      const id = btn.dataset.mid;
      const added = AS.toggleFavMatch(id);
      btn.classList.toggle('active', added);
      showToast(added?'🔔':'🔕', added?'Maç bildirimleri açıldı':'Maç bildirimleri kapatıldı', '', 'neutral');
    });
  });
}

function simulateOtherDay() {
  return MATCHES.leagues.slice(0,3).map(lg=>({
    ...lg, matches: lg.matches.slice(0,2).map(m=>({...m,status:'upcoming',score:{home:null,away:null},time:'20:00'}))
  }));
}

// ── FILTER PILLS ────────────────────────────────
document.querySelectorAll('.pill').forEach(b=>{
  b.addEventListener('click',()=>{
    activeFilter=b.dataset.filter;
    document.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
    b.classList.add('active');
    renderMatches();
  });
});

// ── NAV ─────────────────────────────────────────
document.getElementById('nav-menu').addEventListener('click', openDrawer);
document.getElementById('nav-search').addEventListener('click', openSearch);
document.getElementById('nav-home').addEventListener('click', ()=>{
  document.getElementById('match-list').scrollTo({top:0,behavior:'smooth'});
});
document.getElementById('notif-btn').addEventListener('click',()=>{
  document.getElementById('notif-dot').classList.add('hidden');
  showToast('🔔','Bildirimler','3 yeni maç bildirimi var','goal');
});

// ── DRAWER ──────────────────────────────────────
function openDrawer(){document.getElementById('drawer').classList.add('open');document.getElementById('drawer-overlay').classList.add('open')}
function closeDrawer(){document.getElementById('drawer').classList.remove('open');document.getElementById('drawer-overlay').classList.remove('open')}
document.getElementById('drawer-overlay').addEventListener('click',closeDrawer);
document.getElementById('drawer-close').addEventListener('click',closeDrawer);
document.getElementById('drawer-logout').addEventListener('click',()=>{AS.logout();window.location.href='index.html';});

// ── SEARCH ──────────────────────────────────────
function openSearch(){
  document.getElementById('search-overlay').classList.remove('hidden');
  setTimeout(()=>document.getElementById('search-input').focus(),100);
}
document.getElementById('search-close').addEventListener('click',()=>{
  document.getElementById('search-overlay').classList.add('hidden');
  document.getElementById('search-input').value='';
  document.getElementById('search-results').innerHTML='<div class="search-hint">Aramak istediğin takım veya ligi yaz...</div>';
});
document.getElementById('search-input').addEventListener('input',e=>{
  const q=e.target.value.trim().toLowerCase();
  const res=document.getElementById('search-results');
  if(!q){res.innerHTML='<div class="search-hint">Aramak istediğin takım veya ligi yaz...</div>';return;}
  const found=MATCHES.getAllMatches().filter(m=>
    m.home.name.toLowerCase().includes(q)||m.away.name.toLowerCase().includes(q)||m.leagueName.toLowerCase().includes(q)
  );
  if(!found.length){res.innerHTML='<div class="search-hint">Sonuç bulunamadı.</div>';return;}
  res.innerHTML=found.map(m=>`
    <div class="search-result-item" onclick="window.location.href='match.html?id=${m.id}'">
      <div class="sr-emoji">${m.leagueFlag}</div>
      <div class="sr-info">
        <div class="sr-name">${m.home.name} — ${m.away.name}</div>
        <div class="sr-sub">${m.leagueName} · ${m.status==='live'?'🔴 CANLI '+m.minute+"'":m.status==='finished'?'Bitti':m.time}</div>
      </div>
    </div>`).join('');
});

// ── TOAST ────────────────────────────────────────
function showToast(emoji,title,sub,type='goal',ms=3500){
  const c=document.getElementById('toast-container');
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.innerHTML=`<div class="toast-emoji">${emoji}</div><div class="toast-body"><div class="toast-title">${title}</div>${sub?`<div class="toast-sub">${sub}</div>`:''}</div>`;
  c.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transition='.3s';setTimeout(()=>t.remove(),300);},ms);
}

// ── SIMULATED NOTIFS ─────────────────────────────
const notifs=[
  {e:'⚽',t:'GOL! Galatasaray 3-1 Fenerbahçe',s:"İcardi, 71'",type:'goal'},
  {e:'🟡',t:'Sarı Kart',s:"De Bruyne (Man City) 56'",type:'yellow-card'},
  {e:'🟥',t:'Kırmızı Kart!',s:"İsmail Yüksek 67'",type:'red-card'},
  {e:'⚽',t:'GOL! Arsenal 3-2 Man City',s:"Saka, 88' Penaltı",type:'goal'},
];
[8000,22000,40000,65000].forEach((d,i)=>{
  setTimeout(()=>{
    const n=notifs[i];
    showToast(n.e,n.t,n.s,n.type);
    document.getElementById('notif-dot').classList.remove('hidden');
  },d);
});

// ── GOTO ─────────────────────────────────────────
function goTo(url){window.location.href=url;}

// ── INIT ─────────────────────────────────────────
buildDateStrip();
renderMatches();
