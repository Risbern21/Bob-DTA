/**
 * Generate Documentation Feature
 * Generates comprehensive documentation for code files
 */

import * as vscode from 'vscode';
import { WatsonXApiClient } from '../watsonx/apiClient';
import { generateDocsPrompt, isLanguageSupported, getLanguageName } from '../watsonx/prompts';
import { StatusBar } from '../ui/statusBar';
import { IBMAuth } from '../auth/ibmAuth';
import { AuthState } from '../watsonx/types';
import { Logger } from '../utils/logger';

export class GenerateDocsFeature {
  private static instance: GenerateDocsFeature;
  private apiClient: WatsonXApiClient;
  private statusBar: StatusBar;
  private auth: IBMAuth;

  private constructor() {
    this.apiClient = WatsonXApiClient.getInstance();
    this.statusBar = StatusBar.getInstance();
    this.auth = IBMAuth.getInstance();
  }

  public static getInstance(): GenerateDocsFeature {
    if (!GenerateDocsFeature.instance) {
      GenerateDocsFeature.instance = new GenerateDocsFeature();
    }
    return GenerateDocsFeature.instance;
  }

  /**
   * Generate documentation for the active editor
   */
  public async generateDocumentation(): Promise<void> {
    try {
      // Check authentication
      const isAuthenticated = await this.auth.isAuthenticated();
      if (!isAuthenticated) {
        const selection = await vscode.window.showErrorMessage(
          'Please authenticate with IBM Cloud first.',
          'Login'
        );
        if (selection === 'Login') {
          await vscode.commands.executeCommand('watsonx.login');
        }
        return;
      }

      // Get active editor
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found. Please open a code file.');
        return;
      }

      const document = editor.document;
      const languageId = document.languageId;

      // Check if language is supported
      if (!isLanguageSupported(languageId)) {
        vscode.window.showWarningMessage(
          `Documentation generation for ${getLanguageName(languageId)} is not yet supported.`
        );
        return;
      }

      // Get file content
      const code = document.getText();
      if (!code.trim()) {
        vscode.window.showWarningMessage('The file is empty.');
        return;
      }

      Logger.info(`Generating documentation for ${languageId} file: ${document.fileName}`);

      // Show processing state
      this.statusBar.showProcessing('Generating documentation...');

      // Generate prompt
      const prompt = generateDocsPrompt(code, languageId);

      // Call WatsonX API
      const documentedCode = await this.apiClient.generateText(prompt);

      // Hide processing state
      this.statusBar.hideProcessing(AuthState.Authenticated);

      // Clean up the response (remove markdown code blocks if present)
      const cleanedCode = this.cleanGeneratedCode(documentedCode, languageId);

      // Show diff editor
      await this.showDiffEditor(document, cleanedCode);

      Logger.info('Documentation generated successfully');
    } catch (error) {
      this.statusBar.hideProcessing(this.auth.getState());
      Logger.error('Failed to generate documentation', error);
      
      const errorMessage = (error as Error).message;
      vscode.window.showErrorMessage(`Failed to generate documentation: ${errorMessage}`);
    }
  }

  /**
   * Clean generated code by removing markdown code blocks
   */
  private cleanGeneratedCode(generatedText: string, languageId: string): string {
    let cleaned = generatedText.trim();

    // Remove markdown code blocks
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/g;
    const match = codeBlockRegex.exec(cleaned);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }

    // Remove leading/trailing backticks if present
    cleaned = cleaned.replace(/^`+|`+$/g, '');

    return cleaned;
  }

  /**
   * Show diff editor comparing original and documented code
   */
  private async showDiffEditor(originalDocument: vscode.TextDocument, documentedCode: string): Promise<void> {
    try {
      // Create a temporary document for the documented version
      const documentedUri = vscode.Uri.parse(
        `untitled:${originalDocument.fileName}.documented${this.getFileExtension(originalDocument.fileName)}`
      );

      // Open the documented version in a new document
      const documentedDoc = await vscode.workspace.openTextDocument(documentedUri);
      const edit = new vscode.WorkspaceEdit();
      edit.insert(documentedUri, new vscode.Position(0, 0), documentedCode);
      await vscode.workspace.applyEdit(edit);

      // Show diff editor
      await vscode.commands.executeCommand(
        'vscode.diff',
        originalDocument.uri,
        documentedUri,
        `${this.getFileName(originalDocument.fileName)} ↔ Documented`,
        { preview: true }
      );

      // Show action buttons
      const action = await vscode.window.showInformationMessage(
        'Documentation generated successfully. Review the changes in the diff editor.',
        'Apply Changes',
        'Discard'
      );

      if (action === 'Apply Changes') {
        await this.applyDocumentation(originalDocument, documentedCode);
        // Close the diff editor
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        vscode.window.showInformationMessage('✓ Documentation applied successfully!');
      } else if (action === 'Discard') {
        // Close the diff editor
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    } catch (error) {
      Logger.error('Failed to show diff editor', error);
      throw error;
    }
  }

  /**
   * Apply documented code to the original file
   */
  private async applyDocumentation(document: vscode.TextDocument, documentedCode: string): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );
    edit.replace(document.uri, fullRange, documentedCode);
    await vscode.workspace.applyEdit(edit);
    await document.save();
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot) : '';
  }

  /**
   * Get filename without path
   */
  private getFileName(filepath: string): string {
    const parts = filepath.split(/[/\\]/);
    return parts[parts.length - 1];
  }
}

// Made with Bob
