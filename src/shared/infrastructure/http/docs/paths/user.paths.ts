const err = { $ref: '#/components/schemas/ErrorResponse' };
const errContent = { 'application/json': { schema: err } };
const userContent = {
  'application/json': {
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: { $ref: '#/components/schemas/UserResponse' },
      },
    },
  },
};

export const userPaths = {
  '/user': {
    get: {
      tags: ['User'],
      summary: 'List all users with pagination and filters (ADMIN)',
      security: [{ BearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 10, maximum: 100 } },
        { in: 'query', name: 'username', schema: { type: 'string' } },
        { in: 'query', name: 'email', schema: { type: 'string', format: 'email' } },
        { in: 'query', name: 'name', schema: { type: 'string' } },
        { in: 'query', name: 'lastName', schema: { type: 'string' } },
        {
          in: 'query',
          name: 'role',
          schema: { type: 'string', enum: ['USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT'] },
        },
        {
          in: 'query',
          name: 'status',
          schema: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'BLOCKED'],
          },
        },
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
                  data: { type: 'array', items: { $ref: '#/components/schemas/UserResponse' } },
                  meta: { $ref: '#/components/schemas/PaginationMeta' },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized', content: errContent },
        '403': { description: 'Forbidden — requires ADMIN role', content: errContent },
      },
    },
  },

  '/user/{username}': {
    get: {
      tags: ['User'],
      summary: 'Get a user by username',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'username', required: true, schema: { type: 'string' } }],
      responses: {
        '200': { description: 'User retrieved successfully', content: userContent },
        '404': { description: 'User not found', content: errContent },
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
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', minLength: 2, maxLength: 50, example: 'John' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Name updated', content: userContent },
        '401': { description: 'Unauthorized', content: errContent },
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
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['lastName'],
              properties: {
                lastName: { type: 'string', minLength: 2, maxLength: 50, example: 'Doe' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Last name updated', content: userContent },
        '401': { description: 'Unauthorized', content: errContent },
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
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['username'],
              properties: {
                username: { type: 'string', minLength: 2, maxLength: 50, example: 'john_doe_2' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Username updated', content: userContent },
        '400': { description: 'Username already in use', content: errContent },
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
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['newEmail'],
              properties: {
                newEmail: { type: 'string', format: 'email', example: 'new@example.com' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Email updated, verification sent', content: userContent },
        '400': { description: 'Email already in use', content: errContent },
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
                newPassword: { type: 'string', minLength: 6, example: 'newSecret456' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Password updated', content: userContent },
        '400': { description: 'Incorrect current password', content: errContent },
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
        '200': { description: 'Photo updated', content: userContent },
        '400': { description: 'No file uploaded or invalid type', content: errContent },
      },
    },
    delete: {
      tags: ['User'],
      summary: 'Delete profile photo',
      security: [{ BearerAuth: [] }],
      responses: {
        '200': { description: 'Avatar deleted', content: userContent },
        '404': { description: 'No avatar to delete', content: errContent },
      },
    },
  },

  '/user/{id}/role': {
    patch: {
      tags: ['User'],
      summary: 'Change user role — USER or SUPPORT (ADMIN)',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: { role: { type: 'string', enum: ['USER', 'SUPPORT'] } },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Role updated', content: userContent },
        '403': { description: 'Forbidden', content: errContent },
      },
    },
  },

  '/user/{id}/role/admin': {
    patch: {
      tags: ['User'],
      summary: 'Change user role — any role (SUPER_ADMIN)',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: { role: { type: 'string', enum: ['ADMIN', 'USER', 'SUPPORT'] } },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Role updated', content: userContent },
        '403': { description: 'Forbidden', content: errContent },
      },
    },
  },

  '/user/{id}/status/deactivate': {
    patch: {
      tags: ['User'],
      summary: 'Deactivate a user account (ADMIN)',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        '200': { description: 'User deactivated', content: userContent },
        '403': { description: 'Forbidden', content: errContent },
      },
    },
  },

  '/user/{id}/status/suspend': {
    patch: {
      tags: ['User'],
      summary: 'Suspend a user account (ADMIN)',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        '200': { description: 'User suspended', content: userContent },
        '403': { description: 'Forbidden', content: errContent },
      },
    },
  },

  '/user/{id}/status/block': {
    patch: {
      tags: ['User'],
      summary: 'Block a user account with a reason (SUPER_ADMIN)',
      security: [{ BearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['reason'],
              properties: {
                reason: { type: 'string', minLength: 1, example: 'Violated terms of service' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'User blocked', content: userContent },
        '403': { description: 'Forbidden', content: errContent },
      },
    },
  },
};
