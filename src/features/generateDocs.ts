/**
 * Generate Documentation Feature
 * Generates comprehensive documentation for code files
 */

import * as vscode from 'vscode';
import { ProviderFactory } from '../providers/ProviderFactory';
import { ITextGenerationProvider } from '../providers/ITextGenerationProvider';
import { generateDocsPrompt, isLanguageSupported, getLanguageName } from '../watsonx/prompts';
import { StatusBar } from '../ui/statusBar';
import { IBMAuth } from '../auth/ibmAuth';
import { AuthState } from '../watsonx/types';
import { Logger } from '../utils/logger';
import config from '../utils/config';

export class GenerateDocsFeature {
  private static instance: GenerateDocsFeature;
  private provider: ITextGenerationProvider;
  private statusBar: StatusBar;
  private auth: IBMAuth;

  private constructor() {
    this.provider = ProviderFactory.createProvider();
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

      // Call AI provider
      Logger.info(`Using provider: ${this.provider.getName()}`);
      const documentedCode = await this.provider.generateText(prompt);

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
      const outputMode = config.getDocsOutputMode();

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

      // Show action buttons based on output mode
      let action: string | undefined;
      if (outputMode === 'replace') {
        action = await vscode.window.showInformationMessage(
          'Documentation generated successfully. Review the changes in the diff editor.',
          'Apply Changes',
          'Discard'
        );
      } else {
        action = await vscode.window.showInformationMessage(
          'Documentation generated successfully. Review the changes in the diff editor.',
          'Save as New File',
          'Discard'
        );
      }

      if (action === 'Apply Changes') {
        await this.applyDocumentation(originalDocument, documentedCode);
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        vscode.window.showInformationMessage('✓ Documentation applied successfully!');
      } else if (action === 'Save as New File') {
        await this.saveAsNewFile(originalDocument, documentedCode);
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        vscode.window.showInformationMessage('✓ Documented file created successfully!');
      } else if (action === 'Discard') {
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
   * Save documented code as a new file
   */
  private async saveAsNewFile(originalDocument: vscode.TextDocument, documentedCode: string): Promise<void> {
    const originalPath = originalDocument.uri.fsPath;
    const ext = this.getFileExtension(originalPath);
    const baseName = originalPath.substring(0, originalPath.length - ext.length);
    const newFilePath = `${baseName}.documented${ext}`;
    const newFileUri = vscode.Uri.file(newFilePath);

    // Write the documented code to the new file
    await vscode.workspace.fs.writeFile(newFileUri, Buffer.from(documentedCode, 'utf8'));

    // Open the new file
    const newDoc = await vscode.workspace.openTextDocument(newFileUri);
    await vscode.window.showTextDocument(newDoc, {
      preview: false,
      viewColumn: vscode.ViewColumn.Beside
    });
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
