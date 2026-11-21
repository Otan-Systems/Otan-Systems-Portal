(function () {
  'use strict';

  var API_URL = 'https://lzbsgrnuufhevjnpxtly.supabase.co/functions/v1/otan-auth';
  var KEY = 'otan_session';

  var listeners = { change: [], ended: [] };
  var session = null;
  var expTimer = null;
  var bar = null;

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.token && s.expires_at > Date.now()) return s;
      localStorage.removeItem(KEY);
    } catch (e) {}
    return null;
  }
  function persist(s) {
    try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch (e) {}
  }
  function emit(ev, arg) {
    listeners[ev].forEach(function (fn) { try { fn(arg); } catch (e) { console.error(e); } });
  }

  session = load();

  function api(action, body, token) {
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['X-Session'] = token;
    return fetch(API_URL, { method: 'POST', headers: headers, body: JSON.stringify(Object.assign({ action: action }, body || {})) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'server' }; }); })
      .catch(function () { return { ok: false, error: 'network' }; });
  }
  function errMsg(res) {
    switch (res.error) {
      case 'invalid_credentials': return 'Wrong username, password or value';
      case 'invalid_value':       return 'Wrong value';
      case 'blocked':             return 'Too many attempts. Blocked until ' + (res.until ? new Date(res.until).toLocaleString() : '24 h');
      case 'username_taken':      return 'Username is taken';
      case 'value_taken':         return 'Value was taken. New one generated: save it';
      case 'invalid_input':       return 'Some conditions undone';
      case 'network':             return 'No connection. Try again';
      default:                    return 'Server error. Try again';
    }
  }

  function schedule() {
    clearTimeout(expTimer);
    if (session) expTimer = setTimeout(function () { setSession(null, 'expired'); }, Math.max(0, session.expires_at - Date.now()));
  }
  function setSession(s, reason) {
    session = s;
    persist(s);
    schedule();
    render();
    emit('change', s);
    if (!s && reason) emit('ended', reason);
  }

  /* ───── topbar ───── */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function ensureSprite() {
    if (document.getElementById('s-tri')) return;
    var holder = document.createElement('div');
    holder.innerHTML =
      '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
      '<symbol id="s-tri" viewBox="0 0 100 100"><path d="M50 8 L93 88 H7 Z" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></symbol>' +
      '<symbol id="s-sq" viewBox="0 0 100 100"><rect x="5" y="10" width="90" height="80" rx="18" vector-effect="non-scaling-stroke"/></symbol>' +
      '<symbol id="s-arch" viewBox="0 0 100 100"><path d="M6 94 V50 A44 44 0 0 1 94 50 V94 Z" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></symbol>' +
      '<symbol id="s-circle" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" vector-effect="non-scaling-stroke"/></symbol>' +
      '</svg>';
    document.body.insertBefore(holder.firstChild, document.body.firstChild);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function buildBar() {
    bar = document.getElementById('otanTopbar');
    if (!bar) return;
    ensureSprite();

    var right = bar.querySelector('.tb-right');
    if (!right) { right = el('div', 'tb-right'); bar.appendChild(right); }

    var left = el('div', 'tb-left');
    var center = el('div', 'tb-center');
    center.innerHTML =
      '<a class="tb-shapes" href="/#welcome" aria-label="Otan Systems lobby">' +
      '<svg class="shape c-white"><use href="#s-tri"/></svg>' +
      '<svg class="shape c-orange"><use href="#s-sq"/></svg>' +
      '<svg class="shape c-blue"><use href="#s-arch"/></svg>' +
      '<svg class="shape c-lime"><use href="#s-circle"/></svg></a>';
    bar.insertBefore(left, right);
    bar.insertBefore(center, right);

    if (right.querySelector('.tb-links')) {
      var burger = el('button', 'tb-burger');
      burger.type = 'button';
      burger.setAttribute('aria-label', 'Menu');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('data-act', 'burger');
      burger.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
      right.appendChild(burger);
    }

    bar.addEventListener('click', onBarClick);
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var wasOpen = isMenuOpen();
      closeMenu(); closeBurger();
      if (wasOpen) { var u = bar.querySelector('.tb-user'); if (u) u.focus(); }
    });
  }

  function render() {
    document.body.classList.toggle('authed', !!session);
    if (!bar) return;
    var always = bar.getAttribute('data-mode') === 'always';
    document.body.classList.toggle('has-topbar', always || !!session);

    var left = bar.querySelector('.tb-left');
    left.replaceChildren();
    if (session) {
      var btn = el('button', 'tb-user');
      btn.type = 'button';
      btn.setAttribute('aria-haspopup', 'true');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('data-act', 'toggle');
      btn.appendChild(el('span', 'tb-name', session.username));
      btn.insertAdjacentHTML('beforeend', '<svg class="tb-caret" viewBox="0 0 24 24"><path d="M5 9l7 7 7-7"/></svg>');

      var menu = el('div', 'tb-menu');
      menu.setAttribute('role', 'menu');
      menu.innerHTML =
        '<button class="tb-item" type="button" role="menuitem" data-act="logout">Log Out</button>' +
        '<button class="tb-item danger" type="button" role="menuitem" data-act="delete">Delete</button>' +
        '<div class="tb-collapse"><div><div class="tb-confirm">' +
        '<p>The action is beyond retrieve. Are you sure?</p>' +
        '<div class="tb-confirm-actions">' +
        '<button class="tb-btn danger" type="button" data-act="confirm">Delete</button>' +
        '<button class="tb-btn" type="button" data-act="cancel">Cancel</button></div>' +
        '<div class="tb-err" role="alert"></div></div></div></div>';
      left.append(btn, menu);
    } else {
      var a = el('a', 'tb-login', 'Log In');
      a.href = '/#login';
      a.setAttribute('data-act', 'login');
      left.appendChild(a);
    }
  }

  function isMenuOpen() { var m = bar && bar.querySelector('.tb-menu'); return !!(m && m.classList.contains('open')); }
  function resetConfirm() {
    if (!bar) return;
    var c = bar.querySelector('.tb-collapse');
    if (c) c.classList.remove('open');
    var e = bar.querySelector('.tb-err');
    if (e) e.textContent = '';
    var b = bar.querySelector('[data-act="confirm"]');
    if (b) b.disabled = false;
  }
  function openMenu() {
    var m = bar.querySelector('.tb-menu'), u = bar.querySelector('.tb-user');
    if (!m) return;
    m.classList.add('open'); u.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    if (!bar) return;
    var m = bar.querySelector('.tb-menu'), u = bar.querySelector('.tb-user');
    if (m) m.classList.remove('open');
    if (u) u.setAttribute('aria-expanded', 'false');
    resetConfirm();
  }
  function closeBurger() {
    if (!bar) return;
    var l = bar.querySelector('.tb-links'), b = bar.querySelector('.tb-burger');
    if (l) l.classList.remove('open');
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  function onBarClick(e) {
    var t = e.target.closest('[data-act]');
    if (!t || !bar.contains(t)) { if (e.target.closest('.tb-links a')) closeBurger(); return; }
    var act = t.getAttribute('data-act');

    if (act === 'toggle') {
      if (isMenuOpen()) closeMenu(); else { closeBurger(); openMenu(); }
    } else if (act === 'logout') {
      var tok = session && session.token;
      closeMenu();
      setSession(null, 'logout');
      if (tok) api('logout', {}, tok);
    } else if (act === 'delete') {
      bar.querySelector('.tb-collapse').classList.add('open');
    } else if (act === 'cancel') {
      resetConfirm();
    } else if (act === 'confirm') {
      var btn = t, errBox = bar.querySelector('.tb-err');
      btn.disabled = true; errBox.textContent = '';
      api('delete', {}, session && session.token).then(function (res) {
        if (res.ok || res.error === 'unauthorized') { closeMenu(); setSession(null, 'delete'); }
        else { btn.disabled = false; errBox.textContent = errMsg(res); }
      });
    } else if (act === 'login') {
      t.href = '/?next=' + encodeURIComponent(location.pathname + location.search + location.hash) + '#login';
    } else if (act === 'burger') {
      var links = bar.querySelector('.tb-links');
      var open = !links.classList.contains('open');
      closeMenu();
      links.classList.toggle('open', open);
      t.setAttribute('aria-expanded', String(open));
    }
  }
  function onDocClick(e) {
    if (!bar) return;
    var menu = bar.querySelector('.tb-menu');
    if (isMenuOpen() && !e.target.closest('.tb-menu') && !e.target.closest('.tb-user')) closeMenu();
    var links = bar.querySelector('.tb-links');
    if (links && links.classList.contains('open') && !e.target.closest('.tb-links') && !e.target.closest('.tb-burger')) closeBurger();
  }

  /* ───── init ───── */
  function init() {
    session = load();
    buildBar();
    render();
    schedule();

    window.addEventListener('storage', function (e) {
      if (e.key !== KEY) return;
      var had = !!session;
      session = load();
      schedule(); render();
      emit('change', session);
      if (had && !session) emit('ended', 'remote');
    });

    if (session) {
      api('me', {}, session.token).then(function (res) {
        if (!session) return;
        if (res.ok) {
          session.username = res.username;
          session.expires_at = Date.parse(res.expires_at);
          persist(session); schedule(); render();
          emit('change', session);
        } else if (res.error === 'unauthorized') {
          setSession(null, 'invalid');
        }
      });
    }
  }

  window.OtanID = {
    api: api,
    errMsg: errMsg,
    session: function () { return session; },
    setSession: function (s) { setSession(s); },
    on: function (ev, fn) { if (listeners[ev]) listeners[ev].push(fn); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();