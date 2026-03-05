/* ================================================================
   SPHIRITHEARTIST — auth.js  v2
   Full auth: Sign In / Sign Up / Google / Forgot Password
   Auth wall: checkout requires account.
   Exposes: window.studioAuth
   ================================================================ */

(function () {
    'use strict';

    // ── FIREBASE CONFIG ─────────────────────────────────────────
    const FIREBASE_CONFIG = {
        apiKey:            "YOUR_API_KEY",
        authDomain:        "YOUR_PROJECT.firebaseapp.com",
        projectId:         "YOUR_PROJECT_ID",
        storageBucket:     "YOUR_PROJECT.appspot.com",
        messagingSenderId: "YOUR_SENDER_ID",
        appId:             "YOUR_APP_ID"
    };

    const DEMO_MODE = FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY';

    const DEMO_USERS = {
        'admin@sphiri.com':   { role: 'admin',   name: 'Studio Admin',  uid: 'u_admin' },
        'partner@sphiri.com': { role: 'partner', name: 'SK8 Partner',   uid: 'u_partner' },
        'client@sphiri.com':  { role: 'client',  name: 'Alex Client',   uid: 'u_client' },
    };

    // ── STATE ────────────────────────────────────────────────────
    let _user      = null;
    let _onAuthCbs = [];
    let _auth      = null;
    let _db        = null;
    let _mode      = 'signin'; // 'signin' | 'signup' | 'forgot'
    let _pendingCb = null;
    let _pendingReason = null;

    // ── BOOT ─────────────────────────────────────────────────────
    async function init() {
        injectStyles();
        injectModal();

        if (DEMO_MODE) {
            const saved = sessionStorage.getItem('sphiri_demo_user');
            if (saved) {
                try { _user = JSON.parse(saved); } catch(e) {}
            }
            updateNavIcon();
            _onAuthCbs.forEach(cb => cb(_user));
            return;
        }

        const { initializeApp }                   = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        const { getAuth, onAuthStateChanged }      = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
        const { getFirestore, doc, getDoc }        = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

        const app = initializeApp(FIREBASE_CONFIG);
        _auth = getAuth(app);
        _db   = getFirestore(app);

        onAuthStateChanged(_auth, async fbUser => {
            if (fbUser) {
                const snap = await getDoc(doc(_db, 'users', fbUser.uid));
                const data = snap.exists() ? snap.data() : {};
                _user = {
                    uid:   fbUser.uid,
                    email: fbUser.email,
                    name:  data.name || fbUser.displayName || fbUser.email.split('@')[0],
                    role:  data.role || 'client',
                    productIds: data.productIds || [],
                    phone: data.phone || '',
                };
            } else {
                _user = null;
            }
            updateNavIcon();
            _onAuthCbs.forEach(cb => cb(_user));
            // If signed in and there's a pending callback, run it
            if (_user && _pendingCb) {
                const cb = _pendingCb; _pendingCb = null;
                closeModal(); cb(_user);
            }
        });
    }

    // ── MODAL INJECT ─────────────────────────────────────────────
    function injectModal() {
        if (document.getElementById('samModal')) return;

        const el = document.createElement('div');
        el.id = 'samModal';
        el.className = 'sam-overlay';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = `
            <div class="sam-card" role="dialog" aria-modal="true" aria-labelledby="samTitle">

                <!-- Close -->
                <button class="sam-close" id="samClose" aria-label="Close">
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>

                <!-- Logo -->
                <div class="sam-logo">
                    <div class="sam-logo-mark">✦</div>
                    <div class="sam-logo-name">SPhiri<span>Studio</span></div>
                </div>

                <!-- Auth wall reason (shown when checkout triggers) -->
                <div class="sam-wall-banner" id="samWallBanner" style="display:none">
                    <div class="sam-wall-icon" id="samWallIcon">🔒</div>
                    <div class="sam-wall-text" id="samWallText">Sign in to continue</div>
                </div>

                <!-- Tabs: Sign In / Sign Up -->
                <div class="sam-tabs" id="samTabs">
                    <button class="sam-tab active" data-mode="signin" id="tabSignin">Sign In</button>
                    <button class="sam-tab" data-mode="signup" id="tabSignup">Create Account</button>
                </div>

                <!-- Demo notice -->
                <div class="sam-demo" id="samDemo">
                    <span>⚡ Demo</span>
                    <code>client@sphiri.com / demo1234</code>
                </div>

                <!-- Form -->
                <div class="sam-form" id="samForm">
                    <!-- Sign Up only: Name -->
                    <div class="sam-field" id="fieldName" style="display:none">
                        <label for="samName">Full Name</label>
                        <input class="sam-input" id="samName" type="text" placeholder="Your name" autocomplete="name">
                    </div>

                    <!-- Sign Up only: Phone -->
                    <div class="sam-field" id="fieldPhone" style="display:none">
                        <label for="samPhone">WhatsApp / Phone <span class="sam-optional">(optional)</span></label>
                        <input class="sam-input" id="samPhone" type="tel" placeholder="+27 82 000 0000" autocomplete="tel">
                    </div>

                    <!-- Always: Email -->
                    <div class="sam-field">
                        <label for="samEmail">Email</label>
                        <input class="sam-input" id="samEmail" type="email" placeholder="you@example.com" autocomplete="email">
                    </div>

                    <!-- Always: Password -->
                    <div class="sam-field" id="fieldPassword">
                        <div class="sam-label-row">
                            <label for="samPassword">Password</label>
                            <button class="sam-forgot-link" id="samForgotLink">Forgot?</button>
                        </div>
                        <div class="sam-input-wrap">
                            <input class="sam-input" id="samPassword" type="password" placeholder="••••••••" autocomplete="current-password">
                            <button class="sam-eye" id="samEye" aria-label="Show password" tabindex="-1">
                                <svg id="eyeIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Sign Up only: Confirm Password -->
                    <div class="sam-field" id="fieldConfirm" style="display:none">
                        <label for="samConfirm">Confirm Password</label>
                        <div class="sam-input-wrap">
                            <input class="sam-input" id="samConfirm" type="password" placeholder="••••••••" autocomplete="new-password">
                        </div>
                    </div>

                    <!-- Sign Up only: Terms -->
                    <label class="sam-terms" id="fieldTerms" style="display:none">
                        <input type="checkbox" id="samTerms">
                        <span>I agree to the <a href="#" tabindex="-1">Terms</a> and <a href="#" tabindex="-1">Privacy Policy</a></span>
                    </label>

                    <!-- Error -->
                    <div class="sam-error" id="samError" role="alert"></div>

                    <!-- Primary CTA -->
                    <button class="sam-btn-primary" id="samSubmit">Sign In</button>

                    <!-- Divider -->
                    <div class="sam-divider"><span>or</span></div>

                    <!-- Google -->
                    <button class="sam-btn-google" id="samGoogle">
                        <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Continue with Google
                    </button>
                </div>

                <!-- Forgot password form (hidden by default) -->
                <div class="sam-form" id="samForgotForm" style="display:none">
                    <p class="sam-forgot-desc">Enter your email and we'll send a reset link.</p>
                    <div class="sam-field">
                        <label for="samForgotEmail">Email</label>
                        <input class="sam-input" id="samForgotEmail" type="email" placeholder="you@example.com" autocomplete="email">
                    </div>
                    <div class="sam-error" id="samForgotError" role="alert"></div>
                    <div class="sam-success" id="samForgotSuccess" style="display:none">✓ Reset link sent — check your inbox.</div>
                    <button class="sam-btn-primary" id="samForgotSubmit">Send Reset Link</button>
                    <button class="sam-back-link" id="samBackToSignin">← Back to Sign In</button>
                </div>

            </div>
        `;
        document.body.appendChild(el);
        wireModal();
    }

    // ── WIRE ──────────────────────────────────────────────────────
    function wireModal() {
        // Close
        document.getElementById('samClose').addEventListener('click', closeModal);
        document.getElementById('samModal').addEventListener('click', e => {
            if (e.target.id === 'samModal') closeModal();
        });

        // Tabs
        document.querySelectorAll('.sam-tab').forEach(tab => {
            tab.addEventListener('click', () => setMode(tab.dataset.mode));
        });

        // Show/hide password
        const eye = document.getElementById('samEye');
        const pwd = document.getElementById('samPassword');
        if (eye && pwd) {
            eye.addEventListener('click', () => {
                const shown = pwd.type === 'text';
                pwd.type = shown ? 'password' : 'text';
                eye.classList.toggle('active', !shown);
            });
        }

        // Forgot
        document.getElementById('samForgotLink').addEventListener('click', e => { e.preventDefault(); showForgot(); });
        document.getElementById('samBackToSignin').addEventListener('click', () => setMode('signin'));
        document.getElementById('samForgotSubmit').addEventListener('click', handleForgot);

        // Submit
        document.getElementById('samSubmit').addEventListener('click', handleSubmit);
        ['samEmail','samPassword','samConfirm','samName'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleSubmit(); });
        });

        // Google
        document.getElementById('samGoogle').addEventListener('click', handleGoogle);

        // Show demo notice in demo mode
        if (DEMO_MODE) document.getElementById('samDemo').style.display = 'flex';
    }

    // ── MODE ──────────────────────────────────────────────────────
    function setMode(mode) {
        _mode = mode;

        // Tabs
        document.querySelectorAll('.sam-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));

        // Show/hide fields
        const isSignUp = mode === 'signup';
        document.getElementById('fieldName').style.display    = isSignUp ? 'flex' : 'none';
        document.getElementById('fieldPhone').style.display   = isSignUp ? 'flex' : 'none';
        document.getElementById('fieldConfirm').style.display = isSignUp ? 'flex' : 'none';
        document.getElementById('fieldTerms').style.display   = isSignUp ? 'flex' : 'none';
        document.getElementById('samForgotLink').style.display = isSignUp ? 'none' : 'inline';
        document.getElementById('samGoogle').style.display    = isSignUp ? 'none' : 'flex';
        document.getElementById('samSubmit').textContent      = isSignUp ? 'Create Account' : 'Sign In';

        // Show/hide forgot form
        document.getElementById('samForm').style.display       = 'flex';
        document.getElementById('samForgotForm').style.display = 'none';
        document.getElementById('samTabs').style.display       = 'flex';

        clearError();
        // Focus email
        setTimeout(() => document.getElementById('samEmail')?.focus(), 50);
    }

    function showForgot() {
        _mode = 'forgot';
        document.getElementById('samForm').style.display       = 'none';
        document.getElementById('samForgotForm').style.display = 'flex';
        document.getElementById('samTabs').style.display       = 'none';
        clearError();
        setTimeout(() => document.getElementById('samForgotEmail')?.focus(), 50);
    }

    // ── SUBMIT ────────────────────────────────────────────────────
    async function handleSubmit() {
        const email  = document.getElementById('samEmail').value.trim();
        const pass   = document.getElementById('samPassword').value;
        const name   = document.getElementById('samName').value.trim();
        const phone  = document.getElementById('samPhone').value.trim();
        const conf   = document.getElementById('samConfirm').value;
        const terms  = document.getElementById('samTerms').checked;
        const isSignUp = _mode === 'signup';

        // Validation
        if (!email) { return shakeField('samEmail', 'Email is required'); }
        if (!pass)  { return shakeField('samPassword', 'Password is required'); }
        if (isSignUp) {
            if (!name)           return shakeField('samName', 'Please enter your name');
            if (pass.length < 6) return shakeField('samPassword', 'Password must be at least 6 characters');
            if (pass !== conf)   return shakeField('samConfirm', 'Passwords don\'t match');
            if (!terms)          return showError('Please accept the Terms to continue');
        }

        if (DEMO_MODE) {
            const demo = DEMO_USERS[email];
            if (demo && pass === 'demo1234') {
                _user = { uid: demo.uid, email, name: demo.name, role: demo.role, productIds: [] };
                sessionStorage.setItem('sphiri_demo_user', JSON.stringify(_user));
                closeModal();
                updateNavIcon();
                _onAuthCbs.forEach(cb => cb(_user));
                if (_pendingCb) { const cb = _pendingCb; _pendingCb = null; cb(_user); }
            } else if (isSignUp) {
                // Demo sign-up: create client session
                _user = { uid: 'u_' + Date.now(), email, name: name || email.split('@')[0], role: 'client', productIds: [] };
                sessionStorage.setItem('sphiri_demo_user', JSON.stringify(_user));
                closeModal();
                updateNavIcon();
                _onAuthCbs.forEach(cb => cb(_user));
                if (_pendingCb) { const cb = _pendingCb; _pendingCb = null; cb(_user); }
            } else {
                shakeField('samPassword', 'Incorrect credentials. Use demo1234.');
            }
            return;
        }

        setLoading(true);
        try {
            const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

            if (isSignUp) {
                const cred = await createUserWithEmailAndPassword(_auth, email, pass);
                await setDoc(doc(_db, 'users', cred.user.uid), {
                    email, name: name || email.split('@')[0],
                    phone: phone || '', role: 'client',
                    productIds: [], createdAt: serverTimestamp()
                });
            } else {
                await signInWithEmailAndPassword(_auth, email, pass);
            }
            closeModal();
        } catch(e) {
            shakeField('samPassword', friendlyError(e.code));
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle() {
        if (DEMO_MODE) { showError('Google sign-in requires Firebase config.'); return; }
        try {
            const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
            const { doc, getDoc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const { user } = await signInWithPopup(_auth, new GoogleAuthProvider());
            const snap = await getDoc(doc(_db, 'users', user.uid));
            if (!snap.exists()) {
                await setDoc(doc(_db, 'users', user.uid), {
                    email: user.email, name: user.displayName || user.email,
                    phone: '', role: 'client', productIds: [],
                    createdAt: serverTimestamp()
                });
            }
            closeModal();
        } catch(e) {
            showError(friendlyError(e.code));
        }
    }

    async function handleForgot() {
        const email = document.getElementById('samForgotEmail').value.trim();
        const errEl = document.getElementById('samForgotError');
        const okEl  = document.getElementById('samForgotSuccess');

        if (!email) {
            errEl.textContent = 'Enter your email address.';
            errEl.style.display = 'block'; return;
        }
        if (DEMO_MODE) {
            errEl.textContent = ''; errEl.style.display = 'none';
            okEl.style.display = 'block'; return;
        }
        const btn = document.getElementById('samForgotSubmit');
        btn.disabled = true; btn.textContent = 'Sending…';
        try {
            const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
            await sendPasswordResetEmail(_auth, email);
            errEl.style.display = 'none'; okEl.style.display = 'block';
        } catch(e) {
            errEl.textContent = friendlyError(e.code); errEl.style.display = 'block';
        } finally {
            btn.disabled = false; btn.textContent = 'Send Reset Link';
        }
    }

    async function handleSignOut() {
        if (DEMO_MODE) {
            _user = null;
            sessionStorage.removeItem('sphiri_demo_user');
            updateNavIcon();
            _onAuthCbs.forEach(cb => cb(null));
            if (window.location.pathname.includes('dashboard')) window.location.href = 'index.html';
            return;
        }
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
        await signOut(_auth);
        if (window.location.pathname.includes('dashboard')) window.location.href = 'index.html';
    }

    // ── OPEN / CLOSE ─────────────────────────────────────────────
    function openModal(reason, startMode) {
        const modal = document.getElementById('samModal');
        if (!modal) return;

        setMode(startMode || _mode || 'signin');

        // Auth wall banner
        const banner = document.getElementById('samWallBanner');
        const icon   = document.getElementById('samWallIcon');
        const text   = document.getElementById('samWallText');
        if (reason) {
            banner.style.display = 'flex';
            icon.textContent = reason.icon || '🔒';
            text.textContent = reason.text || reason;
        } else {
            banner.style.display = 'none';
        }

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('samEmail')?.focus(), 120);
    }

    function closeModal() {
        const modal = document.getElementById('samModal');
        if (!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        clearError();
        // If closed without signing in, clear pending callback
        if (!_user) _pendingCb = null;
    }

    // ── NAV ICON ─────────────────────────────────────────────────
    function updateNavIcon() {
        const btn = document.getElementById('navAccountBtn');
        if (!btn) return;

        if (_user) {
            const colors = { admin: '#ff9500', partner: '#30d158', client: 'var(--accent)' };
            const col    = colors[_user.role] || 'var(--accent)';
            btn.innerHTML = `<div class="nav-acct-avatar" style="background:${col}">${_user.name[0].toUpperCase()}</div>`;
            btn.title     = `${_user.name} · ${_user.role}`;
        } else {
            btn.innerHTML = `
                <div class="nav-acct-pill">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>Sign In</span>
                </div>`;
            btn.title = 'Sign in to your Studio';
        }
    }
    window.addEventListener('navReady', updateNavIcon);

    // ── HELPERS ──────────────────────────────────────────────────
    function showError(msg) {
        const el = document.getElementById('samError');
        if (!el) return;
        el.textContent = msg; el.style.display = 'block';
        clearTimeout(el._t);
        el._t = setTimeout(() => { el.style.display = 'none'; el.textContent = ''; }, 5000);
    }
    function clearError() {
        const el = document.getElementById('samError');
        if (el) { el.textContent = ''; el.style.display = 'none'; }
    }
    function shakeField(id, msg) {
        const el = document.getElementById(id);
        if (!el) { showError(msg); return; }
        showError(msg);
        el.style.borderColor = '#ff3b30';
        el.style.animation   = 'samShake 0.35s ease';
        el.focus();
        setTimeout(() => { el.style.animation = ''; el.style.borderColor = ''; }, 600);
    }
    function setLoading(on) {
        const btn = document.getElementById('samSubmit');
        if (!btn) return;
        btn.disabled = on;
        btn.textContent = on ? 'Please wait…' : (_mode === 'signup' ? 'Create Account' : 'Sign In');
    }
    function friendlyError(code) {
        return ({
            'auth/wrong-password':          'Incorrect password.',
            'auth/user-not-found':          'No account with that email.',
            'auth/email-already-in-use':    'Email already registered.',
            'auth/weak-password':           'Password must be at least 6 characters.',
            'auth/invalid-email':           'Invalid email address.',
            'auth/too-many-requests':       'Too many attempts — try again later.',
            'auth/network-request-failed':  'Network error. Check your connection.',
            'auth/popup-closed-by-user':    'Sign-in popup was closed.',
            'auth/invalid-credential':      'Incorrect email or password.',
        })[code] || 'Something went wrong. Please try again.';
    }

    // ── STYLES ───────────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('samStyles')) return;
        const s = document.createElement('style');
        s.id = 'samStyles';
        s.textContent = `
/* ── AUTH MODAL OVERLAY ── */
.sam-overlay {
    position: fixed; inset: 0;
    z-index: 9000;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    background: rgba(0,0,0,0);
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
    pointer-events: none;
    transition: background 0.3s, backdrop-filter 0.3s;
}
.sam-overlay.open {
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    pointer-events: all;
}

/* ── CARD ── */
.sam-card {
    width: 100%; max-width: 390px;
    background: var(--bg, #fff);
    border: 1px solid var(--border, rgba(0,0,0,0.08));
    border-radius: 26px;
    padding: 32px 30px 28px;
    position: relative;
    opacity: 0;
    transform: translateY(20px) scale(0.97);
    transition: opacity 0.35s cubic-bezier(0.2,0.8,0.2,1), transform 0.35s cubic-bezier(0.2,0.8,0.2,1);
    box-shadow: 0 24px 60px rgba(0,0,0,0.18);
}
.sam-overlay.open .sam-card { opacity: 1; transform: translateY(0) scale(1); }

/* Close button */
.sam-close {
    position: absolute; top: 14px; right: 14px;
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--bg2, #f5f5f7); border: none;
    color: var(--muted, #86868b); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, color 0.2s;
}
.sam-close:hover { background: var(--border); color: var(--text); }

/* Logo */
.sam-logo {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 20px;
}
.sam-logo-mark {
    width: 32px; height: 32px;
    background: var(--accent, #0071e3);
    color: #fff; border-radius: 10px;
    font-size: 14px;
    display: flex; align-items: center; justify-content: center;
}
.sam-logo-name {
    font-size: 13px; font-weight: 900;
    letter-spacing: -0.3px;
    color: var(--text, #1d1d1f);
}
.sam-logo-name span { color: var(--muted, #86868b); font-weight: 600; }

/* Auth wall banner */
.sam-wall-banner {
    display: flex; align-items: center; gap: 12px;
    background: rgba(0,113,227,0.07);
    border: 1.5px solid rgba(0,113,227,0.2);
    border-radius: 14px; padding: 12px 14px;
    margin-bottom: 16px;
}
[data-theme="dark"] .sam-wall-banner {
    background: rgba(10,132,255,0.1);
    border-color: rgba(10,132,255,0.25);
}
.sam-wall-icon { font-size: 20px; flex-shrink: 0; }
.sam-wall-text { font-size: 13px; font-weight: 700; color: var(--text); line-height: 1.4; }

/* Tabs */
.sam-tabs {
    display: flex; gap: 4px;
    background: var(--bg2, #f5f5f7);
    border-radius: 12px; padding: 4px;
    margin-bottom: 18px;
}
.sam-tab {
    flex: 1; padding: 9px;
    border: none; border-radius: 9px;
    background: transparent;
    color: var(--muted); font-size: 13px; font-weight: 700;
    font-family: inherit; cursor: pointer;
    transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}
.sam-tab.active {
    background: var(--bg, #fff);
    color: var(--text);
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

/* Demo notice */
.sam-demo {
    display: none; align-items: center; gap: 8px;
    background: rgba(255,149,0,0.07);
    border: 1px solid rgba(255,149,0,0.2);
    border-radius: 10px; padding: 8px 12px;
    margin-bottom: 14px;
    font-size: 11px; color: var(--muted);
}
.sam-demo span { color: #ff9500; font-weight: 800; }
.sam-demo code { font-family: monospace; color: var(--text); }

/* Form */
.sam-form { display: flex; flex-direction: column; gap: 0; }

.sam-field {
    display: flex; flex-direction: column; gap: 5px;
    margin-bottom: 12px;
}
.sam-field label {
    font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.8px;
    color: var(--muted);
}
.sam-optional { text-transform: none; letter-spacing: 0; font-weight: 600; }

.sam-label-row {
    display: flex; justify-content: space-between; align-items: center;
}
.sam-forgot-link {
    background: none; border: none;
    color: var(--accent); font-size: 11px; font-weight: 700;
    cursor: pointer; padding: 0; font-family: inherit;
}
.sam-forgot-link:hover { opacity: 0.7; }

.sam-input-wrap { position: relative; }

.sam-input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1.5px solid var(--border, rgba(0,0,0,0.1));
    background: var(--bg2, #f5f5f7);
    color: var(--text, #1d1d1f);
    font-size: 15px; font-family: inherit;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
}
.sam-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(0,113,227,0.1);
}
[data-theme="dark"] .sam-input:focus { box-shadow: 0 0 0 3px rgba(10,132,255,0.13); }
.sam-input::placeholder { color: var(--muted); opacity: 0.6; }
.sam-input-wrap .sam-input { padding-right: 42px; }

.sam-eye {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: var(--muted);
    display: flex; align-items: center; padding: 4px;
    transition: color 0.2s;
}
.sam-eye.active, .sam-eye:hover { color: var(--accent); }

/* Terms */
.sam-terms {
    display: flex; align-items: flex-start; gap: 9px;
    font-size: 12px; color: var(--muted);
    cursor: pointer; margin-bottom: 12px;
    line-height: 1.5;
}
.sam-terms input { margin-top: 2px; accent-color: var(--accent); flex-shrink: 0; }
.sam-terms a { color: var(--accent); }

/* Error */
.sam-error {
    display: none;
    font-size: 12px; color: #ff3b30;
    background: rgba(255,59,48,0.07);
    border: 1px solid rgba(255,59,48,0.15);
    border-radius: 9px; padding: 9px 12px;
    margin-bottom: 10px;
    line-height: 1.4;
}

/* Success */
.sam-success {
    font-size: 12px; color: #34c759;
    background: rgba(52,199,89,0.07);
    border: 1px solid rgba(52,199,89,0.2);
    border-radius: 9px; padding: 9px 12px;
    margin-bottom: 10px;
}

/* Primary btn */
.sam-btn-primary {
    width: 100%; padding: 14px;
    background: var(--accent, #0071e3); color: #fff;
    border: none; border-radius: 12px;
    font-size: 15px; font-weight: 800;
    font-family: inherit; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    margin-bottom: 10px;
}
.sam-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
.sam-btn-primary:active { transform: translateY(0); }
.sam-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* Divider */
.sam-divider {
    display: flex; align-items: center; gap: 10px;
    color: var(--muted); font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.6px;
    margin-bottom: 10px;
}
.sam-divider::before, .sam-divider::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
}

/* Google btn */
.sam-btn-google {
    width: 100%; padding: 12px;
    background: var(--bg2); color: var(--text);
    border: 1.5px solid var(--border);
    border-radius: 12px;
    font-size: 14px; font-weight: 700;
    font-family: inherit; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 9px;
    transition: border-color 0.2s, box-shadow 0.2s;
    margin-bottom: 0;
}
.sam-btn-google:hover { border-color: var(--text); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

/* Forgot form */
.sam-forgot-desc { font-size: 13px; color: var(--muted); margin-bottom: 16px; line-height: 1.5; }
.sam-back-link {
    width: 100%; background: none; border: none;
    color: var(--accent); font-size: 13px; font-weight: 700;
    cursor: pointer; padding: 10px; font-family: inherit;
    text-align: center;
}

/* Nav account button */
.nav-acct-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    color: #fff; font-size: 12px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 3px rgba(0,0,0,0.12);
}
.nav-acct-pill {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 11px; border-radius: 980px;
    background: var(--bg2);
    border: 1px solid var(--border);
    font-size: 12px; font-weight: 700;
    color: var(--text);
    transition: border-color 0.2s;
}
.nav-acct-pill:hover { border-color: var(--accent); color: var(--accent); }

/* Shake keyframes */
@keyframes samShake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-5px); }
    40%     { transform: translateX(5px); }
    60%     { transform: translateX(-3px); }
    80%     { transform: translateX(3px); }
}

/* Responsive */
@media (max-width: 440px) {
    .sam-card { padding: 24px 20px 22px; border-radius: 22px; }
}
        `;
        document.head.appendChild(s);
    }

    // ── PUBLIC API ───────────────────────────────────────────────
    window.studioAuth = {
        get user()      { return _user; },
        get isSignedIn(){ return !!_user; },
        get role()      { return _user?.role || 'guest'; },

        openSignIn(reason, mode) { openModal(reason, mode || 'signin'); },
        openSignUp(reason)       { openModal(reason, 'signup'); },
        signOut: handleSignOut,

        // Gate: if not signed in, open modal; call cb once auth resolves
        requireAuth(reason, callback) {
            if (_user) { callback(_user); return; }
            _pendingCb     = callback;
            _pendingReason = reason;
            openModal(reason, 'signin');
            // Watch for sign-in
            const check = () => {
                if (_user) { closeModal(); callback(_user); }
            };
            _onAuthCbs.push(check);
        },

        onChange(cb) {
            _onAuthCbs.push(cb);
            cb(_user);
            return () => { _onAuthCbs = _onAuthCbs.filter(f => f !== cb); };
        },
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();