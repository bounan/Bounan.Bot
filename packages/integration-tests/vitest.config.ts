import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'integration-tests',
    include: ['tests/**/*.test.ts'],
    env: {
      AWS_ACCESS_KEY_ID: 'local',
      AWS_SECRET_ACCESS_KEY: 'local',
      AWS_REGION: 'us-east-1',
      AWS_ENDPOINT_URL_DYNAMODB: 'http://localhost:8001',
    },
  },
});
