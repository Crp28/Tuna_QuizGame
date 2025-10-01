<?php
session_start();
require_once __DIR__ . '/../db-config.php';

define('TABLE', 'question_sets');

// Detect folder from URL
$url_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($url_path, '/'));
$folder = count($segments) >= 2 ? $segments[count($segments) - 2] : 'default-folder';

try {
    $pdo = new PDO($dsn, $databaseUser, $databasePassword, $options);
} catch (PDOException $e) {
    die("DB connection failed.");
}

// PIN protection
if (!isset($_SESSION['adminQ_ok'])) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['pin'])) {
        if ($_POST['pin'] === PIN) {
            $_SESSION['adminQ_ok'] = true;
            header("Location: " . $_SERVER['PHP_SELF']); exit;
        } else {
            $msg = "Incorrect PIN!";
        }
    }
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>AdminQ - Edit Questions JSON</title>
        <style>
            body { background: #1b2b3e; color: #fff; font-family: Segoe UI, Arial, sans-serif; }
            .box { margin: 120px auto; background:#223a50; padding:40px 35px 35px 35px; border-radius:18px; width:320px; box-shadow: 0 6px 32px #000a; text-align:center;}
            input[type=password] { padding:10px; border-radius:8px; border:1px solid #345; width: 90%; margin-bottom:18px; font-size:1.18rem;}
            button { background:#3bc984; color:#fff; border:none; border-radius:7px; padding:10px 32px; font-size:1.15rem;}
            .msg {color:#ffd580; margin-bottom:8px;}
        </style>
    </head>
    <body>
        <div class="box">
            <h2>Admin PIN</h2>
            <?php if(!empty($msg)) echo "<div class='msg'>$msg</div>"; ?>
            <form method="post">
                <input type="password" name="pin" placeholder="Enter PIN" autofocus required /><br>
                <button type="submit">Login</button>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// Logout
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: " . $_SERVER['PHP_SELF']);
    exit;
}

// Handle Save
$msg = "";
$jsontext = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['jsontext'])) {
    $jsontext = trim($_POST['jsontext']);
    $json = json_decode($jsontext, true);
    if ($json === null && strtolower($jsontext) !== 'null') {
        $msg = "<span style='color:#ff7675'>Invalid JSON: " . htmlspecialchars(json_last_error_msg()) . "</span>";
    } else {
        $stmt = $pdo->prepare("INSERT INTO " . TABLE . " (folder, questions_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE questions_json = VALUES(questions_json)");
        $stmt->execute([$folder, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)]);
        $msg = "<span style='color:#81ff81'>Saved successfully!</span>";
    }
} else {
    $stmt = $pdo->prepare("SELECT questions_json FROM " . TABLE . " WHERE folder = ?");
    $stmt->execute([$folder]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $jsontext = $row ? json_encode(json_decode($row['questions_json'], true), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : "[]";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>AdminQ - Edit questions.json</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
        body { background: #1b2b3e; color: #fff; font-family: Segoe UI, Arial, sans-serif; margin:0; }
        .container { max-width:700px; margin:40px auto 24px auto; background:#223a50; border-radius:18px; box-shadow: 0 6px 32px #000a; padding:34px 36px 22px 36px;}
        textarea { width:100%; height:410px; font-size:1.06rem; padding:10px; border-radius:8px; border:1.5px solid #345; font-family:Consolas,Monaco,monospace; background:#111c2a; color:#ffe082; }
        button, .btn { background:#30d178; color:#fff; border:none; border-radius:8px; padding:10px 36px; font-size:1.08rem; margin-right:10px; margin-top:12px; cursor:pointer; }
        .btn-cancel { background:#aaa; color:#333; }
        .logout { float:right; background:#2e6c90; color:#fff; border-radius:6px; padding:6px 16px; text-decoration:none; font-size:0.98rem; }
        .msg { margin-bottom:15px; }
        @media (max-width: 800px) {
            .container { padding:10px 1vw 12px 1vw; }
            textarea { height:200px; }
        }
    </style>
</head>
<body>
<div class="container">
    <a class="logout" href="?logout=1">Logout</a>
<a class="logout" href="admin.php" style="margin-right: 10px;">Item Edit</a>
<a class="logout" href="./" style="margin-right: 10px;">Back to Game</a>
<h2>Snake Quiz Admin</h2>
    <h2 style="color:#ffe082;">Edit questions.json for folder "<?= htmlspecialchars($folder) ?>"</h2>
    <?php if ($msg) echo "<div class='msg'>$msg</div>"; ?>
    <form method="post" autocomplete="off">
        <textarea name="jsontext" spellcheck="false"><?= htmlspecialchars($jsontext) ?></textarea><br>
        <button type="submit">Save</button>
        <a href="<?= $_SERVER['PHP_SELF'] ?>" class="btn btn-cancel">Cancel</a>
    </form>
    <div style="font-size:0.97rem; color:#ffd580; margin-top:16px;">
        <b>Tip:</b> Make sure your JSON is valid.<br>
        Backup before making large changes.
    </div>
</div>
</body>
</html>
