import { catalogIngestService } from '../catalog/catalogIngestService';
import { catalogDb } from '../catalog/catalogDb';

async function main() {
  const args = process.argv.slice(2);
  let category: string | undefined;
  let maxSearches: number | undefined;

  for (const arg of args) {
    if (arg.startsWith('--category=')) {
      category = arg.split('=')[1];
    } else if (arg.startsWith('--budget=')) {
      maxSearches = parseInt(arg.split('=')[1], 10);
    }
  }

  console.log('====================================================');
  console.log('🛒 VoiceCart Catalog Ingestion Pipeline');
  console.log('====================================================');
  if (category) console.log(`📌 Filter Category: ${category}`);
  if (maxSearches) console.log(`🎯 Max Searches Budget: ${maxSearches}`);

  const report = await catalogIngestService.runIngestion({
    category,
    maxSearches
  });

  console.log('\n====================================================');
  console.log('📊 INGESTION REPORT SUMMARY');
  console.log('====================================================');
  console.log(`Status:              ${report.status.toUpperCase()}`);
  console.log(`Total Products Saved: ${report.totalSaved}`);
  console.log(`Store Breakdown:     `, report.byStore);
  console.log(`Category Breakdown:  `, report.byCategory);
  console.log(`API Searches Used:   ${report.apiSearchesUsed}`);
  console.log(`Remaining Budget:    ${report.quotaBudgetRemaining}`);
  console.log(`Duration:            ${(report.durationMs / 1000).toFixed(2)}s`);
  if (report.errors.length > 0) {
    console.log(`Errors encountered:  `, report.errors);
  }
  console.log('====================================================');

  const status = await catalogDb.getCatalogStatus();
  console.log('\n📈 LIVE CATALOG STATS IN DATABASE:');
  console.log(`Total Products:      ${status.totalProducts}`);
  console.log(`With Images:         ${status.productsWithImages}`);
  console.log(`With Specs:          ${status.productsWithSpecs}`);
  console.log(`With Ratings:        ${status.productsWithRating}`);
  console.log('====================================================');

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal ingestion error:', err);
  process.exit(1);
});
