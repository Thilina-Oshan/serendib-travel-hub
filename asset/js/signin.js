/* Sign in / sign up / forgot password.
   Database-driven via PHP backend for sign in, with client-side enhancements. */

const Auth = (() => {
    const read = (s, k, d) => { try { return JSON.parse(s.getItem(k)) ?? d; } catch { return d; } };
    const write = (s, k, v) => s.setItem(k, JSON.stringify(v));
    let now = () => Date.now();
    const MAX_FAILS = 5, LOCK_MS = 30000, OTP_TTL = 5 * 60000, OTP_RESEND_MS = 30000, OTP_TRIES = 5;
    const enc = s => new TextEncoder().encode(s);
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

    /* Normalise +94 / 0094 numbers to local 0XXXXXXXXX so one person = one account */
    const norm = c => { let s = String(c || '').replace(/[\s\-().]/g, ''); if (s.startsWith('+94')) s = '0' + s.slice(3); else if (s.startsWith('0094')) s = '0' + s.slice(4); return s; };
    const validContact = c => /^(0\d{9}|\+\d{9,15})$/.test(norm(c));
    const validName = n => /^[\p{L}][\p{L}\s.'-]{1,59}$/u.test(String(n || '').trim());
    const validPassword = p => String(p || '').length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
    const score = p => { p = String(p || ''); return Math.min(4, (p.length >= 8) + (/[a-z]/.test(p) && /[A-Z]/.test(p)) + /\d/.test(p) + /[^A-Za-z0-9]/.test(p) + (p.length >= 12 ? 1 : 0) - (p.length < 8 ? 1 : 0)); };

    async function hashPw(pw, salt) {
        if (!globalThis.crypto?.subtle) return 'x' + btoa(salt + pw);
        const key = await crypto.subtle.importKey('raw', enc(pw), 'PBKDF2', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
        return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    const users = () => read(localStorage, 'esl_auth_users', []);
    const pub = u => ({ u_id: u.u_id, u_fname: u.u_fname, u_contact: u.u_contact });

    /* Simple per-contact lockout against password guessing */
    function lockLeft(c) { const f = read(localStorage, 'esl_auth_fail', {})[c]; return f && f.until > now() ? Math.ceil((f.until - now()) / 1000) : 0; }
    function addFail(c) { const all = read(localStorage, 'esl_auth_fail', {}), f = all[c] || { n: 0, until: 0 }; f.n++; if (f.n >= MAX_FAILS) { f.n = 0; f.until = now() + LOCK_MS; } all[c] = f; write(localStorage, 'esl_auth_fail', all); }
    function clearFail(c) { const all = read(localStorage, 'esl_auth_fail', {}); delete all[c]; write(localStorage, 'esl_auth_fail', all); }
    const startSession = (u, remember) => { const s = remember ? localStorage : sessionStorage; localStorage.removeItem('esl_auth_session'); sessionStorage.removeItem('esl_auth_session'); write(s, 'esl_auth_session', { u_id: u.u_id }); };

    return {
        norm, validContact, validName, validPassword, score, _clock: fn => { now = fn; },
        async signUp({ u_fname, u_contact, u_password }) {
            if (!validName(u_fname)) return { ok: false, field: 'u_fname', error: 'Enter your full name (letters only).' };
            if (!validContact(u_contact)) return { ok: false, field: 'u_contact', error: 'Enter a valid contact number.' };
            if (!validPassword(u_password)) return { ok: false, field: 'u_password', error: 'Use 8+ characters with letters and numbers.' };
            const c = norm(u_contact), all = users();
            if (all.some(u => u.u_contact === c)) return { ok: false, field: 'u_contact', error: 'This number is already registered. Try signing in.' };
            const salt = uid(), u = { u_id: uid(), u_fname: u_fname.trim(), u_contact: c, salt, u_password: await hashPw(u_password, salt), created: now() };
            all.push(u); write(localStorage, 'esl_auth_users', all); startSession(u, false); return { ok: true, user: pub(u) };
        },
        async signIn({ u_contact, u_password, remember }) {
            const c = norm(u_contact), wait = lockLeft(c);
            if (wait) return { ok: false, error: `Too many attempts. Try again in ${wait}s.` };
            const u = users().find(x => x.u_contact === c);
            if (!u || u.u_password !== await hashPw(u_password, u.salt)) { addFail(c); return { ok: false, error: 'Contact number or password is incorrect.' }; }
            clearFail(c); startSession(u, remember); return { ok: true, user: pub(u) };
        },
        /* Step 1 of forgot password. Never reveals whether the number is registered (except the demo code). */
        requestReset(u_contact) {
            const c = norm(u_contact), otp = read(localStorage, 'esl_auth_otp', {});
            if (otp[c] && now() - otp[c].sent < OTP_RESEND_MS) return { ok: false, error: `Please wait ${Math.ceil((OTP_RESEND_MS - (now() - otp[c].sent)) / 1000)}s before requesting another code.` };
            if (!users().some(u => u.u_contact === c)) return { ok: true };
            const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
            otp[c] = { code, exp: now() + OTP_TTL, sent: now(), tries: 0 }; write(localStorage, 'esl_auth_otp', otp);
            return { ok: true, demoCode: code };
        },
        /* Step 2: verify code, set new password */
        async resetPassword({ u_contact, code, u_password }) {
            const c = norm(u_contact), all = read(localStorage, 'esl_auth_otp', {}), o = all[c];
            if (!o || o.exp < now()) return { ok: false, field: 'code', error: 'That code has expired. Request a new one.' };
            if (o.tries >= OTP_TRIES) { delete all[c]; write(localStorage, 'esl_auth_otp', all); return { ok: false, field: 'code', error: 'Too many wrong codes. Request a new one.' }; }
            if (String(code).trim() !== o.code) { o.tries++; write(localStorage, 'esl_auth_otp', all); return { ok: false, field: 'code', error: 'Incorrect code.' }; }
            if (!validPassword(u_password)) return { ok: false, field: 'u_password', error: 'Use 8+ characters with letters and numbers.' };
            const us = users(), u = us.find(x => x.u_contact === c); u.salt = uid(); u.u_password = await hashPw(u_password, u.salt);
            write(localStorage, 'esl_auth_users', us); delete all[c]; write(localStorage, 'esl_auth_otp', all); clearFail(c); return { ok: true };
        },
        current() { const s = read(sessionStorage, 'esl_auth_session', null) || read(localStorage, 'esl_auth_session', null); const u = s && users().find(x => x.u_id === s.u_id); return u ? pub(u) : null; },
        signOut() { localStorage.removeItem('esl_auth_session'); sessionStorage.removeItem('esl_auth_session'); }
    };
})();
if (typeof module !== 'undefined') module.exports = Auth;

/* ---------------- UI wiring ---------------- */
if (typeof document !== 'undefined') (() => {
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const PANELS = ['signin', 'signup', 'forgot', 'done'];
    const toast = m => { $('#toastMsg').textContent = m; bootstrap.Toast.getOrCreateInstance('#toast', { delay: 4000 }).show(); };

    function show(id) {
        if (!PANELS.includes(id)) id = 'signin';
        PANELS.forEach(p => $('#p-' + p).hidden = p !== id);
        $('#tabs').hidden = id === 'forgot' || id === 'done';
        ['signin', 'signup'].forEach(t => { $('#tab-' + t).classList.toggle('active', t === id); $('#tab-' + t).setAttribute('aria-selected', t === id); });
        $$('.is-invalid').forEach(i => i.classList.remove('is-invalid')); $$('.alert').forEach(a => { if (a.id !== 'siErr') a.hidden = true; });
        if (id === 'forgot') resetStep(1);
        if (id !== 'done') setTimeout(() => $('#p-' + id + ' input')?.focus(), 50);
        if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    }
    const route = () => { show(location.hash.slice(1)); };
    addEventListener('hashchange', () => { show(location.hash.slice(1)); });
    document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) show(g.dataset.go); });

    /* Field helpers */
    const bad = (input, msg) => { input.classList.add('is-invalid'); input.parentElement.querySelector('.invalid-feedback').textContent = msg; input.focus(); return false; };
    document.addEventListener('input', e => e.target.classList?.remove('is-invalid'));
    const alertBox = (el, msg, type = 'danger') => { if (!el) return; el.className = `alert alert-${type}`; el.textContent = msg; el.hidden = false; };
    const busy = (btn, on, label) => { btn.disabled = on; btn.innerHTML = on ? '<span class="spinner-border spinner-border-sm me-2"></span>Please wait…' : label; };
    $$('.pw-toggle').forEach(b => b.addEventListener('click', () => { const i = $(b.dataset.target); i.type = i.type === 'password' ? 'text' : 'password'; b.textContent = i.type === 'password' ? 'Show' : 'Hide'; b.setAttribute('aria-label', i.type === 'password' ? 'Show password' : 'Hide password'); }));

    /* Password strength meters */
    const LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'], COLORS = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success'];
    function meter(inputSel, barSel, labelSel) {
        $(inputSel)?.addEventListener('input', e => {
            const v = e.target.value, s = v ? Auth.score(v) : -1, bar = $(barSel);
            if (bar) { bar.style.width = v ? (s + 1) * 20 + '%' : '0'; bar.className = 'progress-bar ' + (COLORS[s] || ''); }
            if (labelSel) $(labelSel).textContent = v ? `Strength: ${LABELS[s]}` : '';
        });
    }
    meter('#su_password', '#suBar', '#suLabel'); meter('#rs_password', '#rsBar');

    /* Sign up */
    $('#signupForm')?.addEventListener('submit', async e => {
        e.preventDefault(); const f = e.target, b = $('button[type=submit]', f); $('#suErr').hidden = true;
        if (!Auth.validName(f.u_fname.value)) return bad(f.u_fname, 'Enter your full name (letters only).');
        if (!Auth.validContact(f.u_contact.value)) return bad(f.u_contact, 'Enter a valid contact number, e.g. 0771234567.');
        if (!Auth.validPassword(f.u_password.value)) return bad(f.u_password, 'Use 8+ characters with letters and numbers.');
        if (f.u_password.value !== f.confirm.value) return bad(f.confirm, 'Passwords do not match.');
        busy(b, true); const r = await Auth.signUp({ u_fname: f.u_fname.value, u_contact: f.u_contact.value, u_password: f.u_password.value }); busy(b, false, 'Create account');
        if (!r.ok) { const el = { u_fname: f.u_fname, u_contact: f.u_contact, u_password: f.u_password }[r.field]; return el ? bad(el, r.error) : alertBox($('#suErr'), r.error); }
        f.reset(); $('#suBar').style.width = '0'; $('#suLabel').textContent = ''; toast('Account created. Welcome!');
    });

    /* Forgot password */
    let resetContact = '', cool = null;
    function resetStep(n) { $('#forgotForm').hidden = n !== 1; $('#resetForm').hidden = n !== 2; $('#fpMsg').hidden = true; clearInterval(cool); }
    function cooldown() {
        const b = $('#resend'); let s = 30; if (!b) return; b.disabled = true; clearInterval(cool);
        cool = setInterval(() => { s--; b.textContent = s > 0 ? `Resend code in ${s}s` : 'Resend code'; if (s <= 0) { b.disabled = false; clearInterval(cool); } }, 1000); b.textContent = `Resend code in ${s}s`;
    }
    function sendCode(contact, fromResend) {
        const r = Auth.requestReset(contact);
        if (!r.ok) return alertBox($('#fpMsg'), r.error, 'warning');
        resetContact = contact; $('#rsTo').textContent = Auth.norm(contact); resetStep(2);
        alertBox($('#fpMsg'), r.demoCode
            ? `Demo mode: your code is ${r.demoCode}. A real site would send this by SMS.`
            : 'If this number is registered, a code has been sent. It expires in 5 minutes.', 'info');
        cooldown(); $('#rs_code').focus(); if (fromResend) toast('A new code was sent.');
    }
    $('#forgotForm')?.addEventListener('submit', e => {
        e.preventDefault(); const f = e.target;
        if (!Auth.validContact(f.u_contact.value)) return bad(f.u_contact, 'Enter a valid contact number.');
        sendCode(f.u_contact.value, false);
    });
    $('#resend')?.addEventListener('click', () => sendCode(resetContact, true));
    $('#resetForm')?.addEventListener('submit', async e => {
        e.preventDefault(); const f = e.target, b = $('button[type=submit]', f);
        if (!/^\d{6}$/.test(f.code.value.trim())) return bad(f.code, 'Enter the 6-digit code.');
        if (!Auth.validPassword(f.u_password.value)) return bad(f.u_password, 'Use 8+ characters with letters and numbers.');
        if (f.u_password.value !== f.confirm.value) return bad(f.confirm, 'Passwords do not match.');
        busy(b, true); const r = await Auth.resetPassword({ u_contact: resetContact, code: f.code.value, u_password: f.u_password.value }); busy(b, false, 'Reset password');
        if (!r.ok) return bad({ code: f.code, u_password: f.u_password }[r.field] || f.code, r.error);
        f.reset(); $('#rsBar').style.width = '0'; show('signin'); toast('Password updated. Please sign in.');
    });

    route();
})();