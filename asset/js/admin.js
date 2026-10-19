/* Admin dashboard: CRUD operations driven by PHP backend APIs */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CATS = ['Heritage', 'Beaches', 'Wildlife', 'Hill Country'];

/* Entity configuration for dynamic form rendering and tables */
const CFG = {
    destinations: {
        label: 'Destinations', one: 'destination', emoji: '🏯', cat: 'cat', name: 'name',
        fields: [{ k: 'name', l: 'Name', req: 1, w: 6 }, { k: 'cat', l: 'Category', t: 'select', o: CATS, req: 1, w: 6 }, { k: 'loc', l: 'Location', req: 1, w: 6 },
        { k: 'rating', l: 'Rating (1-5)', t: 'number', min: 1, max: 5, req: 1, w: 6 }, { k: 'desc', l: 'Description', t: 'textarea', req: 1 }, { k: 'photo', l: 'Photo', t: 'photo' }],
        cols: ['photo', 'name', 'cat', 'loc', 'rating']
    },
    experiences: {
        label: 'Experiences', one: 'experience', emoji: '🍵', name: 'title',
        fields: [{ k: 'title', l: 'Title', req: 1, w: 8 }, { k: 'icon', l: 'Emoji icon', w: 4, max: 2 }, { k: 'desc', l: 'Description', t: 'textarea', req: 1 }, { k: 'photo', l: 'Photo (optional)', t: 'photo' }],
        cols: ['photo', 'title', 'icon', 'desc']
    },
    gallery: {
        label: 'Gallery', one: 'photo', emoji: '🖼️', cat: 'cat', name: 'caption',
        fields: [{ k: 'caption', l: 'Caption', req: 1, w: 8 }, { k: 'cat', l: 'Category', t: 'select', o: CATS, req: 1, w: 4 }, { k: 'photo', l: 'Photo', t: 'photo', req: 1 }],
        cols: ['photo', 'caption', 'cat']
    },
    reviews: {
        label: 'Testimonials', one: 'testimonial', emoji: '💬', name: 'author',
        fields: [{ k: 'author', l: 'Traveller name', req: 1, w: 6 }, { k: 'country', l: 'Country', req: 1, w: 6 }, { k: 'rating', l: 'Rating (1-5)', t: 'number', min: 1, max: 5, req: 1, w: 6 }, { k: 'text', l: 'Review', t: 'textarea', req: 1 }],
        cols: ['author', 'country', 'rating', 'text']
    }
};

let db = { destinations: [], experiences: [], gallery: [], reviews: [] };
let view = 'overview', editId = null, delId = null, photoData = '';

const toastEl = bootstrap.Toast.getOrCreateInstance('#toast', { delay: 3000 });
const toast = m => { $('#toastMsg').textContent = m; toastEl.show(); };
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

/* Fetch data from PHP backend API */
async function loadData(entity) {
    try {
        const response = await fetch(`../api/${entity}.php`);
        db[entity] = await response.json();
    } catch (err) {
        console.error(`Error loading ${entity}:`, err);
        toast(`Failed to load ${entity}.`);
    }
}

/* Load all entities data */
async function loadAllData() {
    for (const key of Object.keys(CFG)) {
        await loadData(key);
    }
    if (view === 'overview') renderOverview();
    else renderTable();
}

/* Navigation handler */
function show(v) {
    view = v; const c = CFG[v];
    document.querySelectorAll('#sideNav .nav-link').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    $('#viewTitle').textContent = c ? c.label : 'Overview';
    $('#v-overview').hidden = !!c; $('#v-crud').hidden = !c;
    bootstrap.Offcanvas.getInstance('#sidebar')?.hide();
    if (c) { setupFilter(); loadData(v).then(() => renderTable()); }
    else { loadAllData().then(() => renderOverview()); }
}

$('#sideNav').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) show(b.dataset.view); });
document.addEventListener('click', e => { const q = e.target.closest('[data-quick]'); if (q) { show(q.dataset.quick); openForm(); } });

/* Render dashboard overview statistics */
function renderOverview() {
    const avg = db.destinations.length ? (db.destinations.reduce((a, d) => a + +d.rating, 0) / db.destinations.length).toFixed(1) : '–';
    const stat = (n, l) => `<div class="col-6 col-xl-3"><div class="stat"><b>${n}</b><span>${l}</span></div></div>`;
    $('#stats').innerHTML = stat(db.destinations.length, 'Destinations') + stat(db.gallery.length, 'Gallery photos') + stat(db.reviews.length, 'Testimonials') + stat(avg, 'Avg. destination rating');
    const recent = Object.entries(CFG).flatMap(([k, c]) => (db[k] || []).map(r => ({ r, c }))).slice(-6).reverse();
    $('#recent.list-unstyled').innerHTML = recent.length ? recent.map(({ r, c }) => `<li>${thumb(r, c)}<div><strong>${esc(r[c.name])}</strong><br><span class="tag">${c.label}</span></div></li>`).join('') : '<li class="text-muted">No entries yet.</li>';
}

const thumb = (r, c) => r.photo ? `<img class="thumb" src="${r.photo}" alt="">` : `<div class="thumb" aria-hidden="true">${esc(r.icon || c.emoji)}</div>`;

/* Render data table */
function renderTable() {
    const c = CFG[view], q = $('#search').value.toLowerCase(), f = $('#filterCat').value;
    const fields = Object.fromEntries(c.fields.map(x => [x.k, x]));
    $('#thead').innerHTML = '<tr>' + c.cols.map(k => `<th>${k === 'photo' ? 'Photo' : fields[k].l.replace(/ \(.*\)/, '')}</th>`).join('') + '<th class="text-end">Actions</th></tr>';
    const rows = (db[view] || []).filter(r => (!f || r[c.cat] === f) && (!q || JSON.stringify(r).toLowerCase().includes(q)));
    $('#tbody').innerHTML = rows.map(r => `<tr>` + c.cols.map(k => {
        const l = k === 'photo' ? 'Photo' : fields[k].l;
        const v = k === 'photo' ? thumb(r, c) : k === 'rating' ? `<span class="stars">${stars(+r[k])}</span>` : k === 'cat' ? `<span class="tag">${esc(r[k])}</span>` : `<span class="${k === 'desc' || k === 'text' ? 'text-truncate d-inline-block' : ''}" style="${k === 'desc' || k === 'text' ? 'max-width:260px' : ''}">${esc(r[k])}</span>`;
        return `<td data-label="${esc(l)}">${v}</td>`;
    }).join('') + `<td class="act text-end" data-label="Actions"><button class="btn btn-sm btn-outline-success me-1" data-edit="${r.id}">Edit</button><button class="btn btn-sm btn-outline-danger" data-del="${r.id}">Delete</button></td></tr>`).join('');
    $('#empty').hidden = rows.length > 0;
    $('#addBtn').textContent = `+ Add ${c.one}`;
}

function setupFilter() {
    const c = CFG[view]; $('#search').value = '';
    $('#filterWrap').hidden = !c.cat;
    $('#filterCat').innerHTML = '<option value="">All categories</option>' + CATS.map(x => `<option>${x}</option>`).join('');
}

$('#search').addEventListener('input', () => renderTable());
$('#filterCat').addEventListener('change', () => renderTable());
$('#tbody').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
    if (ed) openForm(ed.dataset.edit);
    if (dl) { delId = dl.dataset.del; const r = db[view].find(x => x.id == delId); $('#delName').textContent = r[CFG[view].name]; delModal.show(); }
});

const formModal = new bootstrap.Modal('#formModal'), delModal = new bootstrap.Modal('#delModal');

function openForm(id = null) {
    const c = CFG[view], rec = id ? db[view].find(r => r.id == id) : {}; editId = id; photoData = rec.photo || '';
    $('#formTitle').textContent = `${id ? 'Edit' : 'Add'} ${c.one}`;
    $('#entityForm').classList.remove('was-validated');
    $('#formBody').innerHTML = c.fields.map(f => {
        const v = esc(rec[f.k] ?? ''), req = f.req ? 'required' : '', col = `col-12 ${f.w ? 'col-md-' + f.w : ''}`;
        if (f.t === 'photo') return `<div class="col-12"><label class="form-label">${f.l}</label>
      <label class="drop d-block" id="drop"><input id="f_photo" type="file" accept="image/*" hidden><span>Drag an image here or <u>choose a file</u></span><small class="d-block text-muted">JPG, PNG or WebP. Resized automatically.</small></label>
      <img id="prev" class="photo-prev" alt="Photo preview" ${photoData ? `src="${photoData}"` : 'hidden'}>
      <button type="button" id="rmPhoto" class="btn btn-sm btn-link text-danger" ${photoData ? '' : 'hidden'}>Remove photo</button>
      <div id="photoErr" class="text-danger small" hidden>Please add a photo.</div></div>`;
        const input = f.t === 'select' ? `<select class="form-select" id="f_${f.k}" ${req}><option value="">Choose…</option>${f.o.map(o => `<option ${o === rec[f.k] ? 'selected' : ''}>${o}</option>`).join('')}</select>`
            : f.t === 'textarea' ? `<textarea class="form-control" id="f_${f.k}" rows="3" ${req}>${v}</textarea>`
                : `<input class="form-control" id="f_${f.k}" type="${f.t || 'text'}" value="${v}" ${req} ${f.min ? `min="${f.min}" max="${f.max}"` : ''}>`;
        return `<div class="${col}"><label class="form-label" for="f_${f.k}">${f.l}</label>${input}<div class="invalid-feedback">This field is required.</div></div>`;
    }).join('');
    bindPhoto(); formModal.show();
}
$('#addBtn').addEventListener('click', () => openForm());

function bindPhoto() {
    const input = $('#f_photo'); if (!input) return;
    const drop = $('#drop');
    const take = file => {
        if (!file || !file.type.startsWith('image/')) return toast('Please choose an image file.');
        const rd = new FileReader();
        rd.onload = () => {
            const img = new Image(); img.onload = () => {
                const s = Math.min(1, 1000 / img.width), cv = document.createElement('canvas');
                cv.width = img.width * s; cv.height = img.height * s; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                photoData = cv.toDataURL('image/jpeg', .8); $('#prev').src = photoData; $('#prev').hidden = false; $('#rmPhoto').hidden = false; $('#photoErr').hidden = true;
            }; img.src = rd.result;
        };
        rd.readAsDataURL(file);
    };
    input.addEventListener('change', () => take(input.files[0]));
    ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => take(e.dataTransfer.files[0]));
    $('#rmPhoto').addEventListener('click', () => { photoData = ''; $('#prev').hidden = true; $('#rmPhoto').hidden = true; input.value = ''; });
}

/* Submit form data to PHP API backend (POST for create, PUT for update) */
$('#entityForm').addEventListener('submit', async e => {
    e.preventDefault();
    const c = CFG[view], form = e.target, pf = c.fields.find(f => f.t === 'photo');
    form.classList.add('was-validated');
    const needPhoto = pf && pf.req && !photoData; if (needPhoto) $('#photoErr').hidden = false;
    if (!form.checkValidity() || needPhoto) return;

    const rec = {};
    c.fields.forEach(f => rec[f.k] = f.t === 'photo' ? photoData : f.t === 'number' ? +$('#f_' + f.k).value : $('#f_' + f.k).value.trim());
    if (editId) rec.id = editId;

    try {
        const method = editId ? 'PUT' : 'POST';
        // Fixed path: changed from '/api/' to '../api/'
        const response = await fetch(`../api/${view}.php`, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rec)
        });
        const result = await response.json();
        if (result.success) {
            formModal.hide();
            toast(`${c.one[0].toUpperCase() + c.one.slice(1)} ${editId ? 'updated' : 'added'}.`);
            loadData(view).then(() => renderTable());
        } else {
            toast('Operation failed.');
        }
    } catch (err) {
        console.error('API Error:', err);
        toast('Network error connecting to backend.');
    }
});

/* Delete record via PHP API backend */
$('#delConfirm').addEventListener('click', async () => {
    try {
        // Fixed path: changed from '/api/' to '../api/'
        const response = await fetch(`../api/${view}.php?id=${delId}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            delModal.hide();
            toast('Entry deleted.');
            loadData(view).then(() => renderTable());
        } else {
            toast('Delete failed.');
        }
    } catch (err) {
        console.error('Delete error:', err);
        toast('Network error.');
    }
});

// Initial data load on startup
loadAllData().then(() => show('overview'));