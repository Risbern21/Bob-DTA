/**
 * Configuration Management
 * Handles environment variables and VS Code settings
 */

import * as vscode from 'vscode';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env from the workspace root (not cwd, which can vary in extensions)
const workspaceFolders = vscode.workspace.workspaceFolders;
const workspaceRoot = workspaceFolders?.[0]?.uri?.fsPath;
const envPath = workspaceRoot
  ? path.join(workspaceRoot, '.env')
  : path.join(__dirname, '..', '.env'); // fallback: one level above dist/

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // last-resort: use cwd
}

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
   * Get the IBM Cloud API key for IAM token exchange.
   * No longer needs client_id or client_secret — IBM watsonx uses API key auth.
   * The key is stored in VS Code SecretStorage (via TokenManager), not config files.
   * This method just validates the env fallback if someone prefers it.
   */
  public getIBMAuthConfig() {
    return {
      tokenUrl: 'https://iam.cloud.ibm.com/identity/token'
    };
  }

  /**
   * Get WatsonX configuration from VS Code settings or .env file.
   *
   * VS Code settings key: "bobDta.watsonx.projectId"  ← must match package.json contributes.configuration
   * .env fallback:         WATSONX_PROJECT_ID
   */
  public getWatsonXConfig() {
    // NOTE: The prefix here must match the "contributes.configuration" id in your package.json
    // If your extension id is "bobDta", use getConfiguration('bobDta.watsonx')
    // If it's just "watsonx", use getConfiguration('watsonx')
    const cfg = vscode.workspace.getConfiguration('bobDta.watsonx');

    const projectId =
      cfg.get<string>('projectId')?.trim() ||
      process.env.WATSONX_PROJECT_ID?.trim() ||
      '';

    const region =
      cfg.get<string>('region')?.trim() ||
      process.env.WATSONX_REGION?.trim() ||
      'us-south';

    const model =
      cfg.get<string>('model')?.trim() ||
      process.env.WATSONX_MODEL?.trim() ||
      'ibm/granite-8b-code-instruct';

    if (!projectId) {
      throw new Error(
        'WatsonX Project ID not found.\n\n' +
        'Option 1 — Add to your .env file:\n' +
        '  WATSONX_PROJECT_ID=your-project-id\n\n' +
        'Option 2 — Add to VS Code settings.json:\n' +
        '  "bobDta.watsonx.projectId": "your-project-id"\n\n' +
        'Find your Project ID at: watsonx dashboard → your project → Manage → General'
      );
    }

    return {
      projectId,
      region,
      model,
      baseUrl: this.getWatsonXBaseUrl(region)
    };
  }

  /**
   * Get WatsonX API base URL based on region
   */
  private getWatsonXBaseUrl(region: string): string {
    const regionUrls: Record<string, string> = {
      'us-south': 'https://us-south.ml.cloud.ibm.com',
      'eu-de':    'https://eu-de.ml.cloud.ibm.com',
      'jp-tok':   'https://jp-tok.ml.cloud.ibm.com',
      'eu-gb':    'https://eu-gb.ml.cloud.ibm.com'
    };

    return regionUrls[region] ?? regionUrls['us-south'];
  }

  /**
   * Validate all required config is present.
   * IBM auth credentials are now stored in SecretStorage (not validated here).
   */
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

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