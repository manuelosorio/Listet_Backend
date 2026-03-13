export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    // Replace #middleware with the actual src path
    '^#middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^#services/(.*)$': '<rootDir>/src/services/$1',
    '^#utilities/(.*)$': '<rootDir>/src/utilities/$1',
    // Add any other aliases from your tsconfig here
  },
};
