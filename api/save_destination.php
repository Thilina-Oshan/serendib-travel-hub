<?php
// Include database connection
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = $_POST['title'] ?? '';
    $category = $_POST['category'] ?? 'Heritage';
    $description = $_POST['description'] ?? '';
    $location = $_POST['location'] ?? '';

    $imagePath = '';

    // Handle image file upload
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['image']['tmp_name'];
        $fileName = $_FILES['image']['name'];
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        // Allowed extensions
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

        if (in_array($fileExtension, $allowedExtensions)) {
            // Define upload directory relative to api/ folder (pointing to asset/img/)
            $uploadFileDir = '../asset/img/';

            // Create directory if it doesn't exist
            if (!file_exists($uploadFileDir)) {
                mkdir($uploadFileDir, 0777, true);
            }

            // Generate unique file name to prevent overwriting
            $newFileName = time() . '_' . md5(time() . $fileName) . '.' . $fileExtension;
            $dest_path = $uploadFileDir . $newFileName;

            if (move_uploaded_file($fileTmpPath, $dest_path)) {
                // Store relative web path in database
                $imagePath = '/asset/img/' . $newFileName;
            } else {
                echo json_encode(['success' => false, 'message' => 'Error moving the uploaded file.']);
                exit;
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Allowed: JPG, JPEG, PNG, WEBP.']);
            exit;
        }
    }

    try {
        // Insert query into destinations table
        $stmt = $pdo->prepare("INSERT INTO destinations (title, category, description, location, image_url) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$title, $category, $description, $location, $imagePath]);

        echo json_encode(['success' => true, 'message' => 'Destination added successfully!']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
}
