export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
};
