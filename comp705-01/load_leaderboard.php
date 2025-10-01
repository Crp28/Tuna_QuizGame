<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../db-config.php';

// Get current folder from URL
$url_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($url_path, '/'));
$folder = count($segments) >= 2 ? $segments[count($segments) - 2] : 'unknown';

try {
    $pdo = new PDO($dsn, $databaseUser, $databasePassword, $options);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB connection failed: ' . $e->getMessage()]);
    exit;
}

// 🕒 Cutoff time
$cutoff = '2025-08-25 15:17:00';

// Fetch all rows for this folder
$sql = "SELECT id, username AS name, level, time, created_at 
        FROM leaderboard 
        WHERE folder = :folder";
$stmt = $pdo->prepare($sql);
$stmt->execute([':folder' => $folder]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Group rows by username
$userRows = [];
foreach ($rows as $row) {
    $userRows[$row['name']][] = $row;
}

$best = [];

foreach ($userRows as $name => $entries) {
    // Find best entry and track earliest time
    $bestEntry = null;
    $levels = [];
    $earliest = null;

    foreach ($entries as $row) {
        $level = (int)$row['level'];
        $time  = (float)$row['time'];
        $levels[$level] = true;

        $createdAt = strtotime($row['created_at']);
        if ($earliest === null || $createdAt < $earliest) $earliest = $createdAt;

        if ($bestEntry === null) {
            $bestEntry = $row;
        } else {
            if (
                $level > (int)$bestEntry['level'] ||
                ($level == (int)$bestEntry['level'] && $time < (float)$bestEntry['time'])
            ) {
                $bestEntry = $row;
            }
        }
    }

    $ok = true;

// ✅ If the BEST entry itself is after cutoff, require continuous history
if (strtotime($bestEntry['created_at']) >= strtotime($cutoff)) {
    for ($i = 1; $i <= (int)$bestEntry['level']; $i++) {
        if (!isset($levels[$i])) {
            $ok = false;
            break;
        }
    }
}
    if ($ok) {
        // Keep this user
        $best[$name] = [
            'name'  => $bestEntry['name'],
            'level' => (int)$bestEntry['level'],
            'time'  => (float)$bestEntry['time']
        ];
    } else {
        // 🚮 Delete all entries for this user in this folder
        // 🚮 Delete only the row where this user reached the (invalid) max level
$del = $pdo->prepare("DELETE FROM leaderboard 
                      WHERE folder = :folder AND username = :username AND level = :level");
$del->execute([
    ':folder'   => $folder,
    ':username' => $name,
    ':level'    => (int)$bestEntry['level']
]);

    }
}

// Sort final results
usort($best, function($a, $b) {
    if ($a['level'] != $b['level']) return $b['level'] - $a['level'];
    return $a['time'] <=> $b['time'];
});

echo json_encode(array_values($best), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
