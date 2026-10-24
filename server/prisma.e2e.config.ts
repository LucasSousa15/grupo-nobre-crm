import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/grupo_nobre_crm_test?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: testDatabaseUrl },
});
