/**
 * Prompt Templates for WatsonX API
 * Contains all prompt templates for different features
 */

/**
 * Language-specific documentation formats
 */
const DOC_FORMATS: { [key: string]: string } = {
  javascript: 'JSDoc (/** */)',
  typescript: 'JSDoc (/** */)',
  python: 'Python docstrings (""")',
  java: 'JavaDoc (/** */)',
  go: 'Go doc comments (//)',
  cpp: 'Doxygen (/** */)',
  c: 'Doxygen (/** */)',
  csharp: 'XML documentation comments (///)',
  ruby: 'RDoc (#)',
  php: 'PHPDoc (/** */)',
  rust: 'Rust doc comments (///)',
  swift: 'Swift doc comments (///)',
  kotlin: 'KDoc (/** */)' 
};

/**
 * Get the appropriate documentation format for a language
 */
export function getDocFormat(languageId: string): string {
  return DOC_FORMATS[languageId.toLowerCase()] || 'standard inline comments';
}

/**
 * Generate documentation prompt
 */
export function generateDocsPrompt(code: string, languageId: string): string {
  const docFormat = getDocFormat(languageId);
  const language = languageId.charAt(0).toUpperCase() + languageId.slice(1);

  return `You are an expert software documentation writer. 
Given the following ${language} code, generate comprehensive documentation for every function, class, and method. 

Use the standard docstring/comment format for ${language}: ${docFormat}

Requirements:
- Add documentation comments for ALL functions, classes, methods, and important variables
- Include parameter descriptions with types
- Include return value descriptions with types
- Add usage examples where helpful
- Document any exceptions or errors that might be thrown
- Keep documentation clear, concise, and professional
- Return ONLY the original code with documentation comments added inline
- Do NOT add any explanation, markdown formatting, or text outside the code
- Do NOT modify the actual code logic, only add documentation comments

Code:
\`\`\`${languageId}
${code}
\`\`\`

Return the documented code:`;
}

/**
 * Language display names
 */
export const LANGUAGE_NAMES: { [key: string]: string } = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  go: 'Go',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  ruby: 'Ruby',
  php: 'PHP',
  rust: 'Rust',
  swift: 'Swift',
  kotlin: 'Kotlin'
};

/**
 * Get language display name
 */
export function getLanguageName(languageId: string): string {
  return LANGUAGE_NAMES[languageId.toLowerCase()] || languageId;
}

/**
 * Check if a language is supported for documentation generation
 */
export function isLanguageSupported(languageId: string): boolean {
  const supportedLanguages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'go',
    'cpp',
    'c',
    'csharp',
    'ruby',
    'php',
    'rust',
    'swift',
    'kotlin'
  ];
  
  return supportedLanguages.includes(languageId.toLowerCase());
}

/**
 * Test framework mapping for different languages
 */
const TEST_FRAMEWORKS: { [key: string]: string } = {
  javascript: 'Jest',
  typescript: 'Jest',
  python: 'pytest',
  java: 'JUnit 5',
  go: 'Go testing package',
  cpp: 'Google Test',
  c: 'Unity Test Framework',
  csharp: 'xUnit',
  ruby: 'RSpec',
  php: 'PHPUnit',
  rust: 'Rust built-in test framework',
  swift: 'XCTest',
  kotlin: 'JUnit 5'
};

/**
 * Get the appropriate test framework for a language
 */
export function getTestFramework(languageId: string): string {
  return TEST_FRAMEWORKS[languageId.toLowerCase()] || 'standard unit testing framework';
}

/**
 * Test file naming conventions for different languages
 */
const TEST_FILE_PATTERNS: { [key: string]: (fileName: string) => string } = {
  javascript: (name) => `${name}.test.js`,
  typescript: (name) => `${name}.test.ts`,
  python: (name) => `test_${name}.py`,
  java: (name) => `${name}Test.java`,
  go: (name) => `${name}_test.go`,
  cpp: (name) => `${name}_test.cpp`,
  c: (name) => `test_${name}.c`,
  csharp: (name) => `${name}Tests.cs`,
  ruby: (name) => `${name}_spec.rb`,
  php: (name) => `${name}Test.php`,
  rust: (name) => `${name}_test.rs`,
  swift: (name) => `${name}Tests.swift`,
  kotlin: (name) => `${name}Test.kt`
};

/**
 * Get test file name for a given source file
 */
export function getTestFileName(fileName: string, languageId: string): string {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const pattern = TEST_FILE_PATTERNS[languageId.toLowerCase()];
  
  if (pattern) {
    return pattern(nameWithoutExt);
  }
  
  // Default pattern
  return `${nameWithoutExt}.test.${languageId}`;
}

/**
 * Generate unit tests prompt
 */
export function generateTestsPrompt(code: string, languageId: string, fileName: string): string {
  const testFramework = getTestFramework(languageId);
  const language = getLanguageName(languageId);

  return `Generate ${testFramework} unit tests for this ${language} code.

File: ${fileName}

Code:
\`\`\`${languageId}
${code}
\`\`\`

Create tests that cover:
- Valid inputs (happy path)
- Edge cases (empty, null, boundary values)
- Error cases (invalid inputs, exceptions)
- All functions and methods

Use ${testFramework} syntax. Include imports and setup. Write clear test names.

Return only the test code, no explanations.`;
}

// Made with Bob
