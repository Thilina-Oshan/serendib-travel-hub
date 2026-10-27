<?php
// Start session to manage login state
session_start();

// Include database connection file from the parent api directory
require_once '../api/db.php';

$error = '';

// Check if the form is submitted via POST method
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    // Validate that inputs are not empty
    if (!empty($username) && !empty($password)) {
        // Prepare statement to fetch admin record from database using username
        $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
        $stmt->execute([$username]);
        $admin = $stmt->fetch();

        // Verify password (supports both plain text and hashed passwords from database)
        if ($admin && ($password === $admin['password'] || password_verify($password, $admin['password']))) {
            // Set session variables upon successful admin login
            $_SESSION['admin_logged'] = true;
            $_SESSION['admin_username'] = $admin['username'];

            // Redirect to admin dashboard
            header("Location: ../admin/admin.php");
            exit();
        } else {
            $error = "Invalid username or password!";
        }
    } else {
        $error = "Please fill in all fields!";
    }
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Login | Serendib Travel Hub</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,800&family=Poppins:wght@300;400;500;600&display=swap"
        rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="/asset/css/singin.css" rel="stylesheet">
</head>

<body>
    <div class="auth-page">

        <!-- Brand panel -->
        <aside class="auth-side">
            <a class="brand" href="../index.php">Serendib Travel 🇱🇰</a>
            <div class="side-copy">
                <h1>Admin Control Panel</h1>
                <p>Sign in to manage destinations, experiences, gallery, and client requests.</p>
                <ul class="list-unstyled side-points">
                    <li>🏯 Manage Destinations</li>
                    <li>📝 Handle Client Requests</li>
                    <li>🖼️ Control Media Gallery</li>
                </ul>
            </div>
        </aside>

        <main class="auth-main">
            <div class="auth-box">

                <!-- Heading -->
                <div class="text-center mb-4">
                    <h2 class="fw-bold">Admin Sign In</h2>
                    <p class="text-muted">Enter your admin credentials to access the dashboard.</p>
                </div>

                <!-- Display Error Message if any -->
                <?php if (!empty($error)): ?>
                    <div class="alert alert-danger" role="alert"><?php echo htmlspecialchars($error); ?></div>
                <?php endif; ?>

                <!-- SIGN IN FORM (Using Username instead of Phone Number) -->
                <form id="signinForm" method="POST" action="">
                    <div class="mb-3">
                        <label class="form-label" for="username">Username</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fa-solid fa-user"></i></span>
                            <input id="username" name="username" type="text" class="form-control"
                                placeholder="Enter admin username" required autocomplete="username">
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label" for="password">Password</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fa-solid fa-key"></i></span>
                            <input id="password" name="password" type="password" class="form-control"
                                placeholder="Enter password" autocomplete="current-password" required>
                        </div>
                    </div>

                    <button class="btn btn-cta w-100 py-2 fw-bold shadow-sm" type="submit">
                        Sign in <i class="fa-solid fa-arrow-right-to-bracket ms-2"></i>
                    </button>
                </form>

                <!-- Back to website -->
                <div class="text-center mt-4">
                    <a href="../index.php" class="text-decoration-none text-muted small">
                        <i class="fa-solid fa-arrow-left me-1"></i> Back to Main Website
                    </a>
                </div>

            </div>
        </main>
    </div>

    <!-- Toast Notification -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="toast" class="toast align-items-center text-bg-dark border-0" role="status" aria-live="polite">
            <div class="d-flex">
                <div id="toastMsg" class="toast-body"></div>
                <button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>