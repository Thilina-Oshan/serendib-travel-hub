/* Explore Sri Lanka: vanilla ES6+ */
const $ = (s, el = document) => el.querySelector(s);
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ---------- Data ---------- */
const DESTS = [
  {n:'Sigiriya Rock', cat:'Heritage', loc:'Central Province', r:5, e:'🏯', bg:'s-sigiriya', t:'A 5th-century rock fortress rising 200 m above the jungle, with frescoes, mirror wall and sky-high gardens. Climb at sunrise to beat the heat.'},
  {n:'Kandy & Temple of the Tooth', cat:'Heritage', loc:'Kandy', r:5, e:'🛕', bg:'s-bridge', t:'The last royal capital, centred on a lake and the sacred Temple of the Tooth Relic. Evening puja is the moment to attend.'},
  {n:'Galle Fort', cat:'Heritage', loc:'Southern Coast', r:4, e:'🏰', bg:'s-mirissa', t:'A Dutch-era fort town on the sea, full of cafés, boutiques and ramparts made for a sunset walk.'},
  {n:'Mirissa Beach', cat:'Beaches', loc:'Southern Coast', r:4, e:'🏖️', bg:'s-mirissa', t:'Palm-lined sand, relaxed beach bars and whale-watching boats from November to April.'},
  {n:'Arugam Bay', cat:'Beaches', loc:'Eastern Coast', r:4, e:'🏄', bg:'s-sigiriya', t:'Sri Lanka\'s surf capital. Waves peak from May to September when the south is wet.'},
  {n:'Yala National Park', cat:'Wildlife', loc:'Southern Province', r:5, e:'🐆', bg:'s-bridge', t:'Leopards, elephants, sloth bears and crocodiles across coastal scrub. Book a dawn jeep safari.'},
  {n:'Nuwara Eliya', cat:'Hill Country', loc:'Central Highlands', r:4, e:'🍃', bg:'s-bridge', t:'"Little England": cool air, tea estates, waterfalls and Horton Plains nearby.'},
  {n:'Ella & Nine Arch Bridge', cat:'Hill Country', loc:'Badulla District', r:5, e:'🚂', bg:'s-bridge', t:'Hike Little Adam\'s Peak, then watch the blue train cross the Nine Arch Bridge.'}
];
/* Season rules: [startMonth, endMonth] (1-12, wraps year) when each zone is at its best */
const ZONES = [
  {n:'South & West coast', ex:'Mirissa, Galle, Bentota', best:[11,4], why:'Dry, calm seas'},
  {n:'East coast', ex:'Arugam Bay, Trincomalee', best:[5,9], why:'Dry, best surf'},
  {n:'Hill country', ex:'Ella, Nuwara Eliya', best:[1,4], why:'Clearest views, cooler air'},
  {n:'Cultural triangle', ex:'Sigiriya, Anuradhapura', best:[5,9], why:'Drier, fewer showers'}
];
const inRange = (m, [a, b]) => a <= b ? m >= a && m <= b : m >= a || m <= b;
const GALLERY = [['🌅','s-sigiriya',260,'Sunrise over Sigiriya'],['🐘','s-bridge',180,'Elephants at Udawalawe'],['🍵','s-bridge',220,'Tea pickers, Nuwara Eliya'],['🌊','s-mirissa',300,'Mirissa surf break'],['🚂','s-bridge',200,'Blue train to Ella'],['🛕','s-sigiriya',240,'Temple of the Tooth'],['🐋','s-mirissa',190,'Blue whale, Mirissa'],['🏰','s-mirissa',270,'Galle Fort ramparts']];
const ROUTES = {
  culture:['Colombo','Sigiriya','Kandy'], nature:['Kandy','Nuwara Eliya','Ella','Yala'], adventure:['Ella','Yala','Arugam Bay','Mirissa']
};
const STYLE = {Backpacker:{usd:40,note:'Hostels, tuk-tuks and second-class trains.'}, Family:{usd:120,note:'Family rooms, a private driver, relaxed pacing.'}, Luxury:{usd:300,note:'Boutique villas, private transfers, guided experiences.'}};

/* ---------- Navbar scroll effect ---------- */
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 60);
addEventListener('scroll', onScroll, {passive:true}); onScroll();
$('#menu').addEventListener('click', e => { if (e.target.matches('.nav-link')) bootstrap.Collapse.getOrCreateInstance('#menu', {toggle:false}).hide(); });

/* ---------- Destinations: render, filter, modal ---------- */
const modal = new bootstrap.Modal('#infoModal');
const openModal = (title, meta, text, bg, emoji) => {
  $('#mTitle').textContent = title; $('#mMeta').textContent = meta; $('#mText').textContent = text;
  $('#mScene').className = `scene m-scene ${bg}`; $('#mScene').textContent = emoji; modal.show();
};
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
$('#destGrid').innerHTML = DESTS.map((d, i) => `
  <div class="col-sm-6 col-xl-3 dest-item" data-cat="${d.cat}">
    <article class="dest"><div class="scene ${d.bg}"><span class="badge rounded-pill">${d.cat}</span>${d.e}</div>
      <div class="dest-body"><h3>${d.n}</h3><span class="loc">📍 ${d.loc}</span>
      <span class="stars mb-2" aria-label="${d.r} out of 5">${stars(d.r)}</span>
      <button class="btn mt-2" data-i="${i}">Explore details</button></div></article></div>`).join('');
$('#destGrid').addEventListener('click', e => {
  const b = e.target.closest('button[data-i]'); if (!b) return;
  const d = DESTS[b.dataset.i]; openModal(d.n, `${d.cat} · ${d.loc} · ${stars(d.r)}`, d.t, d.bg, d.e);
});
function filterDests(cat) {
  document.querySelectorAll('#filters .btn-chip').forEach(b => b.classList.toggle('active', b.dataset.filter === cat));
  document.querySelectorAll('.dest-item').forEach(el => el.classList.toggle('hide', cat !== 'All' && el.dataset.cat !== cat));
}
$('#filters').addEventListener('click', e => { const b = e.target.closest('[data-filter]'); if (b) filterDests(b.dataset.filter); });

/* ---------- Month selects + hero search ---------- */
const monthOpts = MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
['#sMonth', '#monthPick'].forEach(s => $(s).innerHTML = monthOpts);
const now = new Date().getMonth() + 1; $('#sMonth').value = $('#monthPick').value = now;
DESTS.forEach(d => $('#sDest').add(new Option(d.n, d.n)));
$('#searchForm').addEventListener('submit', e => {
  e.preventDefault();
  const dest = DESTS.find(d => d.n === $('#sDest').value);
  filterDests(dest ? dest.cat : ($('#sAct').value || 'All'));
  $('#monthPick').value = $('#sMonth').value; renderSeason();
  $('#destinations').scrollIntoView();
});

/* ---------- Season guide ---------- */
function renderSeason() {
  const m = +$('#monthPick').value;
  const scored = ZONES.map(z => ({...z, ok: inRange(m, z.best)}));
  $('#seasonOut').innerHTML = scored.map(z => `
    <div class="col-sm-6"><div class="zone ${z.ok ? 'z-great' : 'z-poor'} fade-in">
      <span class="pill">${z.ok ? 'Best now' : 'Wetter now'}</span><h4>${z.n}</h4>
      <small>${z.ex}</small><div class="mt-1 small">${z.ok ? z.why : 'Expect showers and rougher seas'}</div></div></div>`).join('');
  const names = scored.filter(z => z.ok).map(z => z.n);
  $('#seasonNote').textContent = names.length
    ? `In ${MONTHS[m - 1]}, head to: ${names.join(' and ')}. The southwest (Yala/Maha) monsoons run May to September and October to January in the east.`
    : 'Every region sees some rain this month; plan indoor stops.';
}
$('#monthPick').addEventListener('change', renderSeason); renderSeason();

/* ---------- Itinerary planner ---------- */
$('#days').addEventListener('input', e => $('#daysOut').textContent = e.target.value);
$('#planForm').addEventListener('submit', e => {
  e.preventDefault();
  const days = +$('#days').value, style = $('#style').value;
  const picks = [...document.querySelectorAll('#planForm input[type=checkbox]:checked')].map(c => c.value);
  const out = $('#planOut');
  if (!picks.length) { out.innerHTML = '<p class="mb-0 text-danger">Select at least one interest to build a route.</p>'; return; }
  // Merge routes for chosen interests, de-duplicate, keep order; cap by trip length (~2 nights per stop)
  let stops = [...new Set(['Colombo', ...picks.flatMap(p => ROUTES[p])])];
  stops = stops.slice(0, Math.max(3, Math.min(stops.length, Math.ceil(days / 2))));
  const base = Math.floor(days / stops.length); let extra = days % stops.length, day = 1;
  const rows = stops.map(s => {
    const n = base + (extra-- > 0 ? 1 : 0), range = n > 1 ? `Days ${day}-${day + n - 1}` : `Day ${day}`; day += n;
    return `<div class="stop"><b>${range}</b><span>${s}</span></div>`;
  }).join('');
  const s = STYLE[style];
  out.innerHTML = `<div class="fade-in"><p class="route-line">${stops.join(' → ')}</p>${rows}
    <p class="mt-3 mb-0"><strong>${style}:</strong> ${s.note} Roughly <strong>$${s.usd * days}</strong> for ${days} days per person (estimate, excludes flights).</p></div>`;
});

/* ---------- Gallery + lightbox ---------- */
$('#galleryGrid').innerHTML = GALLERY.map(([e, bg, h, cap], i) =>
  `<button class="tile" data-g="${i}" aria-label="Enlarge: ${cap}"><div class="scene ${bg}" style="height:${h}px">${e}</div></button>`).join('');
$('#galleryGrid').addEventListener('click', e => {
  const t = e.target.closest('[data-g]'); if (!t) return;
  const [em, bg, , cap] = GALLERY[t.dataset.g]; openModal(cap, 'Gallery', 'Replace this tile with your own photo by setting --img on the .scene element.', bg, em);
});

/* ---------- Footer ---------- */
$('#yr').textContent = new Date().getFullYear();
$('#newsForm').addEventListener('submit', e => { e.preventDefault(); $('#newsMsg').textContent = 'Subscribed. Check your inbox to confirm.'; e.target.reset(); });
