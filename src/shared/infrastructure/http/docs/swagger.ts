

export const openapi = {
  openapi: '3.0.0',
  info: {
    title: 'Nexo API',
    version: '1.0.0',
    description: 'REST API built with Node.js, Express and TypeScript following Clean Architecture and DDD.',
  },
  servers: [
    { url: '/api', description: 'Default' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      UserResponse: {
        type: 'object',
        properties: {
          id:        { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
          username:  { type: 'string', example: 'john_doe' },
          email:     { type: 'string', format: 'email', example: 'john@example.com' },
          name:      { type: 'string', nullable: true, example: 'John' },
          lastName:  { type: 'string', nullable: true, example: 'Doe' },
          role:      { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'USER', 'SUPPORT'] },
          status:    { type: 'string', enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED'] },
          avatarUrl: { type: 'string', nullable: true, example: 'https://cdn.example.com/avatars/uuid.jpg' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total:           { type: 'integer', example: 100 },
          page:            { type: 'integer', example: 1 },
          totalPages:      { type: 'integer', example: 10 },
          hasNextPage:     { type: 'boolean', example: true },
          hasPreviousPage: { type: 'boolean', example: false },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status:    { type: 'string', example: 'error' },
          code:      { type: 'string', example: 'VALIDATION_ERROR' },
          message:   { type: 'string', example: 'Validation error' },
          requestId: { type: 'string', nullable: true, example: 'a1b2c3d4' },
          details:   { type: 'object', nullable: true },
        },
      },
    },
  },
  paths: {
    // ── AUTH ────────────────────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string', minLength: 3, maxLength: 30, example: 'john_doe' },
                  email:    { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', minLength: 6, maxLength: 128, example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } },
          },
          '400': { description: 'Validation error / email or username already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and obtain access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful — refresh token set as httpOnly cookie',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, accessToken: { type: 'string' }, expiresIn: { type: 'integer', example: 900000 } } } } },
          },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Issue a new access token using the refresh token cookie',
        responses: {
          '200': {
            description: 'New access token issued',
            content: { 'application/json': { schema: { type: 'object', properties: { accessToken: { type: 'string' }, expiresIn: { type: 'integer' } } } } },
          },
          '401': { description: 'Missing or invalid refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Invalidate current session and clear cookie',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Logged out successfully' },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'User retrieved successfully',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } },
          },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/verify-email': {
      get: {
        tags: ['Auth'],
        summary: 'Verify email address with token from email link',
        parameters: [
          { in: 'query', name: 'token', required: true, schema: { type: 'string' }, description: 'Verification token sent by email' },
        ],
        responses: {
          '200': { description: 'Email verified successfully' },
          '400': { description: 'Invalid or expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/resend-verification': {
      post: {
        tags: ['Auth'],
        summary: 'Resend the email verification link',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email', example: 'john@example.com' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'If the account exists, a new verification email was sent' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset link by email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email', example: 'john@example.com' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'If the account exists, a reset email was sent' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password using the token received by email',
        parameters: [
          { in: 'query', name: 'token', required: true, schema: { type: 'string' }, description: 'Password reset token' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['newPassword'],
                properties: { newPassword: { type: 'string', minLength: 6, maxLength: 128, example: 'newSecret123' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password reset successfully' },
          '400': { description: 'Invalid or expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    // ── USER ────────────────────────────────────────────────────────────────
    '/user': {
      get: {
        tags: ['User'],
        summary: 'List all users with pagination and filters (ADMIN)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page',           schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit',          schema: { type: 'integer', default: 10, maximum: 100 } },
          { in: 'query', name: 'username',       schema: { type: 'string' } },
          { in: 'query', name: 'email',          schema: { type: 'string', format: 'email' } },
          { in: 'query', name: 'name',           schema: { type: 'string' } },
          { in: 'query', name: 'lastName',       schema: { type: 'string' } },
          { in: 'query', name: 'role',           schema: { type: 'string', enum: ['USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT'] } },
          { in: 'query', name: 'status',         schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'BLOCKED'] } },
          { in: 'query', name: 'includeDeleted', schema: { type: 'boolean', default: false } },
        ],
        responses: {
          '200': {
            description: 'Users retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    data:    { type: 'array', items: { $ref: '#/components/schemas/UserResponse' } },
                    meta:    { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Forbidden — requires ADMIN role', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/user/{username}': {
      get: {
        tags: ['User'],
        summary: 'Get a user by username',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'username', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'User retrieved successfully',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } },
          },
          '404': { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/user/name': {
      patch: {
        tags: ['User'],
        summary: 'Update first name',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 2, maxLength: 50, example: 'John' } } } } },
        },
        responses: {
          '200': { description: 'Name updated', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/user/last-name': {
      patch: {
        tags: ['User'],
        summary: 'Update last name',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['lastName'], properties: { lastName: { type: 'string', minLength: 2, maxLength: 50, example: 'Doe' } } } } },
        },
        responses: {
          '200': { description: 'Last name updated', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/user/username': {
      patch: {
        tags: ['User'],
        summary: 'Update username',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['username'], properties: { username: { type: 'string', minLength: 2, maxLength: 50, example: 'john_doe_2' } } } } },
        },
        responses: {
          '200': { description: 'Username updated', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } } },
          '400': { description: 'Username already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/user/email': {
      patch: {
        tags: ['User'],
        summary: 'Update email — sends verification to the new address',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['newEmail'], properties: { newEmail: { type: 'string', format: 'email', example: 'new@example.com' } } } } },
        },
        responses: {
          '200': { description: 'Email updated, verification sent', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } } },
          '400': { description: 'Email already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/user/password': {
      patch: {
        tags: ['User'],
        summary: 'Change password (requires current password)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', minLength: 6, example: 'oldSecret123' },
                  newPassword:     { type: 'string', minLength: 6, example: 'newSecret456' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password updated', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } } },
          '400': { description: 'Incorrect current password', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/user/avatar': {
      patch: {
        tags: ['User'],
        summary: 'Upload or replace profile photo',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['avatar'],
                properties: { avatar: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Photo updated', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } } },
          '400': { description: 'No file uploaded or invalid type', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      delete: {
        tags: ['User'],
        summary: 'Delete profile photo',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Avatar deleted', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } } },
          '404': { description: 'No avatar to delete', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/user/{id}/role': {
      patch: {
        tags: ['User'],
        summary: 'Change user role — USER or SUPPORT (ADMIN)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['USER', 'SUPPORT'] } } } } },
        },
        responses: {
          '200': { description: 'Role updated', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } } },
          '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/user/{id}/role/admin': {
      patch: {
        tags: ['User'],
        summary: 'Change user role — any role (SUPER_ADMIN)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['ADMIN', 'USER', 'SUPPORT'] } } } } },
        },
        responses: {
          '200': { description: 'Role updated', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } } },
          '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/user/{id}/status/deactivate': {
      patch: {
        tags: ['User'],
        summary: 'Deactivate a user account (ADMIN)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'User deactivated', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } } },
          '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/user/{id}/status/suspend': {
      patch: {
        tags: ['User'],
        summary: 'Suspend a user account (ADMIN)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'User suspended', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } } },
          '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/user/{id}/status/block': {
      patch: {
        tags: ['User'],
        summary: 'Block a user account with a reason (SUPER_ADMIN)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['reason'], properties: { reason: { type: 'string', minLength: 1, example: 'Violated terms of service' } } } } },
        },
        responses: {
          '200': { description: 'User blocked', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } } },
          '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
  },
};
