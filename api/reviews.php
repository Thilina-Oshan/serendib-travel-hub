<?php
require_once 'db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT * FROM reviews ORDER BY date DESC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            echo json_encode([]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        try {
            $stmt = $pdo->prepare("INSERT INTO reviews (id, user_id, author, rating, country, text, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                $data['userId'],
                $data['author'],
                $data['rating'],
                $data['country'],
                $data['text'],
                $data['status']
            ]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        try {
            $stmt = $pdo->prepare("UPDATE reviews SET rating = ?, country = ?, text = ? WHERE id = ?");
            $stmt->execute([$data['rating'], $data['country'], $data['text'], $data['id']]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if ($id) {
            try {
                $stmt = $pdo->prepare("DELETE FROM reviews WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
        }
        break;
}
