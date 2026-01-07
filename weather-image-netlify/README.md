# Weather to Image Generator - Netlify Edition

A web application that generates AI images based on real-world context including location, weather, time of day, and season. All API calls are handled securely through Netlify Functions.

## Features

- **Location-based generation**: Use your current location or pick from 30+ famous landmarks worldwide
- **Real-time weather integration**: Incorporates current weather conditions into the generated scene
- **Time and season awareness**: Considers time of day and season (including hemisphere-aware seasons)
- **Secure API handling**: All external API calls go through Netlify Functions - no API keys exposed to users

## Deployment

### Prerequisites

- A [Netlify](https://www.netlify.com/) account
- An [OpenAI API key](https://platform.openai.com/api-keys) (required)
- An [OpenWeatherMap API key](https://openweathermap.org/api) (optional, for weather data)

### Deploy to Netlify

1. **Connect your repository** to Netlify:
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" > "Import an existing project"
   - Connect your Git provider and select this repository
   - Set the publish directory to the `weather-image-netlify` folder

2. **Configure environment variables** in Netlify:
   - Go to Site settings > Environment variables
   - Add the following variables:
     - `OPENAI_API_KEY`: Your OpenAI API key (required)
     - `OPENWEATHER_API_KEY`: Your OpenWeatherMap API key (optional)

3. **Deploy**: Netlify will automatically build and deploy your site

### Local Development

To run locally with Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to the project directory
cd weather-image-netlify

# Create a .env file with your API keys
echo "OPENAI_API_KEY=your-openai-key" > .env
echo "OPENWEATHER_API_KEY=your-weather-key" >> .env

# Start the development server
netlify dev
```

## Architecture

```
weather-image-netlify/
├── index.html              # Frontend application
├── netlify.toml            # Netlify configuration
├── README.md               # This file
└── netlify/
    └── functions/
        ├── weather.js      # Weather API proxy (OpenWeatherMap)
        ├── scene.js        # Scene description generator (OpenAI GPT-4o)
        └── image.js        # Image generator (DALL-E 3)
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/weather` | POST | Fetches weather data for given coordinates |
| `/api/scene` | POST | Generates scene description using GPT-4o |
| `/api/image` | POST | Generates image using DALL-E 3 |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4o and DALL-E 3 |
| `OPENWEATHER_API_KEY` | No | OpenWeatherMap API key for weather data |

## How It Works

1. **Location**: User selects their location (automatic geolocation or manual selection)
2. **Weather**: The app fetches current weather from OpenWeatherMap (if configured)
3. **Scene Description**: GPT-4o generates a detailed scene description based on:
   - Location details
   - Current weather conditions
   - Time of day (calculated from timezone)
   - Season (hemisphere-aware)
   - Current date
4. **Image Generation**: DALL-E 3 creates an image from the scene description

## Security

- All API keys are stored as environment variables on the server
- Users never need to provide or see API keys
- API calls are proxied through Netlify Functions
- No sensitive data is exposed to the client
