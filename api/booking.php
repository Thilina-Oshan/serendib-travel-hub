<?php
// Include the database connection file
require_once 'db.php';

// Set the response header to JSON format
header('Content-Type: application/json');

// Get the HTTP request method (GET, POST, PUT)
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Retrieve all bookings ordered by creation date in descending order
        try {
            $stmt = $pdo->query("SELECT * FROM bookings ORDER BY created DESC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            // Return an empty array if an error occurs
            echo json_encode([]);
        }
        break;

    case 'POST':
        // Decode the incoming JSON payload from the request body
        $data = json_decode(file_get_contents("php://input"), true);

        // Validate if the JSON data is valid
        if (!$data) {
            echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
            exit;
        }

        try {
            // Prepare the SQL insert statement
            $stmt = $pdo->prepare("INSERT INTO bookings (ref, full_name, email, phone, destination, start_date, end_date, days, guests, style, special_requests, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

            // Execute the statement with exact keys matching JavaScript payload
            $stmt->execute([
                $data['ref'] ?? '',
                $data['full_name'] ?? '',        // Matches full_name from JS
                $data['email'] ?? '',           // Matches email from JS
                $data['phone'] ?? '',           // Matches phone from JS
                $data['destination'] ?? '',     // Matches destination from JS
                $data['start_date'] ?? '',      // Matches start_date from JS
                $data['end_date'] ?? '',        // Matches end_date from JS
                $data['days'] ?? 1,             // Matches days from JS
                $data['guests'] ?? 1,           // Matches guests from JS
                $data['style'] ?? 'Family',     // Matches style from JS
                $data['special_requests'] ?? '', // Matches special_requests from JS
                $data['total'] ?? 0,            // Matches total from JS
                'Pending'                       // Initial status
            ]);

            // Return success response
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            // Return the SQL error message if insertion fails
            echo json_encode(['success' => false, 'message' => 'SQL Error: ' . $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Decode update data (e.g., changing booking status to Cancelled)
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
        $status = $data['status'] ?? 'Cancelled';

        // Update the booking status if ID is provided
        if ($id) {
            try {
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
}
