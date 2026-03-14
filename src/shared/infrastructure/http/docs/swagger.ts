import { authPaths } from './paths/auth.paths';
import { userPaths } from './paths/user.paths';
import { schemas } from './schemas';

export const openapi = {
  openapi: '3.0.0',
  info: {
    title: 'Nexo API',
    version: '1.0.0',
    description:
      'REST API built with Node.js, Express and TypeScript following Clean Architecture and DDD.',
  },
  servers: [{ url: '/api', description: 'Default' }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas,
  },
  paths: {
    ...authPaths,
    ...userPaths,
  },
};
