<?php

function get_client_ip() {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    } elseif (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
        return $_SERVER['REMOTE_ADDR'];
    }
    return 'unknown';
}

$ip_address = get_client_ip();

// 🚫 Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

// 🚫 Block curl and scripts (no User-Agent or non-browser agents)
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
if (empty($userAgent) || stripos($userAgent, 'Mozilla') === false) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Invalid client']);
    exit;
}

// 🔐 Decode JSON
$data = file_get_contents('php://input');
$entries = json_decode($data, true);
if (!$entries || !is_array($entries)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}

// 🔌 Load DB config
require_once __DIR__ . '/../db-config.php';

try {
    $pdo = new PDO($dsn, $databaseUser, $databasePassword, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB connection failed: ' . $e->getMessage()]);
    exit;
}

// 🍪 Get user info from cookies
$cookieUsername = $_COOKIE['username'] ?? '';
$firstname      = $_COOKIE['firstname'] ?? '';
$lastname       = $_COOKIE['lastname'] ?? '';
$full_name      = $_COOKIE['full_name'] ?? trim("$firstname $lastname");
$email          = $_COOKIE['email'] ?? '';

// 🚫 Do not continue if any required cookie is empty
if (
    empty($cookieUsername) ||
    empty($firstname) ||
    empty($lastname) ||
    empty($full_name) ||
    empty($email)
) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Missing authentication cookies']);
    exit;
}

// 📁 Folder from URL
$url_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($url_path, '/'));
$folder = count($segments) >= 2 ? $segments[count($segments) - 2] : 'unknown';
//$tableTAAssignments = 'leaderboard_' . preg_replace('/[^a-zA-Z0-9_]/', '', $folder);

// 🧾 Prepare SQL insert
$insertStmt = $pdo->prepare("
    INSERT INTO $tableTAAssignments 
    (username, full_name, email, level, time, ip_address, folder)
    VALUES (:username, :full_name, :email, :level, :time, :ip_address, :folder)
");

$insertedCount = 0;

foreach ($entries as $entry) {
    if (!isset($entry['name'], $entry['level'], $entry['time'])) continue;

    $entryUsername = trim($entry['name']);
    $entryLevel = (int)$entry['level'];
    $entryTime = (float)$entry['time'];

    // 🚫 Require exact username match with cookie
    if ($entryUsername !== $cookieUsername) continue;

    // ✅ Basic sanity checks
    if ($entryLevel < 1 || $entryLevel > 999) continue;
    if ($entryTime <= 0 || $entryTime > 3600) continue;

    // ✅ Insert
    $insertStmt->execute([
        ':username'   => $entryUsername,
        ':full_name'  => $full_name,
        ':email'      => $email,
        ':level'      => $entryLevel,
        ':time'       => $entryTime,
        ':ip_address' => $ip_address,
        ':folder'     => $folder
    ]);

    $insertedCount++;
}

// ✅ Respond
header('Content-Type: application/json');
echo json_encode(['success' => true, 'inserted' => $insertedCount]);
