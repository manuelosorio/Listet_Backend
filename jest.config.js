/** @type {import('jest').Config} */
const config = {
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          target: 'es2022',
        },
        module: {
          type: 'es6',
          noInterop: false,
        },
        sourceMaps: 'inline',
      },
    ],
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  injectGlobals: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^#api/(.*)$': '<rootDir>/src/api/$1',
    '^#controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^#database/(.*)$': '<rootDir>/src/database/$1',
    '^#environments/(.*)$': '<rootDir>/src/environments/$1',
    '^#helper/(.*)$': '<rootDir>/src/helper/$1',
    '^#middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^#models/(.*)$': '<rootDir>/src/models/$1',
    '^#services/(.*)$': '<rootDir>/src/services/$1',
    '^#utilities/(.*)$': '<rootDir>/src/utilities/$1',
  },
};

export default config;
