/**
 * Analyze Bugs Feature
 * Detects potential bugs in code using WatsonX AI and displays them inline or in diagnostics panel
 */

import * as vscode from 'vscode';
import { WatsonXApiClient } from '../watsonx/apiClient';
import { generateBugAnalysisPrompt, isLanguageSupported } from '../watsonx/prompts';
import { StatusBar } from '../ui/statusBar';
import { IBMAuth } from '../auth/ibmAuth';
import { AuthState } from '../watsonx/types';
import { Logger } from '../utils/logger';
import config from '../utils/config';

export interface BugReport {
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export class AnalyzeBugsFeature {
  private static instance: AnalyzeBugsFeature;
  private apiClient: WatsonXApiClient;
  private statusBar: StatusBar;
  private auth: IBMAuth;
  private diagnosticCollection: vscode.DiagnosticCollection;

  private constructor() {
    this.apiClient = WatsonXApiClient.getInstance();
    this.statusBar = StatusBar.getInstance();
    this.auth = IBMAuth.getInstance();
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('watsonx-bugs');
  }

  public static getInstance(): AnalyzeBugsFeature {
    if (!AnalyzeBugsFeature.instance) {
      AnalyzeBugsFeature.instance = new AnalyzeBugsFeature();
    }
    return AnalyzeBugsFeature.instance;
  }

  /**
   * Analyze code for potential bugs
   */
  public async analyzeBugs(): Promise<void> {
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
          `Bug analysis for ${languageId} is not yet supported.`
        );
        return;
      }

      // Get file content
      const code = document.getText();
      if (!code.trim()) {
        vscode.window.showWarningMessage('The file is empty.');
        return;
      }

      Logger.info(`Analyzing bugs in ${languageId} file: ${document.fileName}`);

      // Show processing state
      this.statusBar.showProcessing('Analyzing code for bugs...');

      // Generate prompt
      const prompt = generateBugAnalysisPrompt(code, languageId);

      // Call WatsonX API
      const analysisResult = await this.apiClient.generateText(prompt);

      // Hide processing state
      this.statusBar.hideProcessing(AuthState.Authenticated);

      // Parse the bug reports from AI response
      const bugReports = this.parseBugReports(analysisResult, document);

      if (bugReports.length === 0) {
        vscode.window.showInformationMessage('✅ No bugs detected! Your code looks good.');
        this.diagnosticCollection.clear();
        return;
      }

      // Get user's display mode preference
      const displayMode = config.getBugDisplayMode();

      // Display bugs based on user preference
      if (displayMode === 'panel' || displayMode === 'both') {
        await this.showBugsInPanel(document, bugReports);
      }

      if (displayMode === 'inline' || displayMode === 'both') {
        await this.showBugsInline(document, bugReports);
      }

      Logger.info(`Bug analysis complete. Found ${bugReports.length} potential issues.`);
    } catch (error) {
      this.statusBar.hideProcessing(this.auth.getState());
      Logger.error('Failed to analyze bugs', error);
      
      const errorMessage = (error as Error).message;
      vscode.window.showErrorMessage(`Failed to analyze bugs: ${errorMessage}`);
    }
  }

  /**
   * Parse bug reports from AI response
   */
  private parseBugReports(aiResponse: string, document: vscode.TextDocument): BugReport[] {
    const bugs: BugReport[] = [];
    
    try {
      // Try to parse as JSON first (if AI returns structured data)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.map(bug => ({
            line: Math.max(1, Math.min(bug.line || 1, document.lineCount)),
            severity: bug.severity || 'warning',
            message: bug.message || 'Potential issue detected',
            suggestion: bug.suggestion
          }));
        }
      }
    } catch (e) {
      // If JSON parsing fails, fall back to text parsing
    }

    // Parse text format: "Line X: [SEVERITY] message"
    const lines = aiResponse.split('\n');
    const linePattern = /(?:line\s+)?(\d+)\s*[:：]\s*(?:\[?(error|warning|info)\]?\s*[:：]?\s*)?(.*)/i;

    for (const line of lines) {
      const match = line.match(linePattern);
      if (match) {
        const lineNum = parseInt(match[1], 10);
        const severity = (match[2]?.toLowerCase() as 'error' | 'warning' | 'info') || 'warning';
        const message = match[3]?.trim();

        if (lineNum > 0 && lineNum <= document.lineCount && message) {
          bugs.push({
            line: lineNum,
            severity,
            message,
            suggestion: undefined
          });
        }
      }
    }

    return bugs;
  }

  /**
   * Show bugs in VS Code diagnostics panel
   */
  private async showBugsInPanel(document: vscode.TextDocument, bugs: BugReport[]): Promise<void> {
    const diagnostics: vscode.Diagnostic[] = bugs.map(bug => {
      const line = document.lineAt(bug.line - 1);
      const range = new vscode.Range(
        line.range.start,
        line.range.end
      );

      const severity = bug.severity === 'error' 
        ? vscode.DiagnosticSeverity.Error
        : bug.severity === 'info'
        ? vscode.DiagnosticSeverity.Information
        : vscode.DiagnosticSeverity.Warning;

      const diagnostic = new vscode.Diagnostic(
        range,
        bug.message,
        severity
      );

      diagnostic.source = 'WatsonX AI';
      if (bug.suggestion) {
        diagnostic.relatedInformation = [
          new vscode.DiagnosticRelatedInformation(
            new vscode.Location(document.uri, range),
            `Suggestion: ${bug.suggestion}`
          )
        ];
      }

      return diagnostic;
    });

    this.diagnosticCollection.set(document.uri, diagnostics);

    vscode.window.showInformationMessage(
      `⚠️ Found ${bugs.length} potential issue(s). Check the Problems panel.`,
      'Show Problems'
    ).then(selection => {
      if (selection === 'Show Problems') {
        vscode.commands.executeCommand('workbench.actions.view.problems');
      }
    });
  }

  /**
   * Show bugs as inline comments in the code
   */
  private async showBugsInline(document: vscode.TextDocument, bugs: BugReport[]): Promise<void> {
    // Create annotated code with bug comments
    const lines = document.getText().split('\n');
    const commentStyle = this.getCommentStyle(document.languageId);

    // Sort bugs by line number in reverse order to insert from bottom to top
    const sortedBugs = [...bugs].sort((a, b) => b.line - a.line);

    for (const bug of sortedBugs) {
      const lineIndex = bug.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const indent = lines[lineIndex].match(/^\s*/)?.[0] || '';
        const bugComment = this.formatBugComment(bug, commentStyle, indent);
        lines.splice(lineIndex, 0, bugComment);
      }
    }

    const annotatedCode = lines.join('\n');

    // Show diff editor
    await this.showDiffEditor(document, annotatedCode, bugs.length);
  }

  /**
   * Get comment style for the language
   */
  private getCommentStyle(languageId: string): { start: string; end?: string } {
    const styles: { [key: string]: { start: string; end?: string } } = {
      javascript: { start: '//' },
      typescript: { start: '//' },
      python: { start: '#' },
      java: { start: '//' },
      go: { start: '//' },
      cpp: { start: '//' },
      c: { start: '//' },
      csharp: { start: '//' },
      ruby: { start: '#' },
      php: { start: '//' },
      rust: { start: '//' },
      swift: { start: '//' },
      kotlin: { start: '//' }
    };

    return styles[languageId.toLowerCase()] || { start: '//' };
  }

  /**
   * Format bug comment
   */
  private formatBugComment(bug: BugReport, commentStyle: { start: string; end?: string }, indent: string): string {
    const icon = bug.severity === 'error' ? '❌' : bug.severity === 'warning' ? '⚠️' : 'ℹ️';
    let comment = `${indent}${commentStyle.start} ${icon} BUG: ${bug.message}`;
    
    if (bug.suggestion) {
      comment += `\n${indent}${commentStyle.start}    Suggestion: ${bug.suggestion}`;
    }
    
    if (commentStyle.end) {
      comment += ` ${commentStyle.end}`;
    }
    
    return comment;
  }

  /**
   * Show diff editor comparing original and annotated code
   */
  private async showDiffEditor(
    originalDocument: vscode.TextDocument,
    annotatedCode: string,
    bugCount: number
  ): Promise<void> {
    try {
      // Create a temporary document for the annotated version
      const annotatedUri = vscode.Uri.parse(
        `untitled:${originalDocument.fileName}.bugs-annotated${this.getFileExtension(originalDocument.fileName)}`
      );

      // Open the annotated version in a new document
      const annotatedDoc = await vscode.workspace.openTextDocument(annotatedUri);
      const edit = new vscode.WorkspaceEdit();
      edit.insert(annotatedUri, new vscode.Position(0, 0), annotatedCode);
      await vscode.workspace.applyEdit(edit);

      // Show diff editor
      await vscode.commands.executeCommand(
        'vscode.diff',
        originalDocument.uri,
        annotatedUri,
        `${this.getFileName(originalDocument.fileName)} ↔ Bug Analysis`,
        { preview: true }
      );

      // Show action buttons
      const action = await vscode.window.showInformationMessage(
        `Found ${bugCount} potential bug(s). Review the annotated code in the diff editor.`,
        'Apply Comments',
        'Discard'
      );

      if (action === 'Apply Comments') {
        await this.applyAnnotations(originalDocument, annotatedCode);
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        vscode.window.showInformationMessage('✓ Bug comments applied successfully!');
      } else if (action === 'Discard') {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    } catch (error) {
      Logger.error('Failed to show diff editor', error);
      throw error;
    }
  }

  /**
   * Apply annotated code to the original file
   */
  private async applyAnnotations(document: vscode.TextDocument, annotatedCode: string): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );
    edit.replace(document.uri, fullRange, annotatedCode);
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

  /**
   * Clear diagnostics for a document
   */
  public clearDiagnostics(uri?: vscode.Uri): void {
    if (uri) {
      this.diagnosticCollection.delete(uri);
    } else {
      this.diagnosticCollection.clear();
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();
  }
}

// Made with Bob