/**
 * Logger Utility
 * Provides consistent logging throughout the extension
 */

import * as vscode from 'vscode';

export class Logger {
  private static outputChannel: vscode.OutputChannel;

  public static initialize(context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel('WatsonX');
    context.subscriptions.push(this.outputChannel);
  }

  public static info(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[INFO ${timestamp}] ${message}`;
    this.outputChannel.appendLine(formattedMessage);
    if (args.length > 0) {
      this.outputChannel.appendLine(JSON.stringify(args, null, 2));
    }
  }

  public static error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[ERROR ${timestamp}] ${message}`;
    this.outputChannel.appendLine(formattedMessage);
    if (error) {
      if (error instanceof Error) {
        this.outputChannel.appendLine(`  ${error.message}`);
        if (error.stack) {
          this.outputChannel.appendLine(`  Stack: ${error.stack}`);
        }
      } else {
        this.outputChannel.appendLine(JSON.stringify(error, null, 2));
      }
    }
  }

  public static warn(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[WARN ${timestamp}] ${message}`;
    this.outputChannel.appendLine(formattedMessage);
    if (args.length > 0) {
      this.outputChannel.appendLine(JSON.stringify(args, null, 2));
    }
  }

  public static debug(message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[DEBUG ${timestamp}] ${message}`;
    this.outputChannel.appendLine(formattedMessage);
    if (args.length > 0) {
      this.outputChannel.appendLine(JSON.stringify(args, null, 2));
    }
  }

  public static show() {
    this.outputChannel.show();
  }
}

// Made with Bob
