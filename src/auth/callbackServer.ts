/**
 * OAuth Callback Server
 * Local HTTP server to handle OAuth redirect from IBM Cloud
 */

import express, { Application } from 'express';
import * as http from 'http';
import { Logger } from '../utils/logger';

export class CallbackServer {
  private app: Application;
  private server: http.Server | null = null;
  private port: number = 0;
  private authCodePromise: Promise<string> | null = null;
  private authCodeResolver: ((code: string) => void) | null = null;
  private authCodeRejecter: ((error: Error) => void) | null = null;
  private timeout: NodeJS.Timeout | null = null;

  constructor() {
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/', (req, res) => {
      res.send('WatsonX OAuth Callback Server is running. You can close this window.');
    });

    // OAuth callback endpoint
    this.app.get('/callback', (req, res) => {
      const code = req.query.code as string;
      const error = req.query.error as string;
      const errorDescription = req.query.error_description as string;

      if (error) {
        Logger.error('OAuth callback error', { error, errorDescription });
        res.send(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
              <h1 style="color: #d32f2f;">Authentication Failed</h1>
              <p>${errorDescription || error}</p>
              <p>You can close this window and try again.</p>
            </body>
          </html>
        `);
        
        if (this.authCodeRejecter) {
          this.authCodeRejecter(new Error(errorDescription || error));
        }
        return;
      }

      if (!code) {
        Logger.error('OAuth callback missing authorization code');
        res.send(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
              <h1 style="color: #d32f2f;">Authentication Failed</h1>
              <p>No authorization code received.</p>
              <p>You can close this window and try again.</p>
            </body>
          </html>
        `);
        
        if (this.authCodeRejecter) {
          this.authCodeRejecter(new Error('No authorization code received'));
        }
        return;
      }

      Logger.info('OAuth callback received authorization code');
      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #4caf50;">✓ Authentication Successful</h1>
            <p>You have successfully authenticated with IBM Cloud.</p>
            <p>You can close this window and return to VS Code.</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);

      if (this.authCodeResolver) {
        this.authCodeResolver(code);
      }
    });
  }

  /**
   * Start the server on a random available port
   */
  public async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      // Try ports from 3000 to 9000
      const tryPort = (port: number) => {
        this.server = this.app.listen(port, () => {
          this.port = port;
          Logger.info(`OAuth callback server started on port ${port}`);
          resolve(port);
        }).on('error', (err: any) => {
          if (err.code === 'EADDRINUSE' && port < 9000) {
            // Port in use, try next one
            tryPort(port + 1);
          } else {
            Logger.error('Failed to start OAuth callback server', err);
            reject(err);
          }
        });
      };

      tryPort(3000);
    });
  }

  /**
   * Wait for the OAuth callback with authorization code
   * Returns a promise that resolves with the auth code or rejects on timeout/error
   */
  public waitForCallback(timeoutMs: number = 300000): Promise<string> {
    this.authCodePromise = new Promise((resolve, reject) => {
      this.authCodeResolver = resolve;
      this.authCodeRejecter = reject;

      // Set timeout (default 5 minutes)
      this.timeout = setTimeout(() => {
        Logger.warn('OAuth callback timeout');
        reject(new Error('OAuth callback timeout - please try again'));
      }, timeoutMs);
    });

    // Clean up after promise settles
    this.authCodePromise.finally(() => {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
    });

    return this.authCodePromise;
  }

  /**
   * Stop the server
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          Logger.info('OAuth callback server stopped');
          this.server = null;
          this.port = 0;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get the redirect URI for OAuth
   */
  public getRedirectUri(): string {
    if (this.port === 0) {
      throw new Error('Server not started');
    }
    return `http://localhost:${this.port}/callback`;
  }

  /**
   * Get the current port
   */
  public getPort(): number {
    return this.port;
  }
}

// Made with Bob
