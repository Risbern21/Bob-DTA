# Bob-DTA Extension - Technical Architecture

## High-Level Component Architecture

```mermaid
graph TB
    subgraph "VS Code Extension Host"
        EXT[Extension Activation]
        CMD[Command Registry]
        
        subgraph "Authentication Layer"
            AUTH[IBM Auth Manager]
            TOKEN[Token Manager]
            OAUTH[OAuth Server]
        end
        
        subgraph "API Layer"
            CLIENT[WatsonX API Client]
            RETRY[Retry Logic]
            ERROR[Error Handler]
        end
        
        subgraph "Feature Layer"
            DOCS[Generate Docs]
            TESTS[Generate Tests]
            ANALYZE[Analyze Code]
        end
        
        subgraph "UI Layer"
            STATUS[Status Bar]
            BUTTONS[Editor Buttons]
            PANEL[Analysis Panel]
            DIFF[Diff Editor]
        end
        
        subgraph "Storage Layer"
            SECRET[Secret Storage]
            CONFIG[Configuration]
            ENV[Environment Variables]
        end
    end
    
    subgraph "External Services"
        IBM[IBM Cloud IAM]
        WATSON[WatsonX API]
    end
    
    EXT --> CMD
    CMD --> AUTH
    CMD --> DOCS
    CMD --> TESTS
    CMD --> ANALYZE
    
    AUTH --> OAUTH
    AUTH --> TOKEN
    TOKEN --> SECRET
    
    DOCS --> CLIENT
    TESTS --> CLIENT
    ANALYZE --> CLIENT
    
    CLIENT --> RETRY
    CLIENT --> ERROR
    CLIENT --> TOKEN
    
    DOCS --> DIFF
    TESTS --> STATUS
    ANALYZE --> PANEL
    ANALYZE --> STATUS
    
    STATUS --> UI_LAYER[VS Code UI]
    BUTTONS --> UI_LAYER
    PANEL --> UI_LAYER
    
    CONFIG --> ENV
    
    OAUTH --> IBM
    CLIENT --> WATSON
    TOKEN --> IBM
```

## Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant VSCode
    participant Extension
    participant LocalServer
    participant Browser
    participant IBMCloud
    participant SecretStorage
    
    User->>VSCode: Click "Login with IBM Cloud"
    VSCode->>Extension: Execute watsonx.login
    Extension->>LocalServer: Start on port 3000-9000
    LocalServer-->>Extension: Server ready on port 5432
    
    Extension->>Browser: Open OAuth URL with redirect_uri
    Browser->>IBMCloud: GET /authorize?client_id&redirect_uri
    IBMCloud->>Browser: Show login page
    User->>Browser: Enter credentials
    Browser->>IBMCloud: Submit credentials
    IBMCloud->>Browser: Redirect to localhost:5432/callback?code=xxx
    
    Browser->>LocalServer: GET /callback?code=xxx
    LocalServer->>Extension: Pass authorization code
    Extension->>LocalServer: Shutdown server
    
    Extension->>IBMCloud: POST /token with code
    IBMCloud-->>Extension: access_token + refresh_token
    
    Extension->>SecretStorage: Store tokens
    SecretStorage-->>Extension: Stored successfully
    
    Extension->>VSCode: Show success notification
    VSCode->>User: "Authenticated with IBM Cloud ✓"
```

## API Request Flow with Token Refresh

```mermaid
sequenceDiagram
    participant Feature
    participant APIClient
    participant TokenManager
    participant SecretStorage
    participant WatsonX
    
    Feature->>APIClient: generateText(prompt)
    APIClient->>TokenManager: getAccessToken()
    TokenManager->>SecretStorage: Retrieve token
    SecretStorage-->>TokenManager: token + expiry
    
    alt Token expires in < 5 min
        TokenManager->>SecretStorage: Get refresh_token
        TokenManager->>WatsonX: POST /token (refresh)
        WatsonX-->>TokenManager: New access_token
        TokenManager->>SecretStorage: Store new token
    end
    
    TokenManager-->>APIClient: Valid access_token
    APIClient->>WatsonX: POST /text/generation
    
    alt Success
        WatsonX-->>APIClient: Generated text
        APIClient-->>Feature: Response
    else 401 Unauthorized
        APIClient->>TokenManager: refreshAccessToken()
        TokenManager->>WatsonX: POST /token (refresh)
        alt Refresh succeeds
            WatsonX-->>TokenManager: New token
            APIClient->>WatsonX: Retry request
            WatsonX-->>APIClient: Generated text
            APIClient-->>Feature: Response
        else Refresh fails
            TokenManager-->>APIClient: Refresh failed
            APIClient-->>Feature: Error: Re-login required
        end
    else Other error
        WatsonX-->>APIClient: Error response
        APIClient-->>Feature: Formatted error
    end
```

## Generate Documentation Feature Flow

```mermaid
sequenceDiagram
    actor User
    participant VSCode
    participant Extension
    participant WatsonX
    participant DiffEditor
    
    User->>VSCode: Click "Generate Docs" button
    VSCode->>Extension: Execute watsonx.generateDocs
    Extension->>Extension: Get active editor content
    Extension->>Extension: Detect language
    Extension->>Extension: Build documentation prompt
    
    Extension->>VSCode: Show status "Thinking..."
    Extension->>WatsonX: POST /text/generation
    WatsonX-->>Extension: Generated documented code
    
    Extension->>Extension: Parse response
    Extension->>DiffEditor: Show original vs documented
    DiffEditor->>VSCode: Display diff view
    
    Extension->>VSCode: Show "Apply Changes" action
    VSCode->>User: Display diff with action button
    
    alt User clicks Apply
        User->>VSCode: Click "Apply Changes"
        VSCode->>Extension: Apply documented version
        Extension->>VSCode: Update file content
        VSCode->>User: File updated
    else User closes diff
        User->>VSCode: Close diff editor
    end
```

## Generate Tests Feature Flow

```mermaid
sequenceDiagram
    actor User
    participant VSCode
    participant Extension
    participant WatsonX
    participant FileSystem
    
    User->>VSCode: Click "Generate Tests" button
    VSCode->>Extension: Execute watsonx.generateTests
    Extension->>Extension: Get active file content
    Extension->>Extension: Detect language & test framework
    Extension->>Extension: Build test generation prompt
    
    Extension->>VSCode: Show status "Thinking..."
    Extension->>WatsonX: POST /text/generation
    WatsonX-->>Extension: Generated test code
    
    Extension->>Extension: Parse response
    Extension->>Extension: Determine test file name
    Extension->>FileSystem: Create test file
    FileSystem-->>Extension: File created
    
    Extension->>VSCode: Open test file in editor
    Extension->>VSCode: Show notification "Test file created"
    VSCode->>User: Display test file
```

## Analyze Code Feature Flow

```mermaid
sequenceDiagram
    actor User
    participant VSCode
    participant Extension
    participant WatsonX
    participant Diagnostics
    participant WebView
    
    User->>VSCode: Click "Analyze Code" button
    VSCode->>Extension: Execute watsonx.analyzeCode
    Extension->>Extension: Get active file content
    Extension->>Extension: Build analysis prompt
    
    Extension->>VSCode: Show status "Thinking..."
    Extension->>WatsonX: POST /text/generation
    WatsonX-->>Extension: JSON array of issues
    
    Extension->>Extension: Parse JSON response
    
    par Create Diagnostics
        Extension->>Diagnostics: Create diagnostic for each issue
        Diagnostics->>VSCode: Show squiggly underlines
    and Show WebView
        Extension->>WebView: Create analysis panel
        WebView->>VSCode: Display issues table
    end
    
    VSCode->>User: Show inline diagnostics + panel
    
    alt User clicks issue in panel
        User->>WebView: Click table row
        WebView->>Extension: Navigate to line
        Extension->>VSCode: Move cursor to line
        VSCode->>User: Jump to issue location
    else User clicks Clear Analysis
        User->>WebView: Click "Clear Analysis"
        WebView->>Extension: Clear diagnostics
        Extension->>Diagnostics: Remove all diagnostics
        Extension->>WebView: Close panel
    end
```

## Data Flow Architecture

```mermaid
flowchart LR
    subgraph Input
        USER[User Action]
        FILE[Active File]
        CONFIG[Configuration]
    end
    
    subgraph Processing
        AUTH[Authentication]
        PROMPT[Prompt Builder]
        API[API Client]
    end
    
    subgraph External
        WATSON[WatsonX API]
    end
    
    subgraph Output
        DIFF[Diff Editor]
        NEWFILE[New Test File]
        DIAG[Diagnostics]
        PANEL[WebView Panel]
        NOTIF[Notifications]
    end
    
    USER --> AUTH
    AUTH --> API
    FILE --> PROMPT
    CONFIG --> PROMPT
    PROMPT --> API
    API --> WATSON
    WATSON --> API
    
    API --> DIFF
    API --> NEWFILE
    API --> DIAG
    API --> PANEL
    API --> NOTIF
```

## State Management

```mermaid
stateDiagram-v2
    [*] --> NotAuthenticated
    
    NotAuthenticated --> Authenticating: User clicks Login
    Authenticating --> Authenticated: OAuth success
    Authenticating --> NotAuthenticated: OAuth failed
    
    Authenticated --> Processing: User triggers feature
    Processing --> Authenticated: Success
    Processing --> Error: API error
    Error --> Authenticated: User acknowledges
    
    Authenticated --> TokenRefreshing: Token expires
    TokenRefreshing --> Authenticated: Refresh success
    TokenRefreshing --> NotAuthenticated: Refresh failed
    
    Authenticated --> NotAuthenticated: User logs out
```

## Error Handling Strategy

```mermaid
flowchart TD
    START[API Request] --> CHECK{Check Token}
    CHECK -->|Valid| CALL[Make API Call]
    CHECK -->|Expired| REFRESH[Refresh Token]
    
    REFRESH -->|Success| CALL
    REFRESH -->|Failed| LOGIN[Prompt Re-login]
    
    CALL --> RESPONSE{Response Status}
    
    RESPONSE -->|200 OK| SUCCESS[Return Data]
    RESPONSE -->|401| RETRY{Retry Count}
    RESPONSE -->|429| RATELIMIT[Show Rate Limit Error]
    RESPONSE -->|4xx/5xx| ERROR[Show Error Message]
    RESPONSE -->|Network Error| NETWORK[Show Network Error]
    
    RETRY -->|First Try| REFRESH
    RETRY -->|Already Retried| LOGIN
    
    SUCCESS --> END[Complete]
    RATELIMIT --> END
    ERROR --> END
    NETWORK --> END
    LOGIN --> END
```

## File Organization by Responsibility

```mermaid
graph LR
    subgraph "Core Extension"
        EXT[extension.ts]
    end
    
    subgraph "Authentication"
        AUTH[ibmAuth.ts]
        TOKEN[tokenManager.ts]
        SERVER[callbackServer.ts]
    end
    
    subgraph "API Integration"
        CLIENT[apiClient.ts]
        PROMPTS[prompts.ts]
        TYPES[types.ts]
    end
    
    subgraph "Features"
        DOCS[generateDocs.ts]
        TESTS[generateTests.ts]
        ANALYZE[analyzeCode.ts]
    end
    
    subgraph "UI Components"
        STATUS[statusBar.ts]
        BUTTONS[editorButtons.ts]
        PANEL[analysisPanel.ts]
    end
    
    subgraph "Utilities"
        CONFIG[config.ts]
        LOGGER[logger.ts]
        FILEUTIL[fileUtils.ts]
    end
    
    EXT --> AUTH
    EXT --> DOCS
    EXT --> TESTS
    EXT --> ANALYZE
    EXT --> STATUS
    EXT --> BUTTONS
    
    AUTH --> TOKEN
    AUTH --> SERVER
    
    DOCS --> CLIENT
    TESTS --> CLIENT
    ANALYZE --> CLIENT
    ANALYZE --> PANEL
    
    CLIENT --> PROMPTS
    CLIENT --> TYPES
    CLIENT --> TOKEN
    
    ALL[All Modules] --> CONFIG
    ALL --> LOGGER
    DOCS --> FILEUTIL
    TESTS --> FILEUTIL
```

## Security Architecture

```mermaid
flowchart TB
    subgraph "Secure Storage"
        SECRET[VS Code SecretStorage]
        ENV[.env file gitignored]
    end
    
    subgraph "Runtime Memory"
        TOKEN[Access Token]
        REFRESH[Refresh Token]
    end
    
    subgraph "Network"
        HTTPS[HTTPS Only]
        OAUTH[OAuth 2.0]
    end
    
    subgraph "Validation"
        INPUT[Input Sanitization]
        JSON[JSON Validation]
        STATE[CSRF Protection]
    end
    
    SECRET --> TOKEN
    SECRET --> REFRESH
    ENV --> CONFIG_DATA[Client Credentials]
    
    TOKEN --> HTTPS
    CONFIG_DATA --> OAUTH
    OAUTH --> HTTPS
    
    USER_INPUT[User Input] --> INPUT
    API_RESPONSE[API Response] --> JSON
    OAUTH_CALLBACK[OAuth Callback] --> STATE
```

---

## Key Design Decisions

### 1. Token Management
- **Decision:** Use VS Code SecretStorage for tokens
- **Rationale:** Encrypted, secure, platform-agnostic
- **Alternative Considered:** OS keychain (platform-specific)

### 2. OAuth Callback
- **Decision:** Local HTTP server on random port
- **Rationale:** Standard OAuth flow, no external dependencies
- **Alternative Considered:** Deep links (less reliable)

### 3. API Client Architecture
- **Decision:** Single client with retry logic
- **Rationale:** Centralized error handling, DRY principle
- **Alternative Considered:** Per-feature clients (more duplication)

### 4. Prompt Management
- **Decision:** Template strings in separate file
- **Rationale:** Easy to modify, version control friendly
- **Alternative Considered:** Inline prompts (harder to maintain)

### 5. Test File Creation
- **Decision:** Create in same directory as source
- **Rationale:** Standard convention, easy to find
- **Alternative Considered:** Separate test directory (requires project structure knowledge)

### 6. Analysis Display
- **Decision:** Both diagnostics and WebView panel
- **Rationale:** Inline + detailed view, best of both worlds
- **Alternative Considered:** Only diagnostics (less detail) or only panel (less discoverable)

### 7. Configuration Storage
- **Decision:** VS Code settings + .env for secrets
- **Rationale:** User preferences in settings, secrets in .env
- **Alternative Considered:** All in .env (less discoverable)

### 8. Error Handling
- **Decision:** Automatic retry with token refresh
- **Rationale:** Better UX, handles common auth issues
- **Alternative Considered:** Immediate error (more user friction)

---

## Performance Considerations

1. **API Calls:** Debounce auto-analyze on save (max 1 call per 5 seconds)
2. **Token Refresh:** Check expiry before each call to avoid mid-request expiry
3. **WebView:** Lazy load, only create when needed
4. **Diagnostics:** Clear old diagnostics before adding new ones
5. **File Operations:** Use streaming for large files if needed

---

## Extensibility Points

1. **New Features:** Add to features/ directory, register command
2. **New Models:** Update configuration enum, modify API client
3. **New Languages:** Add to language detection logic
4. **Custom Prompts:** User-configurable prompt templates (future)
5. **Multiple Providers:** Abstract API client interface (future)