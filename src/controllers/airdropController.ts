import { Request, Response } from 'express';
import { AirdropService } from '../services/airdropService';
import { AirdropRequest } from '../types';
import { SecurityErrorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export class AirdropController {
  private airdropService: AirdropService;

  constructor() {
    this.airdropService = new AirdropService();
  }

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
      
      // Process the airdrop
      const result = await this.airdropService.processAirdrop({
        secretCode,
        recipientAddress
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
          configuredCodes: this.airdropService.getConfiguredCodes()
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
    res.status(200).json({
      success: true,
      message: 'Airdrop service is running',
      timestamp: new Date().toISOString()
    });
  }
}
