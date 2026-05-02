/**
 * Bob-DTA VS Code Extension
 * Main entry point for the extension
 */

import * as vscode from 'vscode';
import { Logger } from './utils/logger';
import { TokenManager } from './auth/tokenManager';
import { IBMAuth } from './auth/ibmAuth';
import { StatusBar } from './ui/statusBar';
import { WatsonXApiClient } from './watsonx/apiClient';
import { GenerateDocsFeature } from './features/generateDocs';
import config from './utils/config';

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext) {
  Logger.initialize(context);
  Logger.info('Bob-DTA extension is activating...');

  try {
    // Validate configuration
    const configValidation = config.validateConfig();
    if (!configValidation.valid) {
      Logger.warn('Configuration validation failed', configValidation.errors);
      vscode.window.showWarningMessage(
        'Bob-DTA: Configuration incomplete. Please check your .env file and VS Code settings.',
        'Show Output'
      ).then(selection => {
        if (selection === 'Show Output') {
          Logger.show();
        }
      });
    }

    // Initialize core components
    TokenManager.initialize(context);
    const auth = IBMAuth.initialize(context);
    const statusBar = StatusBar.initialize(context);
    WatsonXApiClient.getInstance();
    const docsFeature = GenerateDocsFeature.getInstance();

    // Update status bar based on auth state
    const isAuthenticated = await auth.isAuthenticated();
    statusBar.updateForState(isAuthenticated ? 
      (await import('./watsonx/types')).AuthState.Authenticated : 
      (await import('./watsonx/types')).AuthState.NotAuthenticated
    );

    // Listen to auth state changes
    auth.onStateChange((state) => {
      statusBar.updateForState(state);
    });

    // Register commands
    
    // Login command
    const loginCommand = vscode.commands.registerCommand('watsonx.login', async () => {
      Logger.info('Login command triggered');
      try {
        await auth.login();
      } catch (error) {
        Logger.error('Login command failed', error);
      }
    });

    // Logout command
    const logoutCommand = vscode.commands.registerCommand('watsonx.logout', async () => {
      Logger.info('Logout command triggered');
      try {
        await auth.logout();
      } catch (error) {
        Logger.error('Logout command failed', error);
      }
    });

    // Generate Documentation command
    const generateDocsCommand = vscode.commands.registerCommand('watsonx.generateDocs', async () => {
      Logger.info('Generate Docs command triggered');
      try {
        await docsFeature.generateDocumentation();
      } catch (error) {
        Logger.error('Generate Docs command failed', error);
      }
    });

    // Add commands to subscriptions
    context.subscriptions.push(
      loginCommand,
      logoutCommand,
      generateDocsCommand
    );

    Logger.info('Bob-DTA extension activated successfully');
    
    // Show welcome message on first activation
    const hasShownWelcome = context.globalState.get<boolean>('hasShownWelcome', false);
    if (!hasShownWelcome) {
      const action = await vscode.window.showInformationMessage(
        'Welcome to Bob-DTA! AI-powered code documentation using IBM watsonx.ai.',
        'Get Started',
        'Dismiss'
      );
      
      if (action === 'Get Started') {
        if (!isAuthenticated) {
          await vscode.commands.executeCommand('watsonx.login');
        } else {
          vscode.window.showInformationMessage(
            'You\'re already logged in! Open a code file and click the "Generate Docs" button in the editor toolbar.'
          );
        }
      }
      
      await context.globalState.update('hasShownWelcome', true);
    }

  } catch (error) {
    Logger.error('Failed to activate extension', error);
    vscode.window.showErrorMessage(
      `Bob-DTA: Failed to activate extension. ${(error as Error).message}`
    );
  }
}

/**
 * Extension deactivation
 */
export function deactivate() {
  Logger.info('Bob-DTA extension is deactivating...');
}

// Made with Bob
