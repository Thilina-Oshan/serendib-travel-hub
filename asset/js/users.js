/* Client dashboard: auth, overview, booking, my bookings, reviews, profile.
    Database-driven via PHP API endpoints (api/booking.php, api/reviews.php). */

(() => {
    // Utility DOM selector helpers
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // Fallback store utility for client-side user session preferences
    const store = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) };

    // Unique reference ID generator
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    // Constant tour packages and pricing structure
    const DEST = ['Sigiriya Rock', 'Kandy & Temple of the Tooth', 'Galle Fort', 'Mirissa Beach', 'Arugam Bay', 'Yala National Park', 'Nuwara Eliya', 'Ella & Nine Arch Bridge', 'Custom route (from planner)'];
    const RATE = { Backpacker: 40, Family: 120, Luxury: 300 };
    const TITLES = { overview: 'Overview', book: 'Book a tour', bookings: 'My bookings', reviews: 'My reviews', profile: 'Profile' };

    // Formatting helper functions
    const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
    const fmt = iso => iso ? new Date(iso + (iso.length === 10 ? 'T00:00' : '')).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '';
    const badge = s => s === 'Cancelled' ? 'bg-secondary' : s === 'Confirmed' ? 'bg-success' : 'bg-warning text-dark';
    const today = () => new Date().toISOString().slice(0, 10);
    const starInput = (val = 0) => [5, 4, 3, 2, 1].map(n => `<input type="radio" name="rating" id="st${n}" value="${n}" ${n === val ? 'checked' : ''}><label for="st${n}" title="${n} star${n > 1 ? 's' : ''}">★</label>`).join('');
    const toast = m => { $('#toastMsg').textContent = m; bootstrap.Toast.getOrCreateInstance('#toast', { delay: 3500 }).show(); };

    /* ---------- Single-user dashboard context ---------- */
    const DEFAULT_ID = 'dashboard-user';
    const user = () => ({
        id: DEFAULT_ID,
        name: store.get('esl_dashboard_name', ''),
        email: store.get('esl_dashboard_email', '')
    });
    let u = user(), editRv = null;

    // Database memory object for holding fetched rows
    let db = {
        bookings: [],
        reviews: []
    };

    // Fetch bookings and reviews from database via PHP API using correct relative paths
    async function loadUserData() {
        try {
            const resBk = await fetch('/api/booking.php');
            if (!resBk.ok) throw new Error(`HTTP error! Status: ${resBk.status}`);
            db.bookings = await resBk.json();

            const resRv = await fetch('/api/reviews.php');
            if (!resRv.ok) throw new Error(`HTTP error! Status: ${resRv.status}`);
            const allReviews = await resRv.json();
            db.reviews = allReviews;
        } catch (err) {
            console.error('Error loading data from API:', err);
        }
    }

    const mine = k => db[k] || [];

    /* ---------- Overview View ---------- */
    const bookingRow = (b, actions = '') => `<div class="bk-item"><div class="d-flex justify-content-between flex-wrap gap-2"><strong>${esc(b.destination)}</strong><span class="badge ${badge(b.status)}">${b.status}</span></div>
  <div class="small text-muted"><span class="ref">${b.ref}</span> · starts ${fmt(b.start_date)} · ${b.days} days · ${b.guests} guest(s) · ${esc(b.style)} · <strong>$${(+b.total).toLocaleString()}</strong></div>
  ${b.special_requests ? `<div class="small mt-1">“${esc(b.special_requests)}”</div>` : ''}</div>`;

    function renderOverview() {
        const bk = mine('bookings'), live = bk.filter(b => b.status !== 'Cancelled'), up = live.filter(b => b.start_date >= today()).sort((a, b) => a.start_date.localeCompare(b.start_date));
        $('#hello').textContent = `Hello, ${u.name.split(' ')[0]} 👋`;
        const nx = up[0];
        $('#nextTrip').textContent = nx ? `Next trip: ${nx.destination} on ${fmt(nx.start_date)} (${Math.max(0, Math.ceil((new Date(nx.start_date + 'T00:00') - new Date()) / 864e5))} days to go).` : 'No upcoming trips yet. Ready to plan one?';
        const stat = (n, l) => `<div class="col-6 col-xl-3"><div class="stat"><b>${n}</b><span>${l}</span></div></div>`;
        $('#stats').innerHTML = stat(bk.length, 'Total bookings') + stat(up.length, 'Upcoming trips') + stat(bk.filter(b => b.status === 'Confirmed').length, 'Confirmed') + stat(mine('reviews').length, 'Reviews posted');
        $('#recent').innerHTML = bk.length ? bk.slice(-3).reverse().map(b => bookingRow(b)).join('') : '<p class="text-muted mb-0">Nothing booked yet. <a href="#book">Book your first tour</a>.</p>';
    }

    /* ---------- Book a tour View ---------- */
    const bf = $('#bookForm'), E = bf.elements;
    DEST.forEach(n => E.dest.add(new Option(n, n)));
    if (E.date) E.date.min = today();
    if (E.endDate) E.endDate.min = today();

    const total = () => (RATE[E.style.value] || 0) * (+E.days.value || 0) * (+E.guests.value || 0);
    const upd = () => $('#estTotal').textContent = '$' + total().toLocaleString();
    ['style', 'days', 'guests'].forEach(n => { if (E[n]) E[n].addEventListener('input', upd); });
    upd();

    function prefill() {
        if (E.name) E.name.value ||= u.name;
        if (E.email) E.email.value ||= u.email;
    }

    // Handle booking form submission
    bf.addEventListener('submit', async e => {
        e.preventDefault(); bf.classList.add('was-validated'); if (!bf.checkValidity()) return;

        // Prepare payload matching the exact database column names
        const b = {
            ref: 'ESL-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
            full_name: E.name.value.trim(),          // Map 'name' input to 'full_name' column
            email: E.email.value.trim(),
            phone: E.phone.value.trim(),
            destination: E.dest.value,               // Map 'dest' input to 'destination' column
            start_date: E.date.value,                // Map 'date' input to 'start_date' column
            end_date: E.endDate ? E.endDate.value : E.date.value, // Map to 'end_date' column
            days: +E.days.value,
            guests: +E.guests.value,
            style: E.style.value,
            special_requests: E.notes.value.trim(),  // Map 'notes' input to 'special_requests' column
            total: total()
        };

        try {
            const response = await fetch('/api/booking.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(b)
            });
            const result = await response.json();

            // Check if the booking was successfully saved in the database
            if (result.success) {
                await loadUserData();
                bf.hidden = true; $('#bookDone').hidden = false;
                $('#bookDone').innerHTML = `<div class="confirm"><div style="font-size:3rem">🎉</div><h2>Booking request received</h2><p>Reference <span class="ref">${b.ref}</span></p>
                <p>${esc(b.destination)} · ${b.guests} guest(s) · ${b.days} days from ${fmt(b.start_date)}<br>Estimated total <strong>$${b.total.toLocaleString()}</strong>. We'll email ${esc(b.email)} to confirm.</p>
                <a class="btn btn-cta" href="#bookings">View my bookings</a> <button class="btn btn-outline-secondary ms-2" id="again">Book another</button></div>`;
                toast('Booking saved to database successfully!');
            } else {
                toast('Error: ' + (result.message || 'Could not save booking'));
            }
        } catch (err) {
            console.error('API Error:', err);
            toast('Failed to connect to server.');
        }
    });
    $('#bookDone').addEventListener('click', e => { if (e.target.id === 'again') { bf.reset(); bf.classList.remove('was-validated'); bf.hidden = false; $('#bookDone').hidden = true; prefill(); upd(); } });

    /* ---------- Auto-calculate Days from Start and End Date ---------- */
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const daysInput = document.getElementById('bDays');

    function calculateDays() {
        const startVal = startDateInput.value;
        const endVal = endDateInput.value;

        if (startVal && endVal) {
            const startDate = new Date(startVal);
            const endDate = new Date(endVal);

            const diffTime = endDate - startDate;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0) {
                daysInput.value = diffDays;
                daysInput.dispatchEvent(new Event('input'));
            } else {
                daysInput.value = '';
                alert("End date must be after Start date.");
            }
        }
    }

    if (startDateInput && endDateInput && daysInput) {
        startDateInput.addEventListener('change', calculateDays);
        endDateInput.addEventListener('change', calculateDays);
    }

    /* ---------- My Bookings View ---------- */
    function renderBookings() {
        const q = $('#bkSearch').value.toLowerCase(), f = $('#bkFilter').value;
        const list = mine('bookings').filter(b => (!f || b.status === f) && (!q || (b.destination + b.ref).toLowerCase().includes(q))).reverse();
        $('#bkList').innerHTML = list.length ? list.map(b => bookingRow(b, `<div class="mt-2 d-flex gap-2 flex-wrap">
    <button class="btn btn-sm btn-outline-success" data-again="${b.user_id}">Book again</button>
    ${b.status !== 'Cancelled' ? `<button class="btn btn-sm btn-outline-danger" data-cancel="${b.user_id}">Cancel booking</button>` : ''}</div>`)).join('')
            : '<p class="text-muted mb-0">No bookings match. <a href="#book">Book a tour</a>.</p>';
    }

    $('#bkSearch').addEventListener('input', renderBookings);
    $('#bkFilter').addEventListener('change', renderBookings);

    // Handle booking cancellation or booking again actions
    $('#bkList').addEventListener('click', async e => {
        const c = e.target.dataset.cancel, a = e.target.dataset.again;
        if (c && confirm('Cancel this booking?')) {
            try {
                const response = await fetch('api/booking.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: c, status: 'Cancelled' })
                });
                const result = await response.json();
                if (result.success) {
                    await loadUserData();
                    renderBookings();
                    toast('Booking cancelled.');
                }
            } catch (err) {
                toast('Failed to update booking.');
            }
        }
        if (a) {
            const b = mine('bookings').find(x => x.user_id == a);
            if (b) {
                location.hash = '#book';
                E.dest.value = b.destination;
                E.style.value = b.style;
                E.guests.value = b.guests;
                E.days.value = b.days;
                upd();
            }
        }
    });

    /* ---------- My Reviews View ---------- */
    const rm = new bootstrap.Modal('#rvModal'), rf = $('#rvForm');
    function renderReviews() {
        const list = mine('reviews').reverse();
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

    $('#rvList').addEventListener('click', async e => {
        const ed = e.target.dataset.edit, dl = e.target.dataset.del;
        if (ed) openReview(mine('reviews').find(r => r.id === ed));
        if (dl && confirm('Delete this review?')) {
            try {
                const response = await fetch(`api/reviews.php?id=${dl}`, { method: 'DELETE' });
                const result = await response.json();
                if (result.success) {
                    await loadUserData();
                    renderReviews();
                    toast('Review deleted.');
                }
            } catch (err) {
                toast('Failed to delete review.');
            }
        }
    });

    rf.addEventListener('submit', async e => {
        e.preventDefault(); rf.classList.add('was-validated');
        const rating = +(rf.querySelector('input[name="rating"]:checked')?.value || 0); $('#rateErr').hidden = !!rating;
        if (!rating || !rf.checkValidity()) return;

        const reviewData = {
            id: editRv || uid(),
            userId: u.id,
            author: u.name,
            rating: rating,
            country: $('#rvCountry').value.trim(),
            text: $('#rvText').value.trim(),
            status: 'Published'
        };

        try {
            const method = editRv ? 'PUT' : 'POST';
            const response = await fetch('api/reviews.php', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });
            const result = await response.json();

            if (result.success) {
                rm.hide();
                await loadUserData();
                renderReviews();
                toast(editRv ? 'Review updated.' : 'Thanks! Your review is live.');
            } else {
                toast('Failed to save review.');
            }
        } catch (err) {
            console.error('Review API error:', err);
            toast('Server connection error.');
        }
    });

    /* ---------- Profile View ---------- */
    const fillProfile = () => { $('#pName').value = u.name; $('#pEmail').value = u.email; };
    $('#nameForm').addEventListener('submit', e => {
        e.preventDefault();
        const n = $('#pName').value.trim();
        if (n.length < 2) return;
        store.set('esl_dashboard_name', n);
        route();
        toast('Name updated.');
    });

    /* ---------- Router Manager ---------- */
    async function route() {
        u = user();
        $('#app').hidden = false;
        $('#uName').textContent = u.name;
        $('#uEmail').textContent = u.email;
        $('#uAvatar').textContent = (u.name[0] || 'U').toUpperCase();

        // Load data from database before rendering views
        await loadUserData();

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

    // Initial router execution on load
    route();
})();