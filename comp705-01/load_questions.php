<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../db-config.php';

// Get current folder from URL (e.g. /snake/english-01/load_questions.php)
$url_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($url_path, '/'));
$folder = count($segments) >= 2 ? $segments[count($segments) - 2] : 'unknown';

try {
    $pdo = new PDO($dsn, $databaseUser, $databasePassword, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB connection failed: ' . $e->getMessage()]);
    exit;
}

try {
    // Fetch JSON array of questions for this folder
    $stmt = $pdo->prepare("SELECT questions_json FROM question_sets WHERE folder = :folder");
    $stmt->execute([':folder' => $folder]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || !isset($row['questions_json'])) {
        echo json_encode([]); // No questions found
        exit;
    }

    $questions = json_decode($row['questions_json'], true);
    foreach ($questions as &$q) {
        if (isset($q['question'])) {
            $q['question'] = base64_encode(htmlspecialchars($q['question'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
        }
        if (isset($q['options']) && is_array($q['options'])) {
            foreach ($q['options'] as &$opt) {
                $opt = base64_encode(htmlspecialchars($opt, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
            }
        }
        if (isset($q['answer'])) {
            $q['answer'] = base64_encode(htmlspecialchars($q['answer'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
        }
    }

    echo json_encode($questions);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Query failed: ' . $e->getMessage()]);
}
