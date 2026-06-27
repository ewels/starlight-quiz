/** @type {import('prettier').Config} */
export default {
  printWidth: 120,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  plugins: ['prettier-plugin-astro'],
  overrides: [
    { files: '*.astro', options: { parser: 'astro' } },
    // Leave code inside markdown fences untouched — it reflows the quiz
    // examples (task lists, JSX) in ways that misrepresent the syntax.
    { files: '*.md', options: { embeddedLanguageFormatting: 'off' } },
  ],
};
