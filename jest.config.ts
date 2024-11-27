import { Config } from '@jest/types';
const config: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  verbose: true,
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/test/__tests__/'],
  transformIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/redis_data/',
    '/db_data/',
  ],
  moduleNameMapper: {
    '^@app/logger(.*)$': '<rootDir>/libs/logger/src/$1',
    '^@app/database(.*)$': '<rootDir>/src/database/$1',
    '^@app/interfaces(.*)$': '<rootDir>/src/interfaces/$1',
    '^@app/queues(.*)$': '<rootDir>/src/queues/$1',
    '^@app/redis(.*)$': '<rootDir>/src/redis/$1',
    '^@app/trending(.*)$': '<rootDir>/src/trending/$1',
    '^@app/tweet(.*)$': '<rootDir>/src/tweet/$1',
  },
};
export default config;
