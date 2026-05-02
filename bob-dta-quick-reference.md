# Bob-DTA Extension - Quick Reference Guide

## Environment Setup

### Required Environment Variables (.env)
```bash
# IBM Cloud OAuth Credentials
IBM_CLOUD_CLIENT_ID=your_client_id_here
IBM_CLOUD_CLIENT_SECRET=your_client_secret_here

# WatsonX Configuration
WATSONX_PROJECT_ID=your_project_id_here
WATSONX_REGION=us-south
WATSONX_MODEL=ibm/granite-8b-code-instruct
```

### How to Get IBM Cloud Credentials

1. **Create IBM Cloud Account:** https://cloud.ibm.com/registration
2. **Create OAuth App:**
   - Go to: https://cloud.ibm.com/iam/apikeys
   - Create API key or OAuth application
   - Note: You may need to use IBM Cloud CLI or contact support for OAuth app creation
3. **Get WatsonX Project ID:**
   - Go to: https://dataplatform.cloud.ibm.com/
   - Create or select a project
   - Copy the Project ID from project settings

---

## Key API Endpoints

### IBM Cloud IAM
- **Authorization:** `https://iam.cloud.ibm.com/identity/authorize`
- **Token Exchange:** `https://iam.cloud.ibm.com/identity/token`
- **Token Refresh:** `https://iam.cloud.ibm.com/identity/token` (with refresh_token)

### WatsonX API
- **Base URL:** `https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29`
- **Model:** `ibm/granite-8b-code-instruct`
- **Method:** POST
- **Headers:**
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`

---

## Command Palette Commands

| Command | ID | Description |
|---------|-----|-------------|
| WatsonX: Login with IBM Cloud | `watsonx.login` | Initiate OAuth flow |
| WatsonX: Logout | `watsonx.logout` | Clear credentials |
| WatsonX: Generate Documentation | `watsonx.generateDocs` | Add docs to code |
| WatsonX: Generate Tests | `watsonx.generateTests` | Create test file |
| WatsonX: Analyze Code | `watsonx.analyzeCode` | Find issues |
| WatsonX: Clear Analysis | `watsonx.clearAnalysis` | Remove diagnostics |

---

## Configuration Settings

Access via: File > Preferences > Settings > Extensions > WatsonX

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `watsonx.projectId` | string | "" | IBM watsonx Project ID |
| `watsonx.region` | enum | "us-south" | IBM Cloud region |
| `watsonx.model` | string | "ibm/granite-8b-code-instruct" | Model to use |
| `watsonx.autoAnalyzeOnSave` | boolean | false | Auto-analyze on save |

---

## Supported Languages

| Language | Test Framework | Doc Format |
|----------|---------------|------------|
| JavaScript | Jest | JSDoc |
| TypeScript | Jest | JSDoc |
| Python | pytest | Docstrings |
| Java | JUnit | JavaDoc |
| Go | Go testing | Go doc |
| C++ | Google Test | Doxygen |
| C# | NUnit | XML docs |

---

## File Naming Conventions

### Test Files
- **JavaScript/TypeScript:** `fileName.test.js` or `fileName.spec.ts`
- **Python:** `test_fileName.py`
- **Java:** `FileNameTest.java`
- **Go:** `fileName_test.go`
- **C#:** `FileNameTests.cs`

---

## API Request Format

```json
{
  "model_id": "ibm/granite-8b-code-instruct",
  "input": "Your prompt here",
  "parameters": {
    "max_new_tokens": 1000,
    "temperature": 0.2,
    "top_p": 0.9,
    "repetition_penalty": 1.1
  },
  "project_id": "your-project-id"
}
```

---

## Error Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 401 | Unauthorized | Refresh token, retry once |
| 429 | Rate limit | Show error, wait |
| 400 | Bad request | Show error message |
| 500 | Server error | Show error, retry later |

---

## Development Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile)
npm run watch

# Run tests
npm test

# Package extension
npm run package

# Install locally
code --install-extension bob-dta-extension-0.0.1.vsix
```

---

## Debugging

1. Open project in VS Code
2. Press F5 to launch Extension Development Host
3. Set breakpoints in TypeScript files
4. Use Debug Console for logging
5. Check Output panel > WatsonX for logs

---

## Common Issues & Solutions

### Issue: "Not authenticated" error
**Solution:** Click status bar item or run "WatsonX: Login with IBM Cloud"

### Issue: Token expired
**Solution:** Extension auto-refreshes. If fails, re-login required.

### Issue: Rate limit reached
**Solution:** Wait a few minutes before making more requests

### Issue: Network error
**Solution:** Check internet connection and IBM Cloud status

### Issue: OAuth callback timeout
**Solution:** Complete login within 5 minutes, try again if timeout

---

## Testing Checklist

- [ ] OAuth login flow completes successfully
- [ ] Tokens stored securely in SecretStorage
- [ ] Token auto-refresh works before expiry
- [ ] Generate Docs creates proper documentation
- [ ] Generate Tests creates test file with correct name
- [ ] Analyze Code shows diagnostics and panel
- [ ] Status bar updates correctly
- [ ] Editor buttons appear only for code files
- [ ] Auto-analyze on save works (when enabled)
- [ ] Logout clears all credentials
- [ ] Error handling shows appropriate messages
- [ ] Configuration settings are respected

---

## Project Structure Quick Map

```
bob-dta-extension/
├── src/
│   ├── extension.ts              # Entry point - register commands
│   ├── auth/
│   │   ├── ibmAuth.ts           # OAuth orchestration
│   │   ├── callbackServer.ts    # Local server for callback
│   │   └── tokenManager.ts      # Token CRUD + refresh
│   ├── watsonx/
│   │   ├── apiClient.ts         # API calls + retry logic
│   │   ├── prompts.ts           # Prompt templates
│   │   └── types.ts             # TypeScript interfaces
│   ├── features/
│   │   ├── generateDocs.ts      # Docs feature
│   │   ├── generateTests.ts     # Tests feature
│   │   └── analyzeCode.ts       # Analysis feature
│   ├── ui/
│   │   ├── statusBar.ts         # Status bar item
│   │   ├── editorButtons.ts     # Toolbar buttons
│   │   └── analysisPanel.ts     # WebView panel
│   └── utils/
│       ├── config.ts            # Config management
│       ├── logger.ts            # Logging
│       └── fileUtils.ts         # File operations
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Template
├── package.json                  # Extension manifest
└── tsconfig.json                 # TypeScript config
```

---

## VS Code Extension API Quick Reference

### Commands
```typescript
vscode.commands.registerCommand('watsonx.login', async () => {
  // Command implementation
});
```

### Status Bar
```typescript
const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  100
);
statusBarItem.text = "$(cloud) WatsonX: Connected";
statusBarItem.show();
```

### Notifications
```typescript
vscode.window.showInformationMessage('Success!');
vscode.window.showErrorMessage('Error occurred');
vscode.window.showWarningMessage('Warning!');
```

### Secret Storage
```typescript
await context.secrets.store('key', 'value');
const value = await context.secrets.get('key');
await context.secrets.delete('key');
```

### Diagnostics
```typescript
const diagnosticCollection = vscode.languages.createDiagnosticCollection('WatsonX');
const diagnostic = new vscode.Diagnostic(
  range,
  'Issue message',
  vscode.DiagnosticSeverity.Error
);
diagnosticCollection.set(uri, [diagnostic]);
```

### Diff Editor
```typescript
await vscode.commands.executeCommand(
  'vscode.diff',
  originalUri,
  modifiedUri,
  'Original ↔ Documented'
);
```

---

## Prompt Templates Quick Reference

### Documentation Prompt
```
You are an expert software documentation writer. 
Given the following {language} code, generate comprehensive documentation 
for every function, class, and method. Use the standard docstring/comment 
format for {language}. Return only the original code with documentation 
comments added inline — do not add any explanation outside the code.

Code:
{fileContent}
```

### Test Generation Prompt
```
You are an expert software engineer specializing in test-driven 
development. Given the following {language} code, generate a comprehensive 
test suite using {testFramework}. Cover:
- Happy path tests for every function/method
- Edge cases and boundary conditions  
- Error handling and invalid input cases
- Mock any external dependencies

Return only the complete test file code, ready to run, with no explanation.

Code:
{fileContent}
```

### Code Analysis Prompt
```
You are a senior software engineer performing a thorough code review. 
Analyze the following {language} code and identify:
1. Bugs and logical errors (with line numbers where possible)
2. Security vulnerabilities  
3. Performance issues
4. Code style and maintainability problems
5. Missing error handling
6. Any anti-patterns or bad practices

Format your response as a structured JSON array like this:
[
  {
    "severity": "error|warning|info",
    "line": <line number or null>,
    "category": "bug|security|performance|style|maintainability",
    "message": "<concise issue description>",
    "suggestion": "<how to fix it>"
  }
]
Return only the JSON array, no other text.
```

---

## Security Best Practices

1. ✅ Store tokens in SecretStorage (encrypted)
2. ✅ Use .env for sensitive config (gitignored)
3. ✅ Never log tokens or secrets
4. ✅ Use HTTPS for all API calls
5. ✅ Validate OAuth state parameter (CSRF)
6. ✅ Close OAuth server after callback
7. ✅ Sanitize user input in prompts
8. ✅ Validate API responses before parsing
9. ✅ Set OAuth callback timeout (5 min)
10. ✅ Clear tokens on logout

---

## Performance Tips

1. Debounce auto-analyze on save (5 second minimum)
2. Check token expiry before API calls
3. Lazy load WebView panels
4. Clear old diagnostics before adding new
5. Use streaming for large files if needed
6. Cache configuration values
7. Reuse HTTP connections
8. Implement request queuing for rate limits

---

## Next Steps After Implementation

1. Test all features manually
2. Run unit tests
3. Test in different languages
4. Test error scenarios
5. Package extension (.vsix)
6. Install and test locally
7. Create demo video/screenshots
8. Write comprehensive README
9. Publish to VS Code Marketplace (optional)
10. Gather user feedback