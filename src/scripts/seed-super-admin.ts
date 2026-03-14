import 'dotenv/config';
import { env } from '../config/env';
import { UserEntity } from '../modules/user/domain/entities/user.entity';
import { ConnectDb } from '../modules/user/infrastructure/db/mongo';
import { UserRepositoryImpl } from '../modules/user/infrastructure/db/mongo/repositories/userRepository.impl';
import { BcryptAdapter } from '../modules/user/infrastructure/security/BcryptAdapter.adapter';
import { logger } from '../shared/infrastructure/logger/logger';

const seedEmail = process.env.SEED_EMAIL;
const seedPassword = process.env.SEED_PASSWORD;
const seedUsername = process.env.SEED_USERNAME;

if (!seedEmail || !seedPassword || !seedUsername) {
  logger.error('SEED_EMAIL, SEED_PASSWORD and SEED_USERNAME must be set to run this script');
  process.exit(1);
}

async function run(email: string, password: string, username: string): Promise<void> {
  const db = new ConnectDb(env.MONGO_URI);
  const userRepo = new UserRepositoryImpl();
  const passwordService = new BcryptAdapter();

  await db.connect();

  try {
    const existing = await userRepo.findByEmail(email);
    if (existing) {
      logger.info(
        `User with email ${email} already exists (role: ${existing.toPersistence().role}), skipping`,
      );
      return;
    }

    const passwordHash = await passwordService.hash(password);
    const user = UserEntity.create(username, email, passwordHash);
    const token = (user.toPersistence().verificationToken as { value: string }).value;
    user.activate(token);
    user.changeRole('SUPER_ADMIN');

    await userRepo.save(user);
    logger.info(`SUPER_ADMIN created: ${email}`);
  } finally {
    await db.disconnect();
  }
}

run(seedEmail, seedPassword, seedUsername).catch((err: unknown) => {
  logger.error(err, 'Seed failed');
  process.exit(1);
});
