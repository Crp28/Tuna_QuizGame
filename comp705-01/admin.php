<?php
session_start();
require_once __DIR__ . '/../db-config.php';

// Get folder from URL path
$url_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($url_path, '/'));
$folder = count($segments) >= 2 ? $segments[count($segments) - 2] : 'default-folder';

try {
    $pdo = new PDO($dsn, $databaseUser, $databasePassword, $options);
} catch (PDOException $e) {
    die("DB connection failed.");
}

// Load or save JSON array in DB
define('TABLE', 'question_sets');

function load_questions($pdo, $folder) {
    $stmt = $pdo->prepare("SELECT questions_json FROM ".TABLE." WHERE folder = ?");
    $stmt->execute([$folder]);
    $row = $stmt->fetch();
    return $row ? json_decode($row['questions_json'], true) : [];
}

function save_questions($pdo, $folder, $questions) {
    $json = json_encode($questions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $stmt = $pdo->prepare("INSERT INTO ".TABLE." (folder, questions_json)
                           VALUES (?, ?)
                           ON DUPLICATE KEY UPDATE questions_json = VALUES(questions_json)");
    $stmt->execute([$folder, $json]);
}

// Simple PIN login
if (!isset($_SESSION['admin_ok'])) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['pin']) && $_POST['pin'] === PIN) {
        $_SESSION['admin_ok'] = true;
        header("Location: " . $_SERVER['PHP_SELF']);
        exit;
    }
    $msg = isset($_POST['pin']) ? "Incorrect PIN!" : "";
    echo '<!DOCTYPE html><html><head><title>Admin Login</title><style>body{background:#192b3a;color:#fff;font-family:Segoe UI,Arial}.box{margin:120px auto;background:#223a50;padding:40px 35px 35px 35px;border-radius:18px;width:320px;box-shadow:0 6px 32px #000a;text-align:center;}input[type=password]{padding:10px;border-radius:8px;border:1px solid #345;width:90%;margin-bottom:18px;font-size:1.18rem;}button{background:#3bc984;color:#fff;border:none;border-radius:7px;padding:10px 32px;font-size:1.15rem;}.msg{color:#ffd580;margin-bottom:8px;}</style></head><body><div class="box"><h2>Admin Login</h2>';
    if ($msg) echo "<div class='msg'>$msg</div>";
    echo '<form method="post"><input type="password" name="pin" placeholder="Enter PIN" autofocus required /><br><button type="submit">Login</button></form></div></body></html>';
    exit;
}

$questions = load_questions($pdo, $folder);
$editIdx = isset($_POST['editq']) ? intval($_POST['editq']) : -1;

if (isset($_POST['addq'])) {
    $q = trim($_POST['question'] ?? '');
    $a = trim($_POST['optA'] ?? '');
    $b = trim($_POST['optB'] ?? '');
    $c = trim($_POST['optC'] ?? '');
    $d = trim($_POST['optD'] ?? '');
    $ans = strtoupper(trim($_POST['answer'] ?? ''));
    if ($q && $a && $b && $c && $d && in_array($ans, ['A','B','C','D'])) {
        $questions[] = ["question"=>$q, "options"=>[$a,$b,$c,$d], "answer"=>$ans];
        save_questions($pdo, $folder, $questions);
        $msg = "Question added!";
    } else {
        $msg = "Please fill all fields and select a valid answer (A/B/C/D).";
    }
}

if (isset($_POST['saveq'])) {
    $idx = intval($_POST['saveq']);
    if (isset($questions[$idx])) {
        $q = trim($_POST['eq_question'] ?? '');
        $a = trim($_POST['eq_optA'] ?? '');
        $b = trim($_POST['eq_optB'] ?? '');
        $c = trim($_POST['eq_optC'] ?? '');
        $d = trim($_POST['eq_optD'] ?? '');
        $ans = strtoupper(trim($_POST['eq_answer'] ?? ''));
        if ($q && $a && $b && $c && $d && in_array($ans, ['A','B','C','D'])) {
            $questions[$idx] = ["question"=>$q, "options"=>[$a,$b,$c,$d], "answer"=>$ans];
            save_questions($pdo, $folder, $questions);
            $msg = "Question updated!";
        } else {
            $msg = "Please fill all fields and select a valid answer (A/B/C/D).";
            $editIdx = $idx;
        }
    }
}

if (isset($_POST['delq'])) {
    $idx = intval($_POST['delq']);
    if (isset($questions[$idx])) {
        array_splice($questions, $idx, 1);
        save_questions($pdo, $folder, $questions);
        $msg = "Question removed.";
    }
}

if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: " . $_SERVER['PHP_SELF']);
    exit;
}

// DISPLAY SECTION
?>
<!DOCTYPE html>
<html>
<head>
    <title>Snake Quiz Admin</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="https://cv.aut.ac.nz/code/lib/bootstrap.min.css">
    <style>body{background:#192b3a;color:#fff;font-family:Segoe UI,Arial,sans-serif;margin:0}.container{max-width:970px;margin:40px auto 24px auto;background:#223a50;border-radius:18px;box-shadow:0 6px 32px #000a;padding:34px 36px 22px 36px;}h2{margin-top:0;color:#ffe082}form.addq input,form.addq select{width:99%;font-size:1.06rem;padding:6px;margin-bottom:6px;border-radius:6px;border:1px solid #345}form.addq button{background:#30d178;color:#fff;border:none;border-radius:6px;padding:9px 32px;font-size:1.04rem;margin-top:8px}table{width:100%;border-collapse:collapse;margin-bottom:16px;background:#233f60}th,td{border:1px solid #335;padding:7px 8px}th{background:#234;color:#ffe082}td{background:#284267}.btn-del{background:#f55;color:#fff;border:none;border-radius:6px;padding:5px 18px;cursor:pointer}.btn-del:hover{background:#d22}.msg{color:#fffb90;margin-bottom:9px;font-size:1.08rem}.logout{float:right;background:#2e6c90;color:#fff;border-radius:6px;padding:6px 16px;text-decoration:none;font-size:0.98rem}@media (max-width:700px){.container{padding:15px 2vw 12px 2vw}table,th,td{font-size:0.98rem}}</style>
</head>
<body>
<div class="container">
<a class="logout" href="?logout=1">Logout</a>
<a class="logout" href="adminQ.php" style="margin-right: 10px;">Mass Edit</a>
<a class="logout" href="./" style="margin-right: 10px;">Back to Game</a>
<h2>Snake Quiz Admin</h2>

<?php if(!empty($msg)) echo "<div class='msg'>$msg</div>"; ?>
<h3 style="color:#60e8fe;">Add New Question</h3>
<form method="post" class="addq" autocomplete="off">
<input type="text" name="question" placeholder="Question" required>
<input type="text" name="optA" placeholder="Option A" required>
<input type="text" name="optB" placeholder="Option B" required>
<input type="text" name="optC" placeholder="Option C" required>
<input type="text" name="optD" placeholder="Option D" required>
<select name="answer" required><option value="">Correct Answer?</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select>
<button type="submit" name="addq" value="1">Add Question</button>
</form>
<h3 style="color:#ffd580;">All Questions</h3>
<table><tr><th>#</th><th>Question</th><th>Options</th><th>Answer</th><th></th></tr>
<?php foreach($questions as $i => $q): ?>
<tr>
<?php if ($i === $editIdx): ?>
<form method="post">
<td><?= $i+1 ?></td>
<td><input type="text" name="eq_question" value="<?= htmlspecialchars($q['question']) ?>" required style="width:100%;"></td>
<td><b style="color:#ffe082;">A:</b> <input type="text" name="eq_optA" value="<?= htmlspecialchars($q['options'][0]) ?>" required style="width:85%;"><br><b style="color:#81ff81;">B:</b> <input type="text" name="eq_optB" value="<?= htmlspecialchars($q['options'][1]) ?>" required style="width:85%;"><br><b style="color:#60e8fe;">C:</b> <input type="text" name="eq_optC" value="<?= htmlspecialchars($q['options'][2]) ?>" required style="width:85%;"><br><b style="color:#ffd580;">D:</b> <input type="text" name="eq_optD" value="<?= htmlspecialchars($q['options'][3]) ?>" required style="width:85%;"></td>
<td style="text-align:center;"><select name="eq_answer" required><option value="A" <?= $q['answer']=='A'?'selected':'' ?>>A</option><option value="B" <?= $q['answer']=='B'?'selected':'' ?>>B</option><option value="C" <?= $q['answer']=='C'?'selected':'' ?>>C</option><option value="D" <?= $q['answer']=='D'?'selected':'' ?>>D</option></select></td>
<td><button type="submit" name="saveq" value="<?= $i ?>" class="btn-del" style="background:#30d178;">Save</button><button type="submit" name="editq" value="-1" class="btn-del" style="background:#aaa;color:#223;">Cancel</button></td>
</form>
<?php else: ?>
<td><?= $i+1 ?></td><td><?= htmlspecialchars($q['question']) ?></td><td><b style="color:#ffe082;">A:</b> <?= htmlspecialchars($q['options'][0]) ?><br><b style="color:#81ff81;">B:</b> <?= htmlspecialchars($q['options'][1]) ?><br><b style="color:#60e8fe;">C:</b> <?= htmlspecialchars($q['options'][2]) ?><br><b style="color:#ffd580;">D:</b> <?= htmlspecialchars($q['options'][3]) ?></td><td style="text-align:center;"><b><?= htmlspecialchars($q['answer']) ?></b></td><td><form method="post" style="display:inline;"><input type="hidden" name="editq" value="<?= $i ?>"><button type="submit" class="btn-del" style="background:#3086d1;">Edit</button></form><form method="post" style="display:inline;"><input type="hidden" name="delq" value="<?= $i ?>"><button type="submit" class="btn-del" onclick="return confirm('Delete this question?');">Delete</button></form></td>
<?php endif; ?>
</tr>
<?php endforeach; ?>
</table>
</div>
</body>
</html>
