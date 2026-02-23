export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const { base64, mediaType } = req.body;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20251001",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: "この離乳食の写真を解析してください。\nJSONのみ返してください（マークダウン・コードブロック不要）：\n{\"dishName\":\"料理名\",\"nutrition\":{\"protein\":整数0-100,\"iron\":整数0-100,\"carbs\":整数0-100,\"calcium\":整数0-100},\"advice\":\"アドバイス25字以内\",\"missingNutrients\":[\"栄養素1\",\"栄養素2\"]}",
            },
          ],
        }],
      }),
    });

    const data = await response.json();

    // APIエラーの場合は詳細を返す
    if (data.error) {
      return res.status(400).json({ error: data.error.message || JSON.stringify(data.error) });
    }

    const text = (data.content || [])
      .map(b => (b.type === "text" ? b.text : ""))
      .filter(Boolean)
      .join("\n");

    if (!text) {
      return res.status(500).json({ error: "AIから応答がありませんでした: " + JSON.stringify(data) });
    }

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
