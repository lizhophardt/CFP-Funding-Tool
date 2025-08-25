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
      
      console.log(`🎯 AIRDROP CLAIM REQUEST:`);
      console.log(`   📍 Recipient: ${recipientAddress}`);
      console.log(`   🔑 Hash: ${hash}`);
      console.log(`   🕐 Time: ${new Date().toISOString()}`);

      // Validate request body
      if (!hash || !recipientAddress) {
        console.log(`❌ VALIDATION FAILED: Missing required fields`);
        res.status(400).json({
          success: false,
          message: 'Both hash and recipientAddress are required'
        });
        return;
      }

      console.log(`🔍 Processing airdrop request...`);
      
      // Process the airdrop
      const result = await this.airdropService.processAirdrop({
        hash,
        recipientAddress
      });

      const statusCode = result.success ? 200 : 400;
      
      if (result.success) {
        console.log(`✅ AIRDROP SUCCESS:`);
        console.log(`   💰 Amount: ${result.amount} wei`);
        console.log(`   📝 Transaction: ${result.transactionHash}`);
        console.log(`   🎉 Message: ${result.message}`);
      } else {
        console.log(`❌ AIRDROP FAILED:`);
        console.log(`   📝 Reason: ${result.message}`);
      }
      
      res.status(statusCode).json(result);

    } catch (error) {
      console.log(`💥 AIRDROP ERROR: ${error}`);
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
      
      console.log(`🔧 HASH GENERATION REQUEST:`);
      console.log(`   📝 Preimage: "${preimage}"`);
      console.log(`   🕐 Time: ${new Date().toISOString()}`);

      if (!preimage || typeof preimage !== 'string') {
        console.log(`❌ HASH GENERATION FAILED: Invalid preimage`);
        res.status(400).json({
          success: false,
          message: 'Preimage is required and must be a string'
        });
        return;
      }

      const hash = this.airdropService.generateTestHash(preimage);
      
      console.log(`✅ HASH GENERATED:`);
      console.log(`   📝 Preimage: "${preimage}"`);
      console.log(`   🔑 Hash: ${hash}`);
      
      res.status(200).json({
        success: true,
        data: {
          preimage,
          hash
        }
      });

    } catch (error) {
      console.log(`💥 HASH GENERATION ERROR: ${error}`);
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
