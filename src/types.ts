export type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
export type ImageQuality = "standard" | "premium_2k";
export type ModelType = "Vision Standard 1.1" | "Vision Ultra 2.2";

export const CREDIT_COSTS = {
  standard: 80,
  premium_2k: 120
};

export interface GenerationSettings {
  aspectRatio: AspectRatio;
  style: string;
  prompt: string;
  quality: ImageQuality;
  model: ModelType;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  settings: GenerationSettings;
  createdAt: number;
}

export const STYLES = [
  { id: 'photorealistic', name: 'Photorealistic', description: 'Highly detailed, lifelike photography' },
  { id: 'digital-art', name: 'Digital Art', description: 'Clean, vibrant digital illustration' },
  { id: 'cinematic', name: 'Cinematic', description: 'Dramatic lighting, movie-like quality' },
  { id: 'minimalist', name: 'Minimalist', description: 'Simple, clean forms and negative space' },
  { id: 'isometric', name: 'Isometric', description: 'Structured 3D perspective views' },
  { id: 'vaporwave', name: 'Vaporwave', description: '80s aesthetics with neon and dreamy hues' },
];
