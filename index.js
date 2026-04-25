import 'dotenv/config';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const schema = {
  description: "Summary and action item extraction",
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.STRING,
      description: "A concise 1-2 sentence summary of the text.",
    },
    action_items: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "A list of exactly 3 actionable steps.",
    },
  },
  required: ["summary", "action_items"],
};

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", 
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

/**
 * Enhanced analysis function with Exponential Backoff
 */
async function analyzeText(inputText, maxRetries = 3) {
  if (!inputText) return { error: "Input text is required" };

  const prompt = `Summarize this text and extract 3 action items: ${inputText}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      const isServiceUnavailable = error.message.includes("503") || error.message.includes("overloaded");
      
      if (isServiceUnavailable && attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s...
        const waitTime = Math.pow(2, attempt) * 1000; 
        console.warn(`[Attempt ${attempt}] Server busy. Retrying in ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // If we're out of retries or it's a different error (like 401/404)
      console.error("Gemini Error:", error.message);
      return { 
        error: "Service temporarily unavailable after retries.", 
        details: error.message 
      };
    }
  }
}

// Execution
const textInput = "I am creating a project called DART Blockchain integration. i need ot created documentation for the architecture of the software, do a meeting with the stakeholders to explain the whole architecture, plan out things for how to integrate it in autodesk maya. after all these things i have to go for a run in the eveneing and have dinner before 11 pm and wake up tomorrow at 6 am";

analyzeText(textInput).then(res => {
  console.log(JSON.stringify(res, null, 2));
});