/**
 * watsonx Orchestrate Agent Provider
 * Implements text generation using a deployed watsonx Orchestrate agent
 */

import { ITextGenerationProvider } from './ITextGenerationProvider';
import { OrchestrateConfig, OrchestrateError } from '../watsonx/orchestrateTypes';
import { Logger } from '../utils/logger';
import config from '../utils/config';

/**
 * Response shape returned by the IBM IAM token endpoint.
 */
interface IAMTokenResponse {
  access_token: string;   // Bearer token — pass in Authorization header
  refresh_token: string;  // Used to renew access without the API key
  token_type: string;     // Always "Bearer"
  expires_in: number;     // Seconds until expiry (typically 3600)
  expiration: number;     // Unix timestamp (seconds) of expiry
  scope: string;          // Granted scopes e.g. "ibm openid"
}

/**
 * Request body for POST /v1/orchestrate/runs
 */
interface OrchestrateRunRequest {
  message: {
    role: 'user';    // Always "user" for outgoing messages
    content: string; // The prompt text
  };
  agent_id: string;  // ID of the deployed Orchestrate agent
}

export class OrchestrateAgentProvider implements ITextGenerationProvider {
  private orchestrateConfig: OrchestrateConfig;
  private retryCount = 0;
  private readonly MAX_RETRIES = 2;

  // IAM token cache
  private iamToken: string | null = null;
  private iamTokenExpiry: number = 0;

  constructor() {
    this.orchestrateConfig = config.getOrchestrateConfig();
  }

  public getName(): string {
    return 'watsonx Orchestrate Agent';
  }

  public getType(): string {
    return 'orchestrate-agent';
  }

  /**
   * Exchange the IBM Cloud API key for a short-lived IAM bearer token.
   * Caches the token and reuses it until 5 minutes before expiry.
   */
  private async getIAMToken(): Promise<string> {
    const now = Date.now();

    if (this.iamToken && now < this.iamTokenExpiry) {
      return this.iamToken;
    }

    const iamResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${this.orchestrateConfig.apiKey}`,
    });

    const iamText = await iamResponse.text();

    if (!iamResponse.ok) {
      throw new Error(`Failed to obtain IAM token (${iamResponse.status}): ${iamText}`);
    }

    const iamData = JSON.parse(iamText) as IAMTokenResponse;
    this.iamToken = iamData.access_token;
    this.iamTokenExpiry = now + (iamData.expires_in - 300) * 1000;

    Logger.info('IAM token obtained successfully', { expiresIn: iamData.expires_in });
    return this.iamToken;
  }

  /**
   * Generate text using the Orchestrate agent.
   * Calls POST /v1/orchestrate/runs with stream=true and reads the response incrementally.
   */
  public async generateText(prompt: string): Promise<string> {
    try {
      this.validateConfig();

      const url = `${this.orchestrateConfig.instanceUrl}/v1/orchestrate/runs?stream=true&stream_timeout=120000&multiple_content=true`;

      const request: OrchestrateRunRequest = {
        message: { role: 'user', content: prompt },
        agent_id: this.orchestrateConfig.agentId,
      };

      const iamToken = await this.getIAMToken();

      Logger.info('Making Orchestrate Agent API request', {
        agentId: this.orchestrateConfig.agentId,
        promptLength: prompt.length,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${iamToken}`,
          'IAM-API_KEY': this.orchestrateConfig.apiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 401) throw this.createError(401, 'Unauthorized. Check ORCHESTRATE_API_KEY in your .env file.');
        if (response.status === 404) throw this.createError(404, 'Endpoint or agent not found. Verify ORCHESTRATE_INSTANCE_URL and ORCHESTRATE_AGENT_ID.');
        if (response.status === 429) {
          if (this.retryCount < this.MAX_RETRIES) {
            this.retryCount++;
            const delay = Math.pow(2, this.retryCount) * 1000;
            Logger.info(`Rate limited, retrying in ${delay}ms (attempt ${this.retryCount}/${this.MAX_RETRIES})`);
            await this.sleep(delay);
            return await this.generateText(prompt);
          }
          this.retryCount = 0;
          throw this.createError(429, 'Rate limit reached. Please wait a moment and try again.');
        }

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

      this.retryCount = 0;

      const generatedText = await this.readStreamIncrementally(response);

      if (!generatedText || generatedText.trim() === '') {
        throw new Error('Orchestrate agent returned empty text. Please try again or check your agent configuration.');
      }

      Logger.info('Orchestrate request successful', {
        generatedLength: generatedText.length,
        preview: generatedText.substring(0, 200),
      });

      return generatedText;

    } catch (error) {
      this.retryCount = 0;
      if (error instanceof Error && 'statusCode' in error) throw error;
      Logger.error('Orchestrate API request failed', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and the Orchestrate instance URL.');
      }
      throw error;
    }
  }

  /**
   * Reads the NDJSON stream chunk-by-chunk using the ReadableStream API.
   * Waits for the agent to fully finish before returning.
   * Prefers the complete text from message.created; falls back to
   * concatenated message.delta chunks if message.created is absent.
   */
  private async readStreamIncrementally(response: Response): Promise<string> {
    if (!response.body) {
      throw new Error('Response body is null — cannot read stream.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalText = '';
    let deltaText = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer.trim()) {
          const { final, delta } = this.extractTextFromLine(buffer.trim());
          if (final) finalText = final;
          else deltaText += delta;
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const { final, delta } = this.extractTextFromLine(trimmed);
        if (final) finalText = final;
        else deltaText += delta;
      }
    }

    return finalText || deltaText;
  }

  /**
   * Parses one NDJSON line and returns extracted text separated by source.
   *
   * message.created — final complete assistant message:
   *   { event: "message.created", data: { message: { content: [{ response_type: "text", text: "..." }] } } }
   *
   * message.delta — incremental chunk streamed while agent writes:
   *   { event: "message.delta", data: { delta: { content: [{ response_type: "text", text: "..." }] } } }
   */
  private extractTextFromLine(line: string): { final: string; delta: string } {
    const jsonStr = line.startsWith('data:') ? line.slice('data:'.length).trim() : line;
    if (jsonStr === '[DONE]' || !jsonStr) return { final: '', delta: '' };

    try {
      const chunk = JSON.parse(jsonStr);
      const event: string = chunk?.event ?? '';
      const data = chunk?.data ?? {};

      if (event === 'message.created') {
        const content = data?.message?.content;
        if (Array.isArray(content)) {
          const text = content
            .filter((b: any) => b?.response_type === 'text' && b?.text)
            .map((b: any) => b.text as string)
            .join('');
          if (text) return { final: text, delta: '' };
        }
      }

      if (event === 'message.delta') {
        const content = data?.delta?.content;
        if (Array.isArray(content)) {
          const text = content
            .filter((b: any) => b?.response_type === 'text' && b?.text)
            .map((b: any) => b.text as string)
            .join('');
          if (text) return { final: '', delta: text };
        }
      }

    } catch {
      // Not JSON — safe to ignore
    }

    return { final: '', delta: '' };
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.generateText('Hello, this is a connection test.');
      return true;
    } catch (error) {
      Logger.error('Orchestrate connection test failed', error);
      return false;
    }
  }

  private validateConfig(): void {
    if (!this.orchestrateConfig.instanceUrl) throw new Error('ORCHESTRATE_INSTANCE_URL is not configured. Please check your .env file.');
    if (!this.orchestrateConfig.agentId) throw new Error('ORCHESTRATE_AGENT_ID is not configured. Please check your .env file.');
    if (!this.orchestrateConfig.apiKey) throw new Error('ORCHESTRATE_API_KEY is not configured. Please check your .env file.');
  }

  private createError(statusCode: number, message: string): Error {
    const error = new Error(message) as any;
    error.statusCode = statusCode;
    return error;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Made with Bob