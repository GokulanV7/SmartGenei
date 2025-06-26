# Contributing to SmartGeni

We love your input! We want to make contributing to SmartGeni as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

### Development Setup

1. **Quick Setup:**
   ```bash
   git clone <your-fork>
   cd SmartGeni
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Manual Setup:**
   
   **Backend:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your API keys
   python app.py
   ```
   
   **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Code Style

**Python (Backend):**
- Follow PEP 8
- Use type hints where possible
- Add docstrings for functions and classes
- Maximum line length: 127 characters

**TypeScript/React (Frontend):**
- Use TypeScript for all new code
- Follow React best practices
- Use functional components with hooks
- Use meaningful component and variable names

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Examples:
```
feat: add YouTube search integration
fix: resolve CORS issue in API
docs: update installation instructions
```

### Testing

**Backend:**
- Test API endpoints manually
- Ensure health check works
- Verify environment variables are handled correctly

**Frontend:**
- Test UI components
- Ensure build process works
- Check responsive design

### Bug Reports

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](../../issues/new).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

### Feature Requests

We welcome feature requests! Please:

1. Check if the feature has already been requested
2. Clearly describe the feature and its benefits
3. Provide examples of how it would be used
4. Consider if it fits with the project's goals

### Code Review Process

1. All submissions require review before merging
2. We may ask for changes to be made before a PR can be merged
3. We'll do our best to review PRs promptly

### Development Guidelines

#### Backend Development

- **FastAPI Best Practices:**
  - Use Pydantic models for request/response validation
  - Add proper error handling
  - Include API documentation
  - Use dependency injection for shared resources

- **AI/LLM Integration:**
  - Handle API rate limits gracefully
  - Implement proper error handling for external services
  - Cache responses when appropriate
  - Monitor token usage

#### Frontend Development

- **React Best Practices:**
  - Use hooks for state management
  - Implement proper error boundaries
  - Optimize for performance (React.memo, useMemo, useCallback)
  - Follow accessibility guidelines

- **UI/UX:**
  - Maintain consistent design language
  - Ensure mobile responsiveness
  - Add loading states and error messages
  - Test across different browsers

### Security

- Never commit API keys or sensitive data
- Use environment variables for configuration
- Validate all user inputs
- Follow security best practices for web applications

### Documentation

- Update README.md for significant changes
- Document new APIs in the code
- Add inline comments for complex logic
- Update configuration examples

### Getting Help

- Check the [README](../README.md) for setup instructions
- Look through existing [issues](../../issues) and [pull requests](../../pulls)
- Join our discussions in [GitHub Discussions](../../discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in our README.md file and release notes.

Thank you for contributing to SmartGeni! 🧠✨
