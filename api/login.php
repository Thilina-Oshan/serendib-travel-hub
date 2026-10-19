<!-- <?php
require_once 'db.php';
header('Content-Type: application/json');

// Read incoming JSON payload from frontend request
$data = json_decode(file_get_contents("php://input"), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if (!empty($username) && !empty($password)) {
    // Prepare statement to fetch admin record by username
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    // Verify password hash against database record
    if ($admin && password_verify($password, $admin['password'])) {
        echo json_encode(['success' => true, 'message' => 'Login successful']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Please fill in all fields']);
}