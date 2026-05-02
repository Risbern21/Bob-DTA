/**
 * Token Manager
 * Handles secure storage and refresh of IBM Cloud IAM access tokens.
 *
 * IBM watsonx does NOT use OAuth client_id/client_secret.
 * Instead, it uses: IBM Cloud API Key → IAM Bearer Token (expires in 1hr)
 * Refresh is done by re-exchanging the stored API key — no refresh_token needed.
 */

import * as vscode from 'vscode';
import { TokenData } from '../watsonx/types';
import { Logger } from '../utils/logger';

const IAM_TOKEN_URL = 'https://iam.cloud.ibm.com/identity/token';

export class TokenManager {
  private static instance: TokenManager;
  private context: vscode.ExtensionContext;

  // Keys for VS Code SecretStorage
  private readonly API_KEY_KEY = 'ibm_api_key';           // The long-lived IBM Cloud API key
  private readonly ACCESS_TOKEN_KEY = 'ibm_access_token'; // Short-lived IAM bearer token
  private readonly TOKEN_EXPIRY_KEY = 'ibm_token_expiry'; // Expiry timestamp (ms)

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public static initialize(context: vscode.ExtensionContext): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager(context);
    }
    return TokenManager.instance;
  }

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      throw new Error('TokenManager not initialized. Call initialize() first.');
    }
    return TokenManager.instance;
  }

  /**
   * Store the IBM Cloud API key securely.
   * This is the "credential" — never expires, used to mint new tokens.
   */
  public async storeApiKey(apiKey: string): Promise<void> {
    try {
      await this.context.secrets.store(this.API_KEY_KEY, apiKey);
      Logger.info('IBM Cloud API key stored successfully');
    } catch (error) {
      Logger.error('Failed to store API key', error);
      throw new Error('Failed to store IBM Cloud API key');
    }
  }

  /**
   * Store a fetched IAM access token and its expiry time.
   */
  public async storeTokens(tokenData: TokenData): Promise<void> {
    try {
      await this.context.secrets.store(this.ACCESS_TOKEN_KEY, tokenData.access_token);
      await this.context.secrets.store(this.TOKEN_EXPIRY_KEY, tokenData.expiry_time.toString());
      Logger.info('Access token stored successfully');
    } catch (error) {
      Logger.error('Failed to store tokens', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Get a valid access token.
   * Automatically re-exchanges the API key if the token is missing or expiring soon.
   */
  public async getAccessToken(): Promise<string | null> {
    try {
      const accessToken = await this.context.secrets.get(this.ACCESS_TOKEN_KEY);
      const expiryTimeStr = await this.context.secrets.get(this.TOKEN_EXPIRY_KEY);

      if (accessToken && expiryTimeStr) {
        const expiryTime = parseInt(expiryTimeStr, 10);
        const fiveMinutes = 5 * 60 * 1000;

        // Token still valid — return it
        if (expiryTime - Date.now() > fiveMinutes) {
          return accessToken;
        }

        Logger.info('Access token expiring soon, refreshing via API key...');
      } else {
        Logger.info('No stored access token found, fetching new one...');
      }

      // Re-exchange API key for a fresh token
      return await this.refreshAccessToken();
    } catch (error) {
      Logger.error('Failed to get access token', error);
      return null;
    }
  }

  /**
   * Fetch a new IAM access token using the stored API key.
   * IBM IAM tokens expire in 3600 seconds (1 hour).
   */
  public async refreshAccessToken(): Promise<string | null> {
    try {
      const apiKey = await this.context.secrets.get(this.API_KEY_KEY);

      if (!apiKey) {
        Logger.warn('No IBM Cloud API key found — user must log in first');
        return null;
      }

      Logger.info('Exchanging API key for IAM access token...');

      const params = new URLSearchParams({
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: apiKey
      });

      const response = await fetch(IAM_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error('IAM token exchange failed', { status: response.status, error: errorText });

        if (response.status === 400 || response.status === 401) {
          // API key is invalid — clear everything so user re-enters it
          await this.clearTokens();
          Logger.warn('API key rejected by IBM IAM — credentials cleared');
        }
        return null;
      }

      const data: any = await response.json();

      const tokenData: TokenData = {
        access_token: data.access_token,
        refresh_token: '',                                    // IBM IAM doesn't use refresh tokens
        expires_in: data.expires_in,                         // Typically 3600
        token_type: data.token_type,                         // "Bearer"
        expiry_time: Date.now() + (data.expires_in * 1000)
      };

      await this.storeTokens(tokenData);
      Logger.info('IAM access token fetched and stored successfully');

      return tokenData.access_token;
    } catch (error) {
      Logger.error('Failed to refresh access token', error);
      return null;
    }
  }

  /**
   * Check if an API key is stored (i.e. user has "logged in")
   */
  public async isAuthenticated(): Promise<boolean> {
    const apiKey = await this.context.secrets.get(this.API_KEY_KEY);
    return !!apiKey;
  }

  /**
   * Clear all stored credentials (API key + cached token)
   */
  public async clearTokens(): Promise<void> {
    try {
      await this.context.secrets.delete(this.API_KEY_KEY);
      await this.context.secrets.delete(this.ACCESS_TOKEN_KEY);
      await this.context.secrets.delete(this.TOKEN_EXPIRY_KEY);
      Logger.info('All IBM credentials cleared');
    } catch (error) {
      Logger.error('Failed to clear tokens', error);
      throw new Error('Failed to clear authentication tokens');
    }
  }

  /**
   * Get token expiry time in ms
   */
  public async getTokenExpiry(): Promise<number | null> {
    const expiryTimeStr = await this.context.secrets.get(this.TOKEN_EXPIRY_KEY);
    return expiryTimeStr ? parseInt(expiryTimeStr, 10) : null;
  }
}

// Made with Bob