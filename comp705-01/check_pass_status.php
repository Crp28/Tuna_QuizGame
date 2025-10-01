<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../db-config.php';

// Validate input
if (!isset($_GET['username'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing username']);
    exit;
}

$username = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['username']);

// Detect folder from URL path
$urlPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($urlPath, '/'));
$folder = count($segments) >= 2 ? $segments[count($segments) - 2] : 'default-folder';

try {
    $pdo = new PDO($dsn, $databaseUser, $databasePassword, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Fetch questions for this folder
$stmt = $pdo->prepare("SELECT questions_json FROM question_sets WHERE folder = :folder");
$stmt->execute(['folder' => $folder]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row || !isset($row['questions_json'])) {
    echo json_encode(['error' => 'No questions found for this folder']);
    exit;
}

$questions = json_decode($row['questions_json'], true);
if (!is_array($questions)) {
    echo json_encode(['error' => 'Invalid question format']);
    exit;
}
$totalQuestions = count($questions);

// Fetch user's leaderboard entry directly from DB
$stmt = $pdo->prepare("SELECT MAX(level) as level FROM leaderboard WHERE folder = :folder AND username = :username");
$stmt->execute([
    'folder' => $folder,
    'username' => $username
]);
$entry = $stmt->fetch(PDO::FETCH_ASSOC);

$answered = $entry['level'] ?? 0;
$passed = $answered >= ceil($totalQuestions / 2);

echo json_encode([
    'username' => $username,
    'folder' => $folder,
    'total' => $totalQuestions,
    'answered' => $answered,
    'passed' => $passed
]);
