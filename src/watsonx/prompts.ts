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

// Made with Bob
