import { Request, Response } from 'express';
import { AirdropService } from '../services/airdropService';
import { AirdropRequest } from '../types';

export class AirdropController {
  private airdropService: AirdropService;

  constructor() {
    this.airdropService = new AirdropService();
  }

  async claimAirdrop(req: Request, res: Response): Promise<void> {
    try {
      const { hash, recipientAddress }: AirdropRequest = req.body;

      // Validate request body
      if (!hash || !recipientAddress) {
        res.status(400).json({
          success: false,
          message: 'Both hash and recipientAddress are required'
        });
        return;
      }

      // Process the airdrop
      const result = await this.airdropService.processAirdrop({
        hash,
        recipientAddress
      });

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);

    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Internal server error: ${error}`
      });
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
      res.status(500).json({
        success: false,
        message: `Failed to get service status: ${error}`
      });
    }
  }

  async generateTestHash(req: Request, res: Response): Promise<void> {
    try {
      const { preimage } = req.body;

      if (!preimage || typeof preimage !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Preimage is required and must be a string'
        });
        return;
      }

      const hash = this.airdropService.generateTestHash(preimage);
      res.status(200).json({
        success: true,
        data: {
          preimage,
          hash
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to generate test hash: ${error}`
      });
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
