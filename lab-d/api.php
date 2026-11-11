<?php
require_once __DIR__ . '/../../config.php';

$allowedOrigins = [
    'https://mi2no.github.io',
    'http://localhost:8080'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

$path = substr($path, strlen('/weather_api/'));

$city = $_GET['q'] ?? 'Szczecin';
$lang = $_GET['lang'] ?? 'pl';

if ($method == 'GET' && ($path == 'weather' || $path == 'forecast')) {
    $url = "https://api.openweathermap.org/data/2.5/{$path}?q={$city}&lang={$lang}&appid={$OPEN_WEATHER_KEY}";
    $curl = curl_init($url);

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer $apiKey",
            "Accept: application/json"
        ],
        CURLOPT_TIMEOUT => 10
    ]);

    $response = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    if ($response === false) {
        http_response_code(502);
        echo json_encode(['error' => curl_error($curl)]);
        curl_close($curl);
    }
    else {
        curl_close($curl);
        http_response_code($status);
        echo $response;
    }
}
else { 
    http_response_code(502);
    echo json_encode(['error' => 'Invalid request.']);
}
?>
