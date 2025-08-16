import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GlossaryEntry } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateVisualGlossary(rawText: string): Promise<GlossaryEntry[]> {
  const prompt = `
    Analyze the following glossary, provided in a "Term: Definition" format.
    For each entry, extract the term and definition.
    Then, for each term, provide a single, relevant icon name from the Lucide icon library (see lucide.dev/icons). The icon name must be in PascalCase format (e.g., 'BookOpen', 'DatabaseZap', 'CloudCog'). This is crucial for the icon to be rendered correctly.
    Return the result as a JSON array.

    Glossary Text:
    ---
    ${rawText}
    ---
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: {
                type: Type.STRING,
                description: 'The glossary term.',
              },
              definition: {
                type: Type.STRING,
                description: 'The definition of the term.',
              },
              iconName: {
                type: Type.STRING,
                description: "The name of a suitable icon from the Lucide icon library in PascalCase (e.g., 'BrainCircuit', 'CodeXml', 'ShieldCheck').",
              },
            },
            required: ["term", "definition", "iconName"],
          },
        },
      },
    });

    const jsonString = response.text;
    const parsedResult = JSON.parse(jsonString);
    
    if (!Array.isArray(parsedResult)) {
        throw new Error("API did not return a valid array.");
    }

    // Basic validation
    return parsedResult.filter(item => item.term && item.definition && item.iconName);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate visual glossary. Please check the console for details.");
  }
}