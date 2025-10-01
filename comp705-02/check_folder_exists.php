<?php
// check_folder_exists.php
if (!isset($_GET['folder'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing folder parameter']);
    exit;
}

$folder = $_GET['folder'];

// Prevent directory traversal
$folder = preg_replace('/[^a-zA-Z0-9_\-\/]/', '', $folder);

// Base directory (adjust if needed)
$baseDir = __DIR__ . '/../';  // or __DIR__ . '/../levels/'

$fullPath = realpath($baseDir . $folder);

// Check path is under the allowed root and is a directory
if ($fullPath && is_dir($fullPath) && strpos($fullPath, realpath($baseDir)) === 0) {
    echo json_encode(['exists' => true]);
} else {
    echo json_encode(['exists' => false]);
}
