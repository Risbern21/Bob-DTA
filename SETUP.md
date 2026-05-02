# Bob-DTA Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
IBM_CLOUD_CLIENT_ID=your_client_id_here
IBM_CLOUD_CLIENT_SECRET=your_client_secret_here
WATSONX_PROJECT_ID=your_project_id_here
WATSONX_REGION=us-south
WATSONX_MODEL=ibm/granite-8b-code-instruct
```

### 3. Compile the Extension
```bash
npm run compile
```

### 4. Test the Extension

Press **F5** in VS Code to launch the Extension Development Host.

## Getting IBM Cloud Credentials

### Option 1: IBM Cloud API Key (Recommended for Testing)

1. Go to [IBM Cloud IAM API Keys](https://cloud.ibm.com/iam/apikeys)
2. Click "Create an IBM Cloud API key"
3. Give it a name (e.g., "Bob-DTA Extension")
4. Copy the API key immediately (you won't be able to see it again)
5. Use this as your `IBM_CLOUD_CLIENT_ID` (leave `CLIENT_SECRET` empty for now)

### Option 2: OAuth Application (For Production)

1. Contact IBM Cloud support to create an OAuth application
2. Provide your redirect URI: `http://localhost:3000/callback` (or any port 3000-9000)
3. Receive your Client ID and Client Secret
4. Add both to your `.env` file

### Getting WatsonX Project ID

1. Go to [IBM watsonx.ai](https://dataplatform.cloud.ibm.com/)
2. Sign in with your IBM Cloud account
3. Create a new project or select an existing one
4. Click on the project name
5. Go to "Manage" tab
6. Copy the "Project ID"
7. Add it to your `.env` file

## Troubleshooting

### "Configuration incomplete" warning
- Check that all required variables are in your `.env` file
- Ensure there are no typos in variable names
- Restart VS Code after editing `.env`

### Compilation errors
- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and `dist` folders, then run `npm install` again
- Check that you're using Node.js 20 or higher

### Extension not loading
- Check the Output panel (View > Output > WatsonX) for errors
- Ensure the extension compiled successfully (`npm run compile`)
- Try reloading the Extension Development Host (Ctrl+R / Cmd+R)

## Development Commands

```bash
# Compile TypeScript
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Run tests
npm test

# Package extension
npm run package

# Install packaged extension
code --install-extension bob-dta-0.0.1.vsix
```

## Project Structure

```
bob-dta/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── auth/                     # Authentication modules
│   │   ├── ibmAuth.ts           # OAuth orchestration
│   │   ├── callbackServer.ts    # Local OAuth server
│   │   └── tokenManager.ts      # Token management
│   ├── watsonx/                  # WatsonX API integration
│   │   ├── apiClient.ts         # API client
│   │   ├── prompts.ts           # Prompt templates
│   │   └── types.ts             # TypeScript interfaces
│   ├── features/                 # Feature implementations
│   │   └── generateDocs.ts      # Documentation generation
│   ├── ui/                       # UI components
│   │   └── statusBar.ts         # Status bar
│   └── utils/                    # Utilities
│       ├── config.ts            # Configuration
│       └── logger.ts            # Logging
├── dist/                         # Compiled output
├── .env                          # Your credentials (gitignored)
├── .env.example                  # Template
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript config
└── webpack.config.js             # Webpack config
```

## Next Steps

1. **Test Authentication**: Run the extension and try logging in
2. **Test Documentation Generation**: Open a code file and click "Generate Docs"
3. **Check Logs**: View Output > WatsonX for detailed logs
4. **Report Issues**: Check the logs and README for troubleshooting

## Support

- Check the [README.md](README.md) for detailed documentation
- Review the [architecture documentation](bob-dta-architecture.md)
- Check the Output panel for error messages
- Ensure your IBM Cloud account has access to watsonx.ai