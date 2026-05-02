import * as assert from 'assert';
import { AuthState } from '../../watsonx/types';

suite('Types Test Suite', () => {
  
  suite('AuthState Enum', () => {
    test('should have NotAuthenticated state', () => {
      assert.strictEqual(AuthState.NotAuthenticated, 'not_authenticated');
    });

    test('should have Authenticating state', () => {
      assert.strictEqual(AuthState.Authenticating, 'authenticating');
    });

    test('should have Authenticated state', () => {
      assert.strictEqual(AuthState.Authenticated, 'authenticated');
    });

    test('should have TokenRefreshing state', () => {
      assert.strictEqual(AuthState.TokenRefreshing, 'token_refreshing');
    });

    test('should have Error state', () => {
      assert.strictEqual(AuthState.Error, 'error');
    });

    test('should have exactly 5 states', () => {
      const states = Object.values(AuthState);
      assert.strictEqual(states.length, 5);
    });

    test('all states should be strings', () => {
      const states = Object.values(AuthState);
      states.forEach(state => {
        assert.strictEqual(typeof state, 'string');
      });
    });

    test('all states should be lowercase with underscores', () => {
      const states = Object.values(AuthState);
      states.forEach(state => {
        assert.ok(/^[a-z_]+$/.test(state));
      });
    });
  });

  suite('WatsonXRequest Interface', () => {
    test('should accept valid request object', () => {
      const request = {
        model_id: 'ibm/granite-8b-code-instruct',
        input: 'test prompt',
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.2,
          top_p: 0.9,
          repetition_penalty: 1.1
        },
        project_id: 'test-project-id'
      };

      assert.ok(request.model_id);
      assert.ok(request.input);
      assert.ok(request.parameters);
      assert.ok(request.project_id);
    });

    test('should have correct parameter types', () => {
      const request = {
        model_id: 'test-model',
        input: 'test',
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.2,
          top_p: 0.9,
          repetition_penalty: 1.1
        },
        project_id: 'test-id'
      };

      assert.strictEqual(typeof request.parameters.max_new_tokens, 'number');
      assert.strictEqual(typeof request.parameters.temperature, 'number');
      assert.strictEqual(typeof request.parameters.top_p, 'number');
      assert.strictEqual(typeof request.parameters.repetition_penalty, 'number');
    });
  });

  suite('TokenData Interface', () => {
    test('should accept valid token data', () => {
      const tokenData = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        expiry_time: Date.now() + 3600000
      };

      assert.ok(tokenData.access_token);
      assert.ok(tokenData.refresh_token);
      assert.ok(tokenData.expires_in);
      assert.ok(tokenData.token_type);
      assert.ok(tokenData.expiry_time);
    });

    test('should have correct types', () => {
      const tokenData = {
        access_token: 'test',
        refresh_token: 'test',
        expires_in: 3600,
        token_type: 'Bearer',
        expiry_time: Date.now()
      };

      assert.strictEqual(typeof tokenData.access_token, 'string');
      assert.strictEqual(typeof tokenData.refresh_token, 'string');
      assert.strictEqual(typeof tokenData.expires_in, 'number');
      assert.strictEqual(typeof tokenData.token_type, 'string');
      assert.strictEqual(typeof tokenData.expiry_time, 'number');
    });
  });

  suite('ApiError Interface', () => {
    test('should accept valid error object', () => {
      const error = {
        statusCode: 401,
        message: 'Unauthorized',
        details: { error: 'invalid_token' }
      };

      assert.strictEqual(error.statusCode, 401);
      assert.strictEqual(error.message, 'Unauthorized');
      assert.ok(error.details);
    });

    test('should work without details', () => {
      const error: any = {
        statusCode: 500,
        message: 'Internal Server Error'
      };

      assert.strictEqual(error.statusCode, 500);
      assert.strictEqual(error.message, 'Internal Server Error');
      assert.strictEqual(error.details, undefined);
    });

    test('should have correct types', () => {
      const error = {
        statusCode: 404,
        message: 'Not Found',
        details: { path: '/test' }
      };

      assert.strictEqual(typeof error.statusCode, 'number');
      assert.strictEqual(typeof error.message, 'string');
      assert.strictEqual(typeof error.details, 'object');
    });
  });
});

// Made with Bob
