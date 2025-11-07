<?php
require_once __DIR__ . '/db.php';
$db = get_db();
$ts = time();

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$deviceKey = $input['device_key'] ?? null;
$desired = isset($input['desired_state']) ? intval($input['desired_state']) : null;

if (!$deviceKey || $desired === null) {
  json_response(['ok'=>false,'error'=>'Invalid payload'], 400);
}

// record control request and update desired state
$ins = $db->prepare('INSERT INTO controls (device_key, command, ts, status) VALUES (?, ?, ?, ?)');
$ins->execute([$deviceKey, $desired ? 'ON' : 'OFF', $ts, 'pending']);

$upd = $db->prepare('UPDATE devices SET desired_state = ?, updated_at = ? WHERE key = ?');
$upd->execute([$desired, $ts, $deviceKey]);

json_response(['ok'=>true,'device_key'=>$deviceKey,'desired_state'=>$desired]);
?>
