// Netlify Function to fetch weather data from OpenWeatherMap
// Environment variable: OPENWEATHER_API_KEY

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        available: false,
        message: 'Weather API not configured'
      })
    };
  }

  try {
    const { lat, lon } = JSON.parse(event.body);

    if (lat === undefined || lon === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing lat or lon parameters' })
      };
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        available: true,
        data
      })
    };
  } catch (error) {
    console.error('Weather function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch weather data' })
    };
  }
}
