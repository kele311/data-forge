# Contributing to data-forge

Thank you for your interest in contributing! We welcome all contributions, from bug reports to feature implementations.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/data-forge.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format

# Try the CLI locally
npm run dev -- validate test.csv
```

## Making Changes

1. Make your changes in the `src/` directory
2. Add tests for new functionality
3. Update documentation if needed
4. Run `npm run lint` and `npm run format`

## Submitting a Pull Request

1. Push your changes to your fork
2. Create a Pull Request with a clear description
3. Reference any related issues
4. Ensure all tests pass

## Code Style

- Use TypeScript
- Follow the existing code style
- Run `npm run format` before committing
- Add JSDoc comments for public functions

## Testing

- Add tests for new features
- Ensure existing tests still pass
- Aim for good coverage

## Reporting Issues

- Use the GitHub issue tracker
- Provide clear, reproducible examples
- Include your environment details (Node version, OS, etc.)

## Questions?

Open an issue with the `question` label or check existing discussions.

Thank you for contributing! 🙌
