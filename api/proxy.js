import https from "node:https";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  let endpoint = req.query ? req.query.endpoint : "";
  if (!endpoint && req.url) {
    try {
      const u = new URL(req.url, "http://localhost");
      endpoint = u.searchParams.get("endpoint") || "";
    } catch (_) {}
  }

  let subpath = "/public/talent/profiles";
  if (endpoint && endpoint !== "talent_profiles") {
    subpath = `/public/${endpoint}`;
  }

  const options = {
    hostname: "cmsapi.hyqoo.com",
    port: 443,
    path: `/api/v1/hq${subpath}`,
    method: "GET",
    rejectUnauthorized: false,
    headers: {
      "Token": "hq_qzPf5v57fbQRxT4LVQ6a355z9rmMnCdL",
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0"
    }
  };

  const upstreamReq = https.request(options, (upstreamRes) => {
    let data = "";
    upstreamRes.on("data", (chunk) => {
      data += chunk;
    });

    upstreamRes.on("end", () => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.status(upstreamRes.statusCode || 200).send(data);
    });
  });

  upstreamReq.on("error", (error) => {
    res.status(502).json({
      error: "Failed to connect to upstream API",
      details: error.message
    });
  });

  upstreamReq.setTimeout(15000, () => {
    upstreamReq.destroy();
    res.status(504).json({ error: "Upstream API timeout" });
  });

  upstreamReq.end();
}
