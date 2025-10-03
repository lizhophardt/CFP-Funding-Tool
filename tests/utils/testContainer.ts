/**
 * Test-specific dependency injection container
 * 
 * This container provides mock services for testing purposes,
 * allowing for better isolation and control during tests.
 */

import { DIContainer } from '../../src/container/DIContainer';
import { MockDatabaseService } from '../mocks/databaseMock';
import { MockWeb3Service } from '../mocks/web3Mock';
import { SecretCodeService } from '../../src/services/secretCodeService';
import { AirdropService } from '../../src/services/airdropService';
import { DatabaseService } from '../../src/services/databaseService';
import { Web3Service } from '../../src/services/web3Service';

/**
 * Create a test container with mock services
 */
export function createTestContainer(): DIContainer {
  const container = new DIContainer();

  // Register mock database service
  container.register('databaseService', () => {
    const mockDb = new MockDatabaseService();
    mockDb.resetMockData();
    return mockDb as unknown as DatabaseService;
  });

  // Register mock web3 service
  container.register('web3Service', () => {
    return new MockWeb3Service() as unknown as Web3Service;
  });

  // Register real secret code service (using mock database)
  container.register('secretCodeService', () => {
    const databaseService = container.resolve<DatabaseService>('databaseService');
    return new SecretCodeService(databaseService);
  });

  // Register real airdrop service (using mock dependencies)
  container.register('airdropService', () => {
    const databaseService = container.resolve<DatabaseService>('databaseService');
    const web3Service = container.resolve<Web3Service>('web3Service');
    const secretCodeService = container.resolve<SecretCodeService>('secretCodeService');
    return new AirdropService(databaseService, web3Service, secretCodeService);
  });

  return container;
}

/**
 * Create a test container with custom mock services
 */
export function createTestContainerWithMocks(mocks: {
  databaseService?: any;
  web3Service?: any;
  secretCodeService?: any;
  airdropService?: any;
}): DIContainer {
  const container = new DIContainer();

  // Register provided mocks or defaults
  if (mocks.databaseService) {
    container.registerInstance('databaseService', mocks.databaseService);
  } else {
    container.register('databaseService', () => {
      const mockDb = new MockDatabaseService();
      mockDb.resetMockData();
      return mockDb as unknown as DatabaseService;
    });
  }

  if (mocks.web3Service) {
    container.registerInstance('web3Service', mocks.web3Service);
  } else {
    container.register('web3Service', () => new MockWeb3Service() as unknown as Web3Service);
  }

  if (mocks.secretCodeService) {
    container.registerInstance('secretCodeService', mocks.secretCodeService);
  } else {
    container.register('secretCodeService', () => {
      const databaseService = container.resolve<DatabaseService>('databaseService');
      return new SecretCodeService(databaseService);
    });
  }

  if (mocks.airdropService) {
    container.registerInstance('airdropService', mocks.airdropService);
  } else {
    container.register('airdropService', () => {
      const databaseService = container.resolve<DatabaseService>('databaseService');
      const web3Service = container.resolve<Web3Service>('web3Service');
      const secretCodeService = container.resolve<SecretCodeService>('secretCodeService');
      return new AirdropService(databaseService, web3Service, secretCodeService);
    });
  }

  return container;
}
