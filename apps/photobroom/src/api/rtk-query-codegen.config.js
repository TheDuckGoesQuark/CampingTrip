/** @type {import('@rtk-query/codegen-openapi').ConfigFile} */
const config = {
  schemaFile: '../../openapi-schema.yml',
  apiFile: './base-api.ts',
  apiImport: 'baseApi',
  outputFile: './generated-api.ts',
  hooks: true,
  tag: true,
  filterEndpoints: (endpoint, endpointDefinition) => {
    const path = endpointDefinition?.path || '';
    return path.startsWith('/api/photobroom/') || path.startsWith('/api/auth/');
  },
};

export default config;
