// Vercel Serverless Function for Gravity AI Chatbot Proxy
// Supports Multi-Provider LLMs (Render FreeLLMAPI, LiteLLM, OneAPI) and Google Gemini with unified API keys.

const { setCorsHeaders, validateCSRF, checkRateLimit } = require("./security-utils");

module.exports = async (req, res) => {
  if (setCorsHeaders(req, res, { methods: "POST, OPTIONS" })) return;

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  if (!validateCSRF(req)) {
    return res.status(403).json({ error: { message: "Access Denied: CSRF verification failed." } });
  }

  try {
    // Rate limiting: 30 chatbot messages per minute per IP
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "global";
    const rateLimitOk = await checkRateLimit(`chat:${ip}`, 30, 60);
    if (!rateLimitOk) {
      return res.status(429).json({ error: { message: "Too many requests. Please wait a moment before trying again." } });
    }

    // 1. Detect multi-provider Render FreeLLMAPI or Gemini configurations
    let rawBaseUrl = (
      process.env.FREELLM_API_URL ||
      process.env.LLM_API_BASE_URL ||
      process.env.RENDER_LLM_URL ||
      process.env.OPENAI_BASE_URL ||
      ""
    ).trim();

    const apiKey = (
      process.env.FREELLM_API_KEY ||
      process.env.LLM_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.RENDER_LLM_API_KEY ||
      process.env.RENDER_API_KEY ||
      process.env.GEMINI_API_KEY ||
      ""
    ).trim();

    if (!apiKey) {
      return res.status(500).json({
        error: {
          message: "LLM API Key is not configured on the server. Please add FREELLM_API_KEY (or GEMINI_API_KEY) in your Vercel/Render environment settings."
        }
      });
    }

    // Parse the incoming body from the client
    const clientBody = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    // 2. Build standard OpenAI-compatible messages array from any input structure
    let messages = [];

    if (Array.isArray(clientBody.messages) && clientBody.messages.length > 0) {
      messages = clientBody.messages;
    } else if (Array.isArray(clientBody.contents)) {
      // Convert Gemini format to OpenAI messages
      if (clientBody.systemInstruction?.parts?.[0]?.text) {
        messages.push({
          role: "system",
          content: clientBody.systemInstruction.parts[0].text
        });
      }
      clientBody.contents.forEach(c => {
        const role = c.role === "model" ? "assistant" : "user";
        const content = (c.parts || []).map(p => p.text || "").join("\n");
        if (content) {
          messages.push({ role, content });
        }
      });
    } else if (clientBody.userMessage || clientBody.prompt) {
      if (clientBody.systemPrompt) {
        messages.push({ role: "system", content: clientBody.systemPrompt });
      }
      messages.push({
        role: "user",
        content: clientBody.userMessage || clientBody.prompt
      });
    }

    if (messages.length === 0) {
      return res.status(400).json({ error: { message: "No prompt or messages provided in request." } });
    }

    // 3. Determine if using Multi-Provider Render endpoint or direct Gemini
    const isMultiProvider = !!rawBaseUrl || !process.env.GEMINI_API_KEY;

    if (isMultiProvider && rawBaseUrl) {
      // Normalize Render endpoint URL:
      // Accepts https://xxx.onrender.com OR https://xxx.onrender.com/v1 OR https://xxx.onrender.com/v1/chat/completions
      let normalizedUrl = rawBaseUrl.replace(/\/+$/, "");
      if (!normalizedUrl.endsWith("/chat/completions")) {
        if (normalizedUrl.endsWith("/v1")) {
          normalizedUrl = `${normalizedUrl}/chat/completions`;
        } else {
          normalizedUrl = `${normalizedUrl}/v1/chat/completions`;
        }
      }

      // Candidate models for multi-provider API
      const configuredModel = clientBody.model || process.env.FREELLM_MODEL || process.env.LLM_MODEL || process.env.MODEL_NAME;
      const modelCandidates = [
        configuredModel,
        "gpt-4o-mini",
        "gemini-2.0-flash",
        "claude-3-5-haiku",
        "deepseek-chat",
        "llama-3.1-70b",
        "auto"
      ].filter(Boolean);

      // Deduplicate model candidates
      const uniqueModels = [...new Set(modelCandidates)];

      let lastError = null;
      let successfulResponse = null;
      let usedModel = uniqueModels[0] || "gpt-4o-mini";

      // Attempt calling the multi-provider endpoint
      for (const model of uniqueModels) {
        try {
          const payload = {
            model: model,
            messages: messages,
            temperature: clientBody.temperature ?? 0.7,
            max_tokens: clientBody.max_tokens ?? 700
          };

          const response = await fetch(normalizedUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            successfulResponse = data;
            usedModel = model;
            break;
          } else {
            const errData = await response.json().catch(() => ({}));
            lastError = new Error(errData.error?.message || `HTTP ${response.status} from FreeLLMAPI`);
            // If the error was not a model not found / provider error, stop trying other models
            if (response.status === 401 || response.status === 403) {
              break;
            }
          }
        } catch (fetchErr) {
          lastError = fetchErr;
        }
      }

      if (successfulResponse) {
        // Extract reply text from standard OpenAI structure
        let replyText = "";
        if (successfulResponse.choices?.[0]?.message?.content) {
          replyText = successfulResponse.choices[0].message.content;
        } else if (successfulResponse.reply) {
          replyText = successfulResponse.reply;
        } else if (typeof successfulResponse === "string") {
          replyText = successfulResponse;
        }

        // Return unified response compatible with both OpenAI and Gemini clients
        return res.status(200).json({
          reply: replyText,
          model: usedModel,
          choices: [
            {
              message: {
                role: "assistant",
                content: replyText
              }
            }
          ],
          candidates: [
            {
              content: {
                parts: [{ text: replyText }]
              }
            }
          ]
        });
      }

      throw lastError || new Error("Failed to receive response from multi-provider LLM endpoint.");
    }

    // 4. Fallback to Google Gemini if direct Gemini API Key is provided
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // Convert OpenAI messages to Gemini contents format
    const contents = [];
    let systemText = "";

    messages.forEach(m => {
      if (m.role === "system") {
        systemText = m.content;
      } else {
        contents.push({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        });
      }
    });

    const geminiBody = {
      contents: contents,
      ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 700
      }
    };

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody)
    });

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      throw new Error(geminiData.error?.message || `Gemini API HTTP ${geminiRes.status}`);
    }

    const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return res.status(200).json({
      reply: replyText,
      model: "gemini-2.0-flash",
      choices: [
        {
          message: {
            role: "assistant",
            content: replyText
          }
        }
      ],
      candidates: geminiData.candidates || [
        {
          content: {
            parts: [{ text: replyText }]
          }
        }
      ]
    });
  } catch (error) {
    console.error("Chatbot Proxy Handler Error:", error);
    return res.status(500).json({ error: { message: error.message || "Internal Server Error" } });
  }
};
