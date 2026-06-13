const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function dataUrlToBytes(dataUrl) {
  const [meta = "", payload = ""] = String(dataUrl).split(",");
  const mimeType = meta.match(/data:(.*?);base64/)?.[1] || "audio/webm";
  return {
    mimeType,
    bytes: Buffer.from(payload, "base64"),
  };
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing GROQ_API_KEY" }) };

  try {
    const { audio, language } = JSON.parse(event.body || "{}");
    if (!audio) return { statusCode: 400, headers, body: JSON.stringify({ error: "Audio is required" }) };

    const { mimeType, bytes } = dataUrlToBytes(audio);
    const formData = new FormData();
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "json");
    formData.append("temperature", "0");
    if (language) formData.append("language", language);
    formData.append("file", new Blob([bytes], { type: mimeType }), "lingual-voice.webm");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) return { statusCode: response.status, headers, body: JSON.stringify(data) };

    return { statusCode: 200, headers, body: JSON.stringify({ text: data.text || "", raw: data }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || "Groq audio failed" }) };
  }
}
