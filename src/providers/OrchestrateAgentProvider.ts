/**
 * watsonx Orchestrate Agent Provider
 * Implements text generation using a deployed watsonx Orchestrate agent
 */

import { ITextGenerationProvider } from './ITextGenerationProvider';
import { OrchestrateRequest, OrchestrateResponse, OrchestrateConfig, OrchestrateError } from '../watsonx/orchestrateTypes';
import { Logger } from '../utils/logger';
import config from '../utils/config';

export class OrchestrateAgentProvider implements ITextGenerationProvider {
  private orchestrateConfig: OrchestrateConfig;
  private retryCount = 0;
  private readonly MAX_RETRIES = 2;

  constructor() {
    this.orchestrateConfig = config.getOrchestrateConfig();
  }

  /**
   * Get provider name
   */
  public getName(): string {
    return 'watsonx Orchestrate Agent';
  }

  /**
   * Get provider type
   */
  public getType(): string {
    return 'orchestrate-agent';
  }

  /**
   * Generate text using the Orchestrate agent
   */
  public async generateText(prompt: string): Promise<string> {
    try {
      // Validate configuration
      this.validateConfig();

      const url = `${this.orchestrateConfig.instanceUrl}/v1/agents/${this.orchestrateConfig.agentId}/invoke`;

      const request: OrchestrateRequest = {
        input: {
          text: prompt
        }
      };

      Logger.info('Making Orchestrate Agent API request', {
        agentId: this.orchestrateConfig.agentId,
        promptLength: prompt.length
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.orchestrateConfig.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request)
      });

      // Handle different response status codes
      if (response.status === 401) {
        throw this.createError(401, 'Invalid API key. Please check your ORCHESTRATE_API_KEY in .env file.');
      }

      if (response.status === 404) {
        throw this.createError(404, 'Agent not found. Please verify your ORCHESTRATE_AGENT_ID.');
      }

      if (response.status === 429) {
        // Rate limit - retry with exponential backoff
        if (this.retryCount < this.MAX_RETRIES) {
          this.retryCount++;
          const delay = Math.pow(2, this.retryCount) * 1000;
          Logger.info(`Rate limited, retrying in ${delay}ms (attempt ${this.retryCount}/${this.MAX_RETRIES})`);
          await this.sleep(delay);
          return await this.generateText(prompt);
        } else {
          this.retryCount = 0;
          throw this.createError(429, 'Rate limit reached. Please wait a moment and try again.');
        }
      }

      if (!response.ok) {
        // Other errors
        const errorText = await response.text();
        Logger.error('Orchestrate API error', { status: response.status, error: errorText });
        this.retryCount = 0;

        let errorMessage = `API error: ${response.statusText}`;
        try {
          const errorJson: OrchestrateError = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw this.createError(response.status, errorMessage);
      }

      // Success - reset retry count
      this.retryCount = 0;

      const data = await response.json() as OrchestrateResponse;

      Logger.info('Orchestrate API raw response', {
        hasOutput: !!data.output,
        hasText: !!data.output?.text,
        textLength: data.output?.text?.length || 0
      });

      if (!data.output || !data.output.text) {
        throw new Error('No output returned from Orchestrate agent. The agent may not have generated a response.');
      }

      const generatedText = data.output.text;

      if (!generatedText || generatedText.trim() === '') {
        Logger.warn('Orchestrate returned empty text', { response: data });
        throw new Error('Orchestrate agent returned empty text. Please try again or check your agent configuration.');
      }

      Logger.info('Orchestrate API request successful', {
        generatedLength: generatedText.length,
        preview: generatedText.substring(0, 200)
      });

      return generatedText;
    } catch (error) {
      this.retryCount = 0;

      if (error instanceof Error && 'statusCode' in error) {
        // Already a formatted error, rethrow
        throw error;
      }

      // Network or other errors
      Logger.error('Orchestrate API request failed', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and the Orchestrate instance URL.');
      }

      throw error;
    }
  }

  /**
   * Test connection to the Orchestrate agent
   */
  public async testConnection(): Promise<boolean> {
    try {
      const testPrompt = 'Hello, this is a connection test.';
      await this.generateText(testPrompt);
      return true;
    } catch (error) {
      Logger.error('Orchestrate connection test failed', error);
      return false;
    }
  }

  /**
   * Validate Orchestrate configuration
   */
  private validateConfig(): void {
    if (!this.orchestrateConfig.instanceUrl) {
      throw new Error('ORCHESTRATE_INSTANCE_URL is not configured. Please check your .env file.');
    }

    if (!this.orchestrateConfig.agentId) {
      throw new Error('ORCHESTRATE_AGENT_ID is not configured. Please check your .env file.');
    }

    if (!this.orchestrateConfig.apiKey) {
      throw new Error('ORCHESTRATE_API_KEY is not configured. Please check your .env file.');
    }
  }

  /**
   * Create a standardized error
   */
  private createError(statusCode: number, message: string): Error {
    const error = new Error(message) as any;
    error.statusCode = statusCode;
    return error;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Made with Bob