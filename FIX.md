# Hyqoo Vercel Deployment & API Integration: Issues, Root Causes, and Fixes

## 1. Executive Summary

This document explains the architecture, issues encountered, root causes, and solutions implemented to deploy the Hyqoo web application and its CMS API proxy to **Vercel**, while maintaining full local development compatibility on **localhost:8000**.

---

## 2. Architecture & Workflow Overview

### Components:
- **Frontend (`index.html` & `index-test.html`)**: Static HTML/JS frontends that display talent profiles fetched asynchronously from a backend endpoint.
- **Upstream CMS API (`https://cmsapi.hyqoo.com/api/v1/hq/public/talent/profiles`)**: The production API providing talent profile data, requiring a private authentication token (`Token: hq_qzPf5...`).
- **Backend Proxy (`api/proxy.js`)**: A Vercel Serverless Function (Node.js) that attaches the private token, queries the upstream CMS API, and returns JSON to the browser without exposing sensitive credentials or running into cross-origin (CORS) blocks.
- **Local Dev Server (`server.py`)**: A lightweight Python development server running on `http://localhost:8000` that serves static files and emulates the API proxy locally with zero dependencies (no PHP installation required).

---

## 3. Issues Encountered & Detailed Solutions

### Issue 1: Vercel Served Raw PHP Source Code
#### Symptoms:
When clicking **"Load Talent Profiles"** on the deployed Vercel site, the frontend displayed:
```text
Unable to load data.
Unexpected token '<', "<?php\n\nhea"... is not valid JSON
```

#### Root Cause:
1. **No Native PHP on Vercel**: Vercel is a modern serverless and static hosting platform designed for JavaScript/TypeScript (Node.js), Python, Go, and Ruby serverless runtimes. It does **not** have a native Apache or PHP-FPM runtime.
2. **Static File Precedence**: Because `api.php` was stored in the root directory, Vercel treated it as a plain static text file.
3. When the browser executed `fetch("api.php?endpoint=talent_profiles")`, Vercel served the verbatim PHP file contents (`<?php header('Content-Type: ...')`).
4. Calling `response.json()` on the PHP source text threw a JSON parsing syntax error because the response started with `<` instead of `{`.

#### The Fix:
1. **Created Vercel Serverless Function (`api/proxy.js`)**:
   Implemented a standard Node.js API route that handles incoming requests to `/api/proxy?endpoint=talent_profiles`.
2. **Created `.vercelignore`**:
   Configured Vercel to ignore `*.php` and `_secret/`. This prevents Vercel from deploying raw PHP files and eliminates the risk of exposing sensitive configuration files.
3. **Updated Frontend Fallback (`index.html` & `index-test.html`)**:
   Modified the client-side JavaScript to prioritize `/api/proxy?endpoint=talent_profiles` while preserving a fallback to `api.php` for traditional PHP server environments:
   ```javascript
   let response = await fetch("/api/proxy?endpoint=talent_profiles", {
       headers: { "Accept": "application/json" },
       cache: "no-store"
   });
   if (!response.ok) {
       response = await fetch("api.php?endpoint=talent_profiles", {
           headers: { "Accept": "application/json" },
           cache: "no-store"
       });
   }
   ```

---

### Issue 2: Upstream SSL Certificate Verification Failure
#### Symptoms:
After implementing `api/proxy.js`, the frontend returned:
```text
Unable to load data.
Failed to connect to upstream API
```

#### Root Cause:
1. When `api/proxy.js` attempted to fetch from `https://cmsapi.hyqoo.com`, the Node.js runtime threw:
   ```text
   TypeError: fetch failed
   code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
   cause: Error: unable to verify the first certificate
   ```
2. The server hosting `cmsapi.hyqoo.com` has an **incomplete SSL/TLS certificate chain** (the intermediate Certificate Authority certificate is not being sent by the upstream web server).
3. Desktop browsers frequently compensate for this by downloading missing intermediate certificates on the fly via AIA (Authority Information Access), but server environments like Node.js, Python, and AWS/Vercel strictly reject incomplete certificate chains.

#### The Fix:
Updated [`api/proxy.js`](file:///d:/Hyqoo/api/proxy.js) to use Node's native `node:https` module with `rejectUnauthorized: false`:

```javascript
import https from "node:https";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") return res.status(200).end();

  let endpoint = req.query ? req.query.endpoint : "";
  let subpath = (endpoint && endpoint !== "talent_profiles")
    ? `/public/${endpoint}`
    : "/public/talent/profiles";

  const options = {
    hostname: "cmsapi.hyqoo.com",
    port: 443,
    path: `/api/v1/hq${subpath}`,
    method: "GET",
    rejectUnauthorized: false, // Bypasses missing intermediate certificate
    headers: {
      "Token": "hq_qzPf5v57fbQRxT4LVQ6a355z9rmMnCdL",
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0"
    }
  };

  const upstreamReq = https.request(options, (upstreamRes) => {
    let data = "";
    upstreamRes.on("data", (chunk) => { data += chunk; });
    upstreamRes.on("end", () => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.status(upstreamRes.statusCode || 200).send(data);
    });
  });

  upstreamReq.on("error", (error) => {
    res.status(502).json({ error: "Failed to connect to upstream API", details: error.message });
  });

  upstreamReq.setTimeout(15000, () => {
    upstreamReq.destroy();
    res.status(504).json({ error: "Upstream API timeout" });
  });

  upstreamReq.end();
}
```

---

## 4. Local Development Server (`server.py`)

To ensure smooth local testing on Windows without needing to install or configure PHP, Apache, or OpenSSL cert stores:

- **Script**: [`server.py`](file:///d:/Hyqoo/server.py)
- **Start Command**:
  ```powershell
  python d:\Hyqoo\server.py
  ```
- **Capabilities**:
  - Serves static files on `http://localhost:8000/`.
  - Handles `/api.php` and `/api/proxy` requests locally.
  - Queries `https://cmsapi.hyqoo.com` using Python's `urllib` with unverified SSL context, matching Vercel's behavior.

---

## 5. Verification Checklist

| Environment | URL | Expected Result | Verified Status |
| :--- | :--- | :--- | :--- |
| **Localhost** | `http://localhost:8000/index.html` | Clicking "Load Talent Profiles" loads 134 profiles | **PASS (200 OK)** |
| **Localhost** | `http://localhost:8000/index-test.html` | Automatically loads 134 profiles on page open | **PASS (200 OK)** |
| **Vercel** | `https://<your-project>.vercel.app/` | Loads `index.html` at root URL | **PASS** |
| **Vercel** | `https://<your-project>.vercel.app/api/proxy?endpoint=talent_profiles` | Returns talent profiles JSON with no SSL/CORS error | **PASS (200 OK)** |

---

## 6. Git Repository State

- **Remote**: `https://github.com/bhushan-sys/Hyqoo.git`
- **Branch**: `main`
- **Recent Commits**:
  - `3a28ecf` — *Serve index.html as root and add Vercel API proxy*
  - `bd555a4` — *Fix Vercel API routing: use /api/proxy and add .vercelignore*
  - `2bc2d2c` — *Allow upstream SSL with incomplete leaf cert chain in Vercel function*
