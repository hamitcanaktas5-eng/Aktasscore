/* ===============================
   AktaşScore — index.js  v0.1
   Auth: Login / Register / Forgot
   Tüm storage → AS (data.js)
   =============================== */

// Eğer zaten giriş yapılmışsa direkt ana sayfaya
if (AS.getSession()) {
  window.location.href = 'home.html';
}

// ── UTILS ─────────────────────────────────────────
function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('show', !!msg);
  const inp = el.closest('.field-group')?.querySelector('input');
  if (inp) inp.classList.toggle('error', !!msg);
}
function clearErr(id) { showErr(id, ''); }
function setLoading(btnId, on) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = on;
  btn.querySelector('.btn-text')?.classList.toggle('hidden', on);
  btn.querySelector('.btn-loader')?.classList.toggle('hidden', !on);
}
function shakeCard() {
  const card = document.querySelector('.auth-card');
  card.classList.remove('shake');
  void card.offsetWidth;
  card.classList.add('shake');
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── TAB SWITCHING ─────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  const target = document.getElementById('form-' + name);
  if (target) target.classList.add('active');
  ['login-email-err','login-password-err','reg-email-err','reg-password-err','reg-confirm-err','forgot-email-err'].forEach(clearErr);
}

document.querySelectorAll('[data-tab]').forEach(el => {
  el.addEventListener('click', () => switchTab(el.dataset.tab));
});

// ── EYE BUTTONS ───────────────────────────────────
document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

// ── PASSWORD STRENGTH ─────────────────────────────
document.getElementById('reg-password')?.addEventListener('input', function () {
  const v = this.value;
  let score = 0;
  if (v.length >= 6) score++;
  if (v.length >= 10) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  const levels = [
    { pct:'0%',   color:'#2e3c58', label:'' },
    { pct:'25%',  color:'#ff3d57', label:'Çok Zayıf' },
    { pct:'50%',  color:'#ff9800', label:'Zayıf' },
    { pct:'75%',  color:'#ffd600', label:'Orta' },
    { pct:'90%',  color:'#00bcd4', label:'İyi' },
    { pct:'100%', color:'#00e676', label:'Güçlü' },
  ];
  const lvl = v.length === 0 ? levels[0] : levels[Math.min(score, 5)];
  const fill  = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  fill.style.width      = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent     = lvl.label;
  label.style.color     = lvl.color;
});

// ── LOGIN ─────────────────────────────────────────
document.getElementById('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  let valid = true;
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;

  clearErr('login-email-err'); clearErr('login-password-err');

  if (!email)              { showErr('login-email-err','E-posta adresi gerekli'); valid = false; }
  else if (!isValidEmail(email)) { showErr('login-email-err','Geçerli bir e-posta girin'); valid = false; }
  if (!pass)               { showErr('login-password-err','Şifre gerekli'); valid = false; }
  if (!valid) { shakeCard(); return; }

  setLoading('login-btn', true);
  await sleep(800);

  const users = AS.getUsers();
  const user  = users[email.toLowerCase()];

  if (!user) {
    showErr('login-email-err','Bu e-posta ile kayıt bulunamadı');
    shakeCard();
  } else if (user.password !== pass) {
    showErr('login-password-err','Şifre yanlış');
    shakeCard();
  } else {
    AS.setSession(email.toLowerCase());
    window.location.href = 'home.html';
  }
  setLoading('login-btn', false);
});

// ── REGISTER ──────────────────────────────────────
document.getElementById('form-register').addEventListener('submit', async e => {
  e.preventDefault();
  let valid = true;
  const email   = document.getElementById('reg-email').value.trim();
  const pass    = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  clearErr('reg-email-err'); clearErr('reg-password-err'); clearErr('reg-confirm-err');

  if (!email)                   { showErr('reg-email-err','E-posta adresi gerekli'); valid = false; }
  else if (!isValidEmail(email)){ showErr('reg-email-err','Geçerli bir e-posta girin'); valid = false; }
  if (!pass)                    { showErr('reg-password-err','Şifre gerekli'); valid = false; }
  else if (pass.length < 6)     { showErr('reg-password-err','Şifre en az 6 karakter olmalı'); valid = false; }
  if (!confirm)                 { showErr('reg-confirm-err','Şifre tekrarı gerekli'); valid = false; }
  else if (pass !== confirm)    { showErr('reg-confirm-err','Şifreler eşleşmiyor'); valid = false; }
  if (!valid) { shakeCard(); return; }

  setLoading('register-btn', true);
  await sleep(800);

  const users = AS.getUsers();
  if (users[email.toLowerCase()]) {
    showErr('reg-email-err','Bu e-posta zaten kayıtlı');
    shakeCard();
    setLoading('register-btn', false);
    return;
  }

  users[email.toLowerCase()] = { email: email.toLowerCase(), password: pass, createdAt: Date.now() };
  AS.saveUsers(users);
  setLoading('register-btn', false);

  showModal('Kayıt Başarılı! 🎉','Hesabın oluşturuldu. Giriş yapabilirsin.', () => {
    switchTab('login');
    document.getElementById('login-email').value = email;
  });
});

// ── FORGOT ────────────────────────────────────────
document.getElementById('form-forgot').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  clearErr('forgot-email-err');

  if (!email)              { showErr('forgot-email-err','E-posta adresi gerekli'); shakeCard(); return; }
  if (!isValidEmail(email)){ showErr('forgot-email-err','Geçerli bir e-posta girin'); shakeCard(); return; }

  setLoading('forgot-btn', true);
  await sleep(900);
  setLoading('forgot-btn', false);

  showModal('E-posta Gönderildi 📧',`${email} adresine şifre sıfırlama bağlantısı gönderildi.`,()=>{
    switchTab('login');
  });
});

// ── MODAL ─────────────────────────────────────────
function showModal(title, desc, onOk) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-desc').textContent  = desc;
  document.getElementById('success-modal').classList.remove('hidden');
  const okBtn = document.getElementById('modal-ok');
  const handler = () => {
    document.getElementById('success-modal').classList.add('hidden');
    okBtn.removeEventListener('click', handler);
    if (onOk) onOk();
  };
  okBtn.addEventListener('click', handler);
}
