# Contributing to Yosync Studio

Thank you for considering contributing to Yosync Studio! We welcome contributions from everyone and appreciate your help in making this project better.

## 🤝 How to Contribute

### 1. **Before You Start**
- Read this document carefully
- Check existing [issues](https://github.com/Shubhamnpk/synclyric-studio/issues) to avoid duplicates
- Join our [Discord community](https://discord.gg/example) (coming soon) for discussions

### 2. **Development Setup**

#### Prerequisites
- Node.js (version 18 or higher)
- npm or pnpm package manager
- Git

#### Setup Instructions
```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork locally
git clone https://github.com/YOUR_USERNAME/synclyric-studio.git
cd synclyric-studio

# 3. Install dependencies
npm install
# or
pnpm install

# 4. Start the development server
npm run dev
# or
pnpm dev
```

### 3. **Making Changes**

#### Code Style
- Follow the existing code style and patterns
- Use TypeScript for type safety
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

#### Git Workflow
```bash
# 1. Create a new branch for your feature
git checkout -b feature/your-feature-name

# 2. Make your changes
# ... edit files ...

# 3. Test your changes
npm run lint
npm test

# 4. Commit your changes
git add .
git commit -m "feat: add your feature description"

# 5. Push to your fork
git push origin feature/your-feature-name

# 6. Create a Pull Request on GitHub
```

### 4. **Types of Contributions**

#### 🐛 Bug Reports
- Use the issue template
- Include steps to reproduce
- Provide browser and OS information
- Add screenshots if relevant

#### ✨ Feature Requests
- Use the feature request template
- Explain the use case clearly
- Consider existing functionality
- Be open to discussion and feedback

#### 📝 Documentation
- Improve README.md
- Add code comments
- Create tutorials or guides
- Fix typos and grammatical errors

#### 💻 Code Contributions
- Add new features
- Fix bugs
- Improve performance
- Refactor code

### 5. **Pull Request Guidelines**

#### Before Submitting
- Ensure all tests pass
- Run linting and fix any issues
- Update documentation if needed
- Squash commits if necessary

#### PR Description
- Use a clear, descriptive title
- Explain what the PR does
- Mention any related issues
- Include screenshots for UI changes

#### Review Process
- Be responsive to feedback
- Address review comments promptly
- Be open to suggestions and improvements
- Thank reviewers for their time

### 6. **Code Quality Standards**

#### Testing
- Write tests for new features
- Ensure existing tests pass
- Use descriptive test names
- Test edge cases

#### Performance
- Consider performance implications
- Avoid unnecessary re-renders
- Optimize audio and video processing
- Use efficient algorithms

#### Security
- Follow security best practices
- Don't introduce vulnerabilities
- Handle user input safely
- Use secure coding practices

### 7. **Project Structure**

```
src/
├── components/          # React components
│   ├── AudioPlayer/     # Audio playback components
│   ├── LyricsEditor/    # Lyrics editing interface
│   ├── Preview/         # Preview components
│   └── VideoExport/     # Video export functionality
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── services/           # API services
└── config/             # Configuration files
```

### 8. **Communication**

#### Be Respectful
- Use inclusive language
- Be patient with new contributors
- Respect different viewpoints
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)

#### Stay On Topic
- Keep discussions relevant
- Use appropriate channels
- Search before asking
- Provide helpful feedback

### 9. **Getting Help**

#### Resources
- [Documentation](https://github.com/Shubhamnpk/synclyric-studio/wiki)
- [Issues](https://github.com/Shubhamnpk/synclyric-studio/issues)
- [Discussions](https://github.com/Shubhamnpk/synclyric-studio/discussions)
- [Discord](https://discord.gg/example) (coming soon)

#### Contact
- Create an issue for technical questions
- Use discussions for general questions
- Reach out to maintainers for guidance

### 10. **Recognition**

We appreciate all contributions and will:
- Acknowledge your work in release notes
- Add your name to the contributors list
- Feature significant contributions
- Provide constructive feedback

## 📋 Checklist for Contributors

- [ ] I have read the contributing guidelines
- [ ] My code follows the project's style guide
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules

## 🎉 Thank You!

Your contributions help make Yosync Studio better for everyone. We appreciate your time and effort in improving this project.

## 📞 Questions?

If you have questions about contributing, please:
1. Check the [FAQ](https://github.com/Shubhamnpk/synclyric-studio/wiki/FAQ)
2. Search existing [issues](https://github.com/Shubhamnpk/synclyric-studio/issues)
3. Create a new [discussion](https://github.com/Shubhamnpk/synclyric-studio/discussions)
4. Contact the maintainers

---

**Happy Contributing!** 🚀