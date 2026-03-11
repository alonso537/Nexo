export const schemas = {
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
};
