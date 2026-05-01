import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageQuality } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  async generateImage(prompt: string, aspectRatio: AspectRatio = "1:1", quality: ImageQuality = "standard"): Promise<string> {
    try {
      const model = quality === "premium_2k" ? "gemini-3.1-flash-image-preview" : "gemini-2.5-flash-image";
      
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio,
            ...(quality === "premium_2k" ? { imageSize: "2K" } : { imageSize: "1K" })
          },
        },
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No candidates received from Gemini");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }

      throw new Error("The model did not return an image. This might be due to safety filters or an overly complex prompt.");
    } catch (error) {
      console.error("Gemini Image Generation Error:", error);
      throw error;
    }
  },

  async editImage(baseImageBase64: string, prompt: string, quality: ImageQuality = "standard"): Promise<string> {
    try {
      const model = quality === "premium_2k" ? "gemini-3.1-flash-image-preview" : "gemini-2.5-flash-image";
      
      // Extract mimeType and raw base64 data
      const mimeType = baseImageBase64.split(";")[0].split(":")[1];
      const data = baseImageBase64.split(",")[1];

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                data,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No candidates received from Gemini");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }

      throw new Error("The model did not return an image. This might be due to safety filters or an overly complex prompt.");
    } catch (error) {
      console.error("Gemini Image Editing Error:", error);
      throw error;
    }
  },

  async enhancePrompt(rawPrompt: string, style: string, quality: ImageQuality): Promise<string> {
    try {
      const qualityPrefix = quality === "premium_2k" 
        ? "Create an ultra-high resolution 2K quality image. Use keywords: masterpiece, 8k resolution, highly detailed, sharp focus, cinematic lighting, professional post-processing. " 
        : "";

      const prompt = `Enhance this image generation prompt to be more vivid and professional. 
        Input prompt: "${rawPrompt}"
        Requested Style: "${style}"
        
        Requirements:
        1. Keep the core intent of the original prompt.
        2. ${qualityPrefix}Add descriptive details about lighting, texture, composition, and mood appropriate for the ${style} style.
        3. Do not include any conversational text, only the enhanced prompt.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      return response.text?.trim() || rawPrompt;
    } catch (error) {
       console.warn("Prompt enhancement failed, using raw prompt:", error);
       return rawPrompt;
    }
  }
};
