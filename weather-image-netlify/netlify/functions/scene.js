// Netlify Function to generate scene description using OpenAI GPT-4o
// Environment variable: OPENAI_API_KEY

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OpenAI API key not configured' })
    };
  }

  try {
    const { location, weather, timeOfDay, season, date } = JSON.parse(event.body);

    if (!location || !weather || !timeOfDay || !season || !date) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    const prompt = `Generate a detailed scene description for an image that depicts:
- Location: ${location}
- Weather: ${weather}
- Time of day: ${timeOfDay}
- Season: ${season}
- Current date: ${date}

Your description MUST explicitly mention and incorporate ALL of the following:
1. The specific location and its recognizable features
2. The exact weather conditions as described
3. Lighting and atmosphere appropriate for the time of day
4. Seasonal elements (vegetation, decorations, activities)
5. Any special considerations for the current date (holidays, events, etc.)

Write a vivid, detailed scene description of 2-3 paragraphs that would help an AI image generator create an accurate, atmospheric image. Focus on visual details, colors, textures, and mood. Do not include any instructions or meta-text - just the scene description itself.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: 'You are a creative writer specializing in vivid scene descriptions for image generation. Your descriptions should be rich in visual detail and atmosphere.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const description = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    };
  } catch (error) {
    console.error('Scene function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate scene description' })
    };
  }
}
