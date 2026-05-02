/**
 * Generate Tests Feature
 * Generates comprehensive unit tests for code files using WatsonX AI
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { WatsonXApiClient } from '../watsonx/apiClient';
import { generateTestsPrompt, getTestFileName, isLanguageSupported } from '../watsonx/prompts';
import { Logger } from '../utils/logger';
import { IBMAuth } from '../auth/ibmAuth';

export class GenerateTestsFeature {
  private static instance: GenerateTestsFeature;
  private apiClient: WatsonXApiClient;
  private auth: IBMAuth;

  private constructor() {
    this.apiClient = WatsonXApiClient.getInstance();
    this.auth = IBMAuth.getInstance();
  }

  public static getInstance(): GenerateTestsFeature {
    if (!GenerateTestsFeature.instance) {
      GenerateTestsFeature.instance = new GenerateTestsFeature();
    }
    return GenerateTestsFeature.instance;
  }

  /**
   * Generate unit tests for the active editor's code
   */
  public async generateTests(): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage('No active editor found. Please open a code file.');
      return;
    }

    const document = editor.document;
    const languageId = document.languageId;
    const fileName = path.basename(document.fileName);

    // Check if language is supported
    if (!isLanguageSupported(languageId)) {
      vscode.window.showWarningMessage(
        `Test generation for ${languageId} is not yet supported. Supported languages: JavaScript, TypeScript, Python, Java, Go, C++, C#, and more.`
      );
      return;
    }

    // Check authentication
    const isAuthenticated = await this.auth.isAuthenticated();
    if (!isAuthenticated) {
      const result = await vscode.window.showErrorMessage(
        'Please authenticate with IBM Cloud first.',
        'Login'
      );
      if (result === 'Login') {
        await vscode.commands.executeCommand('watsonx.login');
      }
      return;
    }

    // Get the code content
    const code = document.getText();
    if (!code.trim()) {
      vscode.window.showWarningMessage('The file is empty. Please add some code first.');
      return;
    }

    // Show progress
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Generating unit tests...',
        cancellable: false
      },
      async (progress) => {
        try {
          progress.report({ message: 'Analyzing code...' });
          Logger.info(`Generating tests for ${fileName} (${languageId})`);
          Logger.info(`Code length: ${code.length} characters`);

          // Generate the prompt
          const prompt = generateTestsPrompt(code, languageId, fileName);
          Logger.info(`Prompt generated, length: ${prompt.length} characters`);
          Logger.info(`Prompt preview: ${prompt.substring(0, 300)}...`);

          progress.report({ message: 'Calling WatsonX AI...' });

          // Call WatsonX API
          const generatedTests = await this.apiClient.generateText(prompt);
          
          Logger.info(`Received response from WatsonX, length: ${generatedTests?.length || 0}`);

          if (!generatedTests || !generatedTests.trim()) {
            Logger.error('WatsonX returned empty or whitespace-only response');
            throw new Error('WatsonX returned empty response. The model may need more context or the prompt may be too complex. Try with a smaller code file.');
          }

          progress.report({ message: 'Creating test file...' });

          // Clean up the response (remove markdown code blocks if present)
          let cleanedTests = generatedTests.trim();
          
          // Remove markdown code blocks
          const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
          const match = codeBlockRegex.exec(cleanedTests);
          if (match && match[1]) {
            cleanedTests = match[1].trim();
          }

          // Determine test file name and path
          const testFileName = getTestFileName(fileName, languageId);
          const sourceDir = path.dirname(document.uri.fsPath);
          
          // Determine test directory based on language conventions
          let testDir = sourceDir;
          
          // For some languages, tests go in a separate directory
          if (languageId === 'python') {
            // Python: tests/ or same directory
            const testsDir = path.join(path.dirname(sourceDir), 'tests');
            testDir = testsDir;
          } else if (languageId === 'java' || languageId === 'kotlin') {
            // Java/Kotlin: src/test/java or src/test/kotlin
            if (sourceDir.includes('src/main')) {
              testDir = sourceDir.replace('src/main', 'src/test');
            }
          } else if (languageId === 'go') {
            // Go: same directory as source
            testDir = sourceDir;
          } else {
            // JavaScript/TypeScript: __tests__ or same directory
            const testsDir = path.join(sourceDir, '__tests__');
            // Check if __tests__ directory exists
            try {
              await vscode.workspace.fs.stat(vscode.Uri.file(testsDir));
              testDir = testsDir;
            } catch {
              // Use same directory if __tests__ doesn't exist
              testDir = sourceDir;
            }
          }

          const testFilePath = path.join(testDir, testFileName);
          const testFileUri = vscode.Uri.file(testFilePath);

          // Create test directory if it doesn't exist
          try {
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(testDir));
          } catch (error) {
            // Directory might already exist, that's fine
          }

          // Check if test file already exists
          let shouldWrite = true;
          try {
            await vscode.workspace.fs.stat(testFileUri);
            const overwrite = await vscode.window.showWarningMessage(
              `Test file "${testFileName}" already exists. Overwrite?`,
              'Yes',
              'No'
            );
            shouldWrite = overwrite === 'Yes';
          } catch {
            // File doesn't exist, proceed
          }

          if (shouldWrite) {
            // Write the test file
            await vscode.workspace.fs.writeFile(
              testFileUri,
              Buffer.from(cleanedTests, 'utf8')
            );

            // Open the test file
            const testDoc = await vscode.workspace.openTextDocument(testFileUri);
            await vscode.window.showTextDocument(testDoc, {
              preview: false,
              viewColumn: vscode.ViewColumn.Beside
            });

            Logger.info(`Test file created: ${testFilePath}`);
            vscode.window.showInformationMessage(
              `✅ Test file created: ${testFileName}`,
              'Open Folder'
            ).then(selection => {
              if (selection === 'Open Folder') {
                vscode.commands.executeCommand('revealFileInOS', testFileUri);
              }
            });
          } else {
            vscode.window.showInformationMessage('Test generation cancelled.');
          }

        } catch (error) {
          Logger.error('Failed to generate tests', error);
          vscode.window.showErrorMessage(
            `Failed to generate tests: ${(error as Error).message}`
          );
        }
      }
    );
  }
}

// Made with Bob