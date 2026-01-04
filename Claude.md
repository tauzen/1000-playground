# Guidelines for Coding Agents

This repository is designed for quick experiments and prototyping. Here are the guidelines for working in this repository:

## Project Structure

- Each experiment should be in its own folder at the root level
- Use descriptive folder names (e.g., `todo-app`, `data-visualization`, `api-experiment`)
- Each web project should have an `index.html` as the entry point

## Code Style

- Prioritize speed and experimentation over perfection
- Keep code simple and readable
- Add comments only where necessary for complex logic
- Don't over-engineer - build what's needed

## Web Projects

For HTML/CSS/JS projects:
- Include an `index.html` file
- Can use inline CSS/JS or separate files as needed
- Projects will be automatically deployed to GitHub Pages

## Python Projects

- Use virtual environments within project folders if needed
- Include a `requirements.txt` if using external packages
- Add a `README.md` in the project folder to explain setup/usage

## TypeScript Projects

- Include necessary config files (`tsconfig.json`, `package.json`)
- Build outputs should go to a `dist/` folder (already in .gitignore)
- For web projects, ensure compiled output includes `index.html`

## GitHub Pages

- All folders with `index.html` will be accessible via GitHub Pages
- The root `index.html` provides a directory of all projects
- Changes are automatically deployed on push to main branch

## Best Practices

1. Each project is independent - no shared dependencies between projects
2. Document non-obvious setup steps in project-level README files
3. Clean up experiments that are no longer useful
4. Use descriptive commit messages

## Quick Start Template

When creating a new web experiment:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Experiment Name</title>
</head>
<body>
    <h1>Experiment Name</h1>
    <!-- Your code here -->
</body>
</html>
```

## Deployment

Changes pushed to the main branch (or designated Claude branch) are automatically deployed to GitHub Pages via GitHub Actions.
