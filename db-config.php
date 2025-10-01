<?php
// Database connection parameters
$databaseHost = 'localhost';
$databaseName = 'SNAKE'; // Replace with your database name
$databaseUser = 'ecms_nz'; // Replace with your database username
$databasePassword = '6HhBrKSXFA3tqjg'; // Replace with your database password
$databaseCharset = 'utf8mb4';
$tableTAAssignments = 'leaderboard'; // Table name

$dsn = "mysql:host=$databaseHost;dbname=$databaseName;charset=$databaseCharset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];
define('PIN', '12451254');
?>

