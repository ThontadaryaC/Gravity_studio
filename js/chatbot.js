/**
 * Gravity AI Chatbot - Controller & Client-Side RAG Engine
 * 
 * Developer Instructions:
 * 1. Place your knowledge base PDF files directly in the "assets/pdfs/" directory.
 * 2. Add the filenames to the CONFIG.pdfFiles array below (e.g. ["services.pdf"]).
 * 3. Enter your Gemini API Key in CONFIG.apiKey for testing (or deploy a serverless proxy and set CONFIG.apiProxyUrl).
 * 4. Double-click the chatbot header to toggle Developer Mode to check the status of your loaded PDFs.
 */

// Developer Configurations
const CONFIG = {
  // Insert your Gemini API Key here for quick local testing.
  // IMPORTANT: Set this to "" when deploying to production to keep it secure!
  apiKey: "", 
  
  // Set proxy endpoint here if hosting a Netlify serverless function to hide the key.
  // Automatically defaults to Netlify serverless endpoint in production, and empty (direct API) on localhost.
  apiProxyUrl: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "" : "/.netlify/functions/chat", 
  
  // Directory where PDF files are stored (relative to index.html or remote bucket)
  pdfDirectory: "https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/",
  
  // List of PDF filenames placed in the assets/pdfs/ directory to index automatically.
  // Add your files here! Example: ["services.pdf", "company-profile.pdf"]
  pdfFiles: ["Ant_I_gravity.pdf",]
};

(function () {
  // Predefined Q&A for Sandbox / Demo Fallback Mode
  const SANDBOX_QA = [
    {
      keywords: ["hello", "hi", "hey", "help", "who are you", "start"],
      reply: "Hello! I am the Gravity AI Assistant. How can I help you today? You can ask me about our leadership, services, departments, or startup timeline!"
    },
    {
      keywords: ["founder", "ceo", "cto", "leadership", "executive", "ajay", "shashank", "thontadaraya", "munish"],
      reply: "Gravity Studios is led by a visionary executive team:\n\n1. **Ajay Raj B.K**: Founder & Creative Director (Vision, Strategy, Creative Direction, and Brand Development).\n2. **Shashank Raj B.K**: Co-Founder & CEO (Business Operations, Company Management, Partnerships, and Client Relations).\n3. **Thontadaraya**: CTO & Technology Head (Software Development, AI Systems, and Technical Architecture).\n4. **Munish**: Director of VFX & Animation (VFX/Animation Production Pipelines).\n\nHere is our organization structure:\n\n![Team Structure](https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/team_memebers_with_department.jpeg)"
    },
    {
      keywords: ["services", "departments", "what do you do", "creative", "tech"],
      reply: "Gravity Studios operates 18 diverse departments across three key pillars:\n\n* **Technology**: AI Research, Web/Mobile Development, Game Engine Integration, Cybersecurity.\n* **Creative**: VFX Production, 2D/3D Anime Studio, Music & Sound, Cinematography.\n* **Core/Ops**: Branding & Marketing, Financial planning, HR, Strategy.\n\nWe bridge advanced engineering with high-fidelity storytelling!\n\nHere is an overview of our main services:\n\n![Our Services](https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/our_services.jpeg)"
    },
    {
      keywords: ["logo", "design", "branding"],
      reply: "We create premium logo designs and high-end corporate vector branding assets:\n\n![Logo Designs](https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/Logo_designs.jpeg)"
    },
    {
      keywords: ["youtube", "thumbnail", "thumbnail creation"],
      reply: "We design click-through optimized YouTube thumbnail covers for content creators:\n\n![YouTube Thumbnails](https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/Youtube_thumbnail_creations.jpeg)"
    },
    {
      keywords: ["civil", "construction", "site"],
      reply: "We manage and execute civil engineering sites and construction designs:\n\n![Civil Construction](https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/Civil_construction_services.jpeg)"
    },
    {
      keywords: ["price", "pricing", "cost", "quotation"],
      reply: "We offer competitive pricing and flexible valuations for all tech and creative projects:\n\n![Price Quotations](https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/price_quations.jpeg)"
    },
    {
      keywords: ["revenue", "growth", "money", "funding", "startup"],
      reply: "Gravity Studios is a high-performance startup. Our active business model includes B2B Tech Solutions (Custom AI models, web/app development), Creative Content Production (VFX, anime sequences), and Gaming Assets (Direct monetization through game store sales)."
    },
    {
      keywords: ["timeline", "roadmap", "milestone", "history"],
      reply: "Our roadmap spans four core stages:\n\n* **Phase 1: Foundation**: Launching initial core services and setting up production pipes.\n* **Phase 2: Acceleration**: Growing the 18 departments and establishing client pipelines.\n* **Phase 3: Integration**: Pushing Custom AI tools into our animation and code workflows.\n* **Phase 4: Global Scale**: Expanding partnerships internationally."
    }
  ];

  // Default greeting shown to visitors
  const GREETING_TEXT = "Welcome to Gravity Studios! I'm your AI assistant. Ask me anything about our team, services, or departments.";

  // State object
  const state = {
    isOpen: false,
    isSettingsOpen: false,
    isDevMode: false,
    apiKey: CONFIG.apiKey || localStorage.getItem("gravity_chatbot_api_key") || "",
    chatHistory: [], // Clear history per session for visitors
    pdfChunks: [], // Extracted chunks from automatically loaded PDFs
    isTyping: false
  };

  // Safety retry for rendering Lucide icons (handles slow CDN loading)
  function ensureIconsRendered() {
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    } else {
      setTimeout(ensureIconsRendered, 250);
    }
  }

  // Safe wrapper for toggling the FAB icon (re-creates the element so Lucide can process it)
  function updateToggleIcon() {
    const button = document.getElementById("chatbot-toggle-fab");
    if (!button) return;
    
    // Remove any existing icon
    button.innerHTML = "";
    
    // Create fresh <i> tag
    const i = document.createElement("i");
    i.id = "chatbot-toggle-icon";
    if (state.isOpen) {
      i.setAttribute("data-lucide", "x");
      i.textContent = "✕"; // Fallback close icon
    } else {
      i.setAttribute("data-lucide", "message-square");
      i.textContent = "💬"; // Fallback chat bubble
    }
    
    button.appendChild(i);
    
    // Convert <i> to SVG
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    } else {
      setTimeout(updateToggleIcon, 100);
    }
  }

  // Scrape visible webpage content
  function scrapePageContent() {
    try {
      const sections = document.querySelectorAll("main section");
      let text = "Gravity Studios Webpage Details:\n\n";

      sections.forEach(sec => {
        const id = sec.id || "";
        const titleEl = sec.querySelector(".section-title") || sec.querySelector("h2");
        const title = titleEl ? titleEl.textContent.trim() : id.toUpperCase();
        text += `[Section: ${title}]\n`;

        // Get text elements
        const elements = sec.querySelectorAll("p, li, .exec-name, .exec-role, .dept-title, .dept-description, .timeline-title, .timeline-desc");
        let secText = "";
        elements.forEach(el => {
          const content = el.textContent.trim().replace(/\s+/g, ' ');
          if (content && !secText.includes(content)) {
            secText += `- ${content}\n`;
          }
        });
        text += secText + "\n";
      });

      return text;
    } catch (e) {
      console.error("Error scraping page content:", e);
      return "Webpage content could not be scraped.";
    }
  }

  // Load PDF.js dynamically
  function loadPdfJS() {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      script.onerror = () => reject(new Error("Failed to load PDF.js library."));
      document.head.appendChild(script);
    });
  }

  // Chunk text into overlapping segments
  function chunkText(text, size = 800, overlap = 150) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
      const end = start + size;
      const chunk = text.substring(start, Math.min(end, text.length));
      chunks.push({
        text: chunk,
        startChar: start,
        endChar: start + chunk.length
      });
      start += (size - overlap);
    }
    return chunks;
  }

  // Local similarity search on chunks
  function searchChunks(query, topK = 3) {
    if (state.pdfChunks.length === 0) return [];

    const queryWords = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) return state.pdfChunks.slice(0, topK);

    const scored = state.pdfChunks.map(chunk => {
      const chunkText = chunk.text.toLowerCase();
      let score = 0;
      queryWords.forEach(word => {
        const regex = new RegExp(word, 'g');
        const count = (chunkText.match(regex) || []).length;
        if (count > 0) {
          score += count * 2;
        }
      });
      return { chunk, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.chunk);
  }

  // Load and index PDF files configured in CONFIG
  async function loadAndIndexStaticPdfs() {
    if (!CONFIG.pdfFiles || CONFIG.pdfFiles.length === 0) {
      console.log("[Gravity AI] No static PDF files configured in js/chatbot.js.");
      updateLoadedFileList();
      return;
    }

    try {
      await loadPdfJS();
      console.log(`[Gravity AI] Loading and indexing ${CONFIG.pdfFiles.length} PDF files...`);

      for (const filename of CONFIG.pdfFiles) {
        const fileUrl = `${CONFIG.pdfDirectory}${filename}`;
        try {
          const response = await fetch(fileUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch file (HTTP ${response.status})`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(" ");
            fullText += pageText + "\n";
          }

          if (fullText.trim()) {
            const chunks = chunkText(fullText);
            chunks.forEach(c => {
              state.pdfChunks.push({
                pdfName: filename,
                text: c.text
              });
            });
            console.log(`[Gravity AI] Successfully indexed: ${filename} (${chunks.length} chunks generated)`);
          }
        } catch (fileError) {
          console.error(`[Gravity AI] Error indexing PDF "${filename}":`, fileError);
        }
      }
      
      updateLoadedFileList();
    } catch (err) {
      console.error("[Gravity AI] Error initializing PDF RAG indexer:", err);
      updateLoadedFileList();
    }
  }

  // Generate chatbot HTML elements dynamically
  function injectChatbot() {
    const container = document.createElement("div");
    container.className = "gravity-chatbot-container";
    container.id = "gravity-chatbot";

    // Check URL parameters for developer mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("dev")) {
      state.isDevMode = true;
      container.classList.add("dev-mode");
    }

    const statusClass = state.apiKey || CONFIG.apiProxyUrl ? "" : "sandbox";
    const statusText = state.apiKey || CONFIG.apiProxyUrl ? "Online" : "Sandbox";

    container.innerHTML = `
      <!-- Chat Window -->
      <div class="gravity-chatbot-window" id="chatbot-window">
        <!-- Header -->
        <div class="gravity-chatbot-header" id="chatbot-header">
          <div class="gravity-chatbot-header-info">
            <div class="gravity-chatbot-logo">Gravity AI</div>
            <div class="gravity-chatbot-status dev-only ${statusClass}" id="chatbot-status-indicator">
              <span class="gravity-chatbot-status-dot"></span>
              <span id="chatbot-status-text">${statusText}</span>
            </div>
          </div>
          <div class="gravity-chatbot-header-actions">
            <button class="gravity-chatbot-header-btn" id="chatbot-btn-close" title="Close" aria-label="Close chatbot">
              <i data-lucide="x">✕</i>
            </button>
          </div>
        </div>

        <!-- Chat Body -->
        <div class="gravity-chatbot-body" id="chatbot-msg-container">
          <!-- Greeting -->
          <div class="gravity-chatbot-welcome">
            <div class="gravity-chatbot-welcome-title">GRAVITATIONAL CORE ACTIVE</div>
            <p class="gravity-chatbot-welcome-text">${GREETING_TEXT}</p>
          </div>
          <!-- Chat messages go here -->
        </div>

        <!-- Quick Chips -->
        <div class="gravity-chatbot-chips">
          <button class="gravity-chatbot-chip" data-query="What services do you offer?">Services</button>
          <button class="gravity-chatbot-chip" data-query="Who is in the executive leadership?">Leadership</button>
          <button class="gravity-chatbot-chip" data-query="What is the roadmap timeline?">Roadmap</button>
        </div>

        <!-- Footer -->
        <div class="gravity-chatbot-footer">
          <input type="text" id="chatbot-input-field" class="gravity-chatbot-input" placeholder="Ask a question..." aria-label="Question text">
          <button id="chatbot-btn-send" class="gravity-chatbot-send-btn" aria-label="Send">
            <i data-lucide="send">➔</i>
          </button>
        </div>
      </div>

      <!-- Toggle Button (FAB) -->
      <button class="gravity-chatbot-toggle" id="chatbot-toggle-fab" aria-label="Toggle assistant">
        <i data-lucide="message-square" id="chatbot-toggle-icon">💬</i>
      </button>
    `;

    document.body.appendChild(container);

    // Initial lucide icon render
    ensureIconsRendered();

    setupEventListeners();
    renderChatHistory();
    loadAndIndexStaticPdfs();
  }

  // Setup UI event listeners
  function setupEventListeners() {
    const fab = document.getElementById("chatbot-toggle-fab");
    const closeBtn = document.getElementById("chatbot-btn-close");
    const sendBtn = document.getElementById("chatbot-btn-send");
    const inputField = document.getElementById("chatbot-input-field");
    const chatWindow = document.getElementById("chatbot-window");
    const header = document.getElementById("chatbot-header");

    // Double click header to toggle developer mode
    header.addEventListener("dblclick", () => {
      const container = document.getElementById("gravity-chatbot");
      state.isDevMode = !state.isDevMode;
      if (state.isDevMode) {
        container.classList.add("dev-mode");
        addMessage("bot", "⚙️ **Developer Mode Enabled**. Status indicators and PDF loader status are now visible. (Double-click header again to lock).");
      } else {
        container.classList.remove("dev-mode");
        addMessage("bot", "Locked. Developer controls hidden.");
      }
    });

    // Toggle Chat Panel
    fab.addEventListener("click", () => {
      state.isOpen = !state.isOpen;
      chatWindow.classList.toggle("open", state.isOpen);
      fab.classList.toggle("open", state.isOpen);
      updateToggleIcon();
    });

    // Close Button
    closeBtn.addEventListener("click", () => {
      state.isOpen = false;
      chatWindow.classList.remove("open");
      fab.classList.remove("open");
      updateToggleIcon();
    });

    // Send on Enter
    inputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleUserMessageSend();
      }
    });

    // Send Button click
    sendBtn.addEventListener("click", handleUserMessageSend);

    // Quick Chips click
    document.querySelectorAll(".gravity-chatbot-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const query = chip.getAttribute("data-query");
        if (query) {
          inputField.value = query;
          handleUserMessageSend();
        }
      });
    });
  }

  // Update PDF list inside settings panel (dev-mode only status representation)
  function updateLoadedFileList() {
    const list = document.getElementById("chatbot-file-list");
    if (!list) return;

    list.innerHTML = "";
    
    // Group chunks to count how many files are active
    const fileMap = {};
    state.pdfChunks.forEach(chunk => {
      fileMap[chunk.pdfName] = (fileMap[chunk.pdfName] || 0) + 1;
    });

    const activeFiles = Object.keys(fileMap);

    if (activeFiles.length === 0) {
      list.innerHTML = `
        <div style="font-size:0.75rem;color:var(--text-muted);text-align:center;padding:10px;border: 1px dashed var(--glass-border);">
          No PDF files loaded.<br>
          <span style="font-size:0.68rem;">Drop PDF files into <code>assets/pdfs/</code> and add their names in <code>js/chatbot.js</code>.</span>
        </div>`;
      return;
    }

    activeFiles.forEach(filename => {
      const el = document.createElement("div");
      el.className = "gravity-chatbot-file-item";
      el.innerHTML = `
        <span class="gravity-chatbot-file-item-name" style="max-width: 100%;" title="${filename}">
          🟢 ${filename} (${fileMap[filename]} chunks)
        </span>
      `;
      list.appendChild(el);
    });

    ensureIconsRendered();
  }

  // Get sandbox/RAG response locally
  function getLocalSandboxResponse(text) {
    const cleanedText = text.toLowerCase();
    let matchedReply = "";

    // Check predefined Q&A
    for (const qa of SANDBOX_QA) {
      if (qa.keywords.some(keyword => cleanedText.includes(keyword))) {
        matchedReply = qa.reply;
        break;
      }
    }

    // Search local PDF index if not answered by Q&A
    if (!matchedReply && state.pdfChunks.length > 0) {
      const matchedChunks = searchChunks(text, 2);
      if (matchedChunks.length > 0) {
        matchedReply = `Found relevant information in **${matchedChunks[0].pdfName}**:\n\n"${matchedChunks[0].text.trim()}..."`;
      }
    }

    if (!matchedReply) {
      matchedReply = "I'm sorry, I don't have a direct answer for that. Feel free to ask about our services, departments, executive team, or business growth!";
    }

    return matchedReply;
  }

  // Send message processing
  async function handleUserMessageSend() {
    const inputField = document.getElementById("chatbot-input-field");
    const text = inputField.value.trim();
    if (!text || state.isTyping) return;

    inputField.value = "";
    addMessage("user", text);

    showTypingIndicator();

    try {
      const activeKey = state.apiKey;
      const proxyUrl = CONFIG.apiProxyUrl;

      if (activeKey || proxyUrl) {
        // Live Gemini API / Proxy mode
        const pageContext = scrapePageContent();
        const relevantPdfChunks = searchChunks(text);
        
        let pdfContext = "";
        if (relevantPdfChunks.length > 0) {
          pdfContext = "\nRelevant context extracted from configured PDF documents:\n";
          relevantPdfChunks.forEach(chunk => {
            pdfContext += `[From PDF: ${chunk.pdfName}]: ${chunk.text}\n---\n`;
          });
        }

        const systemPrompt = `You are a helpful, professional, and friendly AI chatbot integrated into Gravity Studios' landing page website.
Gravity Studios is a high-tech startup ecosystem merging software engineering, artificial intelligence research, VFX production, and next-generation animation.

Your task is to answer user queries using the strict hierarchy of sources below:

PRIMARY SOURCE (Webpage details & campaign ads):
- Use the scraped webpage content below as your main source of information to answer questions.
- If the user asks about any service, campaign, design, or team structure represented in our "Media Arena" or gallery posters, you MUST recommend the corresponding poster and display its image inline using markdown syntax: \`![Alt Text](image_path)\`.
- Here are the available posters and their paths:
  1. Civil Construction Services: \`![Civil Construction](https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/Civil_construction_services.jpeg)\`
  2. Logo Designs: \`![Logo Designs](https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/Logo_designs.jpeg)\`
  3. YouTube Thumbnail Creations: \`![YouTube Thumbnails](https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/Youtube_thumbnail_creations.jpeg)\`
  4. Our Services: \`![Our Services](https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/our_services.jpeg)\`
  5. Price Quotations: \`![Price Quotations](https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/price_quations.jpeg)\`
  6. Team & Department Structure: \`![Team & Department Structure](https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/team_memebers_with_department.jpeg)\`

SECONDARY SOURCE (PDF Documents - Fallback only):
- Only use the PDF document context below if the user's question CANNOT be answered by the webpage content and campaign ad details listed above.
- If you find the answer in the webpage text, ignore the PDF chunks.

GENERAL INSTRUCTIONS:
1. Always be polite, concise, and helpful.
2. Keep your answer brief (under 150 words) unless requested.
3. You can format responses using markdown bolding, lists, and spacing.

[Webpage Content]
${pageContext}

[PDF Document Context (Secondary Fallback)]
${pdfContext}`;

        const reply = await callGeminiOrProxy(activeKey, proxyUrl, systemPrompt, state.chatHistory, text);
        hideTypingIndicator();
        addMessage("bot", reply);
      } else {
        // Sandbox fallback mode (local QA rules)
        await new Promise(r => setTimeout(r, 800)); // Simulate thinking
        hideTypingIndicator();

        let matchedReply = getLocalSandboxResponse(text);
        if (state.isDevMode && matchedReply.startsWith("I'm sorry")) {
          matchedReply = "I couldn't find a direct match in Sandbox mode.\n\nTo unlock live answers and full reasoning capabilities, please double-click the chat header, open settings, and paste a Gemini API Key.";
        }

        addMessage("bot", matchedReply);
      }
    } catch (err) {
      console.error("Live AI Call failed, falling back to local database:", err);
      hideTypingIndicator();

      // Automatic Graceful Fallback to Sandbox/RAG
      const localReply = getLocalSandboxResponse(text);

      let warningPrefix = "";
      if (state.isDevMode) {
        warningPrefix = `⚠️ **[Dev Warning: Live AI Failed]** *(Using Local Fallback)*\nError: ${err.message || "Unknown error"}\n\n`;
      } else if (window.location.protocol === "file:") {
        warningPrefix = `⚠️ **[CORS Fallback]** *(Browsers block localhost/local file API requests)*\n\n`;
      }

      addMessage("bot", warningPrefix + localReply);
    }
  }

  // Call Google Gemini API or Proxy Endpoint
  async function callGeminiOrProxy(apiKey, proxyUrl, systemPrompt, chatHistory, userMessage) {
    const url = proxyUrl ? proxyUrl : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    // Format message history for Gemini (alternate user/model roles)
    const contents = [];
    const recent = chatHistory.slice(-8); // Limit history depth
    
    recent.forEach(msg => {
      contents.push({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      });
    });

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const body = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 600
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }

  // Append a message bubble to the chat container
  function addMessage(sender, text) {
    const msg = {
      sender,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    state.chatHistory.push(msg);
    renderMessageBubble(msg);
  }

  // Render bubble in UI
  function renderMessageBubble(msg) {
    const container = document.getElementById("chatbot-msg-container");
    if (!container) return;

    const msgEl = document.createElement("div");
    msgEl.className = `gravity-chatbot-msg ${msg.sender}`;
    
    // Parse simple markdown-like syntax for bolding (**), italics (*), code (`), images, and links
    let formattedText = msg.text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Images: ![alt](src)
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:8px; margin-top:8px; display:block; border:1px solid var(--glass-border);">')
      // Links: [text](href) (excluding leading !)
      .replace(/(?<!\!)\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color: var(--neon-cyan); text-decoration: underline;">$1</a>');

    msgEl.innerHTML = `
      <div class="gravity-chatbot-msg-bubble">${formattedText}</div>
      <div class="gravity-chatbot-msg-time">${msg.time}</div>
    `;

    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
  }

  // Show/Hide typing indicators
  function showTypingIndicator() {
    state.isTyping = true;
    const container = document.getElementById("chatbot-msg-container");
    if (!container) return;

    const typingEl = document.createElement("div");
    typingEl.className = "gravity-chatbot-typing";
    typingEl.id = "chatbot-typing-indicator";
    typingEl.innerHTML = `
      <span class="gravity-chatbot-typing-dot"></span>
      <span class="gravity-chatbot-typing-dot"></span>
      <span class="gravity-chatbot-typing-dot"></span>
    `;

    container.appendChild(typingEl);
    container.scrollTop = container.scrollHeight;
  }

  function hideTypingIndicator() {
    state.isTyping = false;
    const indicator = document.getElementById("chatbot-typing-indicator");
    if (indicator) {
      indicator.remove();
    }
  }

  // Render entire stored history
  function renderChatHistory() {
    const container = document.getElementById("chatbot-msg-container");
    if (!container) return;

    state.chatHistory.forEach(msg => {
      renderMessageBubble(msg);
    });
  }

  // Run on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectChatbot);
  } else {
    injectChatbot();
  }
})();
