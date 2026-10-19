<?php
// Initialize session or security checks here if needed in the future
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Dashboard | Serendib Travel Hub</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,800&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Custom Admin CSS -->
    <link href="/asset/css/admin.css" rel="stylesheet">
</head>

<body>
    <!-- Sidebar Navigation: Fixed on desktop, off-canvas drawer on mobile devices -->
    <aside id="sidebar" class="offcanvas-lg offcanvas-start sidebar" tabindex="-1" aria-label="Admin navigation">
        <div class="offcanvas-header d-lg-none">
            <span class="brand">Explore Sri Lanka 🇱🇰</span>
            <button class="btn-close btn-close-white" data-bs-dismiss="offcanvas" data-bs-target="#sidebar" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body flex-column p-0">
            <a class="brand d-none d-lg-block" href="../index.php">
                Explore Sri Lanka 🇱🇰<small>Admin Dashboard</small>
            </a>
            <!-- Sidebar Navigation Links -->
            <nav id="sideNav" class="nav flex-column px-3 mt-3">
                <button class="nav-link active" data-view="overview">📊 Overview</button>
                <button class="nav-link" data-view="destinations">🏯 Destinations</button>
                <button class="nav-link" data-view="experiences">🍵 Experiences</button>
                <button class="nav-link" data-view="gallery">🖼️ Gallery</button>
                <button class="nav-link" data-view="reviews">💬 Testimonials</button>
                <a class="nav-link text-danger mt-2" href="../index.php">🚪 Log-Out</a>
            </nav>
            <div class="side-foot px-3 mt-auto">
                <a class="nav-link" href="../index.php" target="_blank">↗ View Live Website</a>
            </div>
        </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="main">
        <!-- Top Bar Header -->
        <header class="topbar">
            <button class="btn btn-light d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#sidebar" aria-label="Open menu">☰</button>
            <h1 id="viewTitle">Overview</h1>
            <div class="ms-auto d-flex gap-2">
                <button id="exportBtn" class="btn btn-outline-secondary btn-sm">Export JSON</button>
                <button id="resetBtn" class="btn btn-outline-danger btn-sm">Reset Demo Data</button>
            </div>
        </header>

        <!-- Main Body Content Area -->
        <main class="content">
            <!-- Overview Section -->
            <section id="v-overview">
                <div id="stats" class="row g-3 mb-4"></div>
                <div class="row g-3">
                    <div class="col-xl-7">
                        <div class="panel">
                            <h2>Recently Added</h2>
                            <ul id="recent" class="list-unstyled mb-0"></ul>
                        </div>
                    </div>
                    <div class="col-xl-5">
                        <div class="panel">
                            <h2>Quick Actions</h2>
                            <div class="d-grid gap-2">
                                <button class="btn btn-cta" data-quick="destinations">+ Add Destination</button>
                                <button class="btn btn-cta" data-quick="gallery">+ Upload Gallery Photo</button>
                                <button class="btn btn-cta" data-quick="reviews">+ Add Testimonial</button>
                            </div>
                            <p class="small text-muted mt-3 mb-0">Data is securely managed via MySQL Database and PHP backend APIs.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Dynamic CRUD View Section (Handles Destinations, Experiences, Gallery, Reviews) -->
            <section id="v-crud" hidden>
                <div class="panel">
                    <div class="row g-2 mb-3 align-items-center">
                        <div class="col-sm-6 col-lg-4">
                            <input id="search" type="search" class="form-control" placeholder="Search records…" aria-label="Search">
                        </div>
                        <div class="col-sm-4 col-lg-3" id="filterWrap">
                            <select id="filterCat" class="form-select" aria-label="Filter by category"></select>
                        </div>
                        <div class="col-sm col-lg ms-lg-auto text-sm-end">
                            <button id="addBtn" class="btn btn-cta">+ Add New</button>
                        </div>
                    </div>
                    <div class="table-responsive-none">
                        <table class="table align-middle rtable mb-0">
                            <thead id="thead"></thead>
                            <tbody id="tbody"></tbody>
                        </table>
                    </div>
                    <p id="empty" class="text-center text-muted py-4 mb-0" hidden>Nothing here yet. Click “Add new” to create your first entry.</p>
                </div>
            </section>
        </main>
    </div>

    <!-- Add / Edit Modal Form -->
    <div class="modal fade" id="formModal" tabindex="-1" aria-labelledby="formTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
            <form id="entityForm" class="modal-content" novalidate>
                <div class="modal-header">
                    <h2 id="formTitle" class="modal-title fs-4"></h2>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div id="formBody" class="modal-body row g-3"></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                    <button class="btn btn-cta" type="submit">Save Entry</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="delModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-body p-4">
                    <h2 class="fs-5">Delete this entry?</h2>
                    <p id="delName" class="mb-3"></p>
                    <div class="d-flex gap-2 justify-content-end">
                        <button class="btn btn-light" data-bs-dismiss="modal">Keep</button>
                        <button id="delConfirm" class="btn btn-danger">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notification Container -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="toast" class="toast align-items-center text-bg-dark border-0" role="status" aria-live="polite">
            <div class="d-flex">
                <div id="toastMsg" class="toast-body"></div>
                <button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    </div>

    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Admin JavaScript File -->
    <script src="/asset/js/admin.js"></script>
</body>

</html>