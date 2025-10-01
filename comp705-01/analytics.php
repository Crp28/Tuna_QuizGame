<?php
// Add this before any HTML output
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");
header("Pragma: no-cache");

require_once __DIR__ . '/../db-config.php';

function h($s) {
    return htmlspecialchars($s, ENT_QUOTES);
}

function timeAgo($datetime) {
    $now = new DateTime();
    $last = new DateTime($datetime);
    $diff = $now->diff($last);

    if ($diff->y > 0) return $diff->y . ' year(s) ago';
    if ($diff->m > 0) return $diff->m . ' month(s) ago';
    if ($diff->d > 0) return $diff->d . ' day(s) ago';
    if ($diff->h > 0) return $diff->h . ' hour(s) ago';
    if ($diff->i > 0) return $diff->i . ' minute(s) ago';
    return 'Just now';
}


try {
    $pdo = new PDO($dsn, $databaseUser, $databasePassword, $options);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB connection failed: ' . $e->getMessage()]);
    exit;
}

// Fetch all data from leaderboard
try {
    // Infer folder name from the current URL
$folder = basename(dirname($_SERVER['REQUEST_URI']));

// Fallback if empty
if (!$folder || !preg_match('/^[a-z0-9\-]+$/i', $folder)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid or missing folder name.']);
    exit;
}

// Fetch only data for the current folder
$sql = "SELECT username, level, time, created_at, ip_address as ip FROM leaderboard WHERE folder = :folder";
$stmt = $pdo->prepare($sql);
$stmt->execute(['folder' => $folder]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $total_games_played = count($rows);
	$unique_ips = count(array_unique(array_column($rows, 'ip')));

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Query failed: ' . $e->getMessage()]);
    exit;
}

// Aggregate per user
$players = [];
foreach ($rows as $row) {
    $u = $row['username'];
    if (!isset($players[$u])) {
        $players[$u] = [
            'levels' => [],
            'times' => [],
            'attempts' => 0,
            'latest' => '',
        ];
    }
    $players[$u]['levels'][] = (int)$row['level'];
    $players[$u]['times'][] = round((float)$row['time'] / 60, 2); // convert seconds to minutes
    $players[$u]['attempts'] += 1;
    $players[$u]['latest'] = max($players[$u]['latest'], $row['created_at']);
}

// Calculate metrics
$summary = [];
foreach ($players as $user => $data) {
    $total_score = array_sum($data['levels']);
    $total_time = array_sum($data['times']);
    $avg_score = $total_score / count($data['levels']);
    $avg_time = $total_time / count($data['times']);
    $best_score = max($data['levels']);
    $summary[] = [
        'username' => $user,
        'attempts' => $data['attempts'],
        'total_score' => $total_score,
        'total_time' => $total_time,
        'avg_score' => round($avg_score, 2),
        'avg_time' => round($avg_time, 2),
        'best_score' => $best_score,
        'latest_play' => $data['latest'],
        'score_per_minute' => $total_time > 0 ? round($total_score / $total_time, 2) : 0,
    ];
}

// Sort for display
$by_score = $summary;
usort($by_score, fn($a, $b) => $b['best_score'] <=> $a['best_score']);

$by_time = $summary;
usort($by_time, fn($a, $b) => $b['total_time'] <=> $a['total_time']);

$by_accuracy = $summary;
usort($by_accuracy, fn($a, $b) => $b['score_per_minute'] <=> $a['score_per_minute']);
?>

<!DOCTYPE html>
<html lang="en">
	
	<?php
// Prepare chart data (Top 10 by score)
$top_chart = array_slice($by_score, 0, 10);
$chart_usernames = array_map(fn($r) => $r['username'], $top_chart);
$chart_scores = array_map(fn($r) => $r['total_score'], $top_chart);
$chart_avg_times = array_map(fn($r) => $r['avg_time'], $top_chart);
$chart_score_per_minute = array_map(fn($r) => $r['score_per_minute'], $top_chart);




function calculate_stats(array $values): array {
    sort($values);
    $count = count($values);
    $mean = array_sum($values) / $count;
    $median = $count % 2 === 0
        ? ($values[$count / 2 - 1] + $values[$count / 2]) / 2
        : $values[floor($count / 2)];
    $max = max($values);
    $min = min($values);
    $variance = array_sum(array_map(fn($v) => pow($v - $mean, 2), $values)) / $count;
    $stddev = sqrt($variance);

    return [
        'Mean' => round($mean, 2),
        'Median' => round($median, 2),
        'Max' => round($max, 2),
        'Min' => round($min, 2),
        'Std Dev' => round($stddev, 2),
    ];
}

$total_scores = array_column($summary, 'total_score');
$total_times = array_column($summary, 'total_time');
$avg_times = array_column($summary, 'avg_time');
$score_per_minute = array_column($summary, 'score_per_minute');

$stats = [
    'Total Score' => calculate_stats($total_scores),
    'Total Time (min)' => calculate_stats($total_times),
    'Avg Time per Game (min)' => calculate_stats($avg_times),
    'Score per Minute' => calculate_stats($score_per_minute),
];

?>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<head>
    <meta charset="UTF-8">
    <title>🎮 Player Analytics - Snake Quiz Game</title>
    
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.4/js/jquery.dataTables.min.js"></script>
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.4/css/jquery.dataTables.min.css">
    <link rel="stylesheet" href="analytics.css" />

</head>
<body>
<div class="container">
    <div class="d-flex justify-content-between align-items-center mb-4">
  <h1 class="mb-0">📊 Snake Quiz Game: Player Analytics Dashboard</h1>
  <a href="index.php" class="btn btn-outline-warning btn-sm">← Back to Game</a>
</div>


    <div class="mb-3">
  <strong>Total Unique Players:</strong> <?= count($summary) ?> &nbsp;|&nbsp;
  <strong>Total Games Played:</strong> <?= $total_games_played ?> &nbsp;|&nbsp;
  <strong>Total Unique IPs:</strong> <?= $unique_ips ?>
</div>

<h2>📈 Ultimate Player Statistics Summary</h2>
<table class="table table-bordered table-striped leaderboard-table-shadow">
    <thead>
        <tr>
            <th>Metric</th>
            <th>Mean</th>
            <th>Median</th>
            <th>Max</th>
            <th>Min</th>
            <th>Std Dev</th>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($stats as $label => $data): ?>
            <tr>
                <td><?= h($label) ?></td>
                <td><?= $data['Mean'] ?></td>
                <td><?= $data['Median'] ?></td>
                <td><?= $data['Max'] ?></td>
                <td><?= $data['Min'] ?></td>
                <td><?= $data['Std Dev'] ?></td>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>



    <h2>🏆 Top Scorers (Total Level Sum)</h2>
    <table id="scoreTable" class="table table-bordered table-striped leaderboard-table-shadow">
        <thead>
            <tr><th>#</th><th>Player</th><th>Best Score</th><th>Total Score</th><th>Attempts</th></tr>
        </thead>
        <tbody>
        <?php foreach (array_slice($by_score, 0, 10) as $i => $row): ?>
            <tr>
                <td><?= $i+1 ?></td>
                <td><?= h($row['username']) ?></td>
                
                <td><?= $row['best_score'] ?></td>
                <td><?= $row['total_score'] ?></td>
                <td><?= $row['attempts'] ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>

    <h2>⏱️ Most Time Spent (Total Minutes)</h2>
    <table id="timeTable" class="table table-bordered table-striped leaderboard-table-shadow">
        <thead>
            <tr><th>#</th><th>Player</th><th>Total Time (min)</th><th>Attempts</th><th>Avg Time/Play</th></tr>
        </thead>
        <tbody>
        <?php foreach (array_slice($by_time, 0, 10) as $i => $row): ?>
            <tr>
                <td><?= $i+1 ?></td>
                <td><?= h($row['username']) ?></td>
                <td><?= $row['total_time'] ?></td>
                <td><?= $row['attempts'] ?></td>
                <td><?= $row['avg_time'] ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>

    <h2>🎯 Highest Accuracy (Score per Minute)</h2>
    <table id="accuracyTable" class="table table-bordered table-striped leaderboard-table-shadow">
        <thead>
            <tr><th>#</th><th>Player</th><th>Score/Minute</th><th>Total Score</th><th>Total Time</th></tr>
        </thead>
        <tbody>
        <?php
$filtered_accuracy = array_values(array_filter($by_accuracy, fn($row) => $row['total_score'] > 100));
foreach (array_slice($filtered_accuracy, 0, 10) as $i => $row):
?>

            <tr>
                <td><?= $i+1 ?></td>
                <td><?= h($row['username']) ?></td>
                <td><?= $row['score_per_minute'] ?></td>
                <td><?= $row['total_score'] ?></td>
                <td><?= $row['total_time'] ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>

    <h2>🕓 Most Recent Players</h2>
<table id="recentTable" class="table table-bordered table-striped leaderboard-table-shadow">
    <thead>
        <tr><th>Player</th><th>Last Played</th><th>Attempts</th><th>Best Score</th></tr>
    </thead>
    <tbody>
    <?php
    usort($summary, fn($a, $b) => strtotime($b['latest_play']) <=> strtotime($a['latest_play']));

    foreach (array_slice($summary, 0, 10) as $row):
    ?>
        <tr>
            <td><?= h($row['username']) ?></td>
            <td><?= h($row['latest_play']) ?><br><small class="text-muted"><?= timeAgo($row['latest_play']) ?></small></td>
            <td><?= $row['attempts'] ?></td>
            <td><?= $row['best_score'] ?></td>
        </tr>
    <?php endforeach; ?>
    </tbody>
</table>

    <?php

$dau = count(array_unique(array_map(fn($r) => substr($r['created_at'], 0, 10), $rows)));


?>
<?php

$activity = [];
foreach ($rows as $r) {
    $day = substr($r['created_at'], 0, 10);
    $user = $r['username'];
    $activity[$user][$day] = true;
}
$avg_sessions_per_day = array_sum(array_map('count', $activity)) / count($activity);

?>

<?php

$repeats = array_filter($players, fn($p) => $p['attempts'] > 5);
$repeat_rate = round((count($repeats) / count($players)) * 100, 2);


?>

<?php

$retention = [
    'within_1_day' => 0,
    'within_7_days' => 0,
    'within_30_days' => 0,
];
$now = new DateTime();
foreach ($players as $p) {
    $last = new DateTime($p['latest']);
    $diff = $now->diff($last)->days;
    if ($diff <= 1) $retention['within_1_day']++;
    if ($diff <= 7) $retention['within_7_days']++;
    if ($diff <= 30) $retention['within_30_days']++;
}


$total_days = count(array_unique(array_map(fn($r) => substr($r['created_at'], 0, 10), $rows)));
$avg_sessions_per_day = $total_games_played / $total_days;

?>



    <h2>📅 Unique Days of Activity (DAU)</h2>
<table class="table table-bordered table-striped leaderboard-table-shadow">
    <thead><tr><th>Total Unique Days</th></tr></thead>
    <tbody>
        <tr><td><?= $dau ?></td></tr>
    </tbody>
</table>

    <h2>📊 Average Sessions Per Day</h2>
<table class="table table-bordered table-striped leaderboard-table-shadow">
    <thead><tr><th>Avg Sessions per Day</th></tr></thead>
    <tbody>
        <tr><td><?= round($avg_sessions_per_day, 2) ?></td></tr>
    </tbody>
</table>


    <h2>🔁 Repeat Players (> 5 times)</h2>
<table class="table table-bordered table-striped leaderboard-table-shadow">
    <thead><tr><th>Repeat Rate (%)</th><th>Repeat Players</th><th>Total Players</th></tr></thead>
    <tbody>
        <tr>
            <td><?= $repeat_rate ?>%</td>
            <td><?= count($repeats) ?></td>
            <td><?= count($players) ?></td>
        </tr>
    </tbody>
</table>
<?php
$slow_threshold = 2.5; // minutes per game
$chill_players = array_filter($summary, fn($r) => $r['avg_time'] > $slow_threshold);
?>

<h2>🦥 Chill Masters (Avg. Time per Game > <?= $slow_threshold ?> mins)</h2>

<?php if (count($chill_players) > 0): ?>
<table class="table table-bordered table-striped leaderboard-table-shadow">
    <thead>
        <tr><th>Player</th><th>Avg Time per Game (min)</th><th>Total Games</th></tr>
    </thead>
    <tbody>
    <?php foreach ($chill_players as $r): ?>
        <tr>
            <td><?= h($r['username']) ?></td>
            <td><?= $r['avg_time'] ?></td>
            <td><?= $r['attempts'] ?></td>
        </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<?php else: ?>
    <p>😎 Everyone's playing fast today — no Chill Masters found!</p>
<?php endif; ?>



    
    <h2>📊 Visual Analytics</h2>

<div class="mb-5">
    <canvas id="scoreChart" style="width: 100%; height: 400px;"></canvas>
</div>

<div class="mb-5">
    <canvas id="avgTimeChart" style="width: 100%; height: 400px;"></canvas>
</div>

<div class="mb-5">
    <canvas id="accuracyChart" style="width: 100%; height: 400px;"></canvas>
</div>


</div>
<script>
    $(document).ready(function () {
        $('#scoreTable').DataTable();
        $('#timeTable').DataTable();
        $('#accuracyTable').DataTable();
        $('#recentTable').DataTable({
    order: [[1, 'desc']]
});
    });
</script>

<script>
    $(document).ready(function () {
        $('#scoreTable').DataTable();
        $('#timeTable').DataTable();
        $('#accuracyTable').DataTable();
        $('#recentTable').DataTable();

        const chartLabels = <?= json_encode($chart_usernames) ?>;
        const totalScores = <?= json_encode($chart_scores) ?>;
        const avgTimes = <?= json_encode($chart_avg_times) ?>;
        const scorePerMinute = <?= json_encode($chart_score_per_minute) ?>;

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    color: '#222'
                },
                legend: {
                    labels: {
                        color: '#222'
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#222' },
                    grid: { color: '#ddd' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#222' },
                    grid: { color: '#ddd' }
                }
            }
        };

        new Chart(document.getElementById('scoreChart'), {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Total Score',
                    data: totalScores,
                    backgroundColor: 'rgba(255, 193, 7, 0.7)'
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: {
                        ...commonOptions.plugins.title,
                        text: 'Top 10 Players by Total Score'
                    }
                }
            }
        });

        new Chart(document.getElementById('avgTimeChart'), {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Avg Time per Game (min)',
                    data: avgTimes,
                    backgroundColor: 'rgba(33, 150, 243, 0.7)'
                }]
            },
            options: {
                ...commonOptions,
                indexAxis: 'y',
                plugins: {
                    ...commonOptions.plugins,
                    title: {
                        ...commonOptions.plugins.title,
                        text: 'Average Time per Game (Top Players)'
                    }
                }
            }
        });

        new Chart(document.getElementById('accuracyChart'), {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Score per Minute',
                    data: scorePerMinute,
                    fill: false,
                    borderColor: 'rgba(76, 175, 80, 0.9)',
                    tension: 0.2
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: {
                        ...commonOptions.plugins.title,
                        text: 'Efficiency: Score per Minute'
                    }
                }
            }
        });
    });
</script>

<

</html>
