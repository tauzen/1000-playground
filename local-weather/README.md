# Local Weather App

A simple HTML/JavaScript app that displays your current location and weather information.

## Features

- Gets your location using browser Geolocation API
- Displays address details (street, neighborhood, city, country) using Nominatim API
- Shows current weather conditions using OpenWeatherMap API

## Setup

1. **Get an OpenWeatherMap API key** (free):
   - Go to https://openweathermap.org/api
   - Sign up for a free account
   - Get your API key from the dashboard

2. **Add your API key**:
   - Open `index.html`
   - Find the line: `const OPENWEATHER_API_KEY = 'YOUR_API_KEY_HERE';`
   - Replace `YOUR_API_KEY_HERE` with your actual API key

3. **Run the app**:
   - Simply open `index.html` in your web browser
   - Click "Get My Weather" button
   - Allow location access when prompted

## Technologies Used

- Vanilla JavaScript (no build step required)
- Browser Geolocation API
- Nominatim OpenStreetMap API (no key required)
- OpenWeatherMap API

## Note

Make sure to allow location access in your browser when prompted, otherwise the app won't be able to get your location.
