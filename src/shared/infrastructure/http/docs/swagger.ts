import { authPaths } from './paths/auth.paths';
import { userPaths } from './paths/user.paths';
import { schemas } from './schemas';

export const openapi = {
  openapi: '3.0.0',
  info: {
    title: 'Nexo API',
    version: '1.0.0',
    description: `REST API built with Node.js, Express 5 and TypeScript following Clean Architecture and DDD.

**Auth flow:**
- Login returns a short-lived \`accessToken\` (Bearer) and sets a \`refreshToken\` httpOnly cookie.
- On logout, the access token is blacklisted in Redis until expiry and \`tokenVersion\` is incremented in MongoDB — immediately invalidating all active sessions.
- Emails (verification, password reset) are processed asynchronously via BullMQ with 3 retry attempts.

**Roles:** \`USER\` · \`SUPPORT\` · \`ADMIN\` · \`SUPER_ADMIN\`

**Statuses:** \`PENDING\` · \`ACTIVE\` · \`INACTIVE\` · \`SUSPENDED\` · \`BLOCKED\``,
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
