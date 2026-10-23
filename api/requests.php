<?php
session_start();
header('Content-Type: application/json');

// Check if the admin is authenticated
if (!isset($_SESSION['admin_logged']) || $_SESSION['admin_logged'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

// Include database connection
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            // Fetch client bookings from the bookings table and map columns to match admin dashboard requirements
            $stmt = $pdo->query("SELECT user_id as id, full_name as name, email, phone, destination, start_date as date, status FROM bookings ORDER BY created DESC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            echo json_encode([]);
        }
        break;

    case 'PUT':
    case 'POST':
        // Decode incoming JSON data for updating status (Confirm/Decline)
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;
        $status = $data['status'] ?? 'Pending';

        if ($id) {
            try {
                // Update booking request status in the database
                $stmt = $pdo->prepare("UPDATE bookings SET status = ? WHERE user_id = ?");
                $stmt->execute([$status, $id]);
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Missing booking ID']);
        }
        break;

    case 'DELETE':
        // Delete client booking request
        $id = $_GET['id'] ?? null;
        if ($id) {
            try {
                $stmt = $pdo->prepare("DELETE FROM bookings WHERE user_id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Missing ID']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
