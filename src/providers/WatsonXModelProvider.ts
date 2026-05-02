/**
 * watsonx.ai Model Provider
 * Implements text generation using watsonx.ai foundation models
 */

import { ITextGenerationProvider } from './ITextGenerationProvider';
import { WatsonXApiClient } from '../watsonx/apiClient';
import { Logger } from '../utils/logger';

export class WatsonXModelProvider implements ITextGenerationProvider {
  private apiClient: WatsonXApiClient;

  constructor() {
    this.apiClient = WatsonXApiClient.getInstance();
  }

  /**
   * Get provider name
   */
  public getName(): string {
    return 'watsonx.ai Foundation Model';
  }

  /**
   * Get provider type
   */
  public getType(): string {
    return 'watsonx-model';
  }

  /**
   * Generate text using watsonx.ai foundation model
   */
  public async generateText(prompt: string): Promise<string> {
    Logger.info('Using WatsonX Model Provider');
    return await this.apiClient.generateText(prompt);
  }

  /**
   * Test connection to watsonx.ai
   */
  public async testConnection(): Promise<boolean> {
    return await this.apiClient.testConnection();
  }
}

// Made with Bob