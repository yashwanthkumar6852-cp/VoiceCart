import { dbClient } from '../db/dbClient';
import { config } from '../config';

async function main() {
  console.log('🚀 Running VoiceCart database deployment migrations...');
  console.log(`📡 Target DB Type: ${dbClient.dbType}`);
  console.log(`🌐 Target DB Location: ${dbClient.dbLocation}`);

  try {
    await dbClient.runMigrations();
    const pingRes = await dbClient.ping();
    if (!pingRes.ok) {
      throw new Error(`Database ping failed on ${pingRes.type}`);
    }
    console.log(`✅ All database tables migrated successfully! (Ping latency: ${pingRes.latencyMs}ms)`);
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Database migration failed:', err.message);
    process.exit(1);
  }
}

main();
