import { Request, Response, NextFunction } from 'express';

export const validateAirdropRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { hash, recipientAddress } = req.body;

  // Check if required fields are present
  if (!hash || !recipientAddress) {
    res.status(400).json({
      success: false,
      message: 'Both hash and recipientAddress are required'
    });
    return;
  }

  // Validate hash format (should be hex string)
  if (typeof hash !== 'string' || !hash.match(/^(0x)?[a-fA-F0-9]{64}$/)) {
    res.status(400).json({
      success: false,
      message: 'Hash must be a 64-character hexadecimal string (with or without 0x prefix)'
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
