/* ================================================================
   SPHIRITHEARTIST — auth.js  v3
   Real localStorage sessions (Firebase-ready swap later)
   Flows: Choice → Sign In | Sign Up
   Gate: Checkout requires account
   ================================================================ */

(function () {
    'use strict';

    /* ── FIREBASE CONFIG (swap placeholders when ready) ────────── */
    const FIREBASE_CONFIG = {
        apiKey:            "YOUR_API_KEY",
        authDomain:        "YOUR_PROJECT.firebaseapp.com",
        projectId:         "YOUR_PROJECT_ID",
        storageBucket:     "YOUR_PROJECT.appspot.com",
        messagingSenderId: "YOUR_SENDER_ID",
        appId:             "YOUR_APP_ID"
    };
    const FIREBASE_READY = FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';

    /* ── STORAGE ────────────────────────────────────────────────── */
    const SESSION_KEY = 'sphiri_session_v1';
    const ACCOUNTS_KEY = 'sphiri_accounts_v1';

    function getSession() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(e) { return null; }
    }
    function setSession(user) {
        try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch(e) {}
    }
    function clearSession() {
        try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
    }
    function getAccounts() {
        try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}'); } catch(e) { return {}; }
    }
    function saveAccount(user, passwordHash) {
        const accounts = getAccounts();
        accounts[user.email.toLowerCase()] = { ...user, passwordHash };
        try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); } catch(e) {}
    }
    // Simple hash — not cryptographic, just obfuscation until Firebase
    function hashPassword(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0; }
        return 'lh_' + Math.abs(h).toString(36) + str.length.toString(36);
    }

    /* ── STATE ────────────────────────────────────────────────────*/
    let _user      = getSession();
    let _onAuthCbs = [];
    let _pendingCb = null;
    let _screen    = 'choice'; // 'choice' | 'signin' | 'signup'
    
    // User roles
    const ROLES = {
        ADMIN: 'admin',
        ORGANIZER: 'organizer',
        SUPPLIER: 'supplier',
        SKATER: 'skater',  // Regular user who can buy, RSVP, comment
        CLIENT: 'client'    // Legacy role
    };

    /* ── BOOT ─────────────────────────────────────────────────── */
    function init() {
        injectStyles();
        injectModal();
        updateNavIcon();
        _onAuthCbs.forEach(cb => cb(_user));

        if (FIREBASE_READY) bootFirebase();
    }

    async function bootFirebase() {
        try {
            const { initializeApp }               = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
            const { getAuth, onAuthStateChanged }  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
            const { getFirestore, doc, getDoc }    = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

            const app  = initializeApp(FIREBASE_CONFIG);
            const auth = getAuth(app);
            const db   = getFirestore(app);

            window._fbAuth = auth;
            window._fbDb   = db;

            onAuthStateChanged(auth, async fbUser => {
                if (fbUser) {
                    const snap = await getDoc(doc(db, 'users', fbUser.uid));
                    const data = snap.exists() ? snap.data() : {};
                    _user = {
                        uid:   fbUser.uid,
                        email: fbUser.email,
                        name:  data.name  || fbUser.displayName || fbUser.email.split('@')[0],
                        phone: data.phone || '',
                        role:  data.role  || 'client',
                        avatar: (data.name || fbUser.email)[0].toUpperCase(),
                        provider: 'firebase',
                    };
                    setSession(_user);
                } else {
                    _user = null;
                    clearSession();
                }
                updateNavIcon();
                _onAuthCbs.forEach(cb => cb(_user));
                if (_user && _pendingCb) { const cb = _pendingCb; _pendingCb = null; closeModal(); cb(_user); }
            });
        } catch(e) { console.warn('Firebase boot failed, using local auth', e); }
    }

    /* ── MODAL HTML ─────────────────────────────────────────────  */
    function injectModal() {
        if (document.getElementById('samModal')) return;
        const el = document.createElement('div');
        el.id = 'samModal';
        el.className = 'sam-overlay';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = `
<div class="sam-card" role="dialog" aria-modal="true">

    <button class="sam-close" id="samClose" aria-label="Close">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
    </button>

    <!-- Brand -->
    <div class="sam-brand">
        <div class="sam-brand-mark">✦</div>
        <span>SPhiri<strong>Studio</strong></span>
    </div>

    <!-- Checkout wall context -->
    <div class="sam-context" id="samContext" style="display:none">
        <div class="sam-context-icon">🛍</div>
        <div class="sam-context-body">
            <strong>Account required to checkout</strong>
            <span>Track your orders, confirm delivery and keep your purchases safe.</span>
        </div>
    </div>

    <!-- SCREEN: CHOICE ─────────────────────────────────────────── -->
    <div class="sam-screen" id="screenChoice">
        <h2 class="sam-heading">Welcome back<span class="sam-heading-dot">.</span></h2>
        <p class="sam-sub">Sign in to your account or create a new one.</p>

        <div class="sam-choice-btns">
            <button class="sam-choice-btn sam-choice-signin" id="choiceSignIn">
                <div class="sam-choice-icon">→</div>
                <div class="sam-choice-label">
                    <strong>Sign In</strong>
                    <span>I have an account</span>
                </div>
            </button>
            <button class="sam-choice-btn sam-choice-signup" id="choiceSignUp">
                <div class="sam-choice-icon">✦</div>
                <div class="sam-choice-label">
                    <strong>Create Account</strong>
                    <span>New to SPhiri Studio</span>
                </div>
            </button>
        </div>

        <p class="sam-browse-note">Just browsing? <button class="sam-link-btn" id="choiceBrowse">Continue without account</button></p>
    </div>

    <!-- SCREEN: SIGN IN ─────────────────────────────────────────── -->
    <div class="sam-screen" id="screenSignIn" style="display:none">
        <button class="sam-back-btn" id="backFromSignIn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
        </button>
        <h2 class="sam-heading">Sign In<span class="sam-heading-dot">.</span></h2>

        <div class="sam-fields">
            <div class="sam-field">
                <label for="siEmail">Email</label>
                <input class="sam-input" id="siEmail" type="email" placeholder="you@example.com" autocomplete="email">
            </div>
            <div class="sam-field">
                <div class="sam-field-header">
                    <label for="siPassword">Password</label>
                    <button class="sam-link-btn" id="forgotBtn">Forgot password?</button>
                </div>
                <div class="sam-input-wrap">
                    <input class="sam-input" id="siPassword" type="password" placeholder="••••••••" autocomplete="current-password">
                    <button class="sam-eye" id="siEye" tabindex="-1" aria-label="Show password">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
            </div>
        </div>

        <div class="sam-error" id="siError"></div>
        <button class="sam-primary-btn" id="siSubmit">Sign In</button>

        <div class="sam-divider"><span>or</span></div>
        <button class="sam-google-btn" id="siGoogle">
            <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
        </button>

        <p class="sam-switch-note">No account? <button class="sam-link-btn" id="siGoSignUp">Create one →</button></p>
    </div>

    <!-- SCREEN: SIGN UP ─────────────────────────────────────────── -->
    <div class="sam-screen" id="screenSignUp" style="display:none">
        <button class="sam-back-btn" id="backFromSignUp">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
        </button>
        <h2 class="sam-heading">Create Account<span class="sam-heading-dot">.</span></h2>

        <div class="sam-fields">
            <div class="sam-field">
                <label for="suName">Full Name</label>
                <input class="sam-input" id="suName" type="text" placeholder="Your name" autocomplete="name">
            </div>
            <div class="sam-field">
                <label for="suEmail">Email</label>
                <input class="sam-input" id="suEmail" type="email" placeholder="you@example.com" autocomplete="email">
            </div>
            <div class="sam-field">
                <label for="suPhone">
                    WhatsApp Number
                    <span class="sam-optional-tag">optional</span>
                </label>
                <div class="sam-input-wrap">
                    <span class="sam-input-prefix">🇿🇦</span>
                    <input class="sam-input sam-input-prefixed" id="suPhone" type="tel" placeholder="+27 82 000 0000" autocomplete="tel">
                </div>
                <span class="sam-field-hint">Used for order updates and Pudo delivery notifications</span>
            </div>
            <div class="sam-field">
                <label for="suPassword">Password</label>
                <div class="sam-input-wrap">
                    <input class="sam-input" id="suPassword" type="password" placeholder="At least 6 characters" autocomplete="new-password">
                    <button class="sam-eye" id="suEye" tabindex="-1" aria-label="Show password">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
            </div>
            <div class="sam-field">
                <label for="suConfirm">Confirm Password</label>
                <input class="sam-input" id="suConfirm" type="password" placeholder="••••••••" autocomplete="new-password">
            </div>
            <label class="sam-terms">
                <input type="checkbox" id="suTerms">
                <span>I agree to the <a href="terms.html" target="_blank">Terms of Service</a> and <a href="terms.html#privacy" target="_blank">Privacy Policy</a></span>
            </label>
        </div>

        <div class="sam-error" id="suError"></div>
        <button class="sam-primary-btn" id="suSubmit">Create Account</button>

        <p class="sam-switch-note">Already have an account? <button class="sam-link-btn" id="suGoSignIn">Sign in →</button></p>
    </div>

    <!-- SCREEN: FORGOT PASSWORD ──────────────────────────────────── -->
    <div class="sam-screen" id="screenForgot" style="display:none">
        <button class="sam-back-btn" id="backFromForgot">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Sign In
        </button>
        <h2 class="sam-heading">Reset Password<span class="sam-heading-dot">.</span></h2>
        <p class="sam-sub">Enter your email and we'll send a reset link.</p>
        <div class="sam-fields">
            <div class="sam-field">
                <label for="fpEmail">Email</label>
                <input class="sam-input" id="fpEmail" type="email" placeholder="you@example.com" autocomplete="email">
            </div>
        </div>
        <div class="sam-error"   id="fpError"></div>
        <div class="sam-success" id="fpSuccess" style="display:none">✓ Reset link sent — check your inbox.</div>
        <button class="sam-primary-btn" id="fpSubmit">Send Reset Link</button>
    </div>

    <!-- SCREEN: WELCOME (after sign up) ─────────────────────────── -->
    <div class="sam-screen sam-screen-center" id="screenWelcome" style="display:none">
        <div class="sam-welcome-icon">✦</div>
        <h2 class="sam-heading" id="welcomeName">Welcome.<span class="sam-heading-dot">.</span></h2>
        <p class="sam-sub" id="welcomeSub">Your account is ready.</p>
        <button class="sam-primary-btn" id="welcomeContinue">Continue →</button>
    </div>

</div>`;
        document.body.appendChild(el);
        wireModal();
    }

    /* ── WIRE ────────────────────────────────────────────────────  */
    function wireModal() {
        // Close
        document.getElementById('samClose').addEventListener('click', closeModal);
        document.getElementById('samModal').addEventListener('click', e => {
            if (e.target.id === 'samModal') closeModal();
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

        // Choice screen
        document.getElementById('choiceSignIn').addEventListener('click', () => showScreen('signin'));
        document.getElementById('choiceSignUp').addEventListener('click', () => showScreen('signup'));
        document.getElementById('choiceBrowse').addEventListener('click', closeModal);

        // Back buttons
        document.getElementById('backFromSignIn').addEventListener('click', () => showScreen('choice'));
        document.getElementById('backFromSignUp').addEventListener('click', () => showScreen('choice'));
        document.getElementById('backFromForgot').addEventListener('click', () => showScreen('signin'));

        // Cross-links
        document.getElementById('siGoSignUp').addEventListener('click', () => showScreen('signup'));
        document.getElementById('suGoSignIn').addEventListener('click', () => showScreen('signin'));

        // Forgot
        document.getElementById('forgotBtn').addEventListener('click', () => showScreen('forgot'));
        document.getElementById('fpSubmit').addEventListener('click',  handleForgot);

        // Sign in
        document.getElementById('siSubmit').addEventListener('click', handleSignIn);
        document.getElementById('siGoogle').addEventListener('click', handleGoogle);
        ['siEmail','siPassword'].forEach(id => {
            document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') handleSignIn(); });
        });

        // Sign up
        document.getElementById('suSubmit').addEventListener('click', handleSignUp);
        ['suName','suEmail','suPhone','suPassword','suConfirm'].forEach(id => {
            document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') handleSignUp(); });
        });

        // Welcome continue
        document.getElementById('welcomeContinue').addEventListener('click', () => {
            closeModal();
            if (_pendingCb) { const cb = _pendingCb; _pendingCb = null; cb(_user); }
        });

        // Password toggles
        wireEye('siEye', 'siPassword');
        wireEye('suEye', 'suPassword');
    }

    function wireEye(eyeId, inputId) {
        const eye = document.getElementById(eyeId);
        const inp = document.getElementById(inputId);
        if (!eye || !inp) return;
        eye.addEventListener('click', () => {
            const shown = inp.type === 'text';
            inp.type = shown ? 'password' : 'text';
            eye.classList.toggle('active', !shown);
        });
    }

    /* ── SCREENS ─────────────────────────────────────────────────  */
    function showScreen(name) {
        _screen = name;
        const map = {
            choice:  'screenChoice',
            signin:  'screenSignIn',
            signup:  'screenSignUp',
            forgot:  'screenForgot',
            welcome: 'screenWelcome',
        };
        Object.values(map).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        const target = map[name];
        if (target) {
            const el = document.getElementById(target);
            if (el) {
                el.style.display = name === 'welcome' ? 'flex' : 'block';
                el.style.animation = 'samSlideIn 0.28s cubic-bezier(0.2,0.8,0.2,1)';
            }
        }
        // Focus first input
        setTimeout(() => {
            const first = document.querySelector('#' + (target || '') + ' .sam-input');
            if (first) first.focus();
        }, 60);
    }

/* ── SIGN IN ─────────────────────────────────────────────────  */
    async function handleSignIn() {
        const email = val('siEmail');
        const pass  = val('siPassword');
        
        // Validation
        if (!email) return shake('siEmail', 'siError', 'Email is required');
        if (!isValidEmail(email)) return shake('siEmail', 'siError', 'Please enter a valid email');
        if (!pass) return shake('siPassword', 'siError', 'Password is required');
        if (pass.length < 6) return shake('siPassword', 'siError', 'Password must be at least 6 characters');

        if (FIREBASE_READY && window._fbAuth) {
            setLoading('siSubmit', true);
            try {
                const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
                await signInWithEmailAndPassword(window._fbAuth, email, pass);
                // onAuthStateChanged handles the rest
            } catch(e) {
                showError('siError', friendlyError(e.code));
            } finally { setLoading('siSubmit', false, 'Sign In'); }
            return;
        }

        // Local auth
        const accounts = getAccounts();
        const account  = accounts[email.toLowerCase()];
        if (!account) return shake('siEmail', 'siError', 'No account found with that email');
        if (account.passwordHash !== hashPassword(pass)) return shake('siPassword', 'siError', 'Incorrect password');

        _user = { uid: account.uid, email: account.email, name: account.name, phone: account.phone || '', role: account.role || 'client', avatar: account.name[0].toUpperCase(), provider: 'local' };
        setSession(_user);
        updateNavIcon();
        _onAuthCbs.forEach(cb => cb(_user));
        closeModal();
        if (_pendingCb) { const cb = _pendingCb; _pendingCb = null; cb(_user); }
    }

    /* ── SIGN UP ─────────────────────────────────────────────────  */
    async function handleSignUp() {
        const name  = val('suName');
        const email = val('suEmail');
        const phone = val('suPhone');
        const pass  = val('suPassword');
        const conf  = val('suConfirm');
        const terms = document.getElementById('suTerms').checked;

        // Validation
        if (!name) return shake('suName', 'suError', 'Please enter your name');
        if (name.length < 2) return shake('suName', 'suError', 'Name must be at least 2 characters');
        
        if (!email) return shake('suEmail', 'suError', 'Email is required');
        if (!isValidEmail(email)) return shake('suEmail', 'suError', 'Please enter a valid email');
        
        if (!pass) return shake('suPassword', 'suError', 'Password is required');
        if (pass.length < 6) return shake('suPassword', 'suError', 'Password must be at least 6 characters');
        if (pass.length > 128) return shake('suPassword', 'suError', 'Password must be less than 128 characters');
        
        if (pass !== conf) return shake('suConfirm', 'suError', 'Passwords don\'t match');
        if (!terms) return showError('suError', 'Please accept the Terms to continue');

        if (FIREBASE_READY && window._fbAuth) {
            setLoading('suSubmit', true);
            try {
                const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
                const { doc, setDoc, serverTimestamp }   = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
                const cred = await createUserWithEmailAndPassword(window._fbAuth, email, pass);
                await setDoc(doc(window._fbDb, 'users', cred.user.uid), {
                    email, name, phone: phone || '', role: 'client',
                    productIds: [], createdAt: serverTimestamp()
                });
                // onAuthStateChanged fires → sets _user → welcome screen below
            } catch(e) {
                showError('suError', friendlyError(e.code));
                setLoading('suSubmit', false, 'Create Account');
            }
            return;
        }

        // Local auth
        const accounts = getAccounts();
        if (accounts[email.toLowerCase()]) return shake('suEmail', 'suError', 'An account with this email already exists');

        const uid = 'u_' + Date.now().toString(36);
        const user = { uid, email, name, phone: phone || '', role: 'client', avatar: name[0].toUpperCase(), provider: 'local' };
        saveAccount(user, hashPassword(pass));
        _user = { ...user };
        setSession(_user);
        updateNavIcon();
        _onAuthCbs.forEach(cb => cb(_user));

        // Welcome screen
        document.getElementById('welcomeName').innerHTML = 'Welcome, ' + escHtml(name.split(' ')[0]) + '<span class="sam-heading-dot">.</span>';
        document.getElementById('welcomeSub').textContent = 'Your account is ready. Let\'s get you sorted.';
        showScreen('welcome');
    }

    /* ── GOOGLE ─────────────────────────────────────────────────  */
    async function handleGoogle() {
        if (!FIREBASE_READY) {
            showError('siError', 'Google sign-in will be available once Firebase is connected.');
            return;
        }
        try {
            const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
            const { doc, getDoc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            const { user } = await signInWithPopup(window._fbAuth, new GoogleAuthProvider());
            const snap = await getDoc(doc(window._fbDb, 'users', user.uid));
            if (!snap.exists()) {
                await setDoc(doc(window._fbDb, 'users', user.uid), {
                    email: user.email, name: user.displayName || user.email,
                    phone: '', role: 'client', productIds: [], createdAt: serverTimestamp()
                });
            }
            closeModal();
        } catch(e) { showError('siError', friendlyError(e.code)); }
    }

    /* ── FORGOT ─────────────────────────────────────────────────  */
    async function handleForgot() {
        const email = val('fpEmail');
        if (!email) return shake('fpEmail', 'fpError', 'Enter your email address');

        if (FIREBASE_READY && window._fbAuth) {
            setLoading('fpSubmit', true);
            try {
                const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
                await sendPasswordResetEmail(window._fbAuth, email);
                document.getElementById('fpError').style.display = 'none';
                document.getElementById('fpSuccess').style.display = 'block';
            } catch(e) { showError('fpError', friendlyError(e.code)); }
            finally { setLoading('fpSubmit', false, 'Send Reset Link'); }
            return;
        }
        // Local: just show success (no real email)
        document.getElementById('fpError').style.display   = 'none';
        document.getElementById('fpSuccess').style.display = 'block';
    }

    /* ── SIGN OUT ─────────────────────────────────────────────── */
    async function handleSignOut() {
        if (FIREBASE_READY && window._fbAuth) {
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
            await signOut(window._fbAuth);
        }
        _user = null;
        clearSession();
        updateNavIcon();
        _onAuthCbs.forEach(cb => cb(null));
        if (window.location.pathname.includes('dashboard')) window.location.href = 'index.html';
    }

    /* ── OPEN / CLOSE ────────────────────────────────────────── */
    function openModal(opts) {
        const modal = document.getElementById('samModal');
        if (!modal) return;

        // Show/hide context banner
        const ctx = document.getElementById('samContext');
        if (opts && opts.context) {
            ctx.style.display = 'flex';
        } else {
            ctx.style.display = 'none';
        }

        showScreen((opts && opts.screen) || 'choice');
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        const modal = document.getElementById('samModal');
        if (!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // Clear errors
        ['siError','suError','fpError'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.textContent = ''; el.style.display = 'none'; }
        });
        if (!_user) _pendingCb = null;
    }

    /* ── NAV ICON ────────────────────────────────────────────── */
    function updateNavIcon() {
        const btn = document.getElementById('navAccountBtn');
        if (!btn) return;
        if (_user) {
            const colors = { 
                admin: '#ff9500', 
                organizer: '#30d158', 
                supplier: '#5856d6',
                skater: 'var(--accent)',
                client: 'var(--accent)' 
            };
            const labels = {
                admin: 'Admin',
                organizer: 'Organizer',
                supplier: 'Supplier',
                skater: 'Skater',
                client: 'Client'
            };
            const col = colors[_user.role] || 'var(--accent)';
            const label = labels[_user.role] || _user.role;
            btn.innerHTML = `<div class="nav-acct-avatar" style="background:${col}" title="${escHtml(_user.name)} · ${label}">${escHtml(_user.name[0].toUpperCase())}</div>`;
        } else {
            btn.innerHTML = `<div class="nav-acct-pill"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Sign In</span></div>`;
        }
    }
    window.addEventListener('navReady', updateNavIcon);

    /* ── ROLE HELPERS ─────────────────────────────────────────── */
    function isOrganizer() { return _user && (_user.role === ROLES.ORGANIZER || _user.role === ROLES.ADMIN); }
    function isSupplier() { return _user && (_user.role === ROLES.SUPPLIER || _user.role === ROLES.ADMIN); }
    function isAdmin() { return _user && _user.role === ROLES.ADMIN; }
    function isSkater() { return _user && (_user.role === ROLES.SKATER || _user.role === ROLES.CLIENT || !_user.role); }

    /* ── HELPERS ─────────────────────────────────────────────── */
    function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
    function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
    function showError(errId, msg) {
        const el = document.getElementById(errId);
        if (!el) return;
        el.textContent = msg; el.style.display = 'block';
        clearTimeout(el._t); el._t = setTimeout(() => { el.style.display = 'none'; }, 6000);
    }
    function shake(inputId, errId, msg) {
        showError(errId, msg);
        const el = document.getElementById(inputId);
        if (!el) return;
        el.focus(); el.style.borderColor = '#ff3b30';
        el.style.animation = 'samShake 0.35s ease';
        setTimeout(() => { el.style.animation = ''; el.style.borderColor = ''; }, 500);
    }
    function setLoading(btnId, on, label) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.disabled = on; btn.textContent = on ? 'Please wait…' : (label || btn.textContent);
    }
    function friendlyError(code) {
        return ({
            'auth/wrong-password':         'Incorrect password.',
            'auth/invalid-credential':     'Incorrect email or password.',
            'auth/user-not-found':         'No account found with that email.',
            'auth/email-already-in-use':   'An account with this email already exists.',
            'auth/weak-password':          'Password must be at least 6 characters.',
            'auth/invalid-email':          'Please enter a valid email address.',
            'auth/too-many-requests':      'Too many attempts — try again in a few minutes.',
            'auth/network-request-failed': 'Network error. Check your connection.',
            'auth/popup-closed-by-user':   'Sign-in popup was closed.',
        })[code] || 'Something went wrong. Please try again.';
    }

    /* ── STYLES ─────────────────────────────────────────────── */
    function injectStyles() {
        if (document.getElementById('samStyles')) return;
        const s = document.createElement('style');
        s.id = 'samStyles';
        s.textContent = `
/* ── OVERLAY ── */
.sam-overlay {
    position: fixed; inset: 0; z-index: 9000;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    background: transparent;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
    pointer-events: none;
    transition: background 0.3s, backdrop-filter 0.3s;
}
.sam-overlay.open {
    background: rgba(0,0,0,0.52);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    pointer-events: all;
}

/* ── CARD ── */
.sam-card {
    width: 100%; max-width: 400px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 28px;
    padding: 30px 28px 26px;
    position: relative;
    opacity: 0;
    transform: translateY(24px) scale(0.96);
    transition: opacity 0.38s cubic-bezier(0.2,0.8,0.2,1),
                transform 0.38s cubic-bezier(0.2,0.8,0.2,1);
    box-shadow: 0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.04);
    max-height: 92vh;
    overflow-y: auto;
    scrollbar-width: none;
}
.sam-card::-webkit-scrollbar { display: none; }
.sam-overlay.open .sam-card { opacity: 1; transform: translateY(0) scale(1); }

/* ── CLOSE ── */
.sam-close {
    position: absolute; top: 14px; right: 14px;
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--bg2); border: none;
    color: var(--muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, color 0.15s;
}
.sam-close:hover { background: var(--border); color: var(--text); }

/* ── BRAND ── */
.sam-brand {
    display: flex; align-items: center; gap: 9px;
    margin-bottom: 22px;
    font-size: 13px; font-weight: 700;
    color: var(--text);
}
.sam-brand strong { font-weight: 900; }
.sam-brand-mark {
    width: 30px; height: 30px; border-radius: 9px;
    background: var(--accent); color: #fff;
    font-size: 13px; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
}

/* ── CONTEXT BANNER ── */
.sam-context {
    display: flex; align-items: flex-start; gap: 12px;
    background: rgba(0,113,227,0.07);
    border: 1.5px solid rgba(0,113,227,0.18);
    border-radius: 16px; padding: 13px 15px;
    margin-bottom: 20px;
}
[data-theme="dark"] .sam-context {
    background: rgba(10,132,255,0.09);
    border-color: rgba(10,132,255,0.22);
}
.sam-context-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
.sam-context-body { display: flex; flex-direction: column; gap: 3px; }
.sam-context-body strong { font-size: 13px; font-weight: 800; color: var(--text); }
.sam-context-body span  { font-size: 11px; color: var(--muted); line-height: 1.5; }

/* ── HEADINGS ── */
.sam-heading {
    font-size: 26px; font-weight: 900;
    letter-spacing: -0.8px; line-height: 1.1;
    color: var(--text); margin-bottom: 6px;
}
.sam-heading-dot { color: var(--accent); }
.sam-sub { font-size: 13px; color: var(--muted); margin-bottom: 22px; line-height: 1.5; }

/* ── CHOICE SCREEN ── */
.sam-choice-btns {
    display: flex; flex-direction: column; gap: 10px;
    margin-bottom: 18px; margin-top: 4px;
}
.sam-choice-btn {
    display: flex; align-items: center; gap: 16px;
    padding: 16px 18px;
    border-radius: 18px;
    border: 1.5px solid var(--border);
    background: var(--bg2);
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
    text-align: left; font-family: inherit;
}
.sam-choice-btn:hover { transform: translateY(-1px); }
.sam-choice-signin:hover { border-color: var(--accent); background: rgba(0,113,227,0.04); }
.sam-choice-signup:hover { border-color: #34c759;      background: rgba(52,199,89,0.04); }
[data-theme="dark"] .sam-choice-signin:hover { background: rgba(10,132,255,0.07); }
[data-theme="dark"] .sam-choice-signup:hover { background: rgba(52,199,89,0.07); }

.sam-choice-icon {
    width: 40px; height: 40px; border-radius: 12px;
    background: var(--bg); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; flex-shrink: 0;
    color: var(--accent);
    transition: background 0.2s;
}
.sam-choice-signup .sam-choice-icon { color: #34c759; }

.sam-choice-label { display: flex; flex-direction: column; gap: 2px; }
.sam-choice-label strong { font-size: 15px; font-weight: 800; color: var(--text); }
.sam-choice-label span   { font-size: 12px; color: var(--muted); }

.sam-browse-note { font-size: 12px; color: var(--muted); text-align: center; }

/* ── BACK BUTTON ── */
.sam-back-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; cursor: pointer;
    font-size: 12px; font-weight: 700; color: var(--muted);
    font-family: inherit; padding: 0; margin-bottom: 18px;
    transition: color 0.15s;
}
.sam-back-btn:hover { color: var(--text); }

/* ── FIELDS ── */
.sam-fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }

.sam-field { display: flex; flex-direction: column; gap: 5px; }
.sam-field label {
    font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.9px;
    color: var(--muted);
    display: flex; align-items: center; gap: 7px;
}
.sam-field-header {
    display: flex; justify-content: space-between; align-items: center;
}
.sam-optional-tag {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 5px; padding: 1px 6px;
    font-size: 9px; font-weight: 600; color: var(--muted);
    text-transform: none; letter-spacing: 0;
}
.sam-field-hint { font-size: 11px; color: var(--muted); line-height: 1.4; margin-top: 1px; }

.sam-input-wrap { position: relative; display: flex; align-items: center; }
.sam-input-prefix {
    position: absolute; left: 13px;
    font-size: 16px; pointer-events: none; z-index: 1;
}
.sam-input {
    width: 100%; padding: 12px 14px;
    border-radius: 12px;
    border: 1.5px solid var(--border);
    background: var(--bg2); color: var(--text);
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
.sam-input::placeholder { color: var(--muted); opacity: 0.55; }
.sam-input-prefixed { padding-left: 38px; }
.sam-input-wrap .sam-input:not(.sam-input-prefixed) { padding-right: 42px; }

.sam-eye {
    position: absolute; right: 12px;
    background: none; border: none; cursor: pointer;
    color: var(--muted); display: flex; align-items: center; padding: 4px;
    transition: color 0.15s;
}
.sam-eye:hover, .sam-eye.active { color: var(--accent); }

/* Terms */
.sam-terms {
    display: flex; align-items: flex-start; gap: 9px;
    font-size: 12px; color: var(--muted);
    cursor: pointer; line-height: 1.5;
}
.sam-terms input { margin-top: 2px; accent-color: var(--accent); flex-shrink: 0; }
.sam-terms a { color: var(--accent); text-decoration: none; }

/* ── ERRORS / SUCCESS ── */
.sam-error {
    display: none;
    font-size: 12px; color: #ff3b30;
    background: rgba(255,59,48,0.07);
    border: 1px solid rgba(255,59,48,0.14);
    border-radius: 10px; padding: 9px 13px;
    margin-bottom: 8px; line-height: 1.5;
}
.sam-success {
    font-size: 12px; color: #34c759;
    background: rgba(52,199,89,0.07);
    border: 1px solid rgba(52,199,89,0.18);
    border-radius: 10px; padding: 9px 13px;
    margin-bottom: 8px;
}

/* ── BUTTONS ── */
.sam-primary-btn {
    width: 100%; padding: 14px;
    background: var(--accent); color: #fff;
    border: none; border-radius: 13px;
    font-size: 15px; font-weight: 800;
    font-family: inherit; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    margin-bottom: 10px;
}
.sam-primary-btn:hover  { opacity: 0.88; transform: translateY(-1px); }
.sam-primary-btn:active { transform: translateY(0); }
.sam-primary-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

.sam-divider {
    display: flex; align-items: center; gap: 10px;
    color: var(--muted); font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.8px;
    margin: 2px 0 10px;
}
.sam-divider::before, .sam-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

.sam-google-btn {
    width: 100%; padding: 12px;
    background: var(--bg2); color: var(--text);
    border: 1.5px solid var(--border);
    border-radius: 13px;
    font-size: 14px; font-weight: 700;
    font-family: inherit; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 9px;
    transition: border-color 0.2s, box-shadow 0.2s;
    margin-bottom: 14px;
}
.sam-google-btn:hover { border-color: var(--text); box-shadow: 0 2px 8px rgba(0,0,0,0.07); }

.sam-link-btn {
    background: none; border: none; cursor: pointer;
    color: var(--accent); font-size: inherit;
    font-family: inherit; font-weight: 700; padding: 0;
    transition: opacity 0.15s;
}
.sam-link-btn:hover { opacity: 0.7; }

.sam-switch-note { font-size: 12px; color: var(--muted); text-align: center; }

/* ── FORGOT ── */
.sam-forgot-desc { font-size: 13px; color: var(--muted); margin-bottom: 16px; line-height: 1.5; }

/* ── WELCOME SCREEN ── */
.sam-screen-center {
    display: flex; flex-direction: column;
    align-items: center; text-align: center;
    padding: 20px 0 10px;
}
.sam-welcome-icon {
    font-size: 44px; color: var(--accent);
    margin-bottom: 16px;
    animation: samPop 0.5s cubic-bezier(0.2,1,0.2,1);
}
@keyframes samPop {
    0%   { transform: scale(0.3) rotate(-15deg); opacity: 0; }
    70%  { transform: scale(1.15) rotate(3deg); }
    100% { transform: scale(1) rotate(0); opacity: 1; }
}

/* ── NAV ── */
.nav-acct-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    color: #fff; font-size: 12px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 2px var(--bg), 0 0 0 3.5px rgba(0,0,0,0.1);
}
.nav-acct-pill {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 980px;
    background: var(--bg2); border: 1px solid var(--border);
    font-size: 12px; font-weight: 700; color: var(--text);
    transition: border-color 0.2s, color 0.2s;
    white-space: nowrap;
}
.nav-acct-pill:hover { border-color: var(--accent); color: var(--accent); }

/* ── ANIMATIONS ── */
@keyframes samSlideIn {
    from { opacity: 0; transform: translateX(12px); }
    to   { opacity: 1; transform: translateX(0); }
}
@keyframes samShake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-5px); }
    40%     { transform: translateX(5px); }
    60%     { transform: translateX(-3px); }
    80%     { transform: translateX(3px); }
}

/* ── SCREEN TRANSITION ── */
.sam-screen { animation: samSlideIn 0.28s cubic-bezier(0.2,0.8,0.2,1); }

/* Responsive */
@media (max-width: 440px) {
    .sam-card { padding: 24px 20px 22px; border-radius: 22px; }
    .sam-heading { font-size: 22px; }
    .sam-choice-btn { padding: 13px 14px; gap: 12px; }
}

/* ── LOADING SPINNER ── */
.sam-spinner {
    width: 24px; height: 24px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: samSpin 0.8s linear infinite;
    margin: 0 auto 12px;
}
@keyframes samSpin {
    to { transform: rotate(360deg); }
}
        `;
        document.head.appendChild(s);
    }

    /* ── PUBLIC API ─────────────────────────────────────────── */
    window.studioAuth = {
        get user()       { return _user; },
        get isSignedIn() { return !!_user; },
        get role()       { return _user ? _user.role : 'guest'; },

        openSignIn() { openModal({ screen: 'signin' }); },
        openSignUp() { openModal({ screen: 'signup' }); },
        open()       { openModal(); },
        signOut: handleSignOut,

        requireAuth(reason, callback) {
            if (_user) { callback(_user); return; }
            _pendingCb = callback;
            openModal({ context: true, screen: 'choice' });
        },

        onChange(cb) {
            _onAuthCbs.push(cb);
            cb(_user);
            return () => { _onAuthCbs = _onAuthCbs.filter(f => f !== cb); };
        },
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();