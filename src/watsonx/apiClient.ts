/**
 * WatsonX API Client
 * Handles all API calls to IBM watsonx.ai with retry logic and error handling
 */

import { TokenManager } from '../auth/tokenManager';
import { WatsonXRequest, WatsonXResponse, ApiError } from './types';
import { Logger } from '../utils/logger';
import config from '../utils/config';

export class WatsonXApiClient {
  private static instance: WatsonXApiClient;
  private tokenManager: TokenManager;
  private retryCount = 0;
  private readonly MAX_RETRIES = 1;

  private constructor() {
    this.tokenManager = TokenManager.getInstance();
  }

  public static getInstance(): WatsonXApiClient {
    if (!WatsonXApiClient.instance) {
      WatsonXApiClient.instance = new WatsonXApiClient();
    }
    return WatsonXApiClient.instance;
  }

  /**
   * Generate text using WatsonX API
   */
  public async generateText(prompt: string): Promise<string> {
    try {
      const watsonxConfig = config.getWatsonXConfig();
      const accessToken = await this.tokenManager.getAccessToken();

      if (!accessToken) {
        throw new Error('Not authenticated. Please log in first.');
      }

      const request: WatsonXRequest = {
        model_id: watsonxConfig.model,
        input: prompt,
        parameters: {
          max_new_tokens: 2000,  // Increased for test generation
          temperature: 0.3,       // Slightly higher for more creative output
          top_p: 0.95,            // Increased for more diverse output
          repetition_penalty: 1.05 // Reduced to allow similar test patterns
        },
        project_id: watsonxConfig.projectId
      };

      const url = `${watsonxConfig.baseUrl}/ml/v1/text/generation?version=2023-05-29`;

      Logger.info('Making WatsonX API request', { model: watsonxConfig.model });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request)
      });

      // Handle different response status codes
      if (response.status === 401) {
        // Unauthorized - try to refresh token and retry once
        if (this.retryCount < this.MAX_RETRIES) {
          Logger.info('Received 401, attempting token refresh and retry');
          this.retryCount++;
          
          const newToken = await this.tokenManager.refreshAccessToken();
          if (newToken) {
            return await this.generateText(prompt);
          } else {
            throw this.createApiError(401, 'Session expired. Please log in again.');
          }
        } else {
          this.retryCount = 0;
          throw this.createApiError(401, 'Session expired. Please log in again.');
        }
      }

      if (response.status === 429) {
        // Rate limit
        this.retryCount = 0;
        throw this.createApiError(429, 'Rate limit reached. Please wait a moment and try again.');
      }

      if (!response.ok) {
        // Other errors
        const errorText = await response.text();
        Logger.error('WatsonX API error', { status: response.status, error: errorText });
        this.retryCount = 0;
        
        let errorMessage = `API error: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          // If not JSON, use the text as is
          errorMessage = errorText || errorMessage;
        }
        
        throw this.createApiError(response.status, errorMessage);
      }

      // Success - reset retry count
      this.retryCount = 0;

      const data = await response.json() as WatsonXResponse;
      
      Logger.info('WatsonX API raw response', {
        hasResults: !!data.results,
        resultsLength: data.results?.length || 0,
        fullResponse: JSON.stringify(data).substring(0, 500)
      });
      
      if (!data.results || data.results.length === 0) {
        throw new Error('No results returned from WatsonX API');
      }

      const generatedText = data.results[0].generated_text;
      
      if (!generatedText) {
        Logger.warn('WatsonX returned empty generated_text', {
          result: data.results[0]
        });
        throw new Error('WatsonX returned empty generated_text. The model may not have generated any output.');
      }
      
      Logger.info('WatsonX API request successful', {
        generatedLength: generatedText.length,
        tokenCount: data.results[0].generated_token_count,
        preview: generatedText.substring(0, 200)
      });

      return generatedText;
    } catch (error) {
      this.retryCount = 0;
      
      if (error instanceof Error && 'statusCode' in error) {
        // Already an ApiError, rethrow
        throw error;
      }

      // Network or other errors
      Logger.error('WatsonX API request failed', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  /**
   * Create a standardized API error
   */
  private createApiError(statusCode: number, message: string, details?: any): ApiError {
    const error = new Error(message) as any;
    error.statusCode = statusCode;
    error.message = message;
    error.details = details;
    return error as ApiError;
  }

  /**
   * Test API connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const testPrompt = 'Say "Hello" in one word.';
      await this.generateText(testPrompt);
      return true;
    } catch (error) {
      Logger.error('API connection test failed', error);
      return false;
    }
  }
}

// Made with Bob
