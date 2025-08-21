import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/summarize', async (req, res) => {
  const { journalText, moodScale } = req.body;

  if (!journalText) {
    return res.status(400).json({ error: 'Journal text is required.' });
  }
  if (!moodScale) {
    return res.status(400).json({ error: 'Mood scale is required.' });
  }

  const prompt = `Act as a helpful journal summarizer. The user has described their mood as ${moodScale} today. Read the following journal entry and provide a concise, factual summary. Focus on key events, people, emotions, and decisions mentioned in the text, reflecting the user's indicated mood. The summary should be easy to read and under 150 words.

Journal Entry:
${journalText}

Summary:`;

  const payload = {
    contents: [{
      role: "user",
      parts: [{ text: prompt }]
    }]
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  let retryCount = 0;
  const maxRetries = 5;

  const fetchData = async () => {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        const summaryText = result.candidates[0].content.parts[0].text;
        res.status(200).json({ summary: summaryText });
      } else {
        res.status(500).json({ error: 'Failed to get summary from API.' });
      }
    } catch (err) {
      if (retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000;
        console.warn(`API call failed. Retrying in ${delay / 1000}s...`);
        setTimeout(fetchData, delay);
      } else {
        console.error('An error occurred after multiple retries:', err.message);
        res.status(500).json({ error: 'An internal server error occurred after multiple retries.' });
      }
    }
  };

  fetchData();
});




app.post('/api/conversation', async (req, res) => {
  // Extract all the required data from the request body
  const {
    summaries,
    userPersonaText,
    chatbotPersonaId,
    questions,
    conversationHistory,
    currentTasks = [] // Array of current task objects with {id, text, completed}
  } = req.body;

  // Format current tasks for context
  const activeTasks = currentTasks.filter(task => !task.completed);
  const completedTasks = currentTasks.filter(task => task.completed);
  
  const tasksContext = `
    Current Active Tasks (${activeTasks.length}):
    ${activeTasks.length > 0 ? activeTasks.map(task => `- ${task.text}`).join('\n') : 'None'}
    
    Recently Completed Tasks (${completedTasks.slice(-3).length}):
    ${completedTasks.slice(-3).length > 0 ? completedTasks.slice(-3).map(task => `- ${task.text}`).join('\n') : 'None'}
  `;

  // Combine summaries and conversation history into a single, cohesive context.
  const context = `
    Journal entry summaries:
    ${summaries.join('\n')}

    User Persona: ${userPersonaText}
    Chatbot Persona ID: ${chatbotPersonaId}
    
    ${tasksContext}
    
    Conversation History:
    ${conversationHistory.map(entry => `${entry.role}: ${entry.text}`).join('\n')}
  `;

  // Define a comprehensive prompt for the Gemini API
  const prompt = `You are a helpful, human, and compassionate conversational assistant. You are an expert in heart-to-heart conversations and talk like a human. Your goal is to engage in a meaningful dialogue with the user based on their journal entries and help them with actionable tasks when relevant.

IMPORTANT TASK MANAGEMENT INSTRUCTIONS:
1. Based on the conversation and user's needs, you may suggest relevant tasks
2. Only suggest tasks that are directly related to the current conversation or user's expressed needs
3. Keep the active task list to a maximum of 5 tasks
4. If suggesting new tasks would exceed 5 total tasks, identify 1-2 tasks from the current list that seem less relevant or completed and mark them for removal
5. Suggest a maximum of 1-2 new tasks per conversation to avoid overwhelming the user
6. Tasks should be actionable, specific, and achievable
7. Avoid duplicating existing active tasks

Your response should be in the following JSON format:
{
  "response": "Your conversational response here",
  "taskUpdates": {
    "newTasks": [
      {
        "text": "Specific actionable task",
        "reason": "Brief explanation of why this task is relevant"
      }
    ],
    "removeTasks": [
      {
        "id": "task_id_to_remove",
        "reason": "Why this task should be removed (completed, no longer relevant, etc.)"
      }
    ]
  }
}

If no task updates are needed, set "newTasks" and "removeTasks" to empty arrays.

Context:
${context}

User's current question: ${questions[questions.length - 1]}

Respond as JSON:`;

  console.log('Enhanced prompt with task management:', prompt);

  const payload = {
    contents: [{
      role: "user",
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    }
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  let retryCount = 0;
  const maxRetries = 5;

  const fetchData = async () => {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        
        let conversationResponse = result.candidates[0].content.parts[0].text;
        
        // Clean up the response (remove code block markers if present)
        conversationResponse = conversationResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
        
        try {
          // Try to parse as JSON
          const parsedResponse = JSON.parse(conversationResponse);
          
          // Validate the response structure
          if (parsedResponse.response && parsedResponse.taskUpdates) {
            // Ensure arrays exist
            parsedResponse.taskUpdates.newTasks = parsedResponse.taskUpdates.newTasks || [];
            parsedResponse.taskUpdates.removeTasks = parsedResponse.taskUpdates.removeTasks || [];
            
            // Limit new tasks to maximum of 2
            if (parsedResponse.taskUpdates.newTasks.length > 2) {
              parsedResponse.taskUpdates.newTasks = parsedResponse.taskUpdates.newTasks.slice(0, 2);
            }
            
            // Validate that total active tasks won't exceed 5
            const currentActiveCount = activeTasks.length;
            const tasksToRemove = parsedResponse.taskUpdates.removeTasks.length;
            const tasksToAdd = parsedResponse.taskUpdates.newTasks.length;
            const projectedTotal = currentActiveCount - tasksToRemove + tasksToAdd;
            
            // If projected total exceeds 5, automatically remove oldest tasks
            if (projectedTotal > 5) {
              const excessTasks = projectedTotal - 5;
              const oldestTasks = activeTasks
                .filter(task => !parsedResponse.taskUpdates.removeTasks.some(rt => rt.id === task.id))
                .slice(0, excessTasks);
              
              oldestTasks.forEach(task => {
                parsedResponse.taskUpdates.removeTasks.push({
                  id: task.id,
                  reason: "Automatically removed to maintain task limit of 5"
                });
              });
            }
            
            console.log('Task updates:', parsedResponse.taskUpdates);
            res.status(200).json(parsedResponse);
          } else {
            throw new Error('Invalid response structure from AI');
          }
          
        } catch (parseError) {
          console.warn('Failed to parse AI response as JSON, treating as plain text:', parseError.message);
          
          // Fallback: return plain response without task updates
          res.status(200).json({ 
            response: conversationResponse,
            taskUpdates: {
              newTasks: [],
              removeTasks: []
            }
          });
        }
        
      } else {
        res.status(500).json({ error: 'Failed to get a conversation response from the API.' });
      }
      
    } catch (err) {
      if (retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000;
        console.warn(`API call failed. Retrying in ${delay / 1000}s...`);
        setTimeout(fetchData, delay);
      } else {
        console.error('An error occurred after multiple retries:', err.message);
        res.status(500).json({ 
          error: 'An internal server error occurred after multiple retries.',
          response: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
          taskUpdates: {
            newTasks: [],
            removeTasks: []
          }
        });
      }
    }
  };

  fetchData();
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});