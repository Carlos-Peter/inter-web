/* app.js — custom SQL users with bcryptjs, full validation + error messages */
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3';

// --- Modal logic ---
const overlay = document.querySelector('[data-overlay]');
const modals = {
  login: document.querySelector('[data-modal="login"]'),
  signup: document.querySelector('[data-modal="signup"]'),
  cart: document.querySelector('[data-modal="cart"]'),
};

function closeAll(){
  Object.values(modals).forEach(m => m?.setAttribute('aria-hidden','true'));
  overlay?.classList.remove('is-visible');
  document.body.style.overflow = '';
}
function openModal(name){
  closeAll();
  const el = modals[name]; if(!el) return;
  el.setAttribute('aria-hidden','false');
  overlay?.classList.add('is-visible');
  document.body.style.overflow = 'hidden';
  el.querySelector('input,button,[href],textarea,select')?.focus();
}

document.addEventListener('click', (e) => {
  const openBtn = e.target.closest('[data-open]');
  if (openBtn){ e.preventDefault(); openModal(openBtn.dataset.open); }
  if (e.target.matches('[data-close]') || e.target.closest('[data-close]')){ e.preventDefault(); closeAll(); }
});
overlay?.addEventListener('click', closeAll);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeAll(); });

// --- Helpers ---
function showError(id, msg){
  const box = document.getElementById(id);
  if (!box) return;
  box.textContent = msg || '';
  box.style.display = msg ? 'block' : 'none';
}
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- SIGNUP (INSERT into app_users) ---
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('signup-error', '');

  const full_name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim().toLowerCase();
  const password = document.getElementById('signup-password').value;

  if (!full_name) return showError('signup-error', 'Please enter your full name.');
  if (!emailRe.test(email)) return showError('signup-error', 'Please enter a valid email address.');
  if (!password || password.length < 8) return showError('signup-error', 'Password must be at least 8 characters.');

  // Uniqueness check
  let { data: existing, error: checkErr } = await window.supabase
    .from('app_users')
    .select('user_id')
    .eq('email', email)
    .limit(1)
    .maybeSingle();

  if (checkErr) return showError('signup-error', `Error checking user: ${checkErr.message}`);
  if (existing) return showError('signup-error', 'An account with this email already exists.');

  // Hash password
  const salt = bcrypt.genSaltSync(10);
  const hashed_password = bcrypt.hashSync(password, salt);

  // Insert
  const { error: insertErr } = await window.supabase
    .from('app_users')
    .insert([{ email, full_name, hashed_password, role: 'helper' }]);

  if (insertErr) return showError('signup-error', `Sign up failed: ${insertErr.message}`);

  showError('signup-error', '');
  alert('Account created. You can now log in.');
  openModal('login');
});

// --- LOGIN (SELECT + bcrypt compare) ---
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('login-error', '');

  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  if (!emailRe.test(email)) return showError('login-error', 'Please enter a valid email address.');
  if (!password) return showError('login-error', 'Please enter your password.');

  const { data: user, error: fetchErr } = await window.supabase
    .from('app_users')
    .select('user_id, full_name, email, hashed_password, role')
    .eq('email', email)
    .limit(1)
    .maybeSingle();

  if (fetchErr) return showError('login-error', `Login failed: ${fetchErr.message}`);
  if (!user) return showError('login-error', 'Account not found. Please sign up.');

  const ok = bcrypt.compareSync(password, user.hashed_password);
  if (!ok) return showError('login-error', 'Incorrect password. Please try again.');

  localStorage.setItem('app_user', JSON.stringify({
    id: user.user_id, email: user.email, full_name: user.full_name, role: user.role
  }));

  showError('login-error', '');
  alert(`Welcome, ${user.full_name}!`);
  closeAll();
});
