/* ================================================
   AktaşScore — data.js  (v0.1)
   Merkezi veri katmanı — tüm sayfalar bu dosyayı kullanır
   ================================================ */

const AS = {

  // ── KEYS ──────────────────────────────────────
  KEYS: {
    USERS:       'as_users',
    SESSION:     'as_session',
    FAV_TEAMS:   'as_fav_teams',   // favori takımlar [{id,name,logo,league}]
    FAV_MATCHES: 'as_fav_matches', // bildirim için maç id listesi
    SUPPORT:     'as_support',     // destek talepleri
    SETTINGS:    'as_settings',
  },

  // ── STORAGE HELPERS ───────────────────────────
  get(key)        { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, val)   { localStorage.setItem(key, JSON.stringify(val)); },
  remove(key)     { localStorage.removeItem(key); },

  // ── AUTH ──────────────────────────────────────
  getUsers()      { return this.get(this.KEYS.USERS) || {}; },
  saveUsers(u)    { this.set(this.KEYS.USERS, u); },
  getSession()    { return this.get(this.KEYS.SESSION); },
  setSession(email) { this.set(this.KEYS.SESSION, { email, ts: Date.now() }); },
  logout()        { this.remove(this.KEYS.SESSION); },
  requireAuth()   {
    if (!this.getSession()) { window.location.href = 'index.html'; return false; }
    return true;
  },

  // ── FAV TEAMS ─────────────────────────────────
  getFavTeams()   { return this.get(this.KEYS.FAV_TEAMS) || []; },
  isFavTeam(id)   { return this.getFavTeams().some(t => t.id === id); },
  toggleFavTeam(team) {
    let favs = this.getFavTeams();
    if (favs.some(t => t.id === team.id)) {
      favs = favs.filter(t => t.id !== team.id);
      this.set(this.KEYS.FAV_TEAMS, favs);
      return false; // removed
    } else {
      favs.push(team);
      this.set(this.KEYS.FAV_TEAMS, favs);
      return true; // added
    }
  },

  // ── FAV MATCHES (bildirim) ────────────────────
  getFavMatches()  { return this.get(this.KEYS.FAV_MATCHES) || []; },
  isFavMatch(id)   { return this.getFavMatches().includes(id); },
  toggleFavMatch(id) {
    let favs = this.getFavMatches();
    if (favs.includes(id)) {
      favs = favs.filter(x => x !== id);
      this.set(this.KEYS.FAV_MATCHES, favs);
      return false;
    } else {
      favs.push(id);
      this.set(this.KEYS.FAV_MATCHES, favs);
      return true;
    }
  },

  // ── SUPPORT ───────────────────────────────────
  getTickets()    { return this.get(this.KEYS.SUPPORT) || []; },
  saveTickets(t)  { this.set(this.KEYS.SUPPORT, t); },
  createTicket(subject, body, email) {
    const tickets = this.getTickets();
    const ticket = {
      id: 'TKT-' + Date.now(),
      subject, body, email,
      status: 'open',
      createdAt: Date.now(),
      messages: [
        { from: 'user', text: body, ts: Date.now() }
      ]
    };
    tickets.unshift(ticket);
    this.saveTickets(tickets);
    return ticket;
  },
  addMessage(ticketId, text, from = 'user') {
    const tickets = this.getTickets();
    const t = tickets.find(x => x.id === ticketId);
    if (!t) return;
    t.messages.push({ from, text, ts: Date.now() });
    if (from === 'user') t.status = 'open';
    this.saveTickets(tickets);
    return t;
  },
  closeTicket(ticketId) {
    const tickets = this.getTickets();
    const t = tickets.find(x => x.id === ticketId);
    if (t) { t.status = 'closed'; this.saveTickets(tickets); }
  },

  // ── SEED DEMO DATA ────────────────────────────
  seedDemo() {
    // Demo kullanıcı
    const users = this.getUsers();
    if (!users['demo@aktasscore.com']) {
      users['demo@aktasscore.com'] = { email: 'demo@aktasscore.com', password: '123456', createdAt: Date.now() };
      this.saveUsers(users);
    }
    // Demo destek talebi
    const tickets = this.getTickets();
    if (!tickets.length) {
      const demo = {
        id: 'TKT-DEMO1',
        subject: 'Uygulama hakkında bilgi',
        body: 'Merhaba, uygulama ne zaman tam sürüme geçecek?',
        email: 'demo@aktasscore.com',
        status: 'closed',
        createdAt: Date.now() - 86400000 * 2,
        messages: [
          { from: 'user',    text: 'Merhaba, uygulama ne zaman tam sürüme geçecek?', ts: Date.now() - 86400000 * 2 },
          { from: 'support', text: 'Merhaba! v0.2 sürümünde lig tablosu ve daha fazla özellik gelecek. Takipte kalın! 🎉', ts: Date.now() - 86400000 },
        ]
      };
      this.saveTickets([demo]);
    }
  },

  // ── UTILITIES ─────────────────────────────────
  formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('tr-TR', { day:'numeric', month:'short', year:'numeric' });
  },
  formatTimestamp(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }) + ' · ' +
           d.toLocaleDateString('tr-TR', { day:'numeric', month:'short' });
  },
};

// ── MOCK MATCH DATA ───────────────────────────────
// API gelince bu veri API'den gelecek
const MATCHES = {
  leagues: [
    {
      id: 'sl', name: 'Süper Lig', country: 'Türkiye', flag: '🇹🇷',
      matches: [
        {
          id:'sl1', leagueId:'sl', leagueName:'Süper Lig', leagueFlag:'🇹🇷',
          home:{ id:'gs',  name:'Galatasaray',  logo:'⭐', formation:'4-2-3-1' },
          away:{ id:'fb',  name:'Fenerbahçe',   logo:'🦅', formation:'4-3-3'   },
          score:{ home:2, away:1 }, status:'live', minute:67, ht:'1-0',
          time:'21:00', date:'Bugün',
          events:[
            { min:12, type:'goal',   side:'home', player:'İcardi',        detail:'Kafa, Ziyech Asisti' },
            { min:31, type:'yellow', side:'away', player:'Fred',           detail:'Faul' },
            { min:38, type:'goal',   side:'away', player:'Dzeko',          detail:'Sol ayak, Tadic Asisti' },
            { min:45, type:'yellow', side:'home', player:'Seri',           detail:'Faul' },
            { min:58, type:'goal',   side:'home', player:'Ziyech',         detail:'Serbest vuruş' },
            { min:63, type:'sub',    side:'away', player:'Szymanski',      detail:'↗ Crespo ↘' },
            { min:67, type:'red',    side:'away', player:'İsmail Yüksek',  detail:'2. Sarı' },
          ],
          stats:[
            { label:'Topa Sahip Olma', home:57, away:43, type:'possession' },
            { label:'Şut',             home:14, away:9 },
            { label:'İsabetli Şut',    home:6,  away:4 },
            { label:'Korner',          home:7,  away:3 },
            { label:'Faul',            home:11, away:13 },
            { label:'Ofsayt',          home:3,  away:2 },
            { label:'Sarı Kart',       home:1,  away:2 },
            { label:'Kırmızı Kart',    home:0,  away:1 },
          ],
          lineup:{
            home:{
              starting:[
                {num:1,  name:'F. Muslera',       pos:'GK'},
                {num:53, name:'Sacha Boey',        pos:'DEF'},
                {num:6,  name:'Abdülkerim E.',     pos:'DEF'},
                {num:4,  name:'Victor Nelsson',    pos:'DEF'},
                {num:3,  name:'Van Aanholt',       pos:'DEF'},
                {num:8,  name:'Seri',              pos:'MID', event:'🟡'},
                {num:18, name:'Torreira',           pos:'MID'},
                {num:22, name:'Ziyech',             pos:'MID', event:'⚽'},
                {num:17, name:'Kerem Aktürkoğlu',  pos:'MID'},
                {num:10, name:'Mertens',            pos:'MID'},
                {num:9,  name:'İcardi',             pos:'FWD', event:'⚽'},
              ],
              subs:[
                {num:25,name:'Pentek',    pos:'FWD'},
                {num:15,name:'Oliveira',  pos:'MID'},
                {num:44,name:'Kaan Ayhan',pos:'DEF'},
              ]
            },
            away:{
              starting:[
                {num:1,  name:'Livakovic',          pos:'GK'},
                {num:87, name:'Osayi-Samuel',       pos:'DEF'},
                {num:3,  name:'Djiku',              pos:'DEF'},
                {num:21, name:'Rodrigues',          pos:'DEF'},
                {num:88, name:'Ferdi Kadıoğlu',    pos:'DEF'},
                {num:8,  name:'Fred',              pos:'MID', event:'🟡'},
                {num:6,  name:'İsmail Yüksek',     pos:'MID', event:'🟥'},
                {num:10, name:'Tadic',             pos:'MID'},
                {num:23, name:'Crespo',            pos:'FWD', event:'🔄'},
                {num:11, name:'Dzeko',             pos:'FWD', event:'⚽'},
                {num:17, name:'İrfan Can',         pos:'FWD'},
              ],
              subs:[
                {num:20,name:'Szymanski',  pos:'MID', event:'🔄'},
                {num:9, name:'Batshuayi',  pos:'FWD'},
                {num:4, name:'Zajc',       pos:'MID'},
              ]
            }
          },
          h2h:{ wins:{home:12,draw:8,away:9},
            matches:[
              {date:'14 Oca 2024',homeScore:1,awayScore:1},
              {date:'05 Kas 2023',homeScore:3,awayScore:1},
              {date:'26 Mar 2023',homeScore:0,awayScore:1},
              {date:'06 Kas 2022',homeScore:2,awayScore:2},
            ]
          }
        },
        {
          id:'sl2', leagueId:'sl', leagueName:'Süper Lig', leagueFlag:'🇹🇷',
          home:{ id:'bjk', name:'Beşiktaş',    logo:'🦅', formation:'4-4-2' },
          away:{ id:'ts',  name:'Trabzonspor', logo:'⚡', formation:'4-2-3-1' },
          score:{ home:0, away:0 }, status:'live', minute:23, ht:null,
          time:'19:00', date:'Bugün',
          events:[
            { min:14, type:'yellow', side:'home', player:'Al-Musrati', detail:'Faul' },
          ],
          stats:[
            { label:'Topa Sahip Olma', home:52, away:48, type:'possession' },
            { label:'Şut',   home:3, away:5 },
            { label:'Korner', home:2, away:3 },
            { label:'Faul',  home:4, away:3 },
          ],
          lineup:{
            home:{ starting:[
              {num:1,name:'Mert Günok',  pos:'GK'},
              {num:4,name:'Tayyip Talha',pos:'DEF'},
              {num:5,name:'Vida',        pos:'DEF'},
              {num:3,name:'Batshuayi',   pos:'FWD'},
              {num:8,name:'Al-Musrati',  pos:'MID',event:'🟡'},
              {num:9,name:'Michy B.',    pos:'FWD'},
              {num:10,name:'Gedson',     pos:'MID'},
              {num:11,name:'Ghezzal',    pos:'FWD'},
            ], subs:[{num:23,name:'Rebocho',pos:'DEF'}]},
            away:{ starting:[
              {num:1,name:'Uğurcan Ç.',  pos:'GK'},
              {num:3,name:'Marc Bartra', pos:'DEF'},
              {num:9,name:'Maxi Gomez',  pos:'FWD'},
              {num:10,name:'Hamsik',     pos:'MID'},
              {num:7,name:'Trezeguet',   pos:'FWD'},
            ], subs:[{num:22,name:'Denswil',pos:'DEF'}]}
          },
          h2h:{ wins:{home:18,draw:10,away:12},
            matches:[
              {date:'10 Şub 2024',homeScore:2,awayScore:1},
              {date:'02 Eyl 2023',homeScore:1,awayScore:1},
            ]
          }
        },
        {
          id:'sl3', leagueId:'sl', leagueName:'Süper Lig', leagueFlag:'🇹🇷',
          home:{ id:'bsk', name:'Başakşehir',  logo:'🔵', formation:'4-3-3' },
          away:{ id:'svs', name:'Sivasspor',   logo:'🔴', formation:'5-3-2' },
          score:{ home:1, away:3 }, status:'finished', minute:90, ht:'0-2',
          time:'17:00', date:'Bugün',
          events:[
            { min:22, type:'goal',   side:'away', player:'Erdoğan',  detail:'Sağ ayak' },
            { min:35, type:'goal',   side:'away', player:'Türkmen',  detail:'Kafa' },
            { min:61, type:'goal',   side:'home', player:'Chadli',   detail:'Penaltı' },
            { min:78, type:'goal',   side:'away', player:'Erdoğan',  detail:'Kontra atak' },
          ],
          stats:[
            { label:'Topa Sahip Olma', home:62, away:38, type:'possession' },
            { label:'Şut',   home:18, away:8 },
            { label:'Korner', home:9, away:2 },
          ],
          lineup:{
            home:{ starting:[
              {num:1,name:'Günok',  pos:'GK'},
              {num:9,name:'Chadli', pos:'MID', event:'⚽'},
            ], subs:[]},
            away:{ starting:[
              {num:1,name:'Doğukan',   pos:'GK'},
              {num:9,name:'Erdoğan',   pos:'FWD', event:'⚽⚽'},
              {num:11,name:'Türkmen',  pos:'FWD', event:'⚽'},
            ], subs:[]}
          },
          h2h:{ wins:{home:6,draw:4,away:5},
            matches:[{date:'12 Ara 2023',homeScore:2,awayScore:0}]
          }
        },
        {
          id:'sl4', leagueId:'sl', leagueName:'Süper Lig', leagueFlag:'🇹🇷',
          home:{ id:'ank', name:'Ankaragücü',  logo:'⚽', formation:'4-4-2' },
          away:{ id:'ksp', name:'Kasımpaşa',   logo:'⚽', formation:'4-3-3' },
          score:{ home:null, away:null }, status:'upcoming',
          time:'21:00', date:'Bugün',
          events:[], stats:[], lineup:{home:{starting:[],subs:[]},away:{starting:[],subs:[]}},
          h2h:{ wins:{home:5,draw:3,away:4}, matches:[] }
        },
      ]
    },
    {
      id: 'pl', name: 'Premier League', country: 'İngiltere', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      matches: [
        {
          id:'pl1', leagueId:'pl', leagueName:'Premier League', leagueFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
          home:{ id:'mci', name:'Manchester City', logo:'🔵', formation:'4-3-3' },
          away:{ id:'ars', name:'Arsenal',         logo:'🔴', formation:'4-2-3-1' },
          score:{ home:2, away:2 }, status:'live', minute:78, ht:'1-1',
          time:'22:00', date:'Bugün',
          events:[
            { min:18, type:'goal', side:'home', player:'Haaland',   detail:'Penaltı' },
            { min:34, type:'goal', side:'away', player:'Saka',      detail:'Sol ayak' },
            { min:56, type:'goal', side:'away', player:'Martinelli',detail:'Kafa' },
            { min:71, type:'goal', side:'home', player:'De Bruyne', detail:'Serbest vuruş' },
          ],
          stats:[
            { label:'Topa Sahip Olma', home:48, away:52, type:'possession' },
            { label:'Şut',   home:12, away:14 },
            { label:'Korner', home:5, away:7 },
          ],
          lineup:{
            home:{ starting:[
              {num:31,name:'Ederson',    pos:'GK'},
              {num:9, name:'Haaland',    pos:'FWD', event:'⚽'},
              {num:17,name:'De Bruyne',  pos:'MID', event:'⚽'},
              {num:11,name:'Doku',       pos:'FWD'},
              {num:20,name:'B. Silva',   pos:'MID'},
            ], subs:[]},
            away:{ starting:[
              {num:1, name:'Raya',       pos:'GK'},
              {num:7, name:'Saka',       pos:'FWD', event:'⚽'},
              {num:11,name:'Martinelli', pos:'FWD', event:'⚽'},
              {num:29,name:'Havertz',    pos:'MID'},
              {num:35,name:'Zinchenko', pos:'DEF'},
            ], subs:[]}
          },
          h2h:{ wins:{home:8,draw:5,away:7},
            matches:[
              {date:'31 Mar 2024',homeScore:0,awayScore:2},
              {date:'06 Eki 2023',homeScore:1,awayScore:0},
            ]
          }
        },
        {
          id:'pl2', leagueId:'pl', leagueName:'Premier League', leagueFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
          home:{ id:'liv', name:'Liverpool', logo:'🔴', formation:'4-3-3' },
          away:{ id:'che', name:'Chelsea',   logo:'🔵', formation:'4-2-3-1' },
          score:{ home:3, away:1 }, status:'finished', minute:90, ht:'2-0',
          time:'20:00', date:'Bugün',
          events:[
            { min:11, type:'goal', side:'home', player:'Salah',   detail:'Sol ayak' },
            { min:29, type:'goal', side:'home', player:'Díaz',    detail:'Kafa' },
            { min:55, type:'goal', side:'away', player:'Palmer',  detail:'Serbest vuruş' },
            { min:82, type:'goal', side:'home', player:'Núñez',   detail:'Karşı atak' },
          ],
          stats:[
            { label:'Topa Sahip Olma', home:58, away:42, type:'possession' },
            { label:'Şut', home:16, away:10 },
            { label:'Korner', home:8, away:4 },
          ],
          lineup:{
            home:{ starting:[
              {num:1, name:'Alisson',  pos:'GK'},
              {num:11,name:'Salah',    pos:'FWD', event:'⚽'},
              {num:7, name:'Díaz',     pos:'FWD', event:'⚽'},
              {num:9, name:'Núñez',    pos:'FWD', event:'⚽'},
            ], subs:[]},
            away:{ starting:[
              {num:1, name:'Sanchez',  pos:'GK'},
              {num:20,name:'Palmer',   pos:'MID', event:'⚽'},
            ], subs:[]}
          },
          h2h:{ wins:{home:10,draw:6,away:8},
            matches:[{date:'31 Oca 2024',homeScore:4,awayScore:1}]
          }
        },
        {
          id:'pl3', leagueId:'pl', leagueName:'Premier League', leagueFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
          home:{ id:'tot', name:'Tottenham',    logo:'⚽', formation:'4-3-3' },
          away:{ id:'mnu', name:'Man United',   logo:'🔴', formation:'4-2-3-1' },
          score:{ home:null, away:null }, status:'upcoming',
          time:'22:00', date:'Bugün',
          events:[], stats:[], lineup:{home:{starting:[],subs:[]},away:{starting:[],subs:[]}},
          h2h:{ wins:{home:9,draw:4,away:11}, matches:[] }
        },
      ]
    },
    {
      id: 'la', name: 'La Liga', country: 'İspanya', flag: '🇪🇸',
      matches: [
        {
          id:'la1', leagueId:'la', leagueName:'La Liga', leagueFlag:'🇪🇸',
          home:{ id:'rma', name:'Real Madrid', logo:'👑', formation:'4-3-3' },
          away:{ id:'bar', name:'Barcelona',   logo:'🔵', formation:'4-3-3' },
          score:{ home:1, away:1 }, status:'live', minute:55, ht:'1-0',
          time:'22:00', date:'Bugün',
          events:[
            { min:23, type:'goal', side:'home', player:'Vinícius Jr.', detail:'Sol ayak' },
            { min:49, type:'goal', side:'away', player:'Lewandowski',  detail:'Penaltı' },
          ],
          stats:[
            { label:'Topa Sahip Olma', home:44, away:56, type:'possession' },
            { label:'Şut',   home:9,  away:13 },
            { label:'Korner', home:3, away:6 },
          ],
          lineup:{
            home:{ starting:[
              {num:1, name:'Lunin',        pos:'GK'},
              {num:7, name:'Vinícius Jr.', pos:'FWD', event:'⚽'},
              {num:10,name:'Modric',       pos:'MID'},
              {num:9, name:'Benzema',      pos:'FWD'},
            ], subs:[]},
            away:{ starting:[
              {num:1, name:'ter Stegen',    pos:'GK'},
              {num:9, name:'Lewandowski',   pos:'FWD', event:'⚽'},
              {num:8, name:'Pedri',         pos:'MID'},
            ], subs:[]}
          },
          h2h:{ wins:{home:15,draw:9,away:13},
            matches:[
              {date:'21 Oca 2024',homeScore:3,awayScore:2},
              {date:'28 Eki 2023',homeScore:1,awayScore:2},
            ]
          }
        },
        {
          id:'la2', leagueId:'la', leagueName:'La Liga', leagueFlag:'🇪🇸',
          home:{ id:'atm', name:'Atletico Madrid', logo:'🔴', formation:'4-4-2' },
          away:{ id:'sev', name:'Sevilla',         logo:'⚪', formation:'4-3-3' },
          score:{ home:2, away:0 }, status:'finished', minute:90, ht:'1-0',
          time:'19:00', date:'Bugün',
          events:[
            { min:33, type:'goal', side:'home', player:'Griezmann', detail:'Kafa' },
            { min:74, type:'goal', side:'home', player:'Morata',    detail:'Sol ayak' },
          ],
          stats:[
            { label:'Topa Sahip Olma', home:53, away:47, type:'possession' },
            { label:'Şut', home:12, away:7 },
          ],
          lineup:{
            home:{ starting:[
              {num:1, name:'Oblak',     pos:'GK'},
              {num:7, name:'Griezmann', pos:'FWD', event:'⚽'},
              {num:9, name:'Morata',    pos:'FWD', event:'⚽'},
            ], subs:[]},
            away:{ starting:[
              {num:1,name:'Bounou',pos:'GK'},
            ], subs:[]}
          },
          h2h:{ wins:{home:12,draw:5,away:7}, matches:[] }
        },
      ]
    },
    {
      id: 'ucl', name: 'Şampiyonlar Ligi', country: 'Avrupa', flag: '🏆',
      matches: [
        {
          id:'ucl1', leagueId:'ucl', leagueName:'Şampiyonlar Ligi', leagueFlag:'🏆',
          home:{ id:'psg', name:'PSG',           logo:'🔵', formation:'4-3-3' },
          away:{ id:'rma', name:'Real Madrid',   logo:'👑', formation:'4-3-3' },
          score:{ home:null, away:null }, status:'upcoming',
          time:'22:00', date:'Bugün',
          events:[], stats:[], lineup:{home:{starting:[],subs:[]},away:{starting:[],subs:[]}},
          h2h:{ wins:{home:3,draw:2,away:5}, matches:[] }
        },
        {
          id:'ucl2', leagueId:'ucl', leagueName:'Şampiyonlar Ligi', leagueFlag:'🏆',
          home:{ id:'bay', name:'Bayern Münih',   logo:'🔴', formation:'4-2-3-1' },
          away:{ id:'mci', name:'Manchester City',logo:'🔵', formation:'4-3-3' },
          score:{ home:null, away:null }, status:'upcoming',
          time:'22:00', date:'Bugün',
          events:[], stats:[], lineup:{home:{starting:[],subs:[]},away:{starting:[],subs:[]}},
          h2h:{ wins:{home:4,draw:1,away:5}, matches:[] }
        },
      ]
    },
  ],

  getAllMatches() {
    return this.leagues.flatMap(l => l.matches);
  },
  getMatch(id) {
    return this.getAllMatches().find(m => m.id === id);
  },

  // Takım bilgisi - tüm takımlar (favori için)
  getAllTeams() {
    const teams = {};
    this.getAllMatches().forEach(m => {
      if (!teams[m.home.id]) teams[m.home.id] = { ...m.home, league: m.leagueName, leageFlag: m.leagueFlag };
      if (!teams[m.away.id]) teams[m.away.id] = { ...m.away, league: m.leagueName, leagueFlag: m.leagueFlag };
    });
    return Object.values(teams);
  }
};

// Seed demo data on load
AS.seedDemo();
