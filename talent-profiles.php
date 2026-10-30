
<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config-test.php';

$ch = curl_init(CMS_API_URL);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Token: ' . CMS_API_TOKEN,
        'Accept: application/json'
    ],
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2
]);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$curlErrno = curl_errno($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

if ($response === false) {
    error_log(
        "CMS API cURL error {$curlErrno}: {$curlError}"
    );

    http_response_code(502);

    echo json_encode([
        'error' => 'CMS API connection failed',
        'curl_error_code' => $curlErrno
    ]);
    exit;
}

if ($httpCode < 200 || $httpCode >= 300) {
    error_log("CMS API returned HTTP {$httpCode}");

    http_response_code(502);

    echo json_encode([
        'error' => 'CMS API returned an unsuccessful response',
        'upstream_status' => $httpCode
    ]);
    exit;
}

echo $response;
