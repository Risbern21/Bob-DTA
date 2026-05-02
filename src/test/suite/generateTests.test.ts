/**
 * Unit tests for Generate Tests feature
 */

import * as assert from 'assert';
import { 
  getTestFramework, 
  getTestFileName, 
  generateTestsPrompt 
} from '../../watsonx/prompts';

suite('Generate Tests Test Suite', () => {
  
  suite('getTestFramework', () => {
    test('should return Jest for JavaScript', () => {
      assert.strictEqual(getTestFramework('javascript'), 'Jest');
    });

    test('should return Jest for TypeScript', () => {
      assert.strictEqual(getTestFramework('typescript'), 'Jest');
    });

    test('should return pytest for Python', () => {
      assert.strictEqual(getTestFramework('python'), 'pytest');
    });

    test('should return JUnit 5 for Java', () => {
      assert.strictEqual(getTestFramework('java'), 'JUnit 5');
    });

    test('should return Go testing package for Go', () => {
      assert.strictEqual(getTestFramework('go'), 'Go testing package');
    });

    test('should return Google Test for C++', () => {
      assert.strictEqual(getTestFramework('cpp'), 'Google Test');
    });

    test('should return xUnit for C#', () => {
      assert.strictEqual(getTestFramework('csharp'), 'xUnit');
    });

    test('should return default for unsupported language', () => {
      const framework = getTestFramework('unknown');
      assert.ok(framework.includes('standard unit testing framework'));
    });

    test('should handle case insensitivity', () => {
      assert.strictEqual(getTestFramework('JavaScript'), 'Jest');
      assert.strictEqual(getTestFramework('PYTHON'), 'pytest');
    });
  });

  suite('getTestFileName', () => {
    test('should generate .test.js for JavaScript', () => {
      assert.strictEqual(getTestFileName('app.js', 'javascript'), 'app.test.js');
    });

    test('should generate .test.ts for TypeScript', () => {
      assert.strictEqual(getTestFileName('utils.ts', 'typescript'), 'utils.test.ts');
    });

    test('should generate test_ prefix for Python', () => {
      assert.strictEqual(getTestFileName('calculator.py', 'python'), 'test_calculator.py');
    });

    test('should generate Test suffix for Java', () => {
      assert.strictEqual(getTestFileName('Calculator.java', 'java'), 'CalculatorTest.java');
    });

    test('should generate _test suffix for Go', () => {
      assert.strictEqual(getTestFileName('handler.go', 'go'), 'handler_test.go');
    });

    test('should generate _test suffix for C++', () => {
      assert.strictEqual(getTestFileName('math.cpp', 'cpp'), 'math_test.cpp');
    });

    test('should generate Tests suffix for C#', () => {
      assert.strictEqual(getTestFileName('Service.cs', 'csharp'), 'ServiceTests.cs');
    });

    test('should handle files without extension', () => {
      const testFile = getTestFileName('module', 'javascript');
      assert.ok(testFile.includes('module'));
      assert.ok(testFile.includes('test'));
    });

    test('should handle files with multiple dots', () => {
      assert.strictEqual(getTestFileName('my.service.ts', 'typescript'), 'my.service.test.ts');
    });

    test('should handle case insensitivity', () => {
      assert.strictEqual(getTestFileName('App.js', 'JavaScript'), 'App.test.js');
    });
  });

  suite('generateTestsPrompt', () => {
    test('should generate prompt for JavaScript', () => {
      const code = 'function add(a, b) { return a + b; }';
      const prompt = generateTestsPrompt(code, 'javascript', 'math.js');
      
      assert.ok(prompt.toLowerCase().includes('javascript'));
      assert.ok(prompt.includes('Jest'));
      assert.ok(prompt.includes(code));
      assert.ok(prompt.includes('math.js'));
      assert.ok(prompt.includes('test'));
    });

    test('should generate prompt for Python', () => {
      const code = 'def multiply(a, b):\n    return a * b';
      const prompt = generateTestsPrompt(code, 'python', 'calculator.py');
      
      assert.ok(prompt.toLowerCase().includes('python'));
      assert.ok(prompt.includes('pytest'));
      assert.ok(prompt.includes(code));
      assert.ok(prompt.includes('calculator.py'));
    });

    test('should include code in code block', () => {
      const code = 'function test() { return true; }';
      const prompt = generateTestsPrompt(code, 'javascript', 'test.js');
      
      assert.ok(prompt.includes('```javascript'));
      assert.ok(prompt.includes(code));
      assert.ok(prompt.includes('```'));
    });

    test('should request comprehensive test coverage', () => {
      const code = 'function divide(a, b) { return a / b; }';
      const prompt = generateTestsPrompt(code, 'javascript', 'math.js');
      
      assert.ok(prompt.toLowerCase().includes('comprehensive'));
      assert.ok(prompt.toLowerCase().includes('edge case'));
      assert.ok(prompt.toLowerCase().includes('error'));
      assert.ok(prompt.toLowerCase().includes('mock'));
    });

    test('should request happy path tests', () => {
      const code = 'function greet(name) { return `Hello, ${name}`; }';
      const prompt = generateTestsPrompt(code, 'javascript', 'greet.js');
      
      assert.ok(prompt.toLowerCase().includes('happy path'));
    });

    test('should request AAA pattern', () => {
      const code = 'class Calculator {}';
      const prompt = generateTestsPrompt(code, 'javascript', 'calc.js');
      
      assert.ok(prompt.includes('Arrange-Act-Assert') || prompt.includes('AAA'));
    });

    test('should instruct to return only code', () => {
      const code = 'function test() {}';
      const prompt = generateTestsPrompt(code, 'javascript', 'test.js');
      
      assert.ok(prompt.toLowerCase().includes('only') || prompt.toLowerCase().includes('no explanation'));
    });

    test('should handle multi-line code', () => {
      const code = `function complex() {
  const x = 1;
  const y = 2;
  return x + y;
}`;
      const prompt = generateTestsPrompt(code, 'javascript', 'complex.js');
      
      assert.ok(prompt.includes(code));
      assert.ok(prompt.includes('complex.js'));
    });

    test('should capitalize language name', () => {
      const code = 'def test(): pass';
      const prompt = generateTestsPrompt(code, 'python', 'test.py');
      
      assert.ok(prompt.includes('Python'));
    });

    test('should include test framework in prompt', () => {
      const code = 'public class Test {}';
      const prompt = generateTestsPrompt(code, 'java', 'Test.java');
      
      assert.ok(prompt.includes('JUnit'));
    });
  });

  suite('Test Framework Coverage', () => {
    test('should have test framework for all supported languages', () => {
      const languages = [
        'javascript', 'typescript', 'python', 'java', 'go',
        'cpp', 'c', 'csharp', 'ruby', 'php', 'rust', 'swift', 'kotlin'
      ];

      languages.forEach(lang => {
        const framework = getTestFramework(lang);
        assert.ok(framework);
        assert.ok(framework.length > 0);
      });
    });

    test('should have test file pattern for all supported languages', () => {
      const languages = [
        'javascript', 'typescript', 'python', 'java', 'go',
        'cpp', 'c', 'csharp', 'ruby', 'php', 'rust', 'swift', 'kotlin'
      ];

      languages.forEach(lang => {
        const testFile = getTestFileName('example', lang);
        assert.ok(testFile);
        assert.ok(testFile.includes('test') || testFile.includes('Test') || testFile.includes('spec'));
      });
    });
  });

  suite('Edge Cases', () => {
    test('should handle empty code', () => {
      const prompt = generateTestsPrompt('', 'javascript', 'empty.js');
      assert.ok(prompt);
      assert.ok(prompt.includes('empty.js'));
    });

    test('should handle special characters in filename', () => {
      const testFile = getTestFileName('my-file.js', 'javascript');
      assert.ok(testFile.includes('my-file'));
    });

    test('should handle very long filenames', () => {
      const longName = 'a'.repeat(100) + '.js';
      const testFile = getTestFileName(longName, 'javascript');
      assert.ok(testFile.includes('test'));
    });
  });
});

// Made with Bob