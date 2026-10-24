import 'dotenv/config';

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/grupo_nobre_crm_test?schema=public';
process.env.DATABASE_URL = testDatabaseUrl;
