export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/api/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/api/test/db/setupTestDB.js'],
  testTimeout: 30000
};