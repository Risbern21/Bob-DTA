# Bob-DTA - AI-Powered Code Assistant

Bob-DTA (Documentation, Test generation, and Analysis) is a VS Code extension that uses IBM watsonx.ai and the Granite Code model to automatically generate comprehensive documentation and unit tests for your code.

## Features

### 📄 Generate Documentation
- Automatically generates comprehensive inline documentation for your code
- Supports 13+ programming languages (JavaScript, TypeScript, Python, Java, Go, C++, C#, Ruby, PHP, Rust, Swift, Kotlin, and more)
- Uses language-specific documentation formats (JSDoc, docstrings, JavaDoc, etc.)
- Shows a diff editor to review changes before applying
- Powered by IBM's Granite 8B Code Instruct model

### 🧪 Generate Unit Tests ✨ NEW
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

### 🔐 Secure Authentication
- OAuth 2.0 integration with IBM Cloud IAM
- Secure token storage using VS Code's SecretStorage API
- Automatic token refresh (tokens expire after 1 hour)
- Easy login/logout from the status bar

### 🎨 User-Friendly Interface
- Status bar indicator showing connection status
- Editor toolbar buttons for quick access (📄 Docs, 🧪 Tests)
- Visual diff editor to review generated documentation
- Side-by-side view for generated tests
- Clear error messages and notifications

## Prerequisites

Before using Bob-DTA, you need:

1. **IBM Cloud Account**: Sign up at [cloud.ibm.com](https://cloud.ibm.com/registration)
2. **IBM Cloud OAuth Credentials**: Client ID and Client Secret
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
   IBM_CLOUD_CLIENT_ID=your_client_id_here
   IBM_CLOUD_CLIENT_SECRET=your_client_secret_here
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

### Step 2: Get OAuth Credentials
1. Go to [IBM Cloud IAM](https://cloud.ibm.com/iam/apikeys)
2. Create an API key or OAuth application
3. Note your Client ID and Client Secret

### Step 3: Get WatsonX Project ID
1. Go to [IBM watsonx.ai](https://dataplatform.cloud.ibm.com/)
2. Create or select a project
3. Go to project settings
4. Copy the Project ID

## Usage

### First Time Setup

1. Open VS Code with the Bob-DTA extension installed
2. Look at the status bar (bottom left) - you'll see "WatsonX: Not logged in"
3. Click the status bar item or run command: `WatsonX: Login with IBM Cloud`
4. Your browser will open for IBM Cloud authentication
5. Complete the login process
6. Return to VS Code - you should see "WatsonX: Connected" in the status bar

### Generating Documentation

1. Open any code file (JavaScript, TypeScript, Python, Java, Go, C++, C#, etc.)
2. Click the 📄 "Generate Docs" button in the editor toolbar (top right)
   - Or use Command Palette: `WatsonX: Generate Documentation`
3. Wait for the AI to generate documentation (usually 10-30 seconds)
4. Review the changes in the diff editor
5. Click "Apply Changes" to update your file, or "Discard" to cancel

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

### Generating Unit Tests ✨

1. Open any code file you want to test
2. Click the 🧪 "Generate Tests" button in the editor toolbar (top right)
   - Or use Command Palette: `WatsonX: Generate Tests`
3. Wait for the AI to generate comprehensive tests (usually 15-45 seconds)
4. The test file will be created and opened side-by-side with your source code
5. Review and run the tests using your test framework

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

- `WatsonX: Login with IBM Cloud` - Authenticate with IBM Cloud
- `WatsonX: Logout` - Clear stored credentials
- `WatsonX: Generate Documentation` - Generate docs for active file
- `WatsonX: Generate Tests` - Generate unit tests for active file

## Configuration

Configure the extension via VS Code Settings (File > Preferences > Settings > Extensions > WatsonX):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `watsonx.projectId` | string | "" | IBM watsonx Project ID |
| `watsonx.region` | enum | "us-south" | IBM Cloud region (us-south, eu-de, jp-tok) |
| `watsonx.model` | string | "ibm/granite-8b-code-instruct" | WatsonX model to use |

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

### OAuth callback timeout
**Solution:** Complete the login within 5 minutes. Try again if timeout occurs.

## Development

### Project Structure
```
bob-dta/
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
│   │   └── generateDocs.ts      # Documentation feature
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

## Roadmap

### Phase 2 (Coming Soon)
- 🧪 **Generate Tests**: Automatically create comprehensive test suites
- 🔍 **Analyze Code**: AI-powered code review with inline diagnostics

### Future Enhancements
- Support for more languages
- Custom prompt templates
- Batch documentation generation
- Integration with CI/CD pipelines

## Privacy & Security

- All credentials are stored securely using VS Code's SecretStorage API
- Tokens are encrypted and never logged
- OAuth flow uses CSRF protection
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
- Express.js for OAuth callback server

---

**Note:** This is an MVP (Minimum Viable Product) release focusing on documentation generation. Test generation and code analysis features are planned for future releases.