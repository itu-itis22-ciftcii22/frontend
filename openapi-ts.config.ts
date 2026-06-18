import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './lib/api/generated/openapi.json',
  output: './lib/api/generated',
  plugins: [
    '@hey-api/client-fetch',
    {
      name: '@hey-api/sdk',
      responseStyle: 'data',
    },
  ],
});
