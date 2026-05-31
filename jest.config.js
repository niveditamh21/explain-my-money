/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // Override to CommonJS so Jest can import modules without ESM loader
          module: 'CommonJS',
          moduleResolution: 'node',
          jsx: 'react-jsx',
          strict: false,
        },
      },
    ],
  },
  moduleNameMapper: {
    // Resolve the @/* path alias used throughout the project
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/src/__tests__/**/*.test.ts'],
  // Don't try to transform node_modules (except none needed here)
  transformIgnorePatterns: ['/node_modules/'],
  // Clear mocks between tests
  clearMocks: true,
};

module.exports = config;
