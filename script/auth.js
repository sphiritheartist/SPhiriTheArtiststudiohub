/* ================================================================
   SPHIRITHEARTIST — auth.js
   Shared authentication module. Loaded on every page.
   Exposes: window.studioAuth
   ================================================================ */

(function () {

    // ── FIREBASE CONFIG ─────────────────────────────────────────
    // Replace with your Firebase project config
    const FIREBASE_CONFIG = {
        apiKey:            "YOUR_API_KEY",
        authDomain:        "YOUR_PROJECT.firebaseapp.com",
        projectId:         "YOUR_PROJECT_ID",
        storageBucket:     "YOUR_PROJECT.appspot.com",
        messagingSenderId: "YOUR_SENDER_ID",
        appId:             "YOUR_APP_ID"
    };

    const DEMO_MODE = FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY';

    // ── DEMO DATA ────────────────────────────────────────────────
    const DEMO_USERS = {
        'admin@sphiri.com':   { role: 'admin',   name: 'Studio Admin',  uid: 'u_admin',   productIds: [] },
        'partner@sphiri.com': { role: 'partner', name: 'SK8 Partner',   uid: 'u_partner', productIds: ['SKT-001','SKT-002','APP-001'] },
        'client@sphiri.com':  { role: 'client',  name: 'Alex Client',   uid: 'u_client',  productIds: [] },
    };

    // ── STATE ─────────────────────────────────────────────────────
    let _user       = null;  // { uid, email, name, role, productIds }
    let _onAuthCbs  = [];
    let _firebase   = null;
    let _auth       = null;
    let _db         = null;

    // ── BOOT ──────────────────────────────────────────────────────
    async function init() {
        injectModal();
        injectStyles();

        if (DEMO_MODE) {
            const saved = sessionStorage.getItem('sphiri_demo_user');
            if (saved) {
                _user = JSON.parse(saved);
                updateNavIcon(); // may be a no-op if nav not ready yet
                _onAuthCbs.forEach(cb => cb(_user));
            }
            return;
        }

        // Load Firebase dynamically
        const { initializeApp }          = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
        const { getFirestore, doc, getDoc }   = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

        _firebase = initializeApp(FIREBASE_CONFIG);
        _auth     = getAuth(_firebase);
        _db       = getFirestore(_firebase);

        onAuthStateChanged(_auth, async (fbUser) => {
            if (fbUser) {
                const snap = await getDoc(doc(_db, 'users', fbUser.uid));
                const data = snap.exists() ? snap.data() : {};
                _user = {
                    uid:        fbUser.uid,
                    email:      fbUser.email,
                    name:       data.name || fbUser.displayName || fbUser.email.split('@')[0],
                    role:       data.role || 'client',
                    productIds: data.productIds || [],
                };
            } else {
                _user = null;
            }
            updateNavIcon();
            _onAuthCbs.forEach(cb => cb(_user));
        });
    }

    // ── MODAL HTML ────────────────────────────────────────────────
    function injectModal() {
        if (document.getElementById('studioAuthModal')) return;

        document.body.insertAdjacentHTML('beforeend', `
            <div id="studioAuthModal" class="sam-backdrop" aria-hidden="true">
                <div class="sam-card" role="dialog" aria-modal="true">
                    <button class="sam-close" id="samClose" aria-label="Close">✕</button>

                    <div class="sam-brand">SPHIRI<span>THE</span>ARTIST</div>

                    <div class="sam-demo-notice" id="samDemoNotice">
                        <strong>⚡ Demo Mode</strong>
                        <span>admin@sphiri.com / demo1234</span>
                        <span>partner@sphiri.com / demo1234</span>
                        <span>client@sphiri.com / demo1234</span>
                    </div>

                    <h2 class="sam-title" id="samTitle">Sign In</h2>
                    <p class="sam-sub" id="samSub">Access your Studio account</p>

                    <div id="samNameRow" class="sam-field" style="display:none">
                        <label>Display Name</label>
                        <input class="sam-input" id="samName" type="text" placeholder="Your name" autocomplete="name" />
                    </div>
                    <div class="sam-field">
                        <label>Email</label>
                        <input class="sam-input" id="samEmail" type="email" placeholder="you@example.com" autocomplete="email" />
                    </div>
                    <div class="sam-field">
                        <label>Password</label>
                        <input class="sam-input" id="samPassword" type="password" placeholder="••••••••" autocomplete="current-password" />
                    </div>

                    <div class="sam-error" id="samError"></div>

                    <button class="sam-btn sam-btn-primary" id="samSubmit">Sign In</button>
                    <button class="sam-btn sam-btn-google" id="samGoogle">
                        <svg width="16" height="16" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>
                    <button class="sam-toggle" id="samToggle">New here? Create account →</button>
                </div>
            </div>
        `);

        // Wire events
        document.getElementById('samClose').addEventListener('click', closeModal);
        document.getElementById('studioAuthModal').addEventListener('click', e => { if (e.target.id === 'studioAuthModal') closeModal(); });
        document.getElementById('samSubmit').addEventListener('click', handleSubmit);
        document.getElementById('samGoogle').addEventListener('click', handleGoogle);
        document.getElementById('samToggle').addEventListener('click', toggleMode);
        document.getElementById('samEmail').addEventListener('keydown', e => { if (e.key === 'Enter') handleSubmit(); });
        document.getElementById('samPassword').addEventListener('keydown', e => { if (e.key === 'Enter') handleSubmit(); });

        if (DEMO_MODE) document.getElementById('samDemoNotice').style.display = 'flex';
    }

    // ── MODAL LOGIC ───────────────────────────────────────────────
    let _isSignUp = false;

    function openModal(reason) {
        const modal = document.getElementById('studioAuthModal');
        if (!modal) return;
        if (reason) document.getElementById('samSub').textContent = reason;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('samEmail')?.focus(), 100);
    }

    function closeModal() {
        const modal = document.getElementById('studioAuthModal');
        if (!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        clearError();
    }

    function toggleMode() {
        _isSignUp = !_isSignUp;
        document.getElementById('samTitle').textContent   = _isSignUp ? 'Create Account' : 'Sign In';
        document.getElementById('samSub').textContent     = _isSignUp ? 'Join the Studio' : 'Access your Studio account';
        document.getElementById('samSubmit').textContent  = _isSignUp ? 'Create Account' : 'Sign In';
        document.getElementById('samToggle').textContent  = _isSignUp ? '← Back to Sign In' : 'New here? Create account →';
        document.getElementById('samNameRow').style.display  = _isSignUp ? 'flex' : 'none';
        document.getElementById('samGoogle').style.display   = _isSignUp ? 'none' : 'flex';
    }

    async function handleSubmit() {
        const email    = document.getElementById('samEmail').value.trim();
        const password = document.getElementById('samPassword').value;
        const name     = document.getElementById('samName').value.trim();

        if (!email || !password) { showError('Email and password required.'); return; }

        if (DEMO_MODE) {
            const demo = DEMO_USERS[email];
            if (demo && password === 'demo1234') {
                _user = { uid: demo.uid, email, name: demo.name, role: demo.role, productIds: demo.productIds || [] };
                sessionStorage.setItem('sphiri_demo_user', JSON.stringify(_user));
                closeModal();
                updateNavIcon();
                _onAuthCbs.forEach(cb => cb(_user));
            } else {
                showError('Invalid credentials. Use demo passwords.');
            }
            return;
        }

        setLoading(true);
        try {
            const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

            if (_isSignUp) {
                const { user } = await createUserWithEmailAndPassword(_auth, email, password);
                await setDoc(doc(_db, 'users', user.uid), {
                    email, name: name || email.split('@')[0], role: 'client',
                    productIds: [], createdAt: serverTimestamp()
                });
            } else {
                await signInWithEmailAndPassword(_auth, email, password);
            }
            closeModal();
        } catch(e) {
            showError(friendlyError(e.code));
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
                    role: 'client', productIds: [], createdAt: serverTimestamp()
                });
            }
            closeModal();
        } catch(e) {
            showError(friendlyError(e.code));
        }
    }

    async function handleSignOut() {
        if (DEMO_MODE) {
            _user = null;
            sessionStorage.removeItem('sphiri_demo_user');
            updateNavIcon();
            _onAuthCbs.forEach(cb => cb(null));
            // If on dashboard, redirect home
            if (window.location.pathname.includes('dashboard')) window.location.href = 'index.html';
            return;
        }
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
        await signOut(_auth);
        if (window.location.pathname.includes('dashboard')) window.location.href = 'index.html';
    }

    // ── NAV ICON ──────────────────────────────────────────────────
    function updateNavIcon() {
        const btn = document.getElementById('navAccountBtn');
        if (!btn) return; // nav not loaded yet — navReady will re-trigger

        if (_user) {
            const colors = { admin: '#ff9500', partner: '#30d158', client: '#0071e3' };
            const col    = colors[_user.role] || '#0071e3';
            btn.innerHTML = `<div class="nav-acct-avatar" style="background:${col};color:${col}">${_user.name[0].toUpperCase()}</div>`;
            btn.title     = `${_user.name} · ${_user.role}`;
        } else {
            btn.innerHTML = `
                <div class="nav-acct-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span class="nav-acct-pill-label">Sign In</span>
                </div>
            `;
            btn.title = 'Sign in to your Studio';
        }
    }

    // Re-render icon whenever the nav gets injected
    window.addEventListener('navReady', updateNavIcon);

    // ── HELPERS ───────────────────────────────────────────────────
    function showError(msg) {
        const el = document.getElementById('samError');
        if (!el) return;
        el.textContent = msg;
        el.style.opacity = '1';
        clearTimeout(el._t);
        el._t = setTimeout(() => el.style.opacity = '0', 4000);
    }

    function clearError() {
        const el = document.getElementById('samError');
        if (el) { el.textContent = ''; el.style.opacity = '0'; }
    }

    function setLoading(state) {
        const btn = document.getElementById('samSubmit');
        if (btn) { btn.disabled = state; btn.textContent = state ? 'Please wait…' : (_isSignUp ? 'Create Account' : 'Sign In'); }
    }

    function friendlyError(code) {
        return ({
            'auth/wrong-password':       'Incorrect password.',
            'auth/user-not-found':       'No account with that email.',
            'auth/email-already-in-use': 'Email already in use.',
            'auth/weak-password':        'Password must be 6+ characters.',
            'auth/invalid-email':        'Invalid email address.',
            'auth/too-many-requests':    'Too many attempts. Try again later.',
        })[code] || 'Something went wrong. Please try again.';
    }

    // ── CSS ───────────────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('studioAuthStyles')) return;
        const style = document.createElement('style');
        style.id = 'studioAuthStyles';
        style.textContent = `
            /* Auth Modal */
            .sam-backdrop {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                z-index: 8000;
                display: flex; align-items: center; justify-content: center;
                padding: 20px;
                opacity: 0; pointer-events: none;
                transition: opacity 0.3s;
            }
            .sam-backdrop.open { opacity: 1; pointer-events: all; }
            .sam-card {
                width: 100%; max-width: 400px;
                background: var(--bg, #fff);
                border: 1px solid var(--border, rgba(0,0,0,0.08));
                border-radius: 24px;
                padding: 36px;
                position: relative;
                transform: translateY(16px) scale(0.97);
                transition: transform 0.35s cubic-bezier(0.2,0.8,0.2,1);
            }
            .sam-backdrop.open .sam-card { transform: translateY(0) scale(1); }

            .sam-close {
                position: absolute; top: 16px; right: 16px;
                background: var(--bg2, #f5f5f7); border: none;
                width: 28px; height: 28px; border-radius: 50%;
                font-size: 12px; cursor: pointer; color: var(--muted, #86868b);
                display: flex; align-items: center; justify-content: center;
                transition: background 0.2s;
            }
            .sam-close:hover { background: var(--border, rgba(0,0,0,0.12)); }

            .sam-brand {
                font-size: 10px; font-weight: 900;
                text-transform: uppercase; letter-spacing: 4px;
                color: var(--accent, #0071e3); margin-bottom: 20px;
            }
            .sam-brand span { color: var(--accent, #0071e3); }

            .sam-demo-notice {
                display: none; flex-direction: column; gap: 4px;
                background: rgba(255,149,0,0.08);
                border: 1px solid rgba(255,149,0,0.25);
                border-radius: 12px; padding: 12px 14px;
                margin-bottom: 18px; font-size: 11px;
                font-family: monospace; color: var(--muted, #86868b);
            }
            .sam-demo-notice strong { color: #ff9500; font-family: inherit; margin-bottom: 2px; }

            .sam-title { font-size: 24px; font-weight: 900; letter-spacing: -0.8px; margin-bottom: 4px; }
            .sam-sub   { font-size: 13px; color: var(--muted, #86868b); margin-bottom: 22px; }

            .sam-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
            .sam-field label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted, #86868b); }
            .sam-input {
                padding: 12px 14px; border-radius: 11px;
                border: 1.5px solid var(--border, rgba(0,0,0,0.08));
                background: var(--bg2, #f5f5f7); color: var(--text, #1d1d1f);
                font-size: 15px; font-family: inherit; outline: none;
                transition: border-color 0.2s;
            }
            .sam-input:focus { border-color: var(--accent, #0071e3); }

            .sam-error {
                font-size: 12px; color: #ff453a; min-height: 18px;
                margin-bottom: 8px; opacity: 0; transition: opacity 0.3s;
            }

            .sam-btn {
                width: 100%; padding: 13px; border-radius: 11px;
                border: none; font-size: 14px; font-weight: 800;
                font-family: inherit; cursor: pointer;
                transition: opacity 0.2s, transform 0.15s;
                margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;
            }
            .sam-btn:hover { opacity: 0.85; transform: translateY(-1px); }
            .sam-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
            .sam-btn-primary { background: var(--accent, #0071e3); color: #fff; }
            .sam-btn-google   { background: var(--bg2, #f5f5f7); color: var(--text, #1d1d1f); border: 1.5px solid var(--border, rgba(0,0,0,0.08)); }

            .sam-toggle {
                width: 100%; background: none; border: none;
                color: var(--accent, #0071e3); font-size: 12px;
                font-family: inherit; cursor: pointer; padding: 8px;
                text-align: center; margin-top: 2px;
            }

            /* Nav account button */
            .nav-account-btn {
                position: relative; background: none; border: none;
                cursor: pointer; padding: 4px;
                display: flex; align-items: center; justify-content: center;
                color: var(--text, #1d1d1f); opacity: 0.7;
                transition: opacity 0.2s;
            }
            .nav-account-btn:hover { opacity: 1; }

            .nav-account-avatar {
                width: 26px; height: 26px; border-radius: 50%;
                color: #fff; font-size: 11px; font-weight: 900;
                display: flex; align-items: center; justify-content: center;
            }
        `;
        document.head.appendChild(style);
    }

    // ── PUBLIC API ────────────────────────────────────────────────
    window.studioAuth = {
        // Current user (null if not signed in)
        get user() { return _user; },
        get isSignedIn() { return !!_user; },
        get role() { return _user?.role || 'browser'; },

        // Open sign-in modal (with optional reason message)
        openSignIn: openModal,
        signOut: handleSignOut,

        // Guard: opens sign-in if not authed, then calls callback when signed in
        requireAuth(reason, callback) {
            if (_user) { callback(_user); return; }
            openModal(reason || 'Sign in to continue');
            const unsub = this.onChange(u => { if (u) { unsub(); callback(u); } });
        },

        // Subscribe to auth state changes
        onChange(cb) {
            _onAuthCbs.push(cb);
            if (_user !== undefined) cb(_user); // immediate if already resolved
            return () => { _onAuthCbs = _onAuthCbs.filter(f => f !== cb); };
        },
    };

    // ── AUTO-INIT ─────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();