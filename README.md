# 1000 Playground

A repository for quick and dirty experiments with Python, JavaScript, TypeScript, and HTML/CSS.

## Structure

Each experiment lives in its own folder at the root level:

```
1000-playground/
├── hello-world/
├── experiment-2/
├── experiment-3/
└── ...
```

## Viewing Projects Online

All projects are automatically published to GitHub Pages and can be viewed at:

```
https://[username].github.io/1000-playground/
```

Individual projects can be accessed at:

```
https://[username].github.io/1000-playground/[project-folder]/
```

## Adding a New Experiment

1. Create a new folder in the root directory
2. Add your code (HTML/CSS/JS for web projects, or Python/TypeScript for others)
3. For web projects, include an `index.html` as the entry point
4. Commit and push - GitHub Actions will automatically deploy to gh-pages

## Supported Languages

- Python
- JavaScript
- TypeScript
- HTML/CSS

## For Coding Agents

See `Claude.md` for guidelines on working with this repository.

## Deployment

GitHub Actions automatically builds and deploys all projects to the `gh-pages` branch on every push to the main branch.
