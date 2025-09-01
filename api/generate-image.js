import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, image } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GOOGLE_AI_API_KEY 
    });

    // Build contents array - can include both text and image
    const contents = [];
    
    // Add text prompt
    contents.push({ text: prompt });
    
    // Add image if provided (base64 encoded)
    if (image) {
      // Remove data URL prefix if present (data:image/jpeg;base64,)
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      
      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: image.startsWith('data:') 
            ? image.split(';')[0].split(':')[1] 
            : 'image/jpeg'
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: contents,
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        return res.status(200).json({
          success: true,
          image: imageData,
          mimeType: part.inlineData.mimeType || 'image/png'
        });
      }
    }

    return res.status(500).json({ error: 'No image generated' });

  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message 
    });
  }
}