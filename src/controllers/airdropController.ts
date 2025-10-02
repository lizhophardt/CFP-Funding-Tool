import { Request, Response } from 'express';
import { AirdropService } from '../services/airdropService';
import { ServiceContainer } from '../services/serviceContainer';
import { AirdropRequest } from '../types';
import { SecurityErrorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';

/**
 * AirdropController handles HTTP requests for airdrop operations.
 * 
 * This controller provides REST API endpoints for:
 * - Processing airdrop claims
 * - Checking service status
 * - Health monitoring
 * - Test code generation
 * 
 * All requests undergo comprehensive input validation and security scanning
 * before being processed by the underlying services.
 */
export class AirdropController {
  private airdropService: AirdropService;

  /**
   * Creates a new AirdropController instance.
   * 
   * Automatically initializes the airdrop service through dependency injection
   * via the ServiceContainer singleton pattern.
   */
  constructor() {
    this.airdropService = ServiceContainer.getInstance().getAirdropService();
  }

  /**
   * Handles airdrop claim requests.
   * 
   * Processes POST requests to claim dual token airdrops (wxHOPR + xDai).
   * Performs comprehensive validation and security checks before processing.
   * 
   * @param req - Express request object containing secretCode and recipientAddress
   * @param res - Express response object for sending results
   * 
   * @example
   * POST /api/airdrop/claim
   * {
   *   "secretCode": "DontTellUncleSam",
   *   "recipientAddress": "0x742d35Cc6634C0532925a3b8D8B9B3a8d8b8B3a8"
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "message": "Dual airdrop sent successfully",
   *   "wxHOPRTransactionHash": "0x...",
   *   "xDaiTransactionHash": "0x...",
   *   "wxHOPRAmount": "10000000000000000",
   *   "xDaiAmount": "10000000000000000"
   * }
   */
  async claimAirdrop(req: Request, res: Response): Promise<void> {
    try {
      const { secretCode, recipientAddress }: AirdropRequest = req.body;
      
      logger.airdrop('info', 'Claim request received', {
        recipient: recipientAddress,
        secretCodeLength: secretCode?.length || 0,
        validation: req.validationMeta?.validated ? 'PASSED' : 'UNKNOWN',
        securityRisk: req.validationMeta?.securityRisk || 'UNKNOWN',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.processing('Processing airdrop request...');
      
      // Process the airdrop with metadata
      const result = await this.airdropService.processAirdrop({
        secretCode,
        recipientAddress
      }, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      const statusCode = result.success ? 200 : 400;
      
      if (result.success) {
        logger.airdrop('info', 'Airdrop successful', {
          wxHOPRAmount: result.wxHOPRAmount,
          xDaiAmount: result.xDaiAmount,
          wxHOPRTransactionHash: result.wxHOPRTransactionHash,
          xDaiTransactionHash: result.xDaiTransactionHash,
          recipient: recipientAddress
        });
      } else {
        logger.airdrop('warn', 'Airdrop failed', {
          reason: result.message,
          recipient: recipientAddress
        });
      }
      
      res.status(statusCode).json(result);

    } catch (error) {
      logger.airdrop('error', 'Airdrop processing error', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      const sanitizedError = SecurityErrorHandler.sanitizeForAPI(error);
      res.status(500).json(sanitizedError);
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.airdropService.getServiceStatus();
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      const sanitizedError = SecurityErrorHandler.sanitizeForAPI(error);
      res.status(500).json(sanitizedError);
    }
  }

  async generateTestCode(req: Request, res: Response): Promise<void> {
    try {
      const { prefix } = req.body;
      
      logger.airdrop('info', 'Test code generation request', {
        prefix: prefix || 'TestCode',
        ip: req.ip
      });

      const secretCode = this.airdropService.generateTestCode(prefix);
      
      logger.success(`Test secret code generated: ${secretCode}`);
      
      res.status(200).json({
        success: true,
        data: {
          secretCode,
          note: 'For production, use database-managed secret codes'
        }
      });

    } catch (error) {
      logger.airdrop('error', 'Test code generation error', {
        error: error instanceof Error ? error.message : error
      });
      const sanitizedError = SecurityErrorHandler.sanitizeForAPI(error);
      res.status(500).json(sanitizedError);
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const serviceContainer = ServiceContainer.getInstance();
      const healthStatus = await serviceContainer.healthCheck();
      const airdropHealth = await this.airdropService.getDatabaseHealth();
      
      const isHealthy = healthStatus.database.isHealthy && 
                       healthStatus.services.initialized &&
                       airdropHealth.isHealthy;

      res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        message: isHealthy ? 'All services are healthy' : 'Some services are unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          database: healthStatus.database,
          services: healthStatus.services,
          airdropService: airdropHealth
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
