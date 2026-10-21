/* Serendib Travel Hub — Admin Dashboard */
'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

// Change this if the website is hosted inside a subfolder, e.g. '/travel/api/'.
const API_BASE = '/api/';
const CATS = ['Heritage', 'Beaches', 'Wildlife', 'Hill Country'];

const CFG = {
    destinations: {
        label: 'Destinations', one: 'destination', emoji: '🏯', cat: 'cat', name: 'name',
        fields: [
            { k: 'name', l: 'Name', req: 1, w: 6 },
            { k: 'cat', l: 'Category', t: 'select', o: CATS, req: 1, w: 6 },
            { k: 'loc', l: 'Location', req: 1, w: 6 },
            { k: 'rating', l: 'Rating (1-5)', t: 'number', min: 1, max: 5, req: 1, w: 6 },
            { k: 'desc', l: 'Description', t: 'textarea', req: 1 },
            { k: 'photo', l: 'Photo', t: 'photo' }
        ],
        cols: ['photo', 'name', 'cat', 'loc', 'rating']
    },
    experiences: {
        label: 'Experiences', one: 'experience', emoji: '🍵', name: 'title',
        fields: [
            { k: 'title', l: 'Title', req: 1, w: 8 },
            { k: 'icon', l: 'Emoji icon', w: 4, max: 2 },
            { k: 'desc', l: 'Description', t: 'textarea', req: 1 },
            { k: 'photo', l: 'Photo (optional)', t: 'photo' }
        ],
        cols: ['photo', 'title', 'icon', 'desc']
    },
    gallery: {
        label: 'Gallery', one: 'photo', emoji: '🖼️', cat: 'cat', name: 'caption',
        fields: [
            { k: 'caption', l: 'Caption', req: 1, w: 8 },
            { k: 'cat', l: 'Category', t: 'select', o: CATS, req: 1, w: 4 },
            { k: 'photo', l: 'Photo', t: 'photo', req: 1 }
        ],
        cols: ['photo', 'caption', 'cat']
    },
    reviews: {
        label: 'Testimonials', one: 'testimonial', emoji: '💬', name: 'author',
        fields: [
            { k: 'author', l: 'Traveller name', req: 1, w: 6 },
            { k: 'country', l: 'Country', req: 1, w: 6 },
            { k: 'rating', l: 'Rating (1-5)', t: 'number', min: 1, max: 5, req: 1, w: 6 },
            { k: 'text', l: 'Review', t: 'textarea', req: 1 }
        ],
        cols: ['author', 'country', 'rating', 'text']
    }
};

let db = { destinations: [], experiences: [], gallery: [], reviews: [] };
let view = 'overview';
let editId = null;
let delId = null;
let photoData = '';

document.addEventListener('DOMContentLoaded', () => {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap JavaScript did not load. Check bootstrap.bundle.min.js in your HTML.');
        return;
    }

    const toastEl = bootstrap.Toast.getOrCreateInstance($('#toast'), { delay: 3000 });
    const formModal = bootstrap.Modal.getOrCreateInstance($('#formModal'));
    const delModal = bootstrap.Modal.getOrCreateInstance($('#delModal'));
    const toast = message => {
        $('#toastMsg').textContent = message;
        toastEl.show();
    };
    const stars = value => {
        const n = Math.max(0, Math.min(5, Number(value) || 0));
        return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
    };

    async function api(entity, options = {}) {
        const response = await fetch(`${API_BASE}${entity}.php${options.query || ''}`, {
            ...options,
            headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
        });
        const raw = await response.text();
        let data;
        try { data = JSON.parse(raw); }
        catch { throw new Error(`Invalid JSON from ${entity}.php (HTTP ${response.status}): ${raw.slice(0, 180)}`); }
        if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
        return data;
    }

    async function loadData(entity) {
        try {
            const result = await api(entity);
            // GET endpoints should return arrays; also accept a {data: [...]} wrapper.
            const records = Array.isArray(result) ? result : result.data;
            if (!Array.isArray(records)) throw new Error(`Expected an array for ${entity}`);
            db[entity] = records;
        } catch (error) {
            console.error(`Error loading ${entity}:`, error);
            toast(`Failed to load ${entity}. Check the API response.`);
        }
    }

    async function loadAllData() {
        await Promise.all(Object.keys(CFG).map(loadData));
        if (view === 'overview') renderOverview();
        else renderTable();
    }

    function show(nextView) {
        if (nextView !== 'overview' && !CFG[nextView]) return;
        view = nextView;
        const c = CFG[view];
        document.querySelectorAll('#sideNav [data-view]').forEach(el => {
            el.classList.toggle('active', el.dataset.view === view);
        });
        $('#viewTitle').textContent = c ? c.label : 'Overview';
        $('#v-overview').hidden = Boolean(c);
        $('#v-crud').hidden = !c;
        bootstrap.Offcanvas.getInstance($('#sidebar'))?.hide();
        if (c) {
            setupFilter();
            loadData(view).then(() => { if (view === nextView) renderTable(); });
        } else {
            loadAllData();
        }
    }

    const thumb = (record, config) => record.photo
        ? `<img class="thumb" src="${esc(record.photo)}" alt="">`
        : `<div class="thumb" aria-hidden="true">${esc(record.icon || config.emoji)}</div>`;

    function renderOverview() {
        const avg = db.destinations.length
            ? (db.destinations.reduce((sum, d) => sum + (Number(d.rating) || 0), 0) / db.destinations.length).toFixed(1)
            : '–';
        const stat = (number, label) =>
            `<div class="col-6 col-xl-3"><div class="stat"><b>${esc(number)}</b><span>${esc(label)}</span></div></div>`;
        $('#stats').innerHTML =
            stat(db.destinations.length, 'Destinations') +
            stat(db.gallery.length, 'Gallery photos') +
            stat(db.reviews.length, 'Testimonials') +
            stat(avg, 'Avg. destination rating');

        const recent = Object.entries(CFG)
            .flatMap(([key, config]) => (db[key] || []).map(record => ({ record, config })))
            .slice(-6).reverse();
        $('#recent').innerHTML = recent.length
            ? recent.map(({ record, config }) =>
                `<li>${thumb(record, config)}<div><strong>${esc(record[config.name])}</strong><br><span class="tag">${esc(config.label)}</span></div></li>`
            ).join('')
            : '<li class="text-muted">No entries yet.</li>';
    }

  
function renderTable() {
    const c = CFG[view];
    if (!c) return;

    const q = $('#search').value.trim().toLowerCase();
    const f = $('#filterCat').value;

    const fields = Object.fromEntries(
        c.fields.map(field => [field.k, field])
    );

    // Table Header
    $('#thead').innerHTML = '<tr>' + c.cols.map(key =>
        `<th>${esc(
            key === 'photo'
                ? 'Photo'
                : fields[key].l.replace(/\s*\(.*\)/, '')
        )}</th>`
    ).join('') + '<th class="text-end">Actions</th></tr>';

    // Filter Records
    const rows = (db[view] || []).filter(record =>
        (!f || record[c.cat] === f) &&
        (!q || JSON.stringify(record).toLowerCase().includes(q))
    );

    // Render Table Body
    $('#tbody').innerHTML = rows.map(record =>
        '<tr>' + c.cols.map(key => {

            const label = key === 'photo'
                ? 'Photo'
                : fields[key].l;

            // FIX: Support both desc and description
            const fieldValue = key === 'desc'
                ? (record.desc ?? record.description ?? '')
                : (record[key] ?? '');

            let value;

            if (key === 'photo') {

                value = thumb(record, c);

            } else if (key === 'rating') {

                value = `<span class="stars">
                    ${stars(fieldValue)}
                </span>`;

            } else if (key === 'cat') {

                value = `<span class="tag">
                    ${esc(fieldValue)}
                </span>`;

            } else {

                const long = key === 'desc' || key === 'text';

                value = `
                    <span
                        class="${long ? 'text-truncate d-inline-block' : ''}"
                        ${long ? 'style="max-width:260px"' : ''}
                    >
                        ${esc(fieldValue)}
                    </span>
                `;
            }

            return `
                <td data-label="${esc(label)}">
                    ${value}
                </td>
            `;

        }).join('') +

        `<td class="act text-end" data-label="Actions">
            <button
                class="btn btn-sm btn-outline-success me-1"
                data-edit="${esc(record.id)}">
                Edit
            </button>

            <button
                class="btn btn-sm btn-outline-danger"
                data-del="${esc(record.id)}">
                Delete
            </button>
        </td></tr>`

    ).join('');

    $('#empty').hidden = rows.length > 0;

    $('#addBtn').textContent = `+ Add ${c.one}`;
}

    function setupFilter() {
        const c = CFG[view];
        $('#search').value = '';
        $('#filterWrap').hidden = !c.cat;
        $('#filterCat').innerHTML = '<option value="">All categories</option>' +
            CATS.map(cat => `<option value="${esc(cat)}">${esc(cat)}</option>`).join('');
    }

    function openForm(id = null) {
        const c = CFG[view];
        if (!c) return;
        const record = id !== null ? db[view].find(item => String(item.id) === String(id)) : {};
        if (!record) return toast('Record not found.');
        editId = id;
        photoData = record.photo || '';
        $('#formTitle').textContent = `${id !== null ? 'Edit' : 'Add'} ${c.one}`;
        $('#entityForm').classList.remove('was-validated');
        $('#formBody').innerHTML = c.fields.map(field => {
            const value = esc(
                field.k === 'desc'
                    ? (record.desc ?? record.description ?? '')
                    : (record[field.k] ?? '')
            );
            const required = field.req ? 'required' : '';
            const col = `col-12 ${field.w ? 'col-md-' + field.w : ''}`;
            if (field.t === 'photo') return `
                <div class="col-12">
                    <label class="form-label">${esc(field.l)}</label>
                    <label class="drop d-block" id="drop">
                        <input id="f_photo" type="file" accept="image/*" hidden>
                        <span>Drag an image here or <u>choose a file</u></span>
                        <small class="d-block text-muted">JPG, PNG or WebP. Resized automatically.</small>
                    </label>
                    <img id="prev" class="photo-prev" alt="Photo preview" ${photoData ? `src="${esc(photoData)}"` : 'hidden'}>
                    <button type="button" id="rmPhoto" class="btn btn-sm btn-link text-danger" ${photoData ? '' : 'hidden'}>Remove photo</button>
                    <div id="photoErr" class="text-danger small" hidden>Please add a photo.</div>
                </div>`;
            let input;
            if (field.t === 'select') {
                input = `<select class="form-select" id="f_${field.k}" ${required}><option value="">Choose…</option>` +
                    field.o.map(option => `<option value="${esc(option)}" ${option === record[field.k] ? 'selected' : ''}>${esc(option)}</option>`).join('') + '</select>';
            } else if (field.t === 'textarea') {
                input = `<textarea class="form-control" id="f_${field.k}" rows="3" ${required}>${value}</textarea>`;
            } else {
                input = `<input class="form-control" id="f_${field.k}" type="${field.t || 'text'}" value="${value}" ${required}
                    ${field.min !== undefined ? `min="${field.min}"` : ''}
                    ${field.max !== undefined ? `max="${field.max}"` : ''}
                    ${field.max !== undefined && field.t !== 'number' ? `maxlength="${field.max}"` : ''}>`;
            }
            return `<div class="${col}"><label class="form-label" for="f_${field.k}">${esc(field.l)}</label>${input}<div class="invalid-feedback">Please enter a valid value.</div></div>`;
        }).join('');
        bindPhoto();
        formModal.show();
    }

    function bindPhoto() {
        const input = $('#f_photo');
        if (!input) return;
        const drop = $('#drop');
        function take(file) {
            if (!file || !file.type.startsWith('image/')) {
                toast('Please choose an image file.');
                return;
            }
            const reader = new FileReader();
            reader.onerror = () => toast('Could not read the image.');
            reader.onload = () => {
                const img = new Image();
                img.onerror = () => toast('Invalid image.');
                img.onload = () => {
                    const scale = Math.min(1, 1000 / img.width);
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(img.width * scale));
                    canvas.height = Math.max(1, Math.round(img.height * scale));
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    photoData = canvas.toDataURL('image/jpeg', 0.8);
                    $('#prev').src = photoData;
                    $('#prev').hidden = false;
                    $('#rmPhoto').hidden = false;
                    $('#photoErr').hidden = true;
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
        input.addEventListener('change', () => { if (input.files[0]) take(input.files[0]); });
        ['dragenter', 'dragover'].forEach(type => drop.addEventListener(type, event => {
            event.preventDefault();
            drop.classList.add('over');
        }));
        ['dragleave', 'drop'].forEach(type => drop.addEventListener(type, event => {
            event.preventDefault();
            drop.classList.remove('over');
        }));
        drop.addEventListener('drop', event => {
            if (event.dataTransfer.files[0]) take(event.dataTransfer.files[0]);
        });
        $('#rmPhoto').addEventListener('click', () => {
            photoData = '';
            $('#prev').removeAttribute('src');
            $('#prev').hidden = true;
            $('#rmPhoto').hidden = true;
            input.value = '';
        });
    }

    $('#sideNav').addEventListener('click', event => {
        const button = event.target.closest('[data-view]');
        if (button) show(button.dataset.view);
    });
    document.addEventListener('click', event => {
        const button = event.target.closest('[data-quick]');
        if (button) {
            const target = button.dataset.quick;
            show(target);
            openForm();
        }
    });
    $('#search').addEventListener('input', renderTable);
    $('#filterCat').addEventListener('change', renderTable);
    $('#addBtn').addEventListener('click', () => openForm());
    $('#tbody').addEventListener('click', event => {
        const edit = event.target.closest('[data-edit]');
        const del = event.target.closest('[data-del]');
        if (edit) openForm(edit.dataset.edit);
        if (del) {
            delId = del.dataset.del;
            const record = db[view].find(item => String(item.id) === String(delId));
            if (!record) return toast('Record not found.');
            $('#delName').textContent = record[CFG[view].name] || '';
            delModal.show();
        }
    });

    $('#entityForm').addEventListener('submit', async event => {
        event.preventDefault();
        const c = CFG[view];
        const form = event.currentTarget;
        const photoField = c.fields.find(field => field.t === 'photo');
        form.classList.add('was-validated');
        const needPhoto = Boolean(photoField?.req && !photoData);
        if ($('#photoErr')) $('#photoErr').hidden = !needPhoto;
        if (!form.checkValidity() || needPhoto) return;
        const record = {};
        c.fields.forEach(field => {
            record[field.k] = field.t === 'photo' ? photoData :
                field.t === 'number' ? Number($('#f_' + field.k).value) :
                    $('#f_' + field.k).value.trim();
        });
        if (editId !== null) record.id = editId;
        try {
            const result = await api(view, {
                method: editId !== null ? 'PUT' : 'POST',
                body: JSON.stringify(record)
            });
            if (result.success) {
                formModal.hide();
                toast(`${c.one[0].toUpperCase() + c.one.slice(1)} ${editId !== null ? 'updated' : 'added'}.`);
                await loadData(view);
                renderTable();
            } else toast(result.message || 'Operation failed.');
        } catch (error) {
            console.error('Save error:', error);
            toast('Could not save. Check the API and console.');
        }
    });

    $('#delConfirm').addEventListener('click', async () => {
        try {
            const result = await api(view, {
                method: 'DELETE',
                query: `?id=${encodeURIComponent(delId)}`
            });
            if (result.success) {
                delModal.hide();
                toast('Entry deleted.');
                await loadData(view);
                renderTable();
            } else toast(result.message || 'Delete failed.');
        } catch (error) {
            console.error('Delete error:', error);
            toast('Could not delete. Check the API and console.');
        }
    });

    // Export current dashboard records as JSON.
    $('#exportBtn').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'serendib-travel-hub-export.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    });

    // No reset endpoint was supplied. Do not silently delete live MySQL records.
    $('#resetBtn').addEventListener('click', () => {
        toast('Reset is disabled: no safe backend reset endpoint is configured.');
    });

    loadAllData();
});
