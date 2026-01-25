# Guidelines for AI Coding Agents

This repository is a playground for quick experiments and prototyping. It hosts various web applications and experiments that are automatically deployed to GitHub Pages.

## Repository Overview

- **Purpose**: Quick and dirty experiments with web technologies
- **Deployment**: Automatic deployment to GitHub Pages via GitHub Actions
- **Live URL**: https://tauzen.github.io/1000-playground/

## Project Structure

```
1000-playground/
├── index.html                    # Main landing page with project directory
├── Claude.md                     # This file (guidelines for AI agents)
├── README.md                     # Project README
├── .gitignore                    # Git ignore rules
├── .github/
│   └── workflows/
│       └── gh-pages.yml          # GitHub Pages deployment workflow
├── hello-world/                  # Simple interactive demo
├── local-weather/                # Weather app with geolocation
├── location-scene-generator/     # AI scene description generator
├── openai-image-generation/      # DALL-E 3 image generator
├── weather-to-image/             # Weather-based image generation
├── platformer/                   # 2D side-scrolling game
└── weather-image-netlify/        # Netlify-deployed weather app
```

## Current Projects

| Project | Description | Technologies |
|---------|-------------|--------------|
| `hello-world/` | Click counter demo | HTML, CSS, vanilla JS |
| `local-weather/` | Weather app with location detection | Geolocation API, OpenWeatherMap API |
| `location-scene-generator/` | AI-powered scene descriptions | Claude API |
| `openai-image-generation/` | Text-to-image generation | OpenAI DALL-E 3 API |
| `weather-to-image/` | Auto-generate images from weather | Multiple APIs combined |
| `platformer/` | Infinite runner game "Square Runner" | Canvas API, vanilla JS |
| `weather-image-netlify/` | Server-side weather image app | Netlify Functions |

## Creating New Projects

### Web Projects (HTML/CSS/JS)

1. Create a new folder at the root level with a descriptive name (e.g., `my-experiment/`)
2. Add an `index.html` as the entry point
3. Use inline CSS/JS or separate files as needed
4. Update the main `index.html` to add a card linking to the new project

**Template:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Name - 1000 Playground</title>
    <style>
        /* Inline styles or link to external CSS */
    </style>
</head>
<body>
    <h1>Project Name</h1>
    <!-- Content here -->
    <script>
        // Inline JavaScript or link to external JS
    </script>
</body>
</html>
```

### Adding to Main Directory

When creating a new project, add a card to `index.html`:
```html
<a href="project-folder/" class="project-card">
    <h2>Project Title</h2>
    <p>Brief description of what the project does.</p>
    <span class="project-link">View Project →</span>
</a>
```

## Code Style & Conventions

### General Principles
- **Simplicity over perfection**: This is a playground for quick experiments
- **Self-contained projects**: Each project should be independent with no shared dependencies
- **Minimal dependencies**: Prefer vanilla JS; use CDN links when libraries are needed
- **Comments only for complex logic**: Keep code readable and self-explanatory

### Observed Patterns

1. **Consistent styling**: Projects use a purple gradient theme (`#667eea` to `#764ba2`)
2. **Responsive design**: Use viewport meta tag and flexible layouts
3. **Card-based UI**: White cards with rounded corners and shadows
4. **No build tools**: Direct HTML/CSS/JS without bundlers for simplicity

### CSS Conventions
```css
/* Common reset */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* Common gradient background */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Card styling */
.card {
    background: white;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
```

### JavaScript Conventions
- Use vanilla JavaScript for simple projects
- Handle errors gracefully with user-friendly messages
- Use localStorage for persisting user preferences (e.g., API keys)
- For games/animations, use `requestAnimationFrame`

## API Integration Patterns

### Client-Side API Key Management
For projects requiring API keys (OpenWeatherMap, OpenAI, etc.):
```javascript
const STORAGE_KEY = 'api_key_name';

function getStoredApiKey() {
    return localStorage.getItem(STORAGE_KEY);
}

function saveApiKey(key) {
    if (key && key.trim()) {
        localStorage.setItem(STORAGE_KEY, key.trim());
    }
}
```

### Geolocation (Mobile-Compatible)
```javascript
// IMPORTANT: Call geolocation IMMEDIATELY in click handler for Mobile Safari
navigator.geolocation.getCurrentPosition(
    (position) => {
        const { latitude, longitude } = position.coords;
        // Handle success
    },
    (error) => {
        // Handle error
    }
);
```

### External APIs Used
- **OpenWeatherMap**: Weather data (requires API key)
- **Nominatim (OpenStreetMap)**: Reverse geocoding (free, no key required)
- **OpenAI**: DALL-E 3 image generation (requires API key)
- **Anthropic Claude**: Text generation (requires API key)

## Python Projects

Use `uv` for Python package and project management.

### Quick Start
```bash
uv init my-project          # Create new project
cd my-project
uv add package-name         # Add dependencies
uv run python script.py     # Run scripts
```

### Project Structure
- `pyproject.toml` - Project configuration
- `uv.lock` - Locked dependencies (commit this)
- `.python-version` - Pinned Python version

### Key Commands
```bash
uv python install 3.12      # Install Python version
uv python pin 3.12          # Pin version for project
uv sync                     # Install dependencies
uv run pytest              # Run with dependencies
```

## TypeScript Projects

- Use `tsconfig.json` and `package.json`
- Build outputs go to `dist/` (gitignored)
- For web projects, ensure compiled output includes `index.html`

## Netlify Projects

For projects requiring server-side API key handling (like `weather-image-netlify/`):

### Structure
```
project-name/
├── index.html
├── netlify.toml
├── README.md
└── netlify/
    └── functions/
        └── api-handler.js
```

### Configuration
```toml
[build]
  publish = "."
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## Deployment

### GitHub Pages (Default)
- Automatic deployment on push to `main` branch
- All folders with `index.html` are accessible at `https://tauzen.github.io/1000-playground/[folder]/`
- Deployment workflow: `.github/workflows/gh-pages.yml`

### Netlify (For Server-Side Functions)
- Deploy via Netlify CLI or connect GitHub repo
- Set environment variables in Netlify dashboard
- Use for projects requiring secret API keys

## Git Workflow

### Commit Messages
- Use descriptive, concise messages
- Format: `Add [feature]`, `Fix [issue]`, `Update [component]`
- Examples:
  - `Add weather precipitation display`
  - `Fix mobile Safari geolocation prompt`
  - `Update platformer jump mechanics`

### Branch Naming
- Feature branches: `claude/feature-name-sessionId`
- Follow existing branch conventions when working on designated branches

## Best Practices for AI Agents

1. **Read before modifying**: Always read existing files before making changes
2. **Keep projects independent**: Don't create shared utilities across projects
3. **Update the directory**: Add new projects to the main `index.html`
4. **Test locally**: Projects should work by opening `index.html` directly
5. **Handle API keys gracefully**: Provide clear UI for API key input
6. **Mobile-first considerations**: Test touch events and geolocation on mobile
7. **No over-engineering**: Build only what's needed for the experiment
8. **Clean up unused code**: Remove experiments that are no longer useful

## Files to Ignore

The `.gitignore` covers:
- Python: `__pycache__/`, `.venv/`, `*.egg-info/`
- Node.js: `node_modules/`, `package-lock.json`
- Build outputs: `dist/`, `build/`, `out/`
- IDE files: `.vscode/`, `.idea/`
- Environment: `.env`, `.env.local`
- OS files: `.DS_Store`, `Thumbs.db`
