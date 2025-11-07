<?php
// Simple Server-Sent Events stream for demo
require_once __DIR__ . '/db.php';
$db = get_db();

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
echo "retry: 3000\n\n";
@ob_end_flush();
@ob_implicit_flush(true);
ignore_user_abort(true);

function send_event($name, $data) {
  echo "event: {$name}\n";
  echo 'data: ' . json_encode($data) . "\n\n";
}

for ($i=0; $i<1000; $i++) {
  // metrics snapshot
  $rooms = $GLOBALS['db']->query('SELECT key FROM rooms')->fetchAll(PDO::FETCH_COLUMN);
  $latest = [];
  foreach ($rooms as $room) {
    $latest[$room] = [];
    foreach (['occupancy','light','temp','humidity','power'] as $type) {
      $stmt = $GLOBALS['db']->prepare('SELECT value FROM metrics WHERE room_key = ? AND type = ? ORDER BY ts DESC LIMIT 1');
      $stmt->execute([$room, $type]);
      $val = $stmt->fetchColumn();
      if ($val !== false) $latest[$room][$type] = 0 + $val;
    }
  }
  send_event('metrics', [ 'latestByRoom' => $latest ]);

  // pending controls
  $pending = $GLOBALS['db']->query("SELECT device_key, command, ts FROM controls WHERE status = 'pending' ORDER BY ts DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
  send_event('controls', $pending);

  // heartbeat
  echo "data: ping\n\n";
  sleep(2);
}
?>
