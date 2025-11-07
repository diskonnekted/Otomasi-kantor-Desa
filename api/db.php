<?php
// Simple SQLite connector and auto-initializer
function get_db() {
  static $pdo = null;
  if ($pdo) return $pdo;
  $dataDir = __DIR__ . '/../data';
  if (!is_dir($dataDir)) mkdir($dataDir, 0777, true);
  $dbPath = $dataDir . '/iot.db';
  $needInit = !file_exists($dbPath);
  $pdo = new PDO('sqlite:' . $dbPath);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  if ($needInit) {
    init_db($pdo);
  }
  return $pdo;
}

function init_db(PDO $db) {
  $db->exec('CREATE TABLE IF NOT EXISTS rooms (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, name TEXT)');
  $db->exec('CREATE TABLE IF NOT EXISTS devices (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, room_key TEXT, type TEXT, name TEXT, desired_state INTEGER DEFAULT 0, current_state INTEGER DEFAULT 0, updated_at INTEGER)');
  $db->exec('CREATE TABLE IF NOT EXISTS metrics (id INTEGER PRIMARY KEY AUTOINCREMENT, room_key TEXT, type TEXT, value REAL, ts INTEGER)');
  $db->exec('CREATE TABLE IF NOT EXISTS controls (id INTEGER PRIMARY KEY AUTOINCREMENT, device_key TEXT, command TEXT, ts INTEGER, status TEXT)');
  $db->exec('CREATE TABLE IF NOT EXISTS assets (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT, value REAL, ts INTEGER)');

  $rooms = [ ['pelayanan','Ruang Pelayanan'], ['aula','Aula'], ['toilet','Toilet'], ['server','Ruang Server'] ];
  $stmt = $db->prepare('INSERT OR IGNORE INTO rooms (key, name) VALUES (?, ?)');
  foreach ($rooms as $r) { $stmt->execute($r); }

  $devices = [
    ['pelayanan_light','pelayanan','light','Lampu Pelayanan'],
    ['aula_light','aula','light','Lampu Aula'],
    ['toilet_light','toilet','light','Lampu Toilet'],
    ['aula_fan','aula','fan','Kipas Aula'],
    ['aula_ac','aula','ac','AC Aula'],
    ['server_fan','server','fan','Kipas Server'],
    ['pamsimas_pump','tandon','pump','Pompa Tandon'],
    ['street_main','jalan','street','Lampu Jalan']
  ];
  $stmt = $db->prepare('INSERT OR IGNORE INTO devices (key, room_key, type, name, desired_state, current_state, updated_at) VALUES (?, ?, ?, ?, 0, 0, strftime("%s","now"))');
  foreach ($devices as $d) { $stmt->execute($d); }
}

function json_response($data, $code = 200) {
  http_response_code($code);
  header('Content-Type: application/json');
  echo json_encode($data);
  exit;
}

?>
