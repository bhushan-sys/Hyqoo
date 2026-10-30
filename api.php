
<?php

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$configFile = __DIR__ . '/_secret/config.php';

if (!is_file($configFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'API configuration is missing.']);
    exit;
}

$config = require $configFile;

// Only allow GET requests from the HTML frontend.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

// Accept only configured endpoint keys, not arbitrary URLs.
$endpointKey = $_GET['endpoint'] ?? '';

if (
    !is_string($endpointKey) ||
    !isset($config['endpoints'][$endpointKey])
) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid API endpoint.']);
    exit;
}

$endpoint = $config['endpoints'][$endpointKey];

if (($endpoint['method'] ?? '') !== 'GET') {
    http_response_code(400);
    echo json_encode(['error' => 'Unsupported API method.']);
    exit;
}

$baseUrl = rtrim($config['base_url'], '/');
$path = $endpoint['path'];

// Build the URL using trusted configuration only.
$url = $baseUrl . '/' . ltrim($path, '/');

if (!function_exists('curl_init')) {
    http_response_code(500);
    echo json_encode(['error' => 'PHP cURL is not enabled.']);
    exit;
}

$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => [
        'Token: ' . $config['token'],
        'Accept: application/json',
    ],
]);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$errorNumber = curl_errno($ch);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);
/*
if ($response === false) {
    error_log('External API connection failed: ' . $curlError);

    http_response_code(502);
    echo json_encode(['error' => 'Unable to connect to the external API.']);
    exit;
}
*/

if ($response === false) {
    $errorNumber = curl_errno($ch); // See note below
    error_log(
        'External API connection failed: ' .
        $errorNumber . ' - ' . $curlError
    );

    http_response_code(502);

    echo json_encode([
        'error' => 'Unable to connect to the external API.',
        'curl_error' => $curlError,
        'curl_error_code' => $errorNumber,
    ]);

    exit;
}



if ($statusCode < 200 || $statusCode >= 300) {
    http_response_code(502);
    echo json_encode([
        'error' => 'The external API request failed.',
        'upstream_status' => $statusCode,
    ]);
    exit;
}

// Return the upstream JSON without exposing the token.
http_response_code(200);
echo $response;
