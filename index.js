import 'dotenv/config';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Initialize the Gemini SDK with our private API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


/**
 * This JSON Schema ensures the AI always returns a "summary" string and an "action_items" array,
 * which prevents our frontend/database from crashing due to unexpected data.
 */
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

/**
  MODEL CONFIGURATION
 * I used 'gemini-3-flash-preview' for speed.
 * The 'generationConfig' forces the AI to speak only in JSON,
 * stripping away conversational filler like "Here is your result."
 */

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", 
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

/**
 * ANALYZER FUNCTION
 * I've added a 'maxRetries' parameter to 
 * make the function resilient to network blips or server overloads.
 */
async function analyzeText(inputText, maxRetries = 3) {

// Basic validation to avoid wasting API tokens on empty strings
  if (!inputText) return { error: "Input text is required" };

  const prompt = `Summarize this text and extract 3 action items: ${inputText}`;

// This loop implements 'Exponential Backoff'
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
    // Sending the request to Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      // Because we set the schema above, we can safely parse the response text as JSON
      return JSON.parse(response.text());
    } catch (error) {
        /**
       * ERROR HANDLING & RESILIENCE
       * If we hit a 503 (Server Busy) We wait, then try again. 
       * If it's a 401 (Wrong API Key), we stop.
       */
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
const textInput = "Meeting notes from the DART integration sync: First off, Priyanshu mentioned that the current Solana devnet is sluggish, so we might need to look into scaling options or local validators for testing the image provenance registry. Professor Lou wants a formal draft of the system architecture by Friday, but we are still waiting on the final API specs from the animation team at Stellar Creative Labs. They said they'll send them 'sometime mid-week.' Also, we definitely need to fix the memory leak in the C++ wrapper for the DART model before the demo. On a lighter note, someone suggested we order pizza for the long hackathon session this Saturday, and we should also remember to renew the project's IPFS storage subscription before it expires on the 30th. Let's try to meet again on Monday to see where we are with the Maya plugin.";

analyzeText(textInput).then(res => {
  console.log(JSON.stringify(res, null, 2));
});