# Local Weather App

A simple HTML/JavaScript app that displays your current location and weather information.

## Features

- Gets your location using browser Geolocation API
- Displays address details (street, neighborhood, city, country) using Nominatim API
- Shows current weather conditions using OpenWeatherMap API (optional)
- Stores API key in browser localStorage for convenience
- Works without API key (shows location only)

## How to Use

1. **Open the app**:
   - Simply open `index.html` in your web browser

2. **Using the app**:
   - Click "Get My Weather" button
   - Allow location access when prompted
   - The app will display your location details

3. **Adding weather data** (optional):
   - If you don't have an API key, the app will show location only
   - To add weather data, you can:
     - Click "Add API key" link when viewing results
     - Enter your OpenWeatherMap API key when prompted
     - Your key will be saved in localStorage for future visits
   - Get a free API key at https://openweathermap.org/api

## Technologies Used

- Vanilla JavaScript (no build step required)
- Browser Geolocation API
- Browser localStorage for API key storage
- Nominatim OpenStreetMap API (no key required)
- OpenWeatherMap API (optional, requires free API key)

## Privacy

Your API key is stored locally in your browser's localStorage and never sent anywhere except to OpenWeatherMap's API to fetch weather data.
