<?php
session_start();

function clean_input($s) {
    return preg_replace('/[^a-zA-Z0-9_\-\s@.]/', '', trim($s));
}

// 1. Handle GET submission
if (
    isset($_GET['username'], $_GET['firstname'], $_GET['lastname'], $_GET['email']) &&
    $_GET['username'] !== '' && $_GET['firstname'] !== '' && $_GET['lastname'] !== '' && $_GET['email'] !== ''
) {
    $username  = clean_input($_GET['username']);
    $firstname = clean_input($_GET['firstname']);
    $lastname  = clean_input($_GET['lastname']);
    $email     = clean_input($_GET['email']);
    $full_name = trim("$firstname $lastname");

    foreach (['username', 'firstname', 'lastname', 'email', 'full_name'] as $key) {
        setcookie($key, $$key, time() + 60 * 60 * 24 * 180, "/");
    }

    $base = strtok($_SERVER["REQUEST_URI"], '?');
    header("Location: $base");
    exit;
}

// 2. Handle POST submission
if (
    $_SERVER['REQUEST_METHOD'] === 'POST' &&
    isset($_POST['username'], $_POST['firstname'], $_POST['lastname'], $_POST['email']) &&
    $_POST['username'] !== '' && $_POST['firstname'] !== '' && $_POST['lastname'] !== '' && $_POST['email'] !== ''
) {
    $username  = clean_input($_POST['username']);
    $firstname = clean_input($_POST['firstname']);
    $lastname  = clean_input($_POST['lastname']);
    $email     = clean_input($_POST['email']);
    $full_name = trim("$firstname $lastname");

    foreach (['username', 'firstname', 'lastname', 'email', 'full_name'] as $key) {
        setcookie($key, $$key, time() + 60 * 60 * 24 * 180, "/");
    }

    header("Location: " . $_SERVER["REQUEST_URI"]);
    exit;
}

// 3. Use cookie if exists
if (
    isset($_COOKIE['username'], $_COOKIE['firstname'], $_COOKIE['lastname'], $_COOKIE['email']) &&
    $_COOKIE['username'] !== '' && $_COOKIE['firstname'] !== '' && $_COOKIE['lastname'] !== '' && $_COOKIE['email'] !== ''
) {
    $username = clean_input($_COOKIE['username']);
} else {
    // 4. Show login form for all fields
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Enter Details</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <link rel="stylesheet" href="https://cv.aut.ac.nz/code/lib/bootstrap.min.css" />
        <link rel="stylesheet" href="snake.css" />
    </head>
    <body class="d-flex justify-content-center align-items-center" style="min-height:100vh;">
        <form class="shadow-lg p-4 rounded" method="post" autocomplete="off"
              style="background:rgba(40,62,81,0.97); min-width:320px; max-width:98vw;">
            <div class="mb-3 text-center">
                <div style="font-size:2.5rem; margin-bottom:10px;">🐍</div>
                <h2 class="fw-bold mb-2" style="color:#ffe082;">Welcome!</h2>
            </div>
            <div class="mb-3 text-center fw-semibold" style="color:#81ff81; font-size:1.1rem;">
                Please enter your details to start playing:
            </div>
            <input type="text" name="username" class="form-control mb-3 text-center" maxlength="30" required placeholder="Nickname or Username">
            <input type="text" name="firstname" class="form-control mb-3 text-center" maxlength="30" required placeholder="First Name">
            <input type="text" name="lastname" class="form-control mb-3 text-center" maxlength="30" required placeholder="Last Name">
            <input type="email" name="email" class="form-control mb-4 text-center" maxlength="80" required placeholder="Email">
            <button type="submit" class="btn btn-warning w-100 fw-bold" style="font-size:1.18rem;">
                Play Now
            </button>
        </form>
    </body>
    </html>
    <?php
    exit;
}
?>



<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Snake Game for <?php echo htmlspecialchars($username, ENT_QUOTES); ?></title>
  <link rel="stylesheet" href="https://cv.aut.ac.nz/code/lib/bootstrap.min.css" />
  <link rel="stylesheet" href="snake.css" />
  <script src="https://cv.aut.ac.nz/code/lib/sweetalert2.all.min.js"></script>
</head>
<body>
  <div class="split-container">
    <!-- Left: Info, Title, Question -->
    <div class="left-panel"> 
      <div class="question-panel" id="questionPanel">        
      </div>      
      <div id="nextLevelBtn" style="display:none; width:100%; margin-top: 20px;">
  <div style="
    width: 100%;
    background: linear-gradient(90deg, #66bb6a, #a5d6a7);
    color: #fff;
    font-size: 1rem;
    padding: 10px 12px;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    text-align: center;
    line-height: 1.4;
  ">
    🎉 <strong>Congratulations!</strong> You’ve passed over <strong>50%</strong> of the questions. 
    You’re eligible to go to the next level.
    <button onclick="goToNextLevel()" 
            style="
              background-color: #fff200;
              margin-left: 16px;
              border: none;
              border-radius: 4px;
              padding: 4px 10px;
              font-weight: bold;
              font-size: 0.9rem;
              cursor: pointer;
              color: #222;
              box-shadow: 0 1px 4px rgba(0,0,0,0.15);
            ">
      ✅ Next Level
    </button>
  </div>
</div>
      
        <div id="mainLeaderboard" style="margin:20px auto 0 auto;"></div>

      
    </div>
    <!-- Right: Game -->
    <div class="right-panel">      
      <div class="game-area">
		  
		  <?php
$parts = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
$folder = $parts[array_search('snake', $parts) + 1] ?? 'unknown';

?>
<div class="game-title" id="gameTitle">
  🧑‍💻 Snake Quiz Game for 
  <span style="
    background: linear-gradient(90deg, #00c853, #64dd17);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bold;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  ">
    <?= htmlspecialchars($username, ENT_QUOTES) ?>
  </span> 
  at block 
  <span style="
    background: linear-gradient(90deg, #ff4081, #7c4dff, #40c4ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bold;
    text-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
  ">
    <?= htmlspecialchars($folder, ENT_QUOTES) ?>
  </span>
</div>



<div class="score" id="scoreBox"></div>

        <canvas id="gameCanvas" width="900" height="640"></canvas>
        <div class="splash" id="splashScreen" style="padding: 16px 24px;">
  <div style="font-size:2.1rem; font-weight:600; margin-bottom:12px;">Ready to play, <?= htmlspecialchars($username) ?>?</div>
  <div style="font-size:1.2rem; margin-bottom:10px;">
    Press <b>S</b> to start the game!
  </div>
  <div style="font-size:1.05rem; margin-bottom:14px; color:#ffe082;">
    This game block contains <span id="questionCount" style="font-weight:bold; color:#81ff81;">?</span> questions.
    Let’s aim for at least <b>50%</b> correct!
  </div>
  <div class="hint" style="font-size:1rem;">
    🪱 Eat the <span style="color:#81ff81; font-weight:bold;">correct answer</span> worm (A/B/C/D) to score points.<br>
    ❌ Hitting the wall or eating a wrong answer will end your run.<br><br>
    🟢 Once you pass the 50% mark, you <b>may proceed</b> to the next set of questions (if available).<br><br>
    🏆 Check the <b>Leaderboard</b> to see how you rank!
  </div>
</div>

      </div>
    </div>
  </div>
  <div class="footer-bar">
    <span>
      Made by Minh Nguyen @ <span style="color:#fff; text-shadow:0 0 4px #ea0029cc;">AUT</span>
    </span>
    &nbsp; | &nbsp; 
    <a href="admin.php" target="_blank" style="color:#ffe082; text-decoration:underline; font-weight:bold;">Admin: Edit Question Bank</a>
  </div>
  <script src="snake.js?v=<?php echo time(); ?>"></script>
  <script src="drawGame.js?v=<?php echo time(); ?>"></script>
  <script src="drawWorms.js?v=<?php echo time(); ?>"></script>
  <script src="drawExplosion.js?v=<?php echo time(); ?>"></script>
  <script src="drawLeaderBoard.js?v=<?php echo time(); ?>"></script>
  <script src="nextLevel.js?v=<?php echo time(); ?>"></script>
  <script src="drawHowToPlay.js?v=<?php echo time(); ?>"></script>
  <script src="gameOverPopUp.js?v=<?php echo time(); ?>"></script>
  <script src="drawQuestionPanel.js?v=<?php echo time(); ?>"></script>
<script>
  const USERNAME = getCookie('username') || 'Guest';
</script>

<script src="access-check.js"></script>


</body>
</html>
