import express, { Response } from 'express';
import { config } from '../../config/env';

const router = express.Router();

// VULNERABLE: Exposes environment configuration (API8)
router.get('/config', (req, res: Response) => {
    // VULNERABLE: Returns sensitive configuration including secrets
    res.json({
        nodeEnv: config.nodeEnv,
        port: config.port,
        databasePath: config.databasePath,
        jwtSecret: config.jwtSecret, // CRITICAL: Exposes JWT secret!
        weakJwtSecret: config.weakJwtSecret,
        corsOrigin: config.corsOrigin,
        uploadDir: config.uploadDir,
        maxFileSize: config.maxFileSize,
        // Add CTF flag for exposing sensitive configuration
        flag: 'GTX{d3bug_3ndp01nt_3xp0s3d}'
    });
});

// VULNERABLE: Detailed health check exposing internal info (API8)
router.get('/health', (req, res: Response) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: process.env, // CRITICAL: Exposes all environment variables!
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
    });
});

export default router;
