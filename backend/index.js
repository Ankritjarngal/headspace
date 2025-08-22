import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const companionPromptsMap = {
  aura: "You are Aura, a calm and gentle companion. Your purpose is to provide serene, encouraging, and soothing support. Respond with a soft, comforting tone. Focus on bringing peace and clarity to the user's thoughts and feelings.",
  zenith: "You are Zenith, a mindful guide. Your purpose is to help the user stay present and grounded. Respond by encouraging awareness of thoughts and feelings without judgment. Use language that promotes focus on the here and now.",
  summit: "You are Summit, a proactive motivator. Your purpose is to help the user achieve their goals and take action. Respond with an energetic and encouraging tone. Break down problems into actionable steps and inspire progress.",
  luna: "You are Luna, an empathetic companion. Your purpose is to provide emotional support and understanding. Respond with a warm, compassionate tone. Validate the user's feelings and help them feel heard and connected.",
  sage: "You are Sage, a wise and introspective guide. Your purpose is to encourage deep thought and personal insight. Respond with a thoughtful and philosophical tone. Ask insightful questions to help the user explore the deeper meaning of their experiences."
};

app.get("/health", (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/api/summarize', async (req, res) => {
  const { journalText, moodScale } = req.body;

  if (!journalText) return res.status(400).json({ error: 'Journal text is required.' });
  if (!moodScale) return res.status(400).json({ error: 'Mood scale is required.' });

  const prompt = `Act as a helpful journal summarizer. The user has described their mood as ${moodScale} today. Read the following journal entry and provide a concise, factual summary under 150 words.

Journal Entry:
${journalText}

Summary:`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "text/plain" }
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API call failed: ${response.status}`);
    const result = await response.json();

    const summaryText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No summary generated.";
    res.status(200).json({ summary: summaryText });
  } catch (err) {
    console.error("Summarize error:", err.message);
    res.status(500).json({ summary: "I couldn't generate a summary right now. Please try again later." });
  }
});

app.post('/api/conversation', async (req, res) => {
  const {
    summaries = [],
    userPersonaText = "",
    chatbotPersonaId = "aura",
    questions = [],
    conversationHistory = [],
    currentTasks = [],
  } = req.body;

  const activeTasks = currentTasks.filter(t => !t.completed);
  const completedTasks = currentTasks.filter(t => t.completed);

  const tasksContext = `
Current Active Tasks (${activeTasks.length}):
${activeTasks.length ? activeTasks.map(t => `- ${t.text}`).join('\n') : "None"}

Recently Completed Tasks (${completedTasks.slice(-3).length}):
${completedTasks.slice(-3).map(t => `- ${t.text}`).join('\n') || "None"}
`;

  const context = `
${companionPromptsMap[chatbotPersonaId]}

Journal entry summaries:
${summaries.join('\n')}

User Persona: ${userPersonaText}

${tasksContext}

Conversation History:
${conversationHistory.map(e => `${e.role}: ${e.text}`).join('\n')}
`;

  // Improved prompt for natural conversation and intelligent task management
  const prompt = `You are a helpful conversational assistant. Respond like a real human friend would - keep it SHORT (1-2 sentences max), natural, and conversational. Don't be verbose or overly enthusiastic.

TASK MANAGEMENT - Be smart and contextual:
- Add tasks ONLY when the conversation naturally suggests the user needs help with something specific
- Remove tasks when user completes them or they're no longer relevant
- Don't force tasks - only suggest when genuinely helpful based on what user is saying
- Max 2 new tasks per response, max 5 total active tasks

RESPONSE STYLE:
- Short and natural (like texting a friend)
- Don't over-explain or be wordy
- Be supportive but not overly cheerful
- Match the user's tone and energy level

RESPONSE FORMAT (valid JSON only):
{
  "response": "Short, natural response (1-2 sentences max)",
  "taskUpdates": {
    "newTasks": [{"text": "specific actionable task", "reason": "why it's helpful now"}],
    "removeTasks": [{"id": "task_id", "reason": "why removing"}]
  }
}

Context:
${context}

User: ${questions[questions.length - 1]}

JSON response:`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.8,
      maxOutputTokens: 8192, // Much higher limit - can go up to 65,536 if needed
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH", 
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE"
      }
    ]
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  let retryCount = 0;
  const maxRetries = 3;

  const fetchData = async () => {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API call failed: ${response.status} - ${errorText}`);
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Full API Response:", JSON.stringify(result, null, 2));

      let conversationResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Check if we got an empty response or hit token limits
      if (!conversationResponse || conversationResponse.trim() === "" || result?.candidates?.[0]?.finishReason === "MAX_TOKENS") {
        console.warn("Empty response or token limit hit. Full result:", result);
        
        // If hit token limit, provide a simple fallback
        if (result?.candidates?.[0]?.finishReason === "MAX_TOKENS") {
          console.warn("Token limit exceeded - using fallback response");
          const fallbackResponse = {
            response: "I'm here with you! How can I help?",
            taskUpdates: { newTasks: [], removeTasks: [] }
          };
          return res.status(200).json(fallbackResponse);
        }
        
        throw new Error("Empty response from API");
      }
      
      // Log the raw response for debugging
      console.log("Raw AI Response:", conversationResponse);
      
      // Clean the response - remove potential markdown code blocks or extra whitespace
      conversationResponse = conversationResponse.trim();
      if (conversationResponse.startsWith('```json')) {
        conversationResponse = conversationResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (conversationResponse.startsWith('```')) {
        conversationResponse = conversationResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log("Cleaned Response:", conversationResponse);

      // Parse safely with better error handling
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(conversationResponse);
        console.log("Successfully parsed JSON:", parsedResponse);
      } catch (parseError) {
        console.warn("JSON Parse Error:", parseError.message);
        console.warn("Failed to parse:", conversationResponse);
        console.warn("Response length:", conversationResponse.length);
        
        // If completely empty response, throw error to trigger retry
        if (!conversationResponse || conversationResponse.trim() === "") {
          throw new Error("Empty response from AI");
        }
        
        // Try to extract just the response text if JSON parsing fails
        let responseText = "I'm here with you.";
        
        // Simple regex to try to extract response content
        const responseMatch = conversationResponse.match(/"response"\s*:\s*"([^"]+)"/);
        if (responseMatch) {
          responseText = responseMatch[1];
        }
        
        parsedResponse = {
          response: responseText,
          taskUpdates: { newTasks: [], removeTasks: [] }
        };
      }

      // Always ensure correct structure
      parsedResponse.taskUpdates = parsedResponse.taskUpdates || {};
      parsedResponse.taskUpdates.newTasks = parsedResponse.taskUpdates.newTasks || [];
      parsedResponse.taskUpdates.removeTasks = parsedResponse.taskUpdates.removeTasks || [];

      // Enforce max 2 new tasks
      if (parsedResponse.taskUpdates.newTasks.length > 2) {
        parsedResponse.taskUpdates.newTasks = parsedResponse.taskUpdates.newTasks.slice(0, 2);
      }

      // Enforce max 5 total tasks
      const projectedTotal = activeTasks.length - parsedResponse.taskUpdates.removeTasks.length + parsedResponse.taskUpdates.newTasks.length;
      if (projectedTotal > 5) {
        const excess = projectedTotal - 5;
        const oldest = activeTasks.slice(0, excess);
        oldest.forEach(task => {
          parsedResponse.taskUpdates.removeTasks.push({
            id: task.id,
            reason: "Removed automatically to maintain task limit"
          });
        });
      }

      res.status(200).json(parsedResponse);
    } catch (err) {
      console.error("Full error details:", err);
      if (retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000;
        console.warn(`Retry ${retryCount}/${maxRetries} in ${delay / 1000}s... (${err.message})`);
        setTimeout(fetchData, delay);
        return;
      }
      console.error("Max retries reached. Conversation error:", err.message);
      res.status(500).json({
        response: "I'm having trouble connecting right now. Please try again in a moment.",
        taskUpdates: { newTasks: [], removeTasks: [] }
      });
    }
  };

  fetchData();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});