<?php
// Database connection
require_once 'api/db.php';

// Fetch destinations data from the database
try {
  $stmt = $pdo->query("SELECT * FROM destinations ORDER BY id DESC");
  $destinations = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
  $destinations = [];
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Serendib-Travel-Hub: The Wonder of Asia</title>
  <meta name="description"
    content="Plan your trip to Sri Lanka: destinations, monsoon guide, and a custom itinerary builder.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link
    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Poppins:wght@300;400;500;600&display=swap"
    rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="/asset/css/main.css" rel="stylesheet">
</head>

<body>

  <!-- NAVBAR CONTAINER -->
  <div id="navbar-container"></div>

  <!-- HERO -->
  <header id="home" class="hero">
    <div id="heroCarousel" class="carousel slide carousel-fade" data-bs-ride="carousel" data-bs-interval="6000">
      <div class="carousel-inner">
        <div class="carousel-item active">
          <div class="scene s-sigiriya"><span class="scene-tag">Sigiriya Rock Fortress</span></div>
        </div>
        <div class="carousel-item">
          <div class="scene s-bridge"><span class="scene-tag">Nine Arch Bridge, Ella</span></div>
        </div>
        <div class="carousel-item">
          <div class="scene s-mirissa"><span class="scene-tag">Mirissa Beach</span></div>
        </div>
      </div>
    </div>
    <div class="hero-overlay container">
      <h1>Explore Sri Lanka:<br>The Wonder of Asia</h1>
      <p class="lead">Discover the Pearl of the Indian Ocean</p>
      <form id="searchForm" class="glass search row g-2 align-items-end">
        <div class="col-md-3"><label class="form-label" for="sDest">Destination</label>
          <select id="sDest" class="form-select">
            <option value="">Anywhere</option>
          </select>
        </div>
        <div class="col-md-3"><label class="form-label" for="sAct">Activity</label>
          <select id="sAct" class="form-select">
            <option value="">Any activity</option>
            <option value="Heritage">Culture &amp; history</option>
            <option value="Beaches">Beach &amp; surf</option>
            <option value="Wildlife">Safari &amp; wildlife</option>
            <option value="Hill Country">Hiking &amp; tea country</option>
          </select>
        </div>
        <div class="col-md-3"><label class="form-label" for="sMonth">Travel month</label>
          <select id="sMonth" class="form-select"></select>
        </div>
        <div class="col-md-3 d-grid"><button class="btn btn-cta" type="submit">Find trips</button></div>
      </form>
    </div>
  </header>

  <!-- DESTINATIONS -->
  <section id="destinations" class="py-section">
    <div class="container">
      <h2 class="section-title">Top attractions</h2>
      <p class="section-sub">Eight places that show why a small island holds so much.</p>

      <!-- Category Filter Buttons -->
      <div id="filters" class="d-flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter destinations">
        <button class="btn btn-chip active" data-filter="All">All</button>
        <button class="btn btn-chip" data-filter="Heritage">Heritage</button>
        <button class="btn btn-chip" data-filter="Beaches">Beaches</button>
        <button class="btn btn-chip" data-filter="Wildlife">Wildlife</button>
        <button class="btn btn-chip" data-filter="Hill Country">Hill Country</button>
      </div>

      <!-- Destinations Grid loaded dynamically from Database -->
      <div id="destGrid" class="row g-4">
        <?php if (!empty($destinations)): ?>
          <?php foreach ($destinations as $dest): ?>
            <!-- Ensure data-category matches the exact category string stored in database -->
            <div class="col-md-6 col-lg-3 dest-card-wrapper" data-category="<?= htmlspecialchars(trim($dest['cat'] ?? 'All')) ?>">
              <div class="card h-100 shadow-sm border-0 rounded-3 overflow-hidden">
                <!-- Render photo correctly supporting both Base64 and image paths -->
                <img src="<?= !empty($dest['photo']) ? htmlspecialchars($dest['photo']) : '/asset/img/default.jpg' ?>"
                  class="card-img-top"
                  alt="<?= htmlspecialchars($dest['name'] ?? 'Destination') ?>"
                  style="height: 200px; object-fit: cover;">

                <div class="card-body d-flex flex-column">
                  <span class="badge bg-primary w-auto align-self-start mb-2"><?= htmlspecialchars($dest['cat'] ?? 'General') ?></span>
                  <h5 class="card-title"><?= htmlspecialchars($dest['name'] ?? 'Untitled') ?></h5>
                  <?php if (!empty($dest['loc'])): ?>
                    <small class="text-muted mb-2">📍 <?= htmlspecialchars($dest['loc']) ?></small>
                  <?php endif; ?>
                  <p class="card-text text-secondary flex-grow-1"><?= htmlspecialchars($dest['description'] ?? '') ?></p>
                </div>
              </div>
            </div>
          <?php endforeach; ?>
        <?php else: ?>
          <div class="col-12 text-center">
            <p class="text-muted">No destinations available at the moment.</p>
          </div>
        <?php endif; ?>
      </div>
    </div>
  </section>
  <!-- EXPERIENCES -->
  <section id="experiences" class="py-section band">
    <div class="container">
      <h2 class="section-title">Things you can only do here</h2>
      <div class="row g-4 mt-1">
        <div class="col-md-6 col-xl-3">
          <article class="xp">
            <div class="xp-ico">🍵</div>
            <h3>Ceylon tea tasting</h3>
            <p>Walk the estates around Nuwara Eliya, watch leaves rolled and fired, then taste the result at the source.</p>
          </article>
        </div>
        <div class="col-md-6 col-xl-3">
          <article class="xp">
            <div class="xp-ico">🐆</div>
            <h3>Yala safari</h3>
            <p>Jeep through dry-zone scrub at dawn. Yala has one of the world's densest leopard populations.</p>
          </article>
        </div>
        <div class="col-md-6 col-xl-3">
          <article class="xp">
            <div class="xp-ico">🏄</div>
            <h3>Surfing in Arugam Bay</h3>
            <p>A long right-hand point break on the east coast, best from May to September.</p>
          </article>
        </div>
        <div class="col-md-6 col-xl-3">
          <article class="xp">
            <div class="xp-ico">🚂</div>
            <h3>Scenic train rides</h3>
            <p>Kandy to Ella is among the world's great rail journeys. Book reserved seats early.</p>
          </article>
        </div>
      </div>
    </div>
  </section>

  <!-- SEASON -->
  <section id="season" class="py-section">
    <div class="container">
      <h2 class="section-title">Where to go, month by month</h2>
      <p class="section-sub">Sri Lanka has two monsoons, so the sunny coast changes with the calendar.</p>
      <div class="glass-light season-card">
        <div class="row g-4 align-items-center">
          <div class="col-lg-4">
            <label class="form-label" for="monthPick">I'm travelling in</label>
            <select id="monthPick" class="form-select form-select-lg"></select>
            <p id="seasonNote" class="mt-3 mb-0"></p>
          </div>
          <div id="seasonOut" class="col-lg-8 row g-3"></div>
        </div>
      </div>
    </div>
  </section>

  <!-- PLANNER -->
  <section id="planner" class="py-section band">
    <div class="container">
      <h2 class="section-title">Build your route</h2>
      <p class="section-sub">Tell us how long, how you travel, and what you love.</p>
      <div class="row g-4">
        <div class="col-lg-5">
          <form id="planForm" class="glass-light p-4">
            <label class="form-label" for="days">Duration: <strong id="daysOut">7</strong> days</label>
            <input id="days" type="range" class="form-range mb-3" min="3" max="21" value="7">
            <label class="form-label" for="style">Travel style</label>
            <select id="style" class="form-select mb-3">
              <option>Backpacker</option>
              <option selected>Family</option>
              <option>Luxury</option>
            </select>
            <fieldset class="mb-3">
              <legend class="form-label">Main interests</legend>
              <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" id="iNature"
                  value="nature" checked><label class="form-check-label" for="iNature">Nature</label></div>
              <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" id="iCulture"
                  value="culture" checked><label class="form-check-label" for="iCulture">Culture</label></div>
              <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" id="iAdv"
                  value="adventure"><label class="form-check-label" for="iAdv">Adventure</label></div>
            </fieldset>
            <button class="btn btn-cta w-100" type="submit">Create my route</button>
          </form>
        </div>
        <div class="col-lg-7">
          <div id="planOut" class="glass-light p-4 h-100" aria-live="polite">
            <p class="mb-0 text-muted">Your route will appear here. Pick at least one interest and choose “Create my
              route”.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- GALLERY + TESTIMONIALS -->
  <section id="gallery" class="py-section">
    <div class="container">
      <h2 class="section-title">Gallery</h2>
      <p class="section-sub">Select a tile to enlarge it.</p>
      <div id="galleryGrid" class="masonry"></div>
      <h2 class="section-title mt-5 pt-3">What travellers say</h2>
      <div id="reviews" class="carousel slide mt-3" data-bs-ride="carousel">
        <div class="carousel-inner">
          <div class="carousel-item active">
            <blockquote class="review">
              <p>The Ella train was as good as the photos, and the route planner saved us a week of guesswork.</p>
              <footer>Maya &amp; Tom, UK</footer>
            </blockquote>
          </div>
          <div class="carousel-item">
            <blockquote class="review">
              <p>Dawn at Sigiriya, lunch in Kandy, surf in Mirissa. We never felt rushed.</p>
              <footer>Hiroshi, Japan</footer>
            </blockquote>
          </div>
          <div class="carousel-item">
            <blockquote class="review">
              <p>Our kids still talk about the elephants at Udawalawe.</p>
              <footer>The Okafor family, Nigeria</footer>
            </blockquote>
          </div>
        </div>
        <button class="carousel-control-prev" data-bs-target="#reviews" data-bs-slide="prev"
          aria-label="Previous review"><span class="carousel-control-prev-icon"></span></button>
        <button class="carousel-control-next" data-bs-target="#reviews" data-bs-slide="next"
          aria-label="Next review"><span class="carousel-control-next-icon"></span></button>
      </div>
    </div>
  </section>

  <!-- FOOTER CONTAINER -->
  <div id="footer-container"></div>

  <!-- MODAL (shared by destinations and gallery) -->
  <div class="modal fade" id="infoModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div id="mScene" class="scene m-scene"></div>
        <div class="modal-body p-4"><button type="button" class="btn-close float-end" data-bs-dismiss="modal"
            aria-label="Close"></button>
          <h3 id="mTitle"></h3>
          <p id="mMeta" class="text-muted"></p>
          <p id="mText"></p>
        </div>
      </div>
    </div>
  </div>

  <!-- Pass PHP database results into JavaScript window object -->
  <script>
    window.dbDestinations = <?php echo json_encode($destinations, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
  </script>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/asset/js/main.js"></script>
</body>

</html>p