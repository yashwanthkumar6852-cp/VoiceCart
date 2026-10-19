import { serpApiProvider } from '../src/providers/serpApiProvider';
import { amazonProvider } from '../src/providers/amazonProvider';

async function testSerp() {
  console.log('Testing serpApiProvider directly:');
  const res = await serpApiProvider.searchAll('boAt Airdopes 141');
  console.log('SerpApi searchAll response keys:', Object.keys(res));
  console.log('Amazon count:', res.amazon?.length);
  console.log('Flipkart count:', res.flipkart?.length);
  if (res.amazon?.length > 0) {
    console.log('Sample Amazon:', res.amazon[0].title, res.amazon[0].price);
  }

  console.log('\nTesting amazonProvider.search:');
  const amzRes = await amazonProvider.search('boAt Airdopes 141');
  console.log('Amazon provider search count:', amzRes.length);
}

testSerp().catch(console.error);
