(function () {
  'use strict';

  /* ---------------------------------------------------------------
     Frontend-only authentication (HTML + CSS + JS + localStorage)
     - Passwords are never stored as plain text: each is hashed with
       SHA-256 (Web Crypto API) together with a random per-user salt.
     - Accounts live in localStorage under USERS_KEY.
     - A login creates a session in localStorage; logout removes it.
     NOTE: with no server, all checks happen in the browser, so this
     is a learning project, not production-grade security.
     --------------------------------------------------------------- */

  const USERS_KEY = 'auth_users_v2';
  const SESSION_KEY = 'auth_session';
  const SESSION_MS = 30 * 60 * 1000; // 30 minutes

  /* ---------- Storage helpers ---------- */

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  const getUsers = function () { return readJSON(USERS_KEY, {}); };

  /* ---------- Hashing (SHA-256 + salt) ---------- */

  function toHex(bytes) {
    return Array.from(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function makeSalt() {
    return toHex(crypto.getRandomValues(new Uint8Array(16)));
  }

  async function hashPassword(password, salt) {
    const data = new TextEncoder().encode(salt + ':' + password);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return toHex(new Uint8Array(digest));
  }

  function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  function cryptoAvailable() {
    return !!(window.crypto && crypto.subtle);
  }

  /* ---------- Session ---------- */

  function createSession(id) {
    writeJSON(SESSION_KEY, {
      id: id,
      token: toHex(crypto.getRandomValues(new Uint8Array(24))),
      expires: Date.now() + SESSION_MS
    });
  }

  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  // Returns { user, expires } for a valid session, otherwise null
  function getSession() {
    const s = readJSON(SESSION_KEY, null);
    if (!s || !s.id || !s.token || s.expires <= Date.now()) {
      clearSession();
      return null;
    }
    const user = getUsers()[s.id];
    if (!user) {
      clearSession();
      return null;
    }
    return { user: user, expires: s.expires };
  }

  /* ---------- Validation ---------- */

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

  // Returns '' when OK, otherwise an error message
  function identifierProblem(value) {
    if (!value) return 'Please enter a username or email.';
    if (value.indexOf('@') !== -1) {
      return EMAIL_RE.test(value) ? '' : 'Please enter a valid email address.';
    }
    return USERNAME_RE.test(value)
      ? ''
      : 'Username must be 3-30 characters: letters, numbers, dot, dash or underscore.';
  }

  function passwordProblem(pw) {
    if (!pw) return 'Please enter a password.';
    if (pw.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[0-9]/.test(pw)) return 'Password must contain at least 1 number.';
    return '';
  }

  /* ---------- UI helpers ---------- */

  const $ = function (id) { return document.getElementById(id); };

  function showMessage(text, type) {
    const el = $('message');
    el.textContent = text;
    el.className = 'message show ' + type;
  }

  function clearMessage() {
    const el = $('message');
    el.textContent = '';
    el.className = 'message';
  }

  function markInvalid(ids) {
    ['identifier', 'password', 'confirm'].forEach(function (id) {
      const el = $(id);
      if (el) el.classList.toggle('invalid', ids.indexOf(id) !== -1);
    });
  }

  function setupPasswordToggles() {
    document.querySelectorAll('.toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const field = $(btn.dataset.toggle);
        const show = field.type === 'password';
        field.type = show ? 'text' : 'password';
        btn.textContent = show ? 'Hide' : 'Show';
      });
    });
  }

  function formatCountdown(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m + 'm ' + String(s).padStart(2, '0') + 's';
  }

  /* ---------- Page: register ---------- */

  function initRegister() {
    if (getSession()) { location.replace('dashboard.html'); return; }
    setupPasswordToggles();

    const btn = $('submit-btn');

    $('register-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      clearMessage();

      const id = $('identifier').value.trim().toLowerCase();
      const password = $('password').value;
      const confirm = $('confirm').value;

      const idError = identifierProblem(id);
      if (idError) { markInvalid(['identifier']); return showMessage(idError, 'error'); }

      const pwError = passwordProblem(password);
      if (pwError) { markInvalid(['password']); return showMessage(pwError, 'error'); }

      if (!confirm) { markInvalid(['confirm']); return showMessage('Please confirm your password.', 'error'); }
      if (password !== confirm) { markInvalid(['confirm']); return showMessage('Passwords do not match.', 'error'); }

      if (!cryptoAvailable()) {
        return showMessage('Secure hashing is unavailable. Open this page over https or localhost.', 'error');
      }

      const users = getUsers();
      if (Object.prototype.hasOwnProperty.call(users, id)) {
        markInvalid(['identifier']);
        return showMessage('An account with this username/email already exists.', 'error');
      }

      markInvalid([]);
      btn.disabled = true;
      try {
        const salt = makeSalt();
        const hash = await hashPassword(password, salt);
        users[id] = { id: id, salt: salt, hash: hash, createdAt: Date.now() };
        if (!writeJSON(USERS_KEY, users)) throw new Error('storage');
        location.replace('index.html?registered=1');
      } catch (err) {
        btn.disabled = false;
        showMessage('Could not create the account. Please check that browser storage is enabled.', 'error');
      }
    });
  }

  /* ---------- Page: login ---------- */

  function initLogin() {
    if (getSession()) { location.replace('dashboard.html'); return; }
    setupPasswordToggles();

    const params = new URLSearchParams(location.search);
    if (params.get('registered')) showMessage('Account created! Please log in.', 'success');
    if (params.get('expired')) showMessage('Please log in to continue.', 'error');
    if (params.get('loggedout')) showMessage('You have been logged out.', 'success');

    const btn = $('submit-btn');

    $('login-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      clearMessage();

      const id = $('identifier').value.trim().toLowerCase();
      const password = $('password').value;

      if (!id || !password) {
        markInvalid([!id ? 'identifier' : '', !password ? 'password' : '']);
        return showMessage('Please fill in both fields.', 'error');
      }
      if (!cryptoAvailable()) {
        return showMessage('Secure hashing is unavailable. Open this page over https or localhost.', 'error');
      }

      btn.disabled = true;
      try {
        const users = getUsers();
        const user = Object.prototype.hasOwnProperty.call(users, id) ? users[id] : null;

        // Hash even when the account does not exist so timing does not reveal it
        const hash = await hashPassword(password, user ? user.salt : '0'.repeat(32));
        const ok = !!user && safeEqual(hash, user.hash);

        if (!ok) {
          markInvalid(['identifier', 'password']); // highlight both: never reveal which one is wrong
          btn.disabled = false;
          return showMessage('Incorrect username/email or password.', 'error');
        }

        createSession(id);
        location.replace('dashboard.html');
      } catch (err) {
        btn.disabled = false;
        showMessage('Something went wrong. Please try again.', 'error');
      }
    });
  }

  /* ---------- Page: dashboard (protected) ---------- */

  function initDashboard() {
    const session = getSession();
    if (!session) { location.replace('index.html?expired=1'); return; }

    document.body.classList.remove('guarded');

    const label = session.user.id.split('@')[0];
    $('user-name').textContent = label;          // textContent: no HTML injection
    $('user-id').textContent = session.user.id;
    $('user-since').textContent = new Date(session.user.createdAt).toLocaleDateString([], {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    function tick() {
      const left = session.expires - Date.now();
      if (left <= 0) {
        clearSession();
        location.replace('index.html?expired=1');
        return;
      }
      $('session-timer').textContent = formatCountdown(left);
    }
    tick();
    setInterval(tick, 1000);

    $('logout-btn').addEventListener('click', function () {
      clearSession();
      location.replace('index.html?loggedout=1');
    });

    // Logged out in another tab -> leave this page too
    window.addEventListener('storage', function () {
      if (!getSession()) location.replace('index.html?loggedout=1');
    });

    // Back button after logout (page restored from cache) -> bounce to login
    window.addEventListener('pageshow', function (e) {
      if (e.persisted && !getSession()) location.replace('index.html?expired=1');
    });
  }

  /* ---------- Start ---------- */

  const page = document.body.dataset.page;
  if (page === 'register') initRegister();
  else if (page === 'login') initLogin();
  else if (page === 'dashboard') initDashboard();
})();
