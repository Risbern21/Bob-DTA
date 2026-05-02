/**
 * Provider Factory
 * Creates the appropriate text generation provider based on configuration
 */

import { ITextGenerationProvider } from './ITextGenerationProvider';
import { WatsonXModelProvider } from './WatsonXModelProvider';
import { OrchestrateAgentProvider } from './OrchestrateAgentProvider';
import { Logger } from '../utils/logger';
import config from '../utils/config';

export class ProviderFactory {
  private static cachedProvider: ITextGenerationProvider | null = null;

  /**
   * Create and return the configured text generation provider
   * Uses caching to avoid recreating providers unnecessarily
   */
  public static createProvider(): ITextGenerationProvider {
    // Return cached provider if available
    if (this.cachedProvider) {
      return this.cachedProvider;
    }

    const providerType = config.getProviderType();
    Logger.info(`Creating provider: ${providerType}`);

    let provider: ITextGenerationProvider;

    switch (providerType) {
      case 'watsonx-model':
        provider = new WatsonXModelProvider();
        break;

      case 'orchestrate-agent':
        provider = new OrchestrateAgentProvider();
        break;

      default:
        Logger.warn(`Unknown provider type: ${providerType}, falling back to watsonx-model`);
        provider = new WatsonXModelProvider();
    }

    Logger.info(`Provider created: ${provider.getName()} (${provider.getType()})`);
    
    // Cache the provider
    this.cachedProvider = provider;
    
    return provider;
  }

  /**
   * Get the current provider without creating a new one
   * Returns null if no provider has been created yet
   */
  public static getCurrentProvider(): ITextGenerationProvider | null {
    return this.cachedProvider;
  }

  /**
   * Clear the cached provider
   * Useful when configuration changes and a new provider needs to be created
   */
  public static clearCache(): void {
    Logger.info('Clearing provider cache');
    this.cachedProvider = null;
  }

  /**
   * Reset and create a new provider
   * Useful when switching between providers
   */
  public static resetProvider(): ITextGenerationProvider {
    this.clearCache();
    return this.createProvider();
  }
}

// Made with Bob