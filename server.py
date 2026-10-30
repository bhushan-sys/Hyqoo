import http.server
import socketserver
import urllib.request
import urllib.parse
import ssl
import json
import re
import os

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Read configuration from _secret/config.php or config-test.php
CMS_TOKEN = "hq_qzPf5v57fbQRxT4LVQ6a355z9rmMnCdL"
BASE_URL = "https://cmsapi.hyqoo.com/api/v1/hq"

# Setup SSL context (bypasses local Windows certificate bundle issues)
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

class HyqooHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Handle api.php endpoint
        if path == "/api.php":
            endpoint = query.get("endpoint", [""])[0]
            if endpoint == "talent_profiles":
                self.proxy_cms("/public/talent/profiles")
            else:
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Invalid endpoint: {endpoint}"}).encode("utf-8"))
            return

        # Handle talent-profiles.php endpoint
        if path == "/talent-profiles.php":
            self.proxy_cms("/public/talent/profiles")
            return

        # Serve static files as default
        return super().do_GET()

    def proxy_cms(self, endpoint_path):
        target_url = f"{BASE_URL}{endpoint_path}"
        try:
            req = urllib.request.Request(
                target_url,
                headers={
                    "Token": CMS_TOKEN,
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0"
                }
            )
            with urllib.request.urlopen(req, timeout=15, context=ssl_ctx) as response:
                content = response.read()
                self.send_response(response.status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(content)
        except urllib.error.HTTPError as e:
            err_content = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(err_content if err_content else json.dumps({"error": str(e)}).encode("utf-8"))
        except Exception as e:
            self.send_response(502)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Unable to connect to the external API.", "details": str(e)}).encode("utf-8"))

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), HyqooHandler) as httpd:
        print(f"Serving Hyqoo at http://localhost:{PORT}")
        httpd.serve_forever()

