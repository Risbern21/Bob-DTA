import * as assert from 'assert';
import { 
  generateDocsPrompt, 
  getDocFormat, 
  getLanguageName, 
  isLanguageSupported 
} from '../../watsonx/prompts';

suite('Prompts Test Suite', () => {
  
  suite('getDocFormat', () => {
    test('should return JSDoc for JavaScript', () => {
      const format = getDocFormat('javascript');
      assert.strictEqual(format, 'JSDoc (/** */)');
    });

    test('should return JSDoc for TypeScript', () => {
      const format = getDocFormat('typescript');
      assert.strictEqual(format, 'JSDoc (/** */)');
    });

    test('should return docstrings for Python', () => {
      const format = getDocFormat('python');
      assert.strictEqual(format, 'Python docstrings (""")');
    });

    test('should return JavaDoc for Java', () => {
      const format = getDocFormat('java');
      assert.strictEqual(format, 'JavaDoc (/** */)');
    });

    test('should return Go doc comments for Go', () => {
      const format = getDocFormat('go');
      assert.strictEqual(format, 'Go doc comments (//)');
    });

    test('should return default format for unsupported language', () => {
      const format = getDocFormat('unknown');
      assert.strictEqual(format, 'standard inline comments');
    });
  });

  suite('getLanguageName', () => {
    test('should return proper name for JavaScript', () => {
      const name = getLanguageName('javascript');
      assert.strictEqual(name, 'JavaScript');
    });

    test('should return proper name for TypeScript', () => {
      const name = getLanguageName('typescript');
      assert.strictEqual(name, 'TypeScript');
    });

    test('should return proper name for Python', () => {
      const name = getLanguageName('python');
      assert.strictEqual(name, 'Python');
    });

    test('should return input for unknown language', () => {
      const name = getLanguageName('unknown');
      assert.strictEqual(name, 'unknown');
    });

    test('should handle case insensitivity', () => {
      const name = getLanguageName('JAVASCRIPT');
      assert.strictEqual(name, 'JavaScript');
    });
  });

  suite('isLanguageSupported', () => {
    test('should return true for JavaScript', () => {
      assert.strictEqual(isLanguageSupported('javascript'), true);
    });

    test('should return true for TypeScript', () => {
      assert.strictEqual(isLanguageSupported('typescript'), true);
    });

    test('should return true for Python', () => {
      assert.strictEqual(isLanguageSupported('python'), true);
    });

    test('should return true for Java', () => {
      assert.strictEqual(isLanguageSupported('java'), true);
    });

    test('should return true for Go', () => {
      assert.strictEqual(isLanguageSupported('go'), true);
    });

    test('should return true for C++', () => {
      assert.strictEqual(isLanguageSupported('cpp'), true);
    });

    test('should return true for C#', () => {
      assert.strictEqual(isLanguageSupported('csharp'), true);
    });

    test('should return false for unsupported language', () => {
      assert.strictEqual(isLanguageSupported('cobol'), false);
    });

    test('should handle case insensitivity', () => {
      assert.strictEqual(isLanguageSupported('PYTHON'), true);
    });
  });

  suite('generateDocsPrompt', () => {
    test('should generate prompt for JavaScript', () => {
      const code = 'function add(a, b) { return a + b; }';
      const prompt = generateDocsPrompt(code, 'javascript');
      
      // Check for language name (case-insensitive)
      assert.ok(prompt.toLowerCase().includes('javascript'));
      assert.ok(prompt.includes('JSDoc'));
      assert.ok(prompt.includes(code));
      assert.ok(prompt.includes('documentation'));
    });

    test('should generate prompt for Python', () => {
      const code = 'def add(a, b):\n    return a + b';
      const prompt = generateDocsPrompt(code, 'python');
      
      // Check for language name (case-insensitive)
      assert.ok(prompt.toLowerCase().includes('python'));
      assert.ok(prompt.includes('docstrings'));
      assert.ok(prompt.includes(code));
    });

    test('should include code in code block', () => {
      const code = 'function test() {}';
      const prompt = generateDocsPrompt(code, 'javascript');
      
      assert.ok(prompt.includes('```javascript'));
      assert.ok(prompt.includes('```'));
    });

    test('should request comprehensive documentation', () => {
      const code = 'function test() {}';
      const prompt = generateDocsPrompt(code, 'javascript');
      
      assert.ok(prompt.includes('comprehensive'));
      assert.ok(prompt.includes('function'));
      assert.ok(prompt.includes('class'));
      assert.ok(prompt.includes('method'));
    });

    test('should instruct to return only code', () => {
      const code = 'function test() {}';
      const prompt = generateDocsPrompt(code, 'javascript');
      
      assert.ok(prompt.includes('only') || prompt.includes('ONLY'));
      assert.ok(prompt.includes('original code'));
      assert.ok(prompt.toLowerCase().includes('do not'));
    });

    test('should handle multi-line code', () => {
      const code = `function add(a, b) {
  return a + b;
}

function multiply(x, y) {
  return x * y;
}`;
      const prompt = generateDocsPrompt(code, 'javascript');
      
      assert.ok(prompt.includes(code));
      assert.ok(prompt.includes('```javascript'));
    });

    test('should capitalize language name', () => {
      const code = 'test';
      const prompt = generateDocsPrompt(code, 'python');
      
      assert.ok(prompt.includes('Python'));
      assert.ok(!prompt.includes('python code'));
    });
  });
});

// Made with Bob
