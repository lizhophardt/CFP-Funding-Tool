import { Request, Response, NextFunction } from 'express';

export const validateAirdropRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { secretCode, recipientAddress } = req.body;

  // Check if required fields are present
  if (!secretCode || !recipientAddress) {
    res.status(400).json({
      success: false,
      message: 'Both secretCode and recipientAddress are required'
    });
    return;
  }

  // Validate secret code format (should be non-empty string)
  if (typeof secretCode !== 'string' || secretCode.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Secret code must be a non-empty string'
    });
    return;
  }

  // Validate recipient address format (basic Ethereum address validation)
  if (typeof recipientAddress !== 'string' || !recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    res.status(400).json({
      success: false,
      message: 'Recipient address must be a valid Ethereum address (42 characters starting with 0x)'
    });
    return;
  }

  next();
};

export const validateTestHashRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { preimage } = req.body;

  if (!preimage || typeof preimage !== 'string' || preimage.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Preimage is required and must be a non-empty string'
    });
    return;
  }

  next();
};
