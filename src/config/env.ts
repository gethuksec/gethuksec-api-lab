import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Application
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',

    // Database
    databasePath: process.env.DATABASE_PATH || './data/lab.db',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    weakJwtSecret: process.env.WEAK_JWT_SECRET || 'weak-secret-for-demo',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

    // File Upload
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',

    // CORS
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',

    // Rate Limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    // External API
    mockThirdPartyApi: process.env.MOCK_THIRD_PARTY_API || 'http://localhost:3001/mock-api',

    // Security
    enableVulnerableEndpoints: process.env.ENABLE_VULNERABLE_ENDPOINTS === 'true' || true,
};

// Validate required configuration
const requiredEnvVars = ['JWT_SECRET'];

if (config.nodeEnv === 'production') {
    requiredEnvVars.forEach((envVar) => {
        if (!process.env[envVar]) {
            console.warn(`Warning: ${envVar} is not set in production environment`);
        }
    });
}
