<?php
// Start session to manage admin login state
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
        // Prepare statement to fetch admin record from database
        $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
        $stmt->execute([$username]);
        $admin = $stmt->fetch();

        // Verify password (supports both plain text and hashed passwords from database)
        if ($admin && ($password === $admin['password'] || password_verify($password, $admin['password']))) {
            // Set session variables upon successful login
            $_SESSION['admin_logged'] = true;
            $_SESSION['admin_username'] = $admin['username'];

            // Redirect to admin.php inside the admin folder
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
    <title>Admin Login - Serendib Travel Hub</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Custom Login CSS -->
    <link href="/asset/css/loging.css" rel="stylesheet">
</head>

<body>

    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-5 col-lg-4">

                <!-- Brand / Logo Area -->
                <div class="text-center mb-4">
                    <div class="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle shadow mb-3"
                        style="width: 60px; height: 60px;">
                        <i class="fa-solid fa-lock fa-lg"></i>
                    </div>
                    <h3 class="fw-bold text-dark">Serendib Admin</h3>
                    <p class="text-muted small">Sign in to manage your travel hub dashboard</p>
                </div>

                <!-- Login Card Container -->
                <div class="card login-card p-2">
                    <div class="card-body p-4">
                        <!-- Login Form with POST method submission -->
                        <form id="loginForm" method="POST" action="">
                            <div class="mb-3">
                                <label class="form-label fw-semibold text-secondary small">USERNAME</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light border-end-0 text-muted">
                                        <i class="fa-solid fa-user"></i>
                                    </span>
                                    <input type="text" id="username" name="username" class="form-control bg-light border-start-0 py-2"
                                        placeholder="Enter username" required>
                                </div>
                            </div>

                            <div class="mb-4">
                                <label class="form-label fw-semibold text-secondary small">PASSWORD</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light border-end-0 text-muted">
                                        <i class="fa-solid fa-key"></i>
                                    </span>
                                    <input type="password" id="password" name="password"
                                        class="form-control bg-light border-start-0 py-2" placeholder="Enter password"
                                        required>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary w-100 py-2 fw-bold rounded-3 shadow-sm">
                                Login <i class="fa-solid fa-arrow-right-to-bracket ms-2"></i>
                            </button>

                            <!-- Display PHP Error Message if authentication fails -->
                            <?php if (!empty($error)): ?>
                                <div id="loginError" class="text-danger text-center mt-3 small fw-semibold"><?php echo $error; ?></div>
                            <?php endif; ?>
                        </form>
                        <div class="text-center mt-4">
                            <a href="/loging/singin.php" class="text-decoration-none text-muted small">
                                <i class="fa-solid fa-arrow-left me-1"></i> Sing In
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Back to Main Website Link -->
                <div class="text-center mt-4">
                    <a href="../index.php" class="text-decoration-none text-muted small">
                        <i class="fa-solid fa-arrow-left me-1"></i> Back to Main Website
                    </a>
                </div>

            </div>
        </div>
    </div>

    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>