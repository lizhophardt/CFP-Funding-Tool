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
      const { secretCode, recipientAddress }: AirdropRequest = req.body;
      
      console.log(`🎯 AIRDROP CLAIM REQUEST:`);
      console.log(`   📍 Recipient: ${recipientAddress}`);
      console.log(`   🔐 Secret Code: ${secretCode}`);
      console.log(`   🕐 Time: ${new Date().toISOString()}`);

      // Validate request body
      if (!secretCode || !recipientAddress) {
        console.log(`❌ VALIDATION FAILED: Missing required fields`);
        res.status(400).json({
          success: false,
          message: 'Both secretCode and recipientAddress are required'
        });
        return;
      }

      console.log(`🔍 Processing airdrop request...`);
      
      // Process the airdrop
      const result = await this.airdropService.processAirdrop({
        secretCode,
        recipientAddress
      });

      const statusCode = result.success ? 200 : 400;
      
      if (result.success) {
        console.log(`✅ AIRDROP SUCCESS:`);
        console.log(`   💰 wxHOPR Amount: ${result.wxHOPRAmount} wei`);
        console.log(`   💰 xDai Amount: ${result.xDaiAmount} wei`);
        console.log(`   📝 wxHOPR Transaction: ${result.wxHOPRTransactionHash}`);
        console.log(`   📝 xDai Transaction: ${result.xDaiTransactionHash}`);
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

  async generateTestCode(req: Request, res: Response): Promise<void> {
    try {
      const { prefix } = req.body;
      
      console.log(`🔧 SECRET CODE GENERATION REQUEST:`);
      console.log(`   📝 Prefix: "${prefix || 'TestCode'}"`);
      console.log(`   🕐 Time: ${new Date().toISOString()}`);

      const secretCode = this.airdropService.generateTestCode(prefix);
      
      console.log(`✅ SECRET CODE GENERATED:`);
      console.log(`   🔐 Secret Code: ${secretCode}`);
      
      res.status(200).json({
        success: true,
        data: {
          secretCode,
          configuredCodes: this.airdropService.getConfiguredCodes()
        }
      });

    } catch (error) {
      console.log(`💥 SECRET CODE GENERATION ERROR: ${error}`);
      res.status(500).json({
        success: false,
        message: `Failed to generate test secret code: ${error}`
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
