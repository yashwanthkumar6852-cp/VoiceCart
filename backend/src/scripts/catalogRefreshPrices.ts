import { catalogIngestService } from '../catalog/catalogIngestService';

async function main() {
  console.log('====================================================');
  console.log('🔄 VoiceCart Price Refresh');
  console.log('====================================================');

  const result = await catalogIngestService.refreshPrices(25);
  console.log(`✅ Refreshed ${result.refreshed} products.`);
  console.log('====================================================');
  process.exit(0);
}

main().catch(err => {
  console.error('Price refresh error:', err);
  process.exit(1);
});
