const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing GROQ_API_KEY" }) };

  try {
    const { prompt, image } = JSON.parse(event.body || "{}");
    if (!image) return { statusCode: 400, headers, body: JSON.stringify({ error: "Image is required" }) };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt || "Extract the readable text and useful information from this image. Answer clearly." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        max_tokens: 1200,
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    if (!response.ok) return { statusCode: response.status, headers, body: JSON.stringify(data) };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content: data?.choices?.[0]?.message?.content || "", raw: data }),
    };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || "Groq vision failed" }) };
  }
}
