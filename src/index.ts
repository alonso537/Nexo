import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ?? '3000';

console.log(`Nexo running on port ${PORT}`);
