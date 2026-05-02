/**
 * Text Generation Provider Interface
 * Base interface for all AI text generation providers (watsonx.ai models, Orchestrate agents, etc.)
 */

export interface ITextGenerationProvider {
  /**
   * Generate text from a prompt
   * @param prompt The input prompt text
   * @returns Promise resolving to the generated text
   * @throws Error if generation fails
   */
  generateText(prompt: string): Promise<string>;

  /**
   * Test the connection to the provider
   * @returns Promise resolving to true if connection is successful, false otherwise
   */
  testConnection(): Promise<boolean>;

  /**
   * Get the provider name for logging and identification
   * @returns The name of the provider (e.g., "WatsonX Model", "Orchestrate Agent")
   */
  getName(): string;

  /**
   * Get the provider type identifier
   * @returns The type identifier (e.g., "watsonx-model", "orchestrate-agent")
   */
  getType(): string;
}

/**
 * Provider configuration options
 */
export interface ProviderConfig {
  type: 'watsonx-model' | 'orchestrate-agent';
}

// Made with Bob