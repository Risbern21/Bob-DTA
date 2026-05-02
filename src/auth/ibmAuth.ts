/**
 * IBM Authentication Module
 * Handles IBM Cloud IAM authentication via API Key.
 *
 * IBM watsonx does NOT support standard OAuth2 authorization_code flow
 * with a client_id/client_secret for third-party apps. Instead:
 *
 *   User's IBM Cloud API Key  →  POST to IAM token endpoint  →  Bearer token
 *
 * The user generates their API key once at:
 *   https://cloud.ibm.com/iam/apikeys
 *
 * The CallbackServer is no longer needed and has been removed from this flow.
 */

import * as vscode from 'vscode';
import { TokenManager } from './tokenManager';
import { AuthState } from '../watsonx/types';
import { Logger } from '../utils/logger';

const IBM_API_KEYS_URL = 'https://cloud.ibm.com/iam/apikeys';

export class IBMAuth {
  private static instance: IBMAuth;
  private tokenManager: TokenManager;
  private currentState: AuthState = AuthState.NotAuthenticated;
  private stateChangeEmitter = new vscode.EventEmitter<AuthState>();
  public readonly onStateChange = this.stateChangeEmitter.event;

  private constructor(context: vscode.ExtensionContext) {
    this.tokenManager = TokenManager.getInstance();
    this.initializeState();
  }

  public static initialize(context: vscode.ExtensionContext): IBMAuth {
    if (!IBMAuth.instance) {
      IBMAuth.instance = new IBMAuth(context);
    }
    return IBMAuth.instance;
  }

  public static getInstance(): IBMAuth {
    if (!IBMAuth.instance) {
      throw new Error('IBMAuth not initialized. Call initialize() first.');
    }
    return IBMAuth.instance;
  }

  private async initializeState() {
    const isAuth = await this.tokenManager.isAuthenticated();
    this.currentState = isAuth ? AuthState.Authenticated : AuthState.NotAuthenticated;
    Logger.info(`Initial auth state: ${this.currentState}`);
  }

  private setState(state: AuthState) {
    this.currentState = state;
    this.stateChangeEmitter.fire(state);
    Logger.info(`Auth state changed to: ${state}`);
  }

  /**
   * Prompt the user to enter their IBM Cloud API key.
   *
   * Users can generate an API key at: https://cloud.ibm.com/iam/apikeys
   * The key is stored securely in VS Code SecretStorage and used to
   * obtain short-lived IAM Bearer tokens on demand.
   */
  public async login(): Promise<boolean> {
    try {
      this.setState(AuthState.Authenticating);
      Logger.info('Starting IBM Cloud API key login flow');

      // Offer to open IBM Cloud console so user can copy their API key
      const openBrowser = await vscode.window.showInformationMessage(
        'To authenticate with IBM watsonx, you need an IBM Cloud API key.',
        'Open IBM Cloud to get API key',
        'I already have one'
      );

      if (openBrowser === 'Open IBM Cloud to get API key') {
        await vscode.env.openExternal(vscode.Uri.parse(IBM_API_KEYS_URL));
      } else if (openBrowser === undefined) {
        // User dismissed the dialog
        this.setState(AuthState.NotAuthenticated);
        return false;
      }

      // Prompt for the API key (input is masked)
      const apiKey = await vscode.window.showInputBox({
        title: 'IBM Cloud API Key',
        prompt: 'Paste your IBM Cloud API key here',
        password: true,       // Masks the input
        ignoreFocusOut: true, // Don't close if user clicks away
        placeHolder: 'Starts with... (paste from IBM Cloud console)',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'API key cannot be empty';
          }
          if (value.trim().length < 20) {
            return 'API key looks too short — please paste the full key';
          }
          return null;
        }
      });

      if (!apiKey) {
        Logger.info('User cancelled API key input');
        this.setState(AuthState.NotAuthenticated);
        return false;
      }

      // Store the API key securely
      await this.tokenManager.storeApiKey(apiKey.trim());

      // Immediately validate by fetching a token
      Logger.info('Validating API key against IBM IAM...');
      const token = await this.tokenManager.refreshAccessToken();

      if (!token) {
        await this.tokenManager.clearTokens();
        this.setState(AuthState.Error);
        vscode.window.showErrorMessage(
          'IBM Cloud API key validation failed. Please check your key and try again.',
          'Retry'
        ).then(sel => { if (sel === 'Retry') { this.login(); } });
        return false;
      }

      this.setState(AuthState.Authenticated);
      vscode.window.showInformationMessage('✓ Authenticated with IBM watsonx successfully!');
      Logger.info('IBM Cloud authentication successful');
      return true;

    } catch (error) {
      Logger.error('Login failed', error);
      this.setState(AuthState.Error);
      vscode.window.showErrorMessage(
        `Authentication failed: ${(error as Error).message}`,
        'Retry'
      ).then(sel => { if (sel === 'Retry') { this.login(); } });
      return false;
    }
  }

  /**
   * Logout: clear stored API key and cached tokens
   */
  public async logout(): Promise<void> {
    try {
      Logger.info('Logging out — clearing IBM Cloud credentials');
      await this.tokenManager.clearTokens();
      this.setState(AuthState.NotAuthenticated);
      vscode.window.showInformationMessage('Logged out from IBM watsonx successfully');
    } catch (error) {
      Logger.error('Logout failed', error);
      vscode.window.showErrorMessage('Failed to logout');
    }
  }

  /**
   * Returns true if an API key is stored (user has authenticated)
   */
  public async isAuthenticated(): Promise<boolean> {
    return await this.tokenManager.isAuthenticated();
  }

  /**
   * Get current authentication state
   */
  public getState(): AuthState {
    return this.currentState;
  }

  /**
   * Get a valid Bearer token for use in watsonx API calls.
   * Handles auto-refresh transparently.
   */
  public async getAccessToken(): Promise<string | null> {
    return await this.tokenManager.getAccessToken();
  }
}

// Made with Bob