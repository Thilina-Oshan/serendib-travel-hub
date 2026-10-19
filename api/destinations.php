<?php
require_once 'db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM destinations");
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO destinations (name, cat, loc, rating, description, photo) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['cat'], $data['loc'], $data['rating'], $data['desc'], $data['photo']]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("UPDATE destinations SET name = ?, cat = ?, loc = ?, rating = ?, description = ?, photo = ? WHERE id = ?");
        $stmt->execute([$data['name'], $data['cat'], $data['loc'], $data['rating'], $data['desc'], $data['photo'], $data['id']]);
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM destinations WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        }
        break;
}