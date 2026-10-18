const MISSING_KEY_MESSAGE = "Paste GROQ_API_KEY into .env and restart the dev server.";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "POST only" } });
    return;
  }

  const key = (process.env.GROQ_API_KEY || "").trim();
  if (!key) {
    res.status(503).json({ error: { message: MISSING_KEY_MESSAGE } });
    return;
  }

  try {
    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: typeof req.body === "string" ? req.body : JSON.stringify(req.body),
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: { message: err.message || "Groq request failed" } });
  }
}
