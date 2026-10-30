export default async function handler(req, res) {
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

  const baseUrl = "https://cmsapi.hyqoo.com/api/v1/hq";
  const token = "hq_qzPf5v57fbQRxT4LVQ6a355z9rmMnCdL";

  let path = "/public/talent/profiles";
  if (endpoint && endpoint !== "talent_profiles") {
    path = `/public/${endpoint}`;
  }

  try {
    const upstream = await fetch(`${baseUrl}${path}`, {
      headers: {
        "Token": token,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
      }
    });

    const data = await upstream.json();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(upstream.status).json(data);
  } catch (error) {
    res.status(502).json({ error: "Failed to connect to upstream API", details: error.message });
  }
}
