<?php
require_once 'db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM experiences ORDER BY id DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $title = $data['title'] ?? '';
        $icon = $data['icon'] ?? '';
        $desc = $data['desc'] ?? ''; // admin.js sends 'desc'
        $photo = $data['photo'] ?? '';

        try {
            $stmt = $pdo->prepare("INSERT INTO experiences (title, icon, description, photo) VALUES (?, ?, ?, ?)");
            $stmt->execute([$title, $icon, $desc, $photo]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
        $title = $data['title'] ?? '';
        $icon = $data['icon'] ?? '';
        $desc = $data['desc'] ?? '';
        $photo = $data['photo'] ?? '';

        if ($id) {
            try {
                $stmt = $pdo->prepare("UPDATE experiences SET title = ?, icon = ?, description = ?, photo = ? WHERE id = ?");
                $stmt->execute([$title, $icon, $desc, $photo, $id]);
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'ID missing']);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM experiences WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        }
        break;
}
?>