GRAVITY AI CHATBOT - PDF KNOWLEDGE BASE DIRECTORY
================================================

How to use this directory for RAG (Retrieval-Augmented Generation):

1. Place any PDF document related to the website and services you provide directly into this folder (e.g. `services.pdf`, `company-profile.pdf`).
2. Open "js/chatbot.js" in your code editor.
3. Find the `CONFIG` object at the top of the file:
   ```javascript
   const CONFIG = {
     apiKey: "", 
     apiProxyUrl: "", 
     pdfDirectory: "assets/pdfs/",
     pdfFiles: ["your-file-name.pdf"] // <-- Add your PDF file name here
   };
   ```
4. Add the name of the PDF file to the `CONFIG.pdfFiles` array.
5. The chatbot will automatically fetch the PDF file from this folder on page load, parse and chunk the text client-side, and index it for AI questions.

Note: Since this runs client-side, make sure the PDF filenames exactly match the files in this folder (including case sensitivity).
