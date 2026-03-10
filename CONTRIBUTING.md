# Contributing to Ghoomo

We welcome contributions to the Ghoomo project! Please read this guide before submitting a pull request.

## Code of Conduct

- Be respectful and inclusive
- Welcome diverse perspectives
- Focus on constructive feedback
- No harassment or discrimination

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/ghoomo.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit with meaningful messages
7. Push to your fork
8. Submit a pull request

## Development Workflow

### Branch Naming

- Feature: `feature/feature-name`
- Bug fix: `fix/bug-name`
- Documentation: `docs/doc-name`
- Refactor: `refactor/refactor-name`

### Commit Messages

Follow conventional commits:

```
type(scope): subject

body

footer
```

Types: feat, fix, docs, style, refactor, test, chore

Example:
```
feat(auth): add OTP verification

Implement OTP verification for user login.
Adds email validation and rate limiting.

Fixes #123
```

### Code Style

- Use consistent indentation (2 spaces)
- Follow the existing code style
- Use ESLint and Prettier
- Add comments for complex logic

### Testing

- Write tests for new features
- Ensure all tests pass: `npm test`
- Maintain test coverage above 80%

### Documentation

- Update README.md for new features
- Document API changes in docs/API.md
- Add code comments for complex logic
- Update CHANGELOG.md

## Pull Request Process

1. Update documentation
2. Add tests for new features
3. Ensure CI passes
4. Request review from maintainers
5. Address feedback
6. Merge when approved

## Reporting Issues

### Bug Reports

Include:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/logs if applicable
- Environment details

### Feature Requests

Include:
- Clear description of feature
- Use cases and benefits
- Proposed implementation
- Alternatives considered

## Project Structure Guidelines

Follow the existing structure:

```
module/
├── src/
│   ├── components/      (React components)
│   ├── pages/          (Page components)
│   ├── services/       (API services)
│   ├── hooks/          (Custom hooks)
│   └── styles/         (CSS files)
├── tests/              (Test files)
├── package.json
└── README.md
```

## Quick Reference

### Starting Development

```bash
# Backend
cd backend && npm install && npm run dev

# User app
cd user && npm install && npm start

# Driver app
cd driver && npm install && npm start

# Admin dashboard
cd admin && npm install && npm start
```

### Running Tests

```bash
cd backend && npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Questions?

- Check documentation in `docs/` folder
- Review existing issues
- Create a discussion thread
- Contact maintainers

## License

By contributing, you agree your code will be under MIT License.

Thank you for contributing to Ghoomo! 🚗
