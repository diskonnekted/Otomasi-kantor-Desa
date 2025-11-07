<?php
require_once __DIR__ . '/db.php';
$db = get_db();

// Ensure settings table exists
$db->exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)');

function kv_to_nested($rows) {
  $out = [];
  foreach ($rows as $r) {
    $key = $r['key'];
    $valRaw = $r['value'];
    // try to decode JSON, else keep string/number/bool parsing
    $val = json_decode($valRaw, true);
    if ($val === null && json_last_error() !== JSON_ERROR_NONE) {
      // parse primitive types
      if ($valRaw === 'true' || $valRaw === 'false') {
        $val = $valRaw === 'true';
      } elseif (is_numeric($valRaw)) {
        $val = 0 + $valRaw;
      } else {
        $val = $valRaw;
      }
    }
    $parts = explode('.', $key);
    $ref =& $out;
    foreach ($parts as $i => $p) {
      if ($i === count($parts) - 1) {
        $ref[$p] = $val;
      } else {
        if (!isset($ref[$p]) || !is_array($ref[$p])) $ref[$p] = [];
        $ref =& $ref[$p];
      }
    }
    unset($ref);
  }
  return $out;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $rows = $db->query('SELECT key, value FROM settings')->fetchAll(PDO::FETCH_ASSOC);
  $nested = kv_to_nested($rows);
  json_response(['ok'=>true,'settings'=>$nested]);
}

if ($method === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true) ?? [];
  $settings = $input['settings'] ?? [];
  if (!is_array($settings)) json_response(['ok'=>false,'error'=>'Invalid settings payload'], 400);
  // flatten
  $stack = [ ['path'=>[], 'value'=>$settings] ];
  $pairs = [];
  while ($stack) {
    $item = array_pop($stack);
    if (is_array($item['value']) && array_keys($item['value']) !== range(0, count($item['value']) - 1)) {
      foreach ($item['value'] as $k=>$v) {
        $stack[] = ['path'=>array_merge($item['path'], [$k]), 'value'=>$v];
      }
    } else {
      $key = implode('.', $item['path']);
      $val = is_scalar($item['value']) ? (string)$item['value'] : json_encode($item['value']);
      $pairs[] = [$key, $val];
    }
  }

  $stmt = $db->prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  foreach ($pairs as $p) { $stmt->execute($p); }
  json_response(['ok'=>true]);
}

if ($method === 'DELETE') {
  $input = json_decode(file_get_contents('php://input'), true) ?? [];
  $key = $input['key'] ?? null;
  if (!$key) json_response(['ok'=>false,'error'=>'Missing key'], 400);
  $stmt = $db->prepare('DELETE FROM settings WHERE key = ?');
  $stmt->execute([$key]);
  json_response(['ok'=>true]);
}

json_response(['ok'=>false,'error'=>'Method not allowed'], 405);
?>

