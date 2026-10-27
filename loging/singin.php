<?php
// Start session to manage login state
session_start();

// Include database connection file from the parent api directory
require_once '../api/db.php';

$error = '';

// Check if the form is submitted via POST method (Admin or Member Login)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? ''); // Yahan input field ka name username hi hai, par hum ise Full Name ki tarah use karenge
    $password = trim($_POST['password'] ?? '');

    if (!empty($username) && !empty($password)) {
        
        // 1. Check if the user is an Admin in the 'admins' table
        $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
        $stmt->execute([$username]);
        $admin = $stmt->fetch();

        if ($admin && ($password === $admin['password'] || password_verify($password, $admin['password']))) {
            $_SESSION['admin_logged'] = true;
            $_SESSION['admin_username'] = $admin['username'];
            header("Location: ../admin/admin.php");
            exit();
        }

        // 2. Check if the user is a Member in the 'users_loging' table using Full Name (u_fname)
        $stmt = $pdo->prepare("SELECT * FROM users_loging WHERE u_fname = ?");
        $stmt->execute([$username]);
        $member = $stmt->fetch();

        if ($member && password_verify($password, $member['u_password'])) {
            $_SESSION['user_logged'] = true;
            $_SESSION['user_id'] = $member['user_lg_id'];
            $_SESSION['user_name'] = $member['u_fname'];
            $_SESSION['u_contact'] = $member['u_contact'];
            header("Location: ../users/users.php");
            exit();
        }

        $error = "Invalid full name or password!";
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
    <title>Sign In | Serendib Travel Hub</title>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,800&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
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
                <h1>Travel Hub Portal</h1>
                <p>Sign in to manage your bookings, profile, or administrative controls.</p>
                <ul class="list-unstyled side-points">
                    <li>🏯 Manage Destinations</li>
                    <li>📝 Handle Bookings & Requests</li>
                    <li>🖼️ Control Media Gallery</li>
                </ul>
            </div>
        </aside>

        <main class="auth-main">
            <div class="auth-box">

                <!-- Heading -->
                <div class="text-center mb-4">
                    <h2 class="fw-bold">Sign In</h2>
                    <p class="text-muted">Enter your credentials to access your dashboard.</p>
                </div>

                <!-- Tabs: sign in / sign up -->
                <ul id="tabs" class="nav nav-pills nav-fill mb-4" role="tablist">
                    <li class="nav-item"><button class="nav-link active" data-go="signin" id="tab-signin" type="button" role="tab" aria-selected="true">Sign in</button></li>
                    <li class="nav-item"><button class="nav-link" data-go="signup" id="tab-signup" type="button" role="tab" aria-selected="false">Sign up</button></li>
                </ul>

                <!-- SIGN IN FORM -->
                <section id="p-signin" class="panel-x">
                    <?php if (!empty($error)): ?>
                        <div class="alert alert-danger" role="alert"><?php echo htmlspecialchars($error); ?></div>
                    <?php endif; ?>

                    <form id="signinForm" method="POST" action="">
                        <div class="mb-3">
                            <label class="form-label" for="username">Full Name</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fa-solid fa-user"></i></span>
                                <input id="username" name="username" type="text" class="form-control" placeholder="Enter your full name" required autocomplete="username">
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="form-label" for="password">Password</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fa-solid fa-key"></i></span>
                                <input id="password" name="password" type="password" class="form-control" placeholder="Enter password" autocomplete="current-password" required>
                            </div>
                        </div>

                        <button class="btn btn-cta w-100 py-2 fw-bold shadow-sm" type="submit">
                            Sign in <i class="fa-solid fa-arrow-right-to-bracket ms-2"></i>
                        </button>
                    </form>
                </section>

                <!-- SIGN UP -->
                <section id="p-signup" class="panel-x" aria-labelledby="tab-signup" hidden>
                    <h2>Create your account</h2>
                    <p class="text-muted">It only takes a minute.</p>
                    <div id="suErr" class="alert alert-danger" role="alert" hidden></div>
                    <form id="signupForm" novalidate>
                        <div class="mb-3"><label class="form-label" for="su_fname">Full name</label>
                            <div class="input-group has-validation"><span class="input-group-text" aria-hidden="true">👤</span>
                                <input id="su_fname" name="u_fname" class="form-control" autocomplete="name" maxlength="60" required>
                                <div class="invalid-feedback"></div>
                            </div>
                        </div>
                        <div class="mb-3"><label class="form-label" for="su_contact">Contact number</label>
                            <div class="input-group has-validation"><span class="input-group-text" aria-hidden="true">📞</span>
                                <input id="su_contact" name="u_contact" type="tel" inputmode="tel" class="form-control" placeholder="07X XXX XXXX or +94…" autocomplete="tel" required>
                                <div class="invalid-feedback"></div>
                            </div>
                        </div>
                        <div class="mb-3"><label class="form-label" for="su_password">Password</label>
                            <div class="input-group has-validation"><span class="input-group-text" aria-hidden="true">🔒</span>
                                <input id="su_password" name="u_password" type="password" class="form-control" autocomplete="new-password" aria-describedby="suHelp" required>
                                <button type="button" class="btn btn-outline-secondary pw-toggle" data-target="#su_password" aria-label="Show password">Show</button>
                                <div class="invalid-feedback"></div>
                            </div>
                            <div class="progress meter mt-2" role="progressbar" aria-label="Password strength">
                                <div id="suBar" class="progress-bar" style="width:0"></div>
                            </div>
                            <small id="suHelp" class="text-muted">8+ characters with letters and numbers. <span id="suLabel"></span></small>
                        </div>
                        <div class="mb-4"><label class="form-label" for="su_confirm">Confirm password</label>
                            <div class="input-group has-validation"><span class="input-group-text" aria-hidden="true">🔒</span>
                                <input id="su_confirm" name="confirm" type="password" class="form-control" autocomplete="new-password" required>
                                <div class="invalid-feedback"></div>
                            </div>
                        </div>
                        <button class="btn btn-cta w-100" type="submit">Create account</button>
                    </form>
                    <p class="text-center mt-4 mb-0">Already registered? <button type="button" class="btn btn-link p-0 align-baseline" data-go="signin">Sign in</button></p>
                </section>

                <!-- FORGOT PASSWORD -->
                <section id="p-forgot" class="panel-x" hidden>
                    <h2>Forgot password?</h2>
                    <div id="fpMsg" class="alert alert-info" role="status" hidden></div>
                    <form id="forgotForm" novalidate>
                        <p class="text-muted">Enter the contact number on your account and we'll send a 6-digit verification code.</p>
                        <div class="mb-4"><label class="form-label" for="fp_contact">Contact number</label>
                            <div class="input-group has-validation"><span class="input-group-text" aria-hidden="true">📞</span>
                                <input id="fp_contact" name="u_contact" type="tel" inputmode="tel" class="form-control" autocomplete="tel" required>
                                <div class="invalid-feedback"></div>
                            </div>
                        </div>
                        <button class="btn btn-cta w-100" type="submit">Send code</button>
                    </form>
                    <form id="resetForm" novalidate hidden>
                        <p class="text-muted">Enter the code we sent to <strong id="rsTo"></strong> and choose a new password.</p>
                        <div class="mb-3"><label class="form-label" for="rs_code">Verification code</label>
                            <input id="rs_code" name="code" class="form-control code-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" required>
                            <div class="invalid-feedback"></div>
                        </div>
                        <div class="mb-3"><label class="form-label" for="rs_password">New password</label>
                            <div class="input-group has-validation"><input id="rs_password" name="u_password" type="password" class="form-control" autocomplete="new-password" required>
                                <button type="button" class="btn btn-outline-secondary pw-toggle" data-target="#rs_password" aria-label="Show password">Show</button>
                                <div class="invalid-feedback"></div>
                            </div>
                            <div class="progress meter mt-2" role="progressbar" aria-label="Password strength">
                                <div id="rsBar" class="progress-bar" style="width:0"></div>
                            </div>
                        </div>
                        <div class="mb-3"><label class="form-label" for="rs_confirm">Confirm new password</label>
                            <input id="rs_confirm" name="confirm" type="password" class="form-control" autocomplete="new-password" required>
                            <div class="invalid-feedback"></div>
                        </div>
                        <button class="btn btn-cta w-100 mb-2" type="submit">Reset password</button>
                        <button class="btn btn-link w-100" type="button" id="resend">Resend code</button>
                    </form>
                    <p class="text-center mt-3 mb-0"><button type="button" class="btn btn-link p-0" data-go="signin">← Back to sign in</button></p>
                </section>

                <!-- SIGNED IN -->
                <section id="p-done" class="panel-x text-center" hidden>
                    <div class="done-ico" aria-hidden="true">🎉</div>
                    <h2>Welcome, <span id="dName"></span></h2>
                    <p class="text-muted mb-4">You're signed in as <strong id="dContact"></strong>.</p>
                    <a class="btn btn-cta w-100 mb-2" href="../index.php">Continue to website</a>
                    <button class="btn btn-outline-secondary w-100" id="signout" type="button">Sign out</button>
                </section>

            </div>
        </main>
    </div>

    <!-- Back to website -->
    <div class="text-center mt-4 mb-4">
        <a href="../index.php" class="text-decoration-none text-muted small">
            <i class="fa-solid fa-arrow-left me-1"></i> Back to Main Website
        </a>
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
    <script>
        // Frontend AJAX handler for Sign Up connecting to auth.php
        document.getElementById('signupForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const fname = document.getElementById('su_fname').value;
            const contact = document.getElementById('su_contact').value;
            const password = document.getElementById('su_password').value;
            const confirm = document.getElementById('su_confirm').value;
            const errBox = document.getElementById('suErr');

            if (password !== confirm) {
                errBox.textContent = "Passwords do not match!";
                errBox.hidden = false;
                return;
            }

            try {
                const res = await fetch('../api/auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'signup', u_fname: fname, u_contact: contact, u_password: password })
                });
                const data = await res.json();
                if (data.success) {
                    alert(data.message);
                    location.reload();
                } else {
                    errBox.textContent = data.message;
                    errBox.hidden = false;
                }
            } catch (err) {
                console.error(err);
                errBox.textContent = "Server connection error.";
                errBox.hidden = false;
            }
        });
    </script>
    <script src="../asset/js/signin.js" type="module"></script>
</body>

</html>