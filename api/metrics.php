<?php
require_once __DIR__ . '/db.php';
$db = get_db();

// latest metrics per room and type
$latest = [];
$rooms = $db->query('SELECT key FROM rooms')->fetchAll(PDO::FETCH_COLUMN);
foreach ($rooms as $room) {
  $latest[$room] = [];
  foreach (['occupancy','light','temp','humidity','power'] as $type) {
    $stmt = $db->prepare('SELECT value FROM metrics WHERE room_key = ? AND type = ? ORDER BY ts DESC LIMIT 1');
    $stmt->execute([$room, $type]);
    $val = $stmt->fetchColumn();
    if ($val !== false) $latest[$room][$type] = is_numeric($val) ? 0 + $val : $val;
  }
}

// totals
$totalPower = 0; $sumTemp = 0; $countTemp = 0; $activeOcc = 0;
foreach ($latest as $room => $vals) {
  if (isset($vals['power'])) $totalPower += floatval($vals['power']);
  if (isset($vals['temp'])) { $sumTemp += floatval($vals['temp']); $countTemp++; }
  if (isset($vals['occupancy'])) $activeOcc += intval($vals['occupancy']) > 0 ? 1 : 0;
}
$avgTemp = $countTemp ? $sumTemp / $countTemp : null;

// assets
$qA = $db->prepare('SELECT key, value FROM assets WHERE key IN ("waterLevel","waterFlow") ORDER BY ts DESC');
$qA->execute();
$assets = [];
while ($row = $qA->fetch(PDO::FETCH_ASSOC)) {
  $assets[$row['key']] = 0 + $row['value'];
}

// devices status (for assets state)
$streetOn = $db->query("SELECT current_state FROM devices WHERE key = 'street_main' ")->fetchColumn();

json_response([
  'latestByRoom' => $latest,
  'totals' => [ 'totalPower' => round($totalPower, 2), 'avgTemp' => $avgTemp, 'activeOccupancy' => $activeOcc ],
  'assets' => [ 'waterLevel' => $assets['waterLevel'] ?? null, 'waterFlow' => $assets['waterFlow'] ?? null, 'streetLightOn' => !!$streetOn ]
]);
?>
