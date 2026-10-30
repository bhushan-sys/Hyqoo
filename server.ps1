<#
  Hyqoo Zero-Dependency Local Dev Server for Windows
  Runs using built-in Windows PowerShell (no Python, Node, or PHP required)
#>

$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

# Trust self-signed or incomplete cert chains for the upstream API
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13

$cmsToken = "hq_qzPf5v57fbQRxT4LVQ6a355z9rmMnCdL"
$cmsBase = "https://cmsapi.hyqoo.com/api/v1/hq"

# Automatically find an available port
$candidatePorts = @(8000, 8001, 8002, 8080, 8888, 3000, 5000)
$listener = $null
$port = $null

foreach ($p in $candidatePorts) {
    try {
        $candidate = New-Object System.Net.HttpListener
        $candidate.Prefixes.Add("http://localhost:$p/")
        $candidate.Start()
        $listener = $candidate
        $port = $p
        break
    } catch {
        if ($candidate) {
            try { $candidate.Close() } catch {}
        }
    }
}

if (-not $listener) {
    Write-Host "Failed to find an open port. Please close conflicting apps and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " Hyqoo Local Server is running!" -ForegroundColor Green
Write-Host " URL: http://localhost:$port" -ForegroundColor Yellow
Write-Host " Zero installation required (powered by Windows PowerShell)" -ForegroundColor DarkGray
Write-Host " Press Ctrl+C in this window to stop the server." -ForegroundColor DarkGray
Write-Host "======================================================" -ForegroundColor Cyan

# Open default browser
Start-Process "http://localhost:$port"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
    } catch {
        break
    }

    $request = $context.Request
    $response = $context.Response

    $urlPath = $request.Url.AbsolutePath
    $query = $request.Url.Query

    # Enable CORS
    $response.AddHeader("Access-Control-Allow-Origin", "*")
    $response.AddHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
    $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Accept")

    if ($request.HttpMethod -eq "OPTIONS") {
        $response.StatusCode = 200
        $response.Close()
        continue
    }

    # Handle API Proxy requests
    if ($urlPath -eq "/api/proxy" -or $urlPath -eq "/api.php" -or $urlPath -eq "/talent-profiles.php") {
        $endpoint = "talent_profiles"
        if ($request.QueryString["endpoint"]) {
            $endpoint = $request.QueryString["endpoint"]
        }

        $subpath = "/public/talent/profiles"
        if ($endpoint -ne "talent_profiles") {
            $subpath = "/public/$endpoint"
        }

        $targetUrl = "$cmsBase$subpath"

        try {
            $webReq = [System.Net.HttpWebRequest]::Create($targetUrl)
            $webReq.Method = "GET"
            $webReq.Headers.Add("Token", $cmsToken)
            $webReq.Accept = "application/json"
            $webReq.UserAgent = "Mozilla/5.0"
            $webReq.Timeout = 15000

            $webRes = $webReq.GetResponse()
            $stream = $webRes.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes($reader.ReadToEnd())

            $response.ContentType = "application/json; charset=utf-8"
            $response.AddHeader("Cache-Control", "no-store")
            $response.StatusCode = 200
            $response.ContentLength64 = $jsonBytes.Length
            $response.OutputStream.Write($jsonBytes, 0, $jsonBytes.Length)
            $webRes.Close()
        } catch [System.Net.WebException] {
            $webEx = $_.Exception
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("{`"error`": `"Failed to connect to upstream API`", `"details`": `"$($webEx.Message)`"}")
            $response.ContentType = "application/json; charset=utf-8"
            $response.StatusCode = 502
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        } catch {
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("{`"error`": `"Internal error`", `"details`": `"$($_.Exception.Message)`"}")
            $response.ContentType = "application/json; charset=utf-8"
            $response.StatusCode = 500
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }

        $response.Close()
        continue
    }

    # Handle static files
    $localFile = $urlPath.TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($localFile)) {
        $localFile = "index.html"
    }

    $fullPath = Join-Path $root $localFile

    if (Test-Path $fullPath -PathType Leaf) {
        $content = [System.IO.File]::ReadAllBytes($fullPath)
        $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()

        switch ($ext) {
            ".html" { $response.ContentType = "text/html; charset=utf-8" }
            ".htm"  { $response.ContentType = "text/html; charset=utf-8" }
            ".css"  { $response.ContentType = "text/css; charset=utf-8" }
            ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
            ".json" { $response.ContentType = "application/json; charset=utf-8" }
            ".png"  { $response.ContentType = "image/png" }
            ".jpg"  { $response.ContentType = "image/jpeg" }
            ".jpeg" { $response.ContentType = "image/jpeg" }
            ".svg"  { $response.ContentType = "image/svg+xml" }
            ".webp" { $response.ContentType = "image/webp" }
            default { $response.ContentType = "application/octet-stream" }
        }

        $response.StatusCode = 200
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found")
        $response.ContentLength64 = $notFoundBytes.Length
        $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
    }

    $response.Close()
}
