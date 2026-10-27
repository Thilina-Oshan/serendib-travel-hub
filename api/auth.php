<?php
require_once 'db.php';
header('Content-Type: application/json');

// Read incoming JSON payload from frontend request
$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? 'login'; // Defaults to 'login'

if ($action === 'signup') {
    // ==================== MEMBER SIGN UP ====================
    $u_fname = trim($data['u_fname'] ?? '');
    $u_contact = trim($data['u_contact'] ?? '');
    $u_password = $data['u_password'] ?? '';

    if (!empty($u_fname) && !empty($u_contact) && !empty($u_password)) {
        // Check if the contact number is already registered in 'users_loging'
        $stmt = $pdo->prepare("SELECT user_lg_id FROM users_loging WHERE u_contact = ?");
        $stmt->execute([$u_contact]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'This contact number is already registered! Try signing in.']);
            exit();
        }

        // Securely hash the password
        $hashedPassword = password_hash($u_password, PASSWORD_DEFAULT);

        // Insert new user into 'users_loging'
        $stmt = $pdo->prepare("INSERT INTO users_loging (u_fname, u_contact, u_password) VALUES (?, ?, ?)");
        if ($stmt->execute([$u_fname, $u_contact, $hashedPassword])) {
            echo json_encode(['success' => true, 'message' => 'Account created successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again!']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Please fill in all required fields!']);
    }

} else {
    // ==================== MEMBER LOGIN ====================
    $u_contact = trim($data['u_contact'] ?? '');
    $u_password = $data['u_password'] ?? '';

    if (!empty($u_contact) && !empty($u_password)) {
        // Fetch record from 'users_loging' using contact number
        $stmt = $pdo->prepare("SELECT * FROM users_loging WHERE u_contact = ?");
        $stmt->execute([$u_contact]);
        $user = $stmt->fetch();

        // Verify password against hashed database record
        if ($user && password_verify($u_password, $user['u_password'])) {
            session_start();
            $_SESSION['user_logged'] = true;
            $_SESSION['user_id'] = $user['user_lg_id'];
            $_SESSION['user_name'] = $user['u_fname'];
            $_SESSION['u_contact'] = $user['u_contact'];

            echo json_encode([
                'success' => true, 
                'message' => 'Login successful!',
                'redirect' => '../users/users.php'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid contact number or password!']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Please fill in all fields!']);
    }
}