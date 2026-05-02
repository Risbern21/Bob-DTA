/**
 * Status Bar Component
 * Manages the status bar item showing authentication and processing states
 */

import * as vscode from 'vscode';
import { AuthState } from '../watsonx/types';
import { Logger } from '../utils/logger';

export class StatusBar {
  private static instance: StatusBar;
  private statusBarItem: vscode.StatusBarItem;
  private isProcessing: boolean = false;

  private constructor(context: vscode.ExtensionContext) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = 'watsonx.login';
    context.subscriptions.push(this.statusBarItem);
    this.updateForState(AuthState.NotAuthenticated);
    this.statusBarItem.show();
  }

  public static initialize(context: vscode.ExtensionContext): StatusBar {
    if (!StatusBar.instance) {
      StatusBar.instance = new StatusBar(context);
    }
    return StatusBar.instance;
  }

  public static getInstance(): StatusBar {
    if (!StatusBar.instance) {
      throw new Error('StatusBar not initialized. Call initialize() first.');
    }
    return StatusBar.instance;
  }

  /**
   * Update status bar based on authentication state
   */
  public updateForState(state: AuthState): void {
    Logger.debug(`Updating status bar for state: ${state}`);

    switch (state) {
      case AuthState.NotAuthenticated:
        this.statusBarItem.text = '$(cloud) WatsonX: Not logged in';
        this.statusBarItem.tooltip = 'Click to login with IBM Cloud';
        this.statusBarItem.command = 'watsonx.login';
        this.statusBarItem.backgroundColor = undefined;
        break;

      case AuthState.Authenticating:
        this.statusBarItem.text = '$(loading~spin) WatsonX: Authenticating...';
        this.statusBarItem.tooltip = 'Authenticating with IBM Cloud';
        this.statusBarItem.command = undefined;
        this.statusBarItem.backgroundColor = undefined;
        break;

      case AuthState.Authenticated:
        this.statusBarItem.text = '$(cloud) WatsonX: Connected';
        this.statusBarItem.tooltip = 'Connected to IBM watsonx.ai\nClick to logout';
        this.statusBarItem.command = 'watsonx.logout';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        break;

      case AuthState.TokenRefreshing:
        this.statusBarItem.text = '$(sync~spin) WatsonX: Refreshing token...';
        this.statusBarItem.tooltip = 'Refreshing authentication token';
        this.statusBarItem.command = undefined;
        this.statusBarItem.backgroundColor = undefined;
        break;

      case AuthState.Error:
        this.statusBarItem.text = '$(error) WatsonX: Error';
        this.statusBarItem.tooltip = 'Authentication error. Click to retry.';
        this.statusBarItem.command = 'watsonx.login';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;
    }
  }

  /**
   * Show processing state (during API calls)
   */
  public showProcessing(message: string = 'Thinking...'): void {
    this.isProcessing = true;
    this.statusBarItem.text = `$(loading~spin) WatsonX: ${message}`;
    this.statusBarItem.tooltip = 'Processing your request...';
    this.statusBarItem.command = undefined;
    Logger.debug(`Status bar showing processing: ${message}`);
  }

  /**
   * Hide processing state and restore previous state
   */
  public hideProcessing(state: AuthState): void {
    this.isProcessing = false;
    this.updateForState(state);
    Logger.debug('Status bar processing hidden');
  }

  /**
   * Check if currently showing processing state
   */
  public isShowingProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Show the status bar item
   */
  public show(): void {
    this.statusBarItem.show();
  }

  /**
   * Hide the status bar item
   */
  public hide(): void {
    this.statusBarItem.hide();
  }

  /**
   * Dispose the status bar item
   */
  public dispose(): void {
    this.statusBarItem.dispose();
  }
}

// Made with Bob
