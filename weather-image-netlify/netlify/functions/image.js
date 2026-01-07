// Netlify Function to generate image using OpenAI DALL-E 3
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
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing prompt parameter' })
      };
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt
      })
    };
  } catch (error) {
    console.error('Image function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate image' })
    };
  }
}
