import 'dotenv/config';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Define the schema so the AI knows exactly what JSON to build
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

// 2. Use 'gemini-3-flash-preview' or 'gemini-2.5-flash' (Stable)
// If you get a 404 on one, the other is likely the active version in your region.
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", 
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

async function analyzeText(inputText) {
  if (!inputText) return { error: "Input text is required" };

  const prompt = `Summarize this text and extract 3 action items: ${inputText}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // In JSON mode, response.text() returns a string of pure JSON.
    // No backticks (```json) to strip!
    return JSON.parse(response.text());
  } catch (error) {
    // Better error logging to see exactly why it fails (e.g., API Key, Model name)
    console.error("Gemini Error:", error.message);
    return { error: "Failed to process text. Check model name or API key." };
  }
}

// Execution
const textInput = "I am creating a project called DART Blockchain integration. i need ot created documentation for the architecture of the software, do a meeting with the stakeholders to explain the whole architecture, plan out things for how to integrate it in autodesk maya. after all these things i have to go for a run in the eveneing and have dinner before 11 pm and wake up tomorrow at 6 am";
const res = await analyzeText(textInput);

console.log(JSON.stringify(res, null, 2));