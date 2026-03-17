/** @type {import('@rtk-query/codegen-openapi').ConfigFile} */
const config = {
  schemaFile: '../../openapi-schema.yml',
  apiFile: './base-api.ts',
  apiImport: 'baseApi',
  outputFile: './generated-api.ts',
  hooks: true,
  tag: true,
  // Include workout + auth endpoints, exclude other apps (e.g. campsite)
  filterEndpoints: (endpoint, endpointDefinition) => {
    const path = endpointDefinition?.path || '';
    return path.startsWith('/api/workout/') || path.startsWith('/api/auth/');
  },
};

export default config;
