<?php
// Serve the static dashboard HTML to ensure DirectoryIndex works on PHP/Apache
header('Content-Type: text/html; charset=UTF-8');
readfile(__DIR__ . '/index.html');
?>
