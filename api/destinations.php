<?php
// Include database connection configuration
require_once 'db.php';

// Set response header to JSON format
header('Content-Type: application/json');

// Get the HTTP request method
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    // Handle GET request to fetch all destinations
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT * FROM destinations ORDER BY id DESC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
        break;

    // Handle POST request to create a new destination
    case 'POST':
        // Decode JSON payload sent from admin.js
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Capture values corresponding directly to your database columns
        $name = $data['name'] ?? '';
        $cat = $data['cat'] ?? 'Heritage';
        $loc = $data['loc'] ?? '';
        $rating = $data['rating'] ?? 5;
        $desc = $data['desc'] ?? '';
        $photo = $data['photo'] ?? '';

        // Validation check to ensure name is not empty
        if (empty($name)) {
            echo json_encode(['success' => false, 'message' => 'Destination name is required.']);
            exit;
        }

        try {
            // Insert into destinations table using exact column names
            $stmt = $pdo->prepare("INSERT INTO destinations (name, cat, loc, rating, description, photo) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $cat, $loc, $rating, $desc, $photo]);
            
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Destination added successfully!']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
        break;

    // Handle PUT request to update an existing destination
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!$data || !isset($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'Invalid update data or ID missing.']);
            exit;
        }

        $name = $data['name'] ?? '';
        $cat = $data['cat'] ?? '';
        $loc = $data['loc'] ?? '';
        $rating = $data['rating'] ?? 5;
        $desc = $data['desc'] ?? '';
        $photo = $data['photo'] ?? '';

        try {
            $stmt = $pdo->prepare("UPDATE destinations SET name = ?, cat = ?, loc = ?, rating = ?, description = ?, photo = ? WHERE id = ?");
            $stmt->execute([$name, $cat, $loc, $rating, $desc, $photo, $data['id']]);
            
            echo json_encode(['success' => true, 'message' => 'Destination updated successfully!']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
        break;

    // Handle DELETE request to remove a destination
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if ($id) {
            try {
                $stmt = $pdo->prepare("DELETE FROM destinations WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'message' => 'Destination deleted successfully!']);
            } catch (PDOException $e) {
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'ID not provided for deletion.']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Unsupported request method.']);
        break;
}
?>