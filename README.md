# DTA

DTA (Documentation,Unit Test generation, and Analysis) is a VS Code extension that uses IBM watsonx.ai and the Granite Code model to automatically generate comprehensive documentation, unit tests, and bug analysis for your code.

## Features

### Generate Documentation
- Automatically generates comprehensive inline documentation for your code
- Supports 13+ programming languages (JavaScript, TypeScript, Python, Java, Go, C++, C#, Ruby, PHP, Rust, Swift, Kotlin, and more)
- Uses language-specific documentation formats (JSDoc, docstrings, JavaDoc, etc.)
- Shows a diff editor to review changes before applying
- Configurable output: replace original file or create separate .documented file
- Powered by IBM's Granite Code models

### Generate Unit Tests
- Automatically generates comprehensive unit test suites for your code
- Detects and uses the appropriate test framework for each language:
  - JavaScript/TypeScript → Jest
  - Python → pytest
  - Java/Kotlin → JUnit 5
  - Go → Go testing package
  - C++ → Google Test
  - C# → xUnit
  - And more...
- Generates tests with:
  - Happy path test cases
  - Edge cases and boundary conditions
  - Error handling tests
  - Mocked dependencies
  - Clear, descriptive test names
- Creates test files following language conventions:
  - `*.test.js` for JavaScript
  - `test_*.py` for Python
  - `*Test.java` for Java
  - `*_test.go` for Go
  - And more...
- Opens test file side-by-side with source code

### Analyze Bugs
- AI-powered bug detection and code analysis
- Detects logic errors, null references, security vulnerabilities, performance issues, and more
- Configurable display modes:
  - Inline comments: Add bug comments directly in code at problematic lines
  - Diagnostics panel: Show bugs in VS Code's Problems panel with navigation
  - Both: Combine inline comments and panel view
- Severity levels: error, warning, info
- Includes suggestions for fixing detected issues

### Secure Authentication
- API key authentication with IBM Cloud IAM
- Secure token storage using VS Code's SecretStorage API
- Automatic token refresh (tokens expire after 1 hour)
- Easy login/logout from the status bar

### User-Friendly Interface
- Status bar indicator showing connection status
- Editor toolbar buttons for quick access
- Visual diff editor to review generated documentation
- Side-by-side view for generated tests
- Integrated diagnostics for bug analysis
- Clear error messages and notifications

## Prerequisites

Before using DTA, you need:

1. **IBM Cloud Account**: Sign up at [cloud.ibm.com](https://cloud.ibm.com/registration)
2. **IBM Cloud API Key**: For authentication with IBM Cloud IAM
3. **WatsonX Project ID**: From [IBM watsonx.ai](https://dataplatform.cloud.ibm.com/)
4. **Node.js 20+**: For development

## Installation

### From Source

1. Clone or download this repository
2. Open the project in VS Code
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the project root (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
5. Edit `.env` and add your IBM Cloud credentials:
   ```env
   WATSONX_PROJECT_ID=your_project_id_here
   WATSONX_REGION=us-south
   WATSONX_MODEL=ibm/granite-8b-code-instruct
   ```

6. Compile the extension:
   ```bash
   npm run compile
   ```

7. Press F5 to launch the Extension Development Host

## Getting IBM Cloud Credentials

### Step 1: Create IBM Cloud Account
1. Go to [cloud.ibm.com/registration](https://cloud.ibm.com/registration)
2. Sign up for a free account

### Step 2: Get API Key
1. Go to [IBM Cloud IAM API Keys](https://cloud.ibm.com/iam/apikeys)
2. Click "Create an IBM Cloud API key"
3. Give it a name (e.g., DTA Extension")
4. Copy the API key immediately (you won't be able to see it again)
5. Store it securely - you'll use it to authenticate in VS Code

### Step 3: Get WatsonX Project ID
1. Go to [IBM watsonx.ai](https://dataplatform.cloud.ibm.com/)
2. Create or select a project
3. Go to project settings
4. Copy the Project ID

## Usage

### First Time Setup

1. Open VS Code with the
2. DTA extension installed
3. Look at the status bar (bottom left) - you'll see "WatsonX: Not logged in"
4. Click the status bar item or run command: `WatsonX: Login with IBM Cloud`
5. Enter your IBM Cloud API key when prompted
6. The extension will authenticate and you should see "WatsonX: Connected" in the status bar

### Generating Documentation

1. Open any code file (JavaScript, TypeScript, Python, Java, Go, C++, C#, etc.)
2. Click the "Generate Docs" button in the editor toolbar (top right)
   - Or use Command Palette: `WatsonX: Generate Documentation`
3. Wait for the AI to generate documentation (usually 10-30 seconds)
4. Review the changes in the diff editor
5. Click "Apply Changes" to replace the original file, or "Save as New File" to create a .documented file
   - Configure output mode in settings: `watsonx.docsOutputMode`

#### Documentation Example

**Before:**
```javascript
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**After:**
```javascript
/**
 * Calculates the total price of all items in the array
 * @param {Array<{price: number}>} items - Array of items with price property
 * @returns {number} The sum of all item prices
 */
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Generating Unit Tests

1. Open any code file you want to test
2. Click the "Generate Tests" button in the editor toolbar (top right)
   - Or use Command Palette: `WatsonX: Generate Tests`
3. Wait for the AI to generate comprehensive tests (usually 15-45 seconds)
4. The test file will be created and opened side-by-side with your source code
5. Review and run the tests using your test framework

### Analyzing Bugs

1. Open any code file you want to analyze
2. Click the "Analyze Bugs" button in the editor toolbar (top right)
   - Or use Command Palette: `WatsonX: Analyze Bugs`
3. Wait for the AI to analyze your code (usually 10-30 seconds)
4. Based on your display mode setting:
   - **Inline mode**: Review bug comments in diff editor, click "Apply Comments" to add them
   - **Panel mode**: Check the Problems panel for detected bugs
   - **Both mode**: See bugs in both locations
5. Fix the detected issues and re-run analysis to verify

#### Bug Analysis Example

**Code with Issues:**
```javascript
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i <= items.length; i++) {  // Bug: off-by-one error
    total += items[i];
  }
  return total;
}
```

**After Analysis (Inline Mode):**
```javascript
function calculateTotal(items) {
  let total = 0;
  // BUG: Off-by-one error - loop will access items[items.length] which is undefined
  //    Suggestion: Change <= to < in the loop condition
  for (let i = 0; i <= items.length; i++) {
    total += items[i];
  }
  return total;
}
```

#### Test Generation Example

**Source Code (calculator.js):**
```javascript
function add(a, b) {
  return a + b;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error('Cannot divide by zero');
  }
  return a / b;
}
```

**Generated Tests (calculator.test.js):**
```javascript
const { add, divide } = require('./calculator');

describe('Calculator Functions', () => {
  describe('add', () => {
    test('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    test('should add negative numbers', () => {
      expect(add(-2, -3)).toBe(-5);
    });

    test('should handle zero', () => {
      expect(add(0, 5)).toBe(5);
    });
  });

  describe('divide', () => {
    test('should divide two numbers', () => {
      expect(divide(10, 2)).toBe(5);
    });

    test('should throw error when dividing by zero', () => {
      expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
    });

    test('should handle negative numbers', () => {
      expect(divide(-10, 2)).toBe(-5);
    });
  });
});
```

#### Test File Naming Conventions

The extension automatically creates test files following language-specific conventions:

| Language | Source File | Test File |
|----------|-------------|-----------|
| JavaScript | `app.js` | `app.test.js` |
| TypeScript | `utils.ts` | `utils.test.ts` |
| Python | `calculator.py` | `test_calculator.py` |
| Java | `Calculator.java` | `CalculatorTest.java` |
| Go | `handler.go` | `handler_test.go` |
| C++ | `math.cpp` | `math_test.cpp` |
| C# | `Service.cs` | `ServiceTests.cs` |
| Ruby | `parser.rb` | `parser_spec.rb` |

## Commands

Access these commands via Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

- `WatsonX: Login with IBM Cloud` - Authenticate with IBM Cloud using API key
- `WatsonX: Logout` - Clear stored credentials
- `WatsonX: Generate Documentation` - Generate docs for active file
- `WatsonX: Generate Tests` - Generate unit tests for active file
- `WatsonX: Analyze Bugs` - Analyze code for potential bugs and issues

## Configuration

Configure the extension via VS Code Settings (File > Preferences > Settings > Extensions > WatsonX):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `watsonx.projectId` | string | "" | IBM watsonx Project ID |
| `watsonx.region` | enum | "us-south" | IBM Cloud region (us-south, eu-de, jp-tok) |
| `watsonx.model` | string | "ibm/granite-8b-code-instruct" | WatsonX model to use |
| `watsonx.bugDisplayMode` | enum | "both" | How to display bugs (inline, panel, both) |
| `watsonx.docsOutputMode` | enum | "replace" | Documentation output (replace, newFile) |

## Supported Languages

| Language | Documentation Format | Test Framework |
|----------|---------------------|----------------|
| JavaScript | JSDoc | Jest |
| TypeScript | JSDoc | Jest |
| Python | Docstrings | pytest |
| Java | JavaDoc | JUnit 5 |
| Go | Go doc comments | Go testing |
| C++ | Doxygen | Google Test |
| C | Doxygen | Unity Test |
| C# | XML documentation | xUnit |
| Ruby | RDoc | RSpec |
| PHP | PHPDoc | PHPUnit |
| Rust | Rust doc comments | Rust test |
| Swift | Swift doc comments | XCTest |
| Kotlin | KDoc | JUnit 5 |

## Troubleshooting

### "Not authenticated" error
**Solution:** Click the status bar item or run `WatsonX: Login with IBM Cloud`

### "Configuration incomplete" warning
**Solution:** Check that your `.env` file has all required credentials

### Token expired
**Solution:** The extension auto-refreshes tokens. If it fails, log out and log in again.

### Rate limit reached
**Solution:** Wait a few minutes before making more requests

### Network error
**Solution:** Check your internet connection and IBM Cloud status

### Authentication fails
**Solution:** Ensure your API key is valid and has access to watsonx.ai. Check the Output panel for detailed error messages.

## Development

### Project Structure
```
dta/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── auth/
│   │   ├── ibmAuth.ts           # OAuth orchestration
│   │   ├── callbackServer.ts    # Local OAuth server
│   │   └── tokenManager.ts      # Token management
│   ├── watsonx/
│   │   ├── apiClient.ts         # WatsonX API client
│   │   ├── prompts.ts           # Prompt templates
│   │   └── types.ts             # TypeScript interfaces
│   ├── features/
│   │   ├── generateDocs.ts      # Documentation feature
│   │   ├── generateTests.ts     # Test generation feature
│   │   └── analyzeBugs.ts       # Bug analysis feature
│   ├── ui/
│   │   └── statusBar.ts         # Status bar component
│   └── utils/
│       ├── config.ts            # Configuration
│       └── logger.ts            # Logging
├── .env                          # Your credentials (gitignored)
├── .env.example                  # Template
├── package.json                  # Extension manifest
└── tsconfig.json                 # TypeScript config
```

### Build Commands
```bash
npm run compile      # Compile TypeScript
npm run watch        # Watch mode for development
npm run package      # Create .vsix package
npm test            # Run tests
```

### Debugging
1. Open project in VS Code
2. Press F5 to launch Extension Development Host
3. Set breakpoints in TypeScript files
4. Check Output panel > WatsonX for logs

## Future Enhancements
- Support for more languages
- Custom prompt templates
- Batch documentation generation
- Integration with CI/CD pipelines

## Privacy & Security

- API keys are stored securely using VS Code's SecretStorage API
- Tokens are encrypted and never logged
- All API calls use HTTPS
- No code is stored or transmitted except during API calls to IBM watsonx.ai

## License

ISC

## Support

For issues, questions, or contributions:
- Check the [Troubleshooting](#troubleshooting) section
- Review the Output panel (View > Output > WatsonX)
- Open an issue on the repository

## Credits

Built with:
- IBM watsonx.ai and Granite Code models
- VS Code Extension API
- TypeScript
- Express.js for local callback server

---

Made with Bob
