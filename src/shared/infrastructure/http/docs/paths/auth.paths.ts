const err = { $ref: '#/components/schemas/ErrorResponse' };
const errContent = { 'application/json': { schema: err } };
const userContent = { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { $ref: '#/components/schemas/UserResponse' } } } } };

export const authPaths = {
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
        '201': { description: 'User registered successfully', content: userContent },
        '400': { description: 'Validation error / email or username already in use', content: errContent },
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
        '401': { description: 'Invalid credentials', content: errContent },
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
        '401': { description: 'Missing or invalid refresh token', content: errContent },
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
        '401': { description: 'Unauthorized', content: errContent },
      },
    },
  },

  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Get the authenticated user',
      security: [{ BearerAuth: [] }],
      responses: {
        '200': { description: 'User retrieved successfully', content: userContent },
        '401': { description: 'Unauthorized', content: errContent },
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
        '400': { description: 'Invalid or expired token', content: errContent },
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
        '400': { description: 'Invalid or expired token', content: errContent },
      },
    },
  },
};
