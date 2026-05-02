/**
 * Token Manager
 * Handles secure storage and refresh of IBM Cloud access tokens
 */

import * as vscode from 'vscode';
import { TokenData } from '../watsonx/types';
import { Logger } from '../utils/logger';
import config from '../utils/config';

export class TokenManager {
  private static instance: TokenManager;
  private context: vscode.ExtensionContext;
  private readonly ACCESS_TOKEN_KEY = 'ibm_access_token';
  private readonly REFRESH_TOKEN_KEY = 'ibm_refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'ibm_token_expiry';

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
   * Store tokens securely in VS Code SecretStorage
   */
  public async storeTokens(tokenData: TokenData): Promise<void> {
    try {
      await this.context.secrets.store(this.ACCESS_TOKEN_KEY, tokenData.access_token);
      await this.context.secrets.store(this.REFRESH_TOKEN_KEY, tokenData.refresh_token);
      await this.context.secrets.store(this.TOKEN_EXPIRY_KEY, tokenData.expiry_time.toString());
      
      Logger.info('Tokens stored successfully');
    } catch (error) {
      Logger.error('Failed to store tokens', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Get access token, automatically refreshing if needed
   */
  public async getAccessToken(): Promise<string | null> {
    try {
      const accessToken = await this.context.secrets.get(this.ACCESS_TOKEN_KEY);
      const expiryTimeStr = await this.context.secrets.get(this.TOKEN_EXPIRY_KEY);

      if (!accessToken || !expiryTimeStr) {
        Logger.info('No stored access token found');
        return null;
      }

      const expiryTime = parseInt(expiryTimeStr, 10);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // If token expires in less than 5 minutes, refresh it
      if (expiryTime - now < fiveMinutes) {
        Logger.info('Access token expiring soon, refreshing...');
        const newToken = await this.refreshAccessToken();
        return newToken;
      }

      return accessToken;
    } catch (error) {
      Logger.error('Failed to get access token', error);
      return null;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  public async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await this.context.secrets.get(this.REFRESH_TOKEN_KEY);
      
      if (!refreshToken) {
        Logger.warn('No refresh token available');
        return null;
      }

      const authConfig = config.getIBMAuthConfig();
      
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: authConfig.clientId,
        client_secret: authConfig.clientSecret
      });

      Logger.info('Refreshing access token...');
      const response = await fetch(authConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error('Token refresh failed', { status: response.status, error: errorText });
        
        // If refresh fails, clear all tokens
        await this.clearTokens();
        return null;
      }

      const data: any = await response.json();
      
      const tokenData: TokenData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken, // Some APIs don't return new refresh token
        expires_in: data.expires_in,
        token_type: data.token_type,
        expiry_time: Date.now() + (data.expires_in * 1000)
      };

      await this.storeTokens(tokenData);
      Logger.info('Access token refreshed successfully');
      
      return tokenData.access_token;
    } catch (error) {
      Logger.error('Failed to refresh access token', error);
      await this.clearTokens();
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    const accessToken = await this.context.secrets.get(this.ACCESS_TOKEN_KEY);
    const refreshToken = await this.context.secrets.get(this.REFRESH_TOKEN_KEY);
    return !!(accessToken && refreshToken);
  }

  /**
   * Clear all stored tokens
   */
  public async clearTokens(): Promise<void> {
    try {
      await this.context.secrets.delete(this.ACCESS_TOKEN_KEY);
      await this.context.secrets.delete(this.REFRESH_TOKEN_KEY);
      await this.context.secrets.delete(this.TOKEN_EXPIRY_KEY);
      Logger.info('Tokens cleared');
    } catch (error) {
      Logger.error('Failed to clear tokens', error);
      throw new Error('Failed to clear authentication tokens');
    }
  }

  /**
   * Get token expiry time
   */
  public async getTokenExpiry(): Promise<number | null> {
    const expiryTimeStr = await this.context.secrets.get(this.TOKEN_EXPIRY_KEY);
    return expiryTimeStr ? parseInt(expiryTimeStr, 10) : null;
  }
}

// Made with Bob
