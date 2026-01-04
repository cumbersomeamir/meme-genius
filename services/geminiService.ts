
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MagicCaptionResponse } from "../types";

const API_KEY = process.env.API_KEY || "";

/**
 * Analyzes an image and suggests 5 funny captions using gemini-3-pro-preview.
 */
export const getMagicCaptions = async (base64Image: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = "Analyze this image and provide 5 funny, short, and relevant meme captions. Return the response in a JSON format with a 'captions' array containing strings.";
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          captions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["captions"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}") as MagicCaptionResponse;
    return data.captions || [];
  } catch (e) {
    console.error("Failed to parse AI captions", e);
    return [];
  }
};

/**
 * Edits an image based on a prompt using gemini-2.5-flash-image.
 */
export const editImageWithAI = async (base64Image: string, editPrompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } },
        { text: editPrompt }
      ]
    },
    config: {
      // Per instructions: Omit imageSize for gemini-2.5-flash-image
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  return null;
};
