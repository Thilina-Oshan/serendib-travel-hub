/* Client dashboard: auth, overview, booking, my bookings, reviews, profile.

   Demo storage = localStorage; keys shared with the public site and admin:

   esl_users, esl_session, esl_bookings, esl_reviews. Replace `store` with fetch() calls for a real API. */

(() => {

    const $ = (s, el = document) => el.querySelector(s);

    const $$ = (s, el = document) => [...el.querySelectorAll(s)];

    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const store = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) };

    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const DEST = ['Sigiriya Rock', 'Kandy & Temple of the Tooth', 'Galle Fort', 'Mirissa Beach', 'Arugam Bay', 'Yala National Park', 'Nuwara Eliya', 'Ella & Nine Arch Bridge', 'Custom route (from planner)'];

    const RATE = { Backpacker: 40, Family: 120, Luxury: 300 };

    const TITLES = { overview: 'Overview', book: 'Book a tour', bookings: 'My bookings', reviews: 'My reviews', profile: 'Profile' };

    const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

    const fmt = iso => iso ? new Date(iso + (iso.length === 10 ? 'T00:00' : '')).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '';

    const badge = s => s === 'Cancelled' ? 'bg-secondary' : s === 'Confirmed' ? 'bg-success' : 'bg-warning text-dark';

    const today = () => new Date().toISOString().slice(0, 10);

    const starInput = (val = 0) => [5, 4, 3, 2, 1].map(n => `<input type="radio" name="rating" id="st${n}" value="${n}" ${n === val ? 'checked' : ''}><label for="st${n}" title="${n} star${n > 1 ? 's' : ''}">★</label>`).join('');

    const toast = m => { $('#toastMsg').textContent = m; bootstrap.Toast.getOrCreateInstance('#toast', { delay: 3500 }).show(); };



    /* ---------- Single-user dashboard (no login required) ---------- */
    const DEFAULT_ID = 'dashboard-user';
    const user = () => ({
        id: DEFAULT_ID,
        name: store.get('esl_dashboard_name', 'Demo User'),
        email: store.get('esl_dashboard_email', 'demo@exploresrilanka.com')
    });
    let u = user(), editRv = null;
    const mine = k => store.get(k, []).filter(x => x.userId === u.id);

    /* ---------- Routing ---------- */
    function route() {
        u = user();
        $('#app').hidden = false;
        $('#uName').textContent = u.name;
        $('#uEmail').textContent = u.email;
        $('#uAvatar').textContent = (u.name[0] || 'U').toUpperCase();
        const v = TITLES[location.hash.slice(1)] ? location.hash.slice(1) : 'overview';
        $$('[data-v]').forEach(section => section.hidden = section.dataset.v !== v);
        $$('#sideNav .nav-link').forEach(a => a.classList.toggle('active', a.dataset.view === v));
        $('#viewTitle').textContent = TITLES[v];
        bootstrap.Offcanvas.getInstance('#sidebar')?.hide();
        scrollTo(0, 0);
        ({
            overview: renderOverview, book: prefill, bookings: renderBookings,
            reviews: renderReviews, profile: fillProfile
        })[v]();
    }
    addEventListener('hashchange', route);

    /* ---------- Overview ---------- */

    const bookingRow = (b, actions = '') => `<div class="bk-item"><div class="d-flex justify-content-between flex-wrap gap-2"><strong>${esc(b.dest)}</strong><span class="badge ${badge(b.status)}">${b.status}</span></div>

  <div class="small text-muted"><span class="ref">${b.ref}</span> · starts ${fmt(b.date)} · ${b.days} days · ${b.guests} guest(s) · ${esc(b.style)} · <strong>$${(+b.total).toLocaleString()}</strong></div>

  ${b.notes ? `<div class="small mt-1">“${esc(b.notes)}”</div>` : ''}${actions}</div>`;

    function renderOverview() {

        const bk = mine('esl_bookings'), live = bk.filter(b => b.status !== 'Cancelled'), up = live.filter(b => b.date >= today()).sort((a, b) => a.date.localeCompare(b.date));

        $('#hello').textContent = `Hello, ${u.name.split(' ')[0]} 👋`;

        const nx = up[0];

        $('#nextTrip').textContent = nx ? `Next trip: ${nx.dest} on ${fmt(nx.date)} (${Math.max(0, Math.ceil((new Date(nx.date + 'T00:00') - new Date()) / 864e5))} days to go).` : 'No upcoming trips yet. Ready to plan one?';

        const stat = (n, l) => `<div class="col-6 col-xl-3"><div class="stat"><b>${n}</b><span>${l}</span></div></div>`;

        $('#stats').innerHTML = stat(bk.length, 'Total bookings') + stat(up.length, 'Upcoming trips') + stat(bk.filter(b => b.status === 'Confirmed').length, 'Confirmed') + stat(mine('esl_reviews').length, 'Reviews posted');

        $('#recent').innerHTML = bk.length ? bk.slice(-3).reverse().map(b => bookingRow(b)).join('') : '<p class="text-muted mb-0">Nothing booked yet. <a href="#book">Book your first tour</a>.</p>';

    }



    /* ---------- Book a tour ---------- */

    const bf = $('#bookForm'), E = bf.elements;

    DEST.forEach(n => E.dest.add(new Option(n, n)));

    E.date.min = today();

    const total = () => (RATE[E.style.value] || 0) * (+E.days.value || 0) * (+E.guests.value || 0);

    const upd = () => $('#estTotal').textContent = '$' + total().toLocaleString();

    ['style', 'days', 'guests'].forEach(n => E[n].addEventListener('input', upd)); upd();

    function prefill() { E.name.value ||= u.name; E.email.value ||= u.email; }

    bf.addEventListener('submit', e => {

        e.preventDefault(); bf.classList.add('was-validated'); if (!bf.checkValidity()) return;

        const b = {

            id: uid(), ref: 'ESL-' + Math.random().toString(36).slice(2, 7).toUpperCase(), userId: u.id, name: E.name.value.trim(), email: E.email.value.trim(), phone: E.phone.value.trim(),

            dest: E.dest.value, date: E.date.value, days: +E.days.value, guests: +E.guests.value, style: E.style.value, notes: E.notes.value.trim(), total: total(), status: 'Pending', created: new Date().toISOString()

        };

        const all = store.get('esl_bookings', []); all.push(b); store.set('esl_bookings', all);

        bf.hidden = true; $('#bookDone').hidden = false;

        $('#bookDone').innerHTML = `<div class="confirm"><div style="font-size:3rem">🎉</div><h2>Booking request received</h2><p>Reference <span class="ref">${b.ref}</span></p>

    <p>${esc(b.dest)} · ${b.guests} guest(s) · ${b.days} days from ${fmt(b.date)}<br>Estimated total <strong>$${b.total.toLocaleString()}</strong>. We'll email ${esc(b.email)} to confirm.</p>

    <a class="btn btn-cta" href="#bookings">View my bookings</a> <button class="btn btn-outline-secondary ms-2" id="again">Book another</button></div>`;

    });

    $('#bookDone').addEventListener('click', e => { if (e.target.id === 'again') { bf.reset(); bf.classList.remove('was-validated'); bf.hidden = false; $('#bookDone').hidden = true; prefill(); upd(); } });



    /* ---------- My bookings ---------- */

    function renderBookings() {

        const q = $('#bkSearch').value.toLowerCase(), f = $('#bkFilter').value;

        const list = mine('esl_bookings').filter(b => (!f || b.status === f) && (!q || (b.dest + b.ref).toLowerCase().includes(q))).reverse();

        $('#bkList').innerHTML = list.length ? list.map(b => bookingRow(b, `<div class="mt-2 d-flex gap-2 flex-wrap">

    <button class="btn btn-sm btn-outline-success" data-again="${b.id}">Book again</button>

    ${b.status !== 'Cancelled' ? `<button class="btn btn-sm btn-outline-danger" data-cancel="${b.id}">Cancel booking</button>` : ''}</div>`)).join('')

            : '<p class="text-muted mb-0">No bookings match. <a href="#book">Book a tour</a>.</p>';

    }

    $('#bkSearch').addEventListener('input', renderBookings); $('#bkFilter').addEventListener('change', renderBookings);

    $('#bkList').addEventListener('click', e => {

        const c = e.target.dataset.cancel, a = e.target.dataset.again;

        if (c && confirm('Cancel this booking?')) { const all = store.get('esl_bookings', []); all.find(b => b.id === c).status = 'Cancelled'; store.set('esl_bookings', all); renderBookings(); toast('Booking cancelled.'); }

        if (a) { const b = store.get('esl_bookings', []).find(x => x.id === a); location.hash = '#book'; E.dest.value = b.dest; E.style.value = b.style; E.guests.value = b.guests; E.days.value = b.days; upd(); }

    });



    /* ---------- My reviews ---------- */

    const rm = new bootstrap.Modal('#rvModal'), rf = $('#rvForm');

    function renderReviews() {

        const list = mine('esl_reviews').reverse();

        $('#rvList').innerHTML = list.length ? list.map(r => `<div class="bk-item"><div class="d-flex justify-content-between flex-wrap gap-2"><span class="rv-stars" aria-label="${r.rating} out of 5">${stars(r.rating)}</span>

    <span class="badge ${r.status === 'Hidden' ? 'bg-secondary' : 'bg-success'}">${r.status === 'Hidden' ? 'Hidden by admin' : 'Published'}</span></div>

    <p class="my-2">${esc(r.text)}</p><div class="small text-muted mb-2">${esc(r.country || '')} · ${fmt((r.date || '').slice(0, 10))}</div>

    <button class="btn btn-sm btn-outline-success me-1" data-edit="${r.id}">Edit</button><button class="btn btn-sm btn-outline-danger" data-del="${r.id}">Delete</button></div>`).join('')

            : '<p class="text-muted mb-0">You haven\'t posted a review yet. Tell other travellers about your trip.</p>';

    }

    function openReview(r = null) {

        editRv = r?.id || null; $('#rvModalT').textContent = r ? 'Edit review' : 'Write a review';

        $('#rvStars').innerHTML = starInput(r?.rating || 0); $('#rvCountry').value = r?.country || ''; $('#rvText').value = r?.text || '';

        rf.classList.remove('was-validated'); $('#rateErr').hidden = true; rm.show();

    }

    $('#addRv').addEventListener('click', () => openReview());

    $('#rvList').addEventListener('click', e => {

        const all = store.get('esl_reviews', []), ed = e.target.dataset.edit, dl = e.target.dataset.del;

        if (ed) openReview(all.find(r => r.id === ed));

        if (dl && confirm('Delete this review?')) { store.set('esl_reviews', all.filter(r => r.id !== dl)); renderReviews(); toast('Review deleted.'); }

    });

    rf.addEventListener('submit', e => {

        e.preventDefault(); rf.classList.add('was-validated');

        const rating = +(rf.querySelector('input[name="rating"]:checked')?.value || 0); $('#rateErr').hidden = !!rating;

        if (!rating || !rf.checkValidity()) return;

        const all = store.get('esl_reviews', []), vals = { rating, country: $('#rvCountry').value.trim(), text: $('#rvText').value.trim() };

        if (editRv) Object.assign(all.find(r => r.id === editRv), vals);

        else all.push({ id: uid(), userId: u.id, author: u.name, status: 'Published', date: new Date().toISOString(), ...vals });

        store.set('esl_reviews', all); rm.hide(); renderReviews(); toast(editRv ? 'Review updated.' : 'Thanks! Your review is live.');

    });



    /* ---------- Profile ---------- */

    const fillProfile = () => { $('#pName').value = u.name; $('#pEmail').value = u.email; };

    $('#nameForm').addEventListener('submit', e => {
        e.preventDefault();
        const n = $('#pName').value.trim();
        if (n.length < 2) return;
        store.set('esl_dashboard_name', n);
        route();
        toast('Name updated.');
    });

    route();
})();
