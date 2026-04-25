# AI Text Analyzer

*The project setup instructions are at the bottom of the document

## What I Built
A Node.js utility that uses the Gemini 3 Flash model to summarize the input text and transform unstructured text into structured, actionable data by extracting 3 key action items in a strictly validated JSON format.

* **Structured Output:** Enforces a JSON schema for consistent data delivery.
* **Intelligent Summarization:** Condenses complex technical discussions or any other dense prompts into concise summaries.
* **Prioritization Engine:** Identifies exactly 3 critical action items, ignoring non-essential context.


## Development Journey & Prompts

1. Engineering & Architectural Prompts
This project was built using an iterative "AI-Collaborative" workflow. I guided the AI through specific architectural challenges:

**Prompt:** *"The previous code used regex to strip backticks. How can I use native JSON mode and a Response Schema to make this more reliable for a production environment?"*
* **Result:** Moved away from fragile string manipulation and implemented `SchemaType` for 100% predictable JSON outputs.

**Prompt:** *"I'm getting 503 Service Unavailable errors because the model is busy. Help me write a retry loop with exponential backoff so the app doesn't crash."*
* **Result:** Added a robust `for` loop with `setTimeout` that scales wait time (2s, 4s, 8s), ensuring the app stays up during traffic spikes.

**Prompt:** *"I am moving from OpenAI to Gemini. Help me clean up my package.json, remove unused dependencies and set up a .gitignore to keep my API keys safe."*
* **Result:** Professionalized the repository structure for GitHub submission.


2. The System Prompt (Logic Layer)
This is the specific instruction used within the code to guide the model's analysis of the input text. The prompt was designed for **Zero-Shot JSON enforcement**:
> `Analyze the following text: ${inputText}. Summarize this text and extract 3 action items. Return the result in this JSON format: {"summary": "...", "action_items": ["item1", "item2", "item3"]}`

I also used the SDK's `responseSchema` property to define field descriptions, which helped the model understand it should prioritize technical blockers over social context.


## What Didn't Work at First & How I Adjusted

In my initial prototype, I used a standard prompt that returned a string which I then cleaned using Regular Expressions (Regex) to strip Markdown backticks.

Why I moved away from Regex:

Regex is highly dependent on the model consistently using specific Markdown tags. If the model includes a preamble (e.g., "Here is your JSON:") or changes its formatting then the parser breaks.
Token Waste: Asking the model to generate Markdown characters is an inefficient use of tokens.
Lack of Validation: Regex only cleans the string it doesn't ensure the content of the JSON actually matches the required keys and types.
To solve this, I refactored the code to use Native JSON Mode and Response Schemas. This forces the model to communicate in pure data which removes the need for string manipulation and ensuring 100% predictable structure.

* **API Transition:** I initially started with OpenAI, but moved to the Gemini API for better accessibility. This required a full refactor of the dependency chain.
* **Reliability (503 Errors):** The Gemini 3 models occasionally experience high demand. I addressed this by building an **Exponential Backoff** retry mechanism that automatically pauses and retries requests when the server is busy.
* **Code Refinement:** While I handled the core logic and architecture, I used AI assistance to troubleshoot specific SDK quirks and to refine the regex/parsing logic before moving to native JSON mode.

## Future Improvements
* **Validation:** Integrating **Zod** for deep validation of the AI's response before it reaches the frontend.
* **Testing:** Implementing **Jest** to test the retry logic against simulated server failures.
* **Scaling:** Adding support for streaming responses for much larger blocks of text.


## Setup Instructions
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env` file in the root directory.
4. Add your Gemini API key: `GEMINI_API_KEY=your_key_here`
5. Run the script: `node index.js`

## Tech Stack
- Node.js
- Google Generative AI SDK
- Dotenv (for environment variable management)
---
*Submitted as part of the TribalScale technical assessment.*


