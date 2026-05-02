/**
 * WatsonX API Types and Interfaces
 */

export interface WatsonXRequest {
  model_id: string;
  input: string;
  parameters: {
    max_new_tokens: number;
    min_new_tokens?: number;
    temperature: number;
    top_p: number;
    repetition_penalty: number;
    stop_sequences?: string[];
    decoding_method?: string;
  };
  project_id: string;
}

export interface WatsonXResponse {
  results: Array<{
    generated_text: string;
    generated_token_count?: number;
    input_token_count?: number;
    stop_reason?: string;
  }>;
  model_id: string;
  created_at: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  expiry_time: number; // Unix timestamp
}

export interface IBMAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scope: string;
}

export interface WatsonXConfig {
  projectId: string;
  region: string;
  model: string;
  baseUrl: string;
}

export enum AuthState {
  NotAuthenticated = 'not_authenticated',
  Authenticating = 'authenticating',
  Authenticated = 'authenticated',
  TokenRefreshing = 'token_refreshing',
  Error = 'error'
}

export interface ApiError {
  statusCode: number;
  message: string;
  details?: any;
}

// Made with Bob
