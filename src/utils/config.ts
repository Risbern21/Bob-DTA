/**
 * Configuration Management
 * Handles environment variables and VS Code settings
 */

import * as vscode from 'vscode';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config();

export class Config {
  private static instance: Config;

  private constructor() {}

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  /**
   * Get IBM Cloud OAuth configuration from environment variables
   */
  public getIBMAuthConfig() {
    const clientId = process.env.IBM_CLOUD_CLIENT_ID;
    const clientSecret = process.env.IBM_CLOUD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        'IBM Cloud credentials not found. Please set IBM_CLOUD_CLIENT_ID and IBM_CLOUD_CLIENT_SECRET in .env file'
      );
    }

    return {
      clientId,
      clientSecret,
      authorizationUrl: 'https://iam.cloud.ibm.com/identity/authorize',
      tokenUrl: 'https://iam.cloud.ibm.com/identity/token',
      scope: 'openid'
    };
  }

  /**
   * Get WatsonX configuration from VS Code settings and environment
   */
  public getWatsonXConfig() {
    const config = vscode.workspace.getConfiguration('watsonx');
    
    // Try VS Code settings first, fall back to environment variables
    const projectId = config.get<string>('projectId') || process.env.WATSONX_PROJECT_ID || '';
    const region = config.get<string>('region') || process.env.WATSONX_REGION || 'us-south';
    const model = config.get<string>('model') || process.env.WATSONX_MODEL || 'ibm/granite-34b-code-instruct';

    if (!projectId) {
      throw new Error(
        'WatsonX Project ID not found. Please set it in VS Code settings or WATSONX_PROJECT_ID in .env file'
      );
    }

    const baseUrl = this.getWatsonXBaseUrl(region);

    return {
      projectId,
      region,
      model,
      baseUrl
    };
  }

  /**
   * Get WatsonX API base URL based on region
   */
  private getWatsonXBaseUrl(region: string): string {
    const regionUrls: { [key: string]: string } = {
      'us-south': 'https://us-south.ml.cloud.ibm.com',
      'eu-de': 'https://eu-de.ml.cloud.ibm.com',
      'jp-tok': 'https://jp-tok.ml.cloud.ibm.com'
    };

    return regionUrls[region] || regionUrls['us-south'];
  }

  /**
   * Validate that all required configuration is present
   */
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.getIBMAuthConfig();
    } catch (error) {
      errors.push((error as Error).message);
    }

    try {
      this.getWatsonXConfig();
    } catch (error) {
      errors.push((error as Error).message);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default Config.getInstance();

// Made with Bob
