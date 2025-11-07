<?php
require_once __DIR__ . '/db.php';
$db = get_db();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  // List devices
  $rows = $db->query('SELECT id, key, room_key, type, name, desired_state, current_state, updated_at FROM devices ORDER BY id ASC')->fetchAll(PDO::FETCH_ASSOC);
  json_response(['ok'=>true,'devices'=>$rows]);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method === 'POST') {
  // Upsert device
  $key = $input['key'] ?? null;
  $room = $input['room_key'] ?? null;
  $type = $input['type'] ?? null;
  $name = $input['name'] ?? null;
  if (!$key || !$room || !$type || !$name) json_response(['ok'=>false,'error'=>'Missing fields'], 400);
  $now = time();
  // Insert or update
  $stmt = $db->prepare('INSERT INTO devices (key, room_key, type, name, desired_state, current_state, updated_at) VALUES (?, ?, ?, ?, 0, 0, ?) ON CONFLICT(key) DO UPDATE SET room_key=excluded.room_key, type=excluded.type, name=excluded.name, updated_at=excluded.updated_at');
  $stmt->execute([$key, $room, $type, $name, $now]);
  json_response(['ok'=>true,'device'=>['key'=>$key,'room_key'=>$room,'type'=>$type,'name'=>$name]]);
}

if ($method === 'DELETE') {
  $key = $input['key'] ?? null;
  if (!$key) json_response(['ok'=>false,'error'=>'Missing key'], 400);
  $stmt = $db->prepare('DELETE FROM devices WHERE key = ?');
  $stmt->execute([$key]);
  json_response(['ok'=>true]);
}

json_response(['ok'=>false,'error'=>'Method not allowed'], 405);
?>

