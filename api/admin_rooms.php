<?php
require_once __DIR__ . '/db.php';
$db = get_db();

// Simple REST-like handler for rooms management
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  // List rooms
  $rows = $db->query('SELECT id, key, name FROM rooms ORDER BY id ASC')->fetchAll(PDO::FETCH_ASSOC);
  json_response(['ok'=>true,'rooms'=>$rows]);
}

// Parse JSON body for POST/DELETE
$input = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method === 'POST') {
  $key = $input['key'] ?? null;
  $name = $input['name'] ?? null;
  if (!$key || !$name) json_response(['ok'=>false,'error'=>'Missing key or name'], 400);
  // Upsert room
  $stmt = $db->prepare('INSERT INTO rooms (key, name) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET name=excluded.name');
  $stmt->execute([$key, $name]);
  json_response(['ok'=>true,'room'=>['key'=>$key,'name'=>$name]]);
}

if ($method === 'DELETE') {
  $key = $input['key'] ?? null;
  if (!$key) json_response(['ok'=>false,'error'=>'Missing key'], 400);
  $stmt = $db->prepare('DELETE FROM rooms WHERE key = ?');
  $stmt->execute([$key]);
  json_response(['ok'=>true]);
}

json_response(['ok'=>false,'error'=>'Method not allowed'], 405);
?>

