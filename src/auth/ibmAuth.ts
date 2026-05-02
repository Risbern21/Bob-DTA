/**
 * IBM Authentication Module
 * Orchestrates the OAuth 2.0 flow with IBM Cloud IAM
 */

import * as vscode from 'vscode';
import { CallbackServer } from './callbackServer';
import { TokenManager } from './tokenManager';
import { TokenData, AuthState } from '../watsonx/types';
import { Logger } from '../utils/logger';
import config from '../utils/config';

export class IBMAuth {
  private static instance: IBMAuth;
  private callbackServer: CallbackServer;
  private tokenManager: TokenManager;
  private currentState: AuthState = AuthState.NotAuthenticated;
  private stateChangeEmitter = new vscode.EventEmitter<AuthState>();
  public readonly onStateChange = this.stateChangeEmitter.event;

  private constructor(context: vscode.ExtensionContext) {
    this.callbackServer = new CallbackServer();
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
   * Initiate the OAuth login flow
   */
  public async login(): Promise<boolean> {
    try {
      this.setState(AuthState.Authenticating);
      Logger.info('Starting OAuth login flow');

      // Validate configuration
      const authConfig = config.getIBMAuthConfig();

      // Start the local callback server
      const port = await this.callbackServer.start();
      const redirectUri = this.callbackServer.getRedirectUri();

      // Build authorization URL
      const authUrl = this.buildAuthorizationUrl(authConfig, redirectUri);

      // Open browser for user to authenticate
      Logger.info('Opening browser for authentication');
      const opened = await vscode.env.openExternal(vscode.Uri.parse(authUrl));
      
      if (!opened) {
        throw new Error('Failed to open browser for authentication');
      }

      // Show info message
      vscode.window.showInformationMessage(
        'Opening browser for IBM Cloud authentication. Please complete the login process.',
        'Cancel'
      ).then(selection => {
        if (selection === 'Cancel') {
          this.callbackServer.stop();
          this.setState(AuthState.NotAuthenticated);
        }
      });

      // Wait for callback with authorization code
      const authCode = await this.callbackServer.waitForCallback();

      // Stop the callback server
      await this.callbackServer.stop();

      // Exchange authorization code for tokens
      Logger.info('Exchanging authorization code for tokens');
      const tokenData = await this.exchangeCodeForTokens(authCode, redirectUri, authConfig);

      // Store tokens
      await this.tokenManager.storeTokens(tokenData);

      this.setState(AuthState.Authenticated);
      vscode.window.showInformationMessage('✓ Authenticated with IBM Cloud successfully!');
      
      return true;
    } catch (error) {
      Logger.error('Login failed', error);
      this.setState(AuthState.Error);
      
      await this.callbackServer.stop();
      
      vscode.window.showErrorMessage(
        `Authentication failed: ${(error as Error).message}`,
        'Retry'
      ).then(selection => {
        if (selection === 'Retry') {
          this.login();
        }
      });
      
      return false;
    }
  }

  /**
   * Logout and clear stored credentials
   */
  public async logout(): Promise<void> {
    try {
      Logger.info('Logging out');
      await this.tokenManager.clearTokens();
      this.setState(AuthState.NotAuthenticated);
      vscode.window.showInformationMessage('Logged out successfully');
    } catch (error) {
      Logger.error('Logout failed', error);
      vscode.window.showErrorMessage('Failed to logout');
    }
  }

  /**
   * Check if user is authenticated
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
   * Build the OAuth authorization URL
   */
  private buildAuthorizationUrl(authConfig: any, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: authConfig.clientId,
      redirect_uri: redirectUri,
      scope: authConfig.scope,
      state: this.generateState() // CSRF protection
    });

    return `${authConfig.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    authConfig: any
  ): Promise<TokenData> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: authConfig.clientId,
      client_secret: authConfig.clientSecret
    });

    const response = await fetch(authConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      Logger.error('Token exchange failed', { status: response.status, error: errorText });
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data: any = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      expiry_time: Date.now() + (data.expires_in * 1000)
    };
  }

  /**
   * Generate a random state parameter for CSRF protection
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

// Made with Bob
