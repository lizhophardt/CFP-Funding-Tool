/**
 * Unit tests for AirdropController using dependency injection
 */

import { AirdropController } from '../../src/controllers/airdropController';
import { TestHelpers } from '../utils/testHelpers';
import { DIContainer } from '../../src/container/DIContainer';
import { AirdropService } from '../../src/services/airdropService';

describe('AirdropController with Dependency Injection', () => {
  let container: DIContainer;
  let controller: AirdropController;
  let mockAirdropService: jest.Mocked<AirdropService>;

  beforeEach(() => {
    // Create mock airdrop service
    mockAirdropService = {
      processAirdrop: jest.fn(),
      generateTestSecretCode: jest.fn(),
      getDatabaseHealth: jest.fn(),
    } as any;

    // Setup test container with mock services
    container = TestHelpers.setupTestContainerWithMocks({
      airdropService: mockAirdropService
    });

    // Create controller with injected dependencies
    controller = new AirdropController(container);
  });

  afterEach(() => {
    TestHelpers.cleanupTestContainer();
    jest.clearAllMocks();
  });

  describe('claimAirdrop', () => {
    it('should successfully process airdrop with mocked service', async () => {
      // Arrange
      const mockRequest = {
        body: {
          secretCode: 'TestCode1',
          recipientAddress: '0x' + '1'.repeat(40)
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent'),
        validationMeta: {
          validated: true,
          securityRisk: 'LOW' as const,
          timestamp: new Date().toISOString()
        }
      } as any;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;

      const mockAirdropResponse = {
        success: true,
        message: 'Dual airdrop sent successfully',
        wxHOPRTransactionHash: '0x' + 'a'.repeat(64),
        xDaiTransactionHash: '0x' + 'b'.repeat(64),
        wxHOPRAmount: '10000000000000000',
        xDaiAmount: '10000000000000000'
      };

      mockAirdropService.processAirdrop.mockResolvedValue(mockAirdropResponse);

      // Act
      await controller.claimAirdrop(mockRequest, mockResponse);

      // Assert
      expect(mockAirdropService.processAirdrop).toHaveBeenCalledWith(
        {
          secretCode: 'TestCode1',
          recipientAddress: '0x' + '1'.repeat(40)
        },
        {
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent'
        }
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Dual airdrop sent successfully'
        })
      );
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const mockRequest = {
        body: {
          secretCode: 'InvalidCode',
          recipientAddress: '0x' + '1'.repeat(40)
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent'),
        validationMeta: {
          validated: true,
          securityRisk: 'LOW' as const,
          timestamp: new Date().toISOString()
        }
      } as any;

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;

      const mockError = new Error('Invalid secret code');
      mockAirdropService.processAirdrop.mockRejectedValue(mockError);

      // Act
      await controller.claimAirdrop(mockRequest, mockResponse);

      // Assert
      expect(mockAirdropService.processAirdrop).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when all services are healthy', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;

      // Mock container health check
      jest.spyOn(container, 'healthCheck').mockResolvedValue({
        database: { isHealthy: true },
        services: { initialized: true }
      });

      mockAirdropService.getDatabaseHealth.mockResolvedValue({
        isHealthy: true,
        details: { message: 'Database connection is healthy' }
      });

      // Act
      await controller.healthCheck(mockRequest, mockResponse);

      // Assert
      expect(container.healthCheck).toHaveBeenCalled();
      expect(mockAirdropService.getDatabaseHealth).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'All services are healthy and running'
        })
      );
    });

    it('should return unhealthy status when services are down', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;

      // Mock unhealthy container
      jest.spyOn(container, 'healthCheck').mockResolvedValue({
        database: { isHealthy: false, details: { error: 'Database connection failed' } },
        services: { initialized: false }
      });

      mockAirdropService.getDatabaseHealth.mockResolvedValue({
        isHealthy: false,
        details: { error: 'Database connection failed' }
      });

      // Act
      await controller.healthCheck(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Some services are unhealthy'
        })
      );
    });
  });
});
