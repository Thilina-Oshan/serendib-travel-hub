/* Explore Sri Lanka: vanilla ES6+ main script */
const $ = (s, el = document) => el.querySelector(s);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Function to load dynamic HTML components like navbar and footer
/* async function loadComponent(elementId, filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const htmlData = await response.text();
    document.getElementById(elementId).innerHTML = htmlData;

    // Set current year dynamically if loading footer
    if (elementId === 'footer-container') {
      const yrEl = document.getElementById('yr');
      if (yrEl) yrEl.textContent = new Date().getFullYear();
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
  }
}

// Load Navbar and Footer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadComponent('navbar-container', '/include/navbar.html');
  loadComponent('footer-container', '/include/footer.html');
});
 */
/* ---------- Navbar scroll effect ---------- */
window.addEventListener('scroll', () => {
  const navbarEl = $('#nav');
  if (navbarEl) navbarEl.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// Event delegation for dynamically loaded navbar
document.addEventListener('click', e => {
  if (e.target.matches('.nav-link')) {
    const menuEl = $('#menu');
    if (menuEl) {
      const bsCollapse = bootstrap.Collapse.getInstance(menuEl);
      if (bsCollapse) bsCollapse.hide();
    }
  }
});

/* ---------- Category Filters Handler ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const filterButtons = document.querySelectorAll('#filters button[data-filter]');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and add to the clicked one
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const selectedCategory = button.getAttribute('data-filter');
      const allCards = document.querySelectorAll('.dest-card-wrapper');

      allCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');

        // Show card if 'All' is selected or categories match exactly
        if (selectedCategory === 'All' || cardCategory === selectedCategory) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
});

/* ---------- Season guide function ---------- */
const ZONES = [
  { n: 'South & West coast', ex: 'Mirissa, Galle, Bentota', best: [11, 4], why: 'Dry, calm seas' },
  { n: 'East coast', ex: 'Arugam Bay, Trincomalee', best: [5, 9], why: 'Dry, best surf' },
  { n: 'Hill country', ex: 'Ella, Nuwara Eliya', best: [1, 4], why: 'Clearest views, cooler air' },
  { n: 'Cultural triangle', ex: 'Sigiriya, Anuradhapura', best: [5, 9], why: 'Drier, fewer showers' }
];

const inRange = (m, [a, b]) => a <= b ? m >= a && m <= b : m >= a || m <= b;

document.addEventListener('DOMContentLoaded', () => {
  const monthPick = $('#monthPick');
  const sMonth = $('#sMonth');
  const monthOpts = MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');

  if (sMonth) sMonth.innerHTML = monthOpts;
  if (monthPick) monthPick.innerHTML = monthOpts;

  const now = new Date().getMonth() + 1;
  if (sMonth) sMonth.value = now;
  if (monthPick) {
    monthPick.value = now;
    monthPick.addEventListener('change', renderSeason);
    renderSeason();
  }
});

function renderSeason() {
  const monthPickEl = $('#monthPick');
  if (!monthPickEl) return;
  const m = +monthPickEl.value;
  const scored = ZONES.map(z => ({ ...z, ok: inRange(m, z.best) }));

  const seasonOut = $('#seasonOut');
  if (seasonOut) {
    seasonOut.innerHTML = scored.map(z => `
      <div class="col-sm-6"><div class="zone ${z.ok ? 'z-great' : 'z-poor'} fade-in">
        <span class="pill">${z.ok ? 'Best now' : 'Wetter now'}</span><h4>${z.n}</h4>
        <small>${z.ex}</small><div class="mt-1 small">${z.ok ? z.why : 'Expect showers and rougher seas'}</div></div></div>`).join('');
  }

  const names = scored.filter(z => z.ok).map(z => z.n);
  const seasonNote = $('#seasonNote');
  if (seasonNote) {
    seasonNote.textContent = names.length
      ? `In ${MONTHS[m - 1]}, head to: ${names.join(' and ')}.`
      : 'Every region sees some rain this month; plan indoor stops.';
  }
}