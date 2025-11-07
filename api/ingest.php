<?php
require_once __DIR__ . '/db.php';
$db = get_db();

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$ts = time();

// Handle readings per room
if (isset($input['room_key']) && isset($input['readings']) && is_array($input['readings'])) {
  $room = $input['room_key'];
  $ins = $db->prepare('INSERT INTO metrics (room_key, type, value, ts) VALUES (?, ?, ?, ?)');
  foreach ($input['readings'] as $type => $val) {
    $ins->execute([$room, $type, floatval($val), $ts]);
  }
}

// Handle asset-level values (waterLevel, waterFlow, etc.)
if (isset($input['assets']) && is_array($input['assets'])) {
  $insA = $db->prepare('INSERT INTO assets (key, value, ts) VALUES (?, ?, ?)');
  foreach ($input['assets'] as $key => $val) {
    $insA->execute([$key, floatval($val), $ts]);
  }
}

// Optional device status update
if (isset($input['device_status']) && is_array($input['device_status'])) {
  $upd = $db->prepare('UPDATE devices SET current_state = ?, updated_at = ? WHERE key = ?');
  foreach ($input['device_status'] as $devKey => $state) {
    $upd->execute([intval($state), $ts, $devKey]);
  }
}

json_response([ 'ok' => true ]);
?>
