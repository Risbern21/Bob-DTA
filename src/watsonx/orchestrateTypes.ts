/**
 * watsonx Orchestrate API Types
 * Type definitions for watsonx Orchestrate agent invocation
 */

/**
 * Orchestrate agent invocation request
 */
export interface OrchestrateRequest {
  input: {
    text: string;
  };
  // Optional parameters that may be supported by the agent
  parameters?: {
    [key: string]: any;
  };
}

/**
 * Orchestrate agent invocation response
 */
export interface OrchestrateResponse {
  output: {
    text: string;
  };
  // Additional metadata that may be returned
  metadata?: {
    agent_id?: string;
    session_id?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

/**
 * Orchestrate configuration
 */
export interface OrchestrateConfig {
  instanceUrl: string;
  agentId: string;
  apiKey: string;
}

/**
 * Orchestrate API error response
 */
export interface OrchestrateError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  statusCode?: number;
}

// Made with Bob