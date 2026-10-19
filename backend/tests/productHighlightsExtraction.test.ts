import { Product } from '../src/types/product';

export type SpecType =
  | 'processor'
  | 'rear_camera'
  | 'front_camera'
  | 'display'
  | 'battery'
  | 'storage'
  | 'ram'
  | 'audio'
  | 'bluetooth'
  | 'tv'
  | 'watch'
  | 'clothing'
  | 'warranty'
  | 'general';

export interface HighlightRow {
  id: string;
  label?: string; // Line 1: Small grey label (#878787, 14px)
  description: string; // Line 2 or 1-line main text: Bold/regular dark description (#212121 / 16px)
  specType: SpecType;
}

export function extractProductHighlights(product: Product): HighlightRow[] {
  if (!product) return [];

  const rows: HighlightRow[] = [];
  const specs = product.specifications || {};
  const rawHighlights = product.highlights || [];
  const addedKeys = new Set<string>();

  const findRawHighlight = (pattern: RegExp): string | undefined => {
    return rawHighlights.find((h) => pattern.test(h));
  };

  const parseBullet = (bullet: string, defaultType: SpecType): HighlightRow => {
    if (bullet.includes(' | ')) {
      const [p1, ...rest] = bullet.split(' | ');
      const p2 = rest.join(' | ');
      return {
        id: `hl_${Math.random().toString(36).substring(2, 9)}`,
        label: p1.trim(),
        description: p2.trim(),
        specType: defaultType
      };
    }

    if (bullet.includes(' - ') && bullet.length > 25) {
      const [p1, ...rest] = bullet.split(' - ');
      return {
        id: `hl_${Math.random().toString(36).substring(2, 9)}`,
        label: p1.trim(),
        description: rest.join(' - ').trim(),
        specType: defaultType
      };
    }

    return {
      id: `hl_${Math.random().toString(36).substring(2, 9)}`,
      description: bullet.trim(),
      specType: defaultType
    };
  };

  // 1. Processor
  const processorSpec = (specs['Performance'] as any)?.['Processor'] || (specs['General'] as any)?.['Processor'];
  const procRaw = findRawHighlight(/processor|chip|bionic|snapdragon|dimensity|octa[- ]core|quad[- ]core|helio|intel|amd|ryzen/i);
  if (processorSpec || procRaw) {
    const raw = procRaw || processorSpec || '';
    const parsed = parseBullet(raw, 'processor');
    if (processorSpec && raw !== processorSpec && !parsed.label) {
      parsed.label = processorSpec;
    }
    rows.push(parsed);
    addedKeys.add('processor');
  }

  // 2. Rear Camera
  const rearCamSpec = (specs['Camera'] as any)?.['Primary Camera'] || (specs['General'] as any)?.['Primary Camera'];
  const rearCamRaw = findRawHighlight(/rear camera|primary camera|dual camera|triple camera|quad camera|\b\d+\s*mp\s*\+\s*\d+\s*mp/i);
  if (rearCamSpec || rearCamRaw) {
    const raw = rearCamRaw || rearCamSpec || '';
    const parsed = parseBullet(raw, 'rear_camera');
    if (rearCamSpec && raw !== rearCamSpec && !parsed.label) {
      parsed.label = rearCamSpec;
    }
    rows.push(parsed);
    addedKeys.add('rear_camera');
  }

  // 3. Front Camera
  const frontCamSpec = (specs['Camera'] as any)?.['Secondary Camera'] || (specs['General'] as any)?.['Secondary Camera'];
  const frontCamRaw = findRawHighlight(/front camera|selfie camera|secondary camera/i);
  if (frontCamSpec || (frontCamRaw && !frontCamRaw.toLowerCase().includes('rear'))) {
    const raw = frontCamRaw || frontCamSpec || '';
    const parsed = parseBullet(raw, 'front_camera');
    if (frontCamSpec && raw !== frontCamSpec && !parsed.label) {
      parsed.label = frontCamSpec;
    }
    rows.push(parsed);
    addedKeys.add('front_camera');
  }

  // 4. Display
  const displaySize = (specs['Display'] as any)?.['Display Size'] || (specs['General'] as any)?.['Display Size'];
  const displayRes = (specs['Display'] as any)?.['Resolution'] || (specs['Display'] as any)?.['Resolution Type'];
  const displayRaw = findRawHighlight(/display|screen|oled|amoled|retina|super amoled|ips lcd|hz|refresh rate/i);
  if (displaySize || displayRaw) {
    const combinedSpec = [displaySize, displayRes].filter(Boolean).join(' ');
    const raw = displayRaw || combinedSpec || '';
    const parsed = parseBullet(raw, 'display');
    if (combinedSpec && raw !== combinedSpec && !parsed.label) {
      parsed.label = combinedSpec;
    }
    rows.push(parsed);
    addedKeys.add('display');
  }

  // 5. Storage & RAM
  const ramSpec = (specs['Memory and Storage'] as any)?.['RAM'] || (specs['General'] as any)?.['RAM'];
  const storageSpec = (specs['Memory and Storage'] as any)?.['Internal Storage'] || (specs['General'] as any)?.['Internal Storage'];
  const storageRaw = findRawHighlight(/rom|ram|internal storage|storage|\b\d+\s*gb\b|\b\d+\s*tb\b/i);
  if (storageSpec || ramSpec || storageRaw) {
    const combined = [ramSpec ? `${ramSpec} RAM` : '', storageSpec ? `${storageSpec} ROM` : ''].filter(Boolean).join(' | ');
    const raw = storageRaw || combined || '';
    const parsed = parseBullet(raw, 'storage');
    if (combined && raw !== combined && !parsed.label) {
      parsed.label = combined;
    }
    rows.push(parsed);
    addedKeys.add('storage');
  }

  // 6. Battery
  const batteryCap = (specs['Battery and Power'] as any)?.['Battery Capacity'] || (specs['Battery and Power'] as any)?.['Play Time'];
  const fastCharge = (specs['Battery and Power'] as any)?.['Fast Charging'];
  const batteryRaw = findRawHighlight(/battery|playback|playtime|play time|mah|fast charging|warp charge|supervooc/i);
  if (batteryCap || batteryRaw) {
    const combined = [batteryCap, fastCharge ? `(${fastCharge})` : ''].filter(Boolean).join(' ');
    const raw = batteryRaw || combined || '';
    const parsed = parseBullet(raw, 'battery');
    if (combined && raw !== combined && !parsed.label) {
      parsed.label = combined;
    }
    rows.push(parsed);
    addedKeys.add('battery');
  }

  // 7. Audio
  const audioRaw = findRawHighlight(/noise cancellation|anc|enc|driver|sound|bass|surround|audio|dolby|spatial/i);
  if (audioRaw && !addedKeys.has('audio')) {
    rows.push(parseBullet(audioRaw, 'audio'));
    addedKeys.add('audio');
  }

  // 8. Bluetooth
  const btRaw = findRawHighlight(/bluetooth|wireless|connectivity|wi-fi|5g|4g lte|latency/i);
  if (btRaw && !addedKeys.has('bluetooth')) {
    rows.push(parseBullet(btRaw, 'bluetooth'));
    addedKeys.add('bluetooth');
  }

  // 9. Extra category highlights
  for (const h of rawHighlights) {
    if (rows.some((r) => r.description.toLowerCase() === h.toLowerCase() || (r.label && r.label.toLowerCase() === h.toLowerCase()))) {
      continue;
    }
    let type: SpecType = 'general';
    if (/tv|smart tv|led|qled|soundbar/i.test(h)) type = 'tv';
    else if (/watch|smartwatch|fitness|heart rate|sp02/i.test(h)) type = 'watch';
    else if (/shirt|fabric|cotton|fit|wash|cloth|wear/i.test(h)) type = 'clothing';
    else if (/warranty|guarantee/i.test(h)) type = 'warranty';

    rows.push(parseBullet(h, type));
  }

  // Deduplicate
  const seenDesc = new Set<string>();
  const uniqueRows: HighlightRow[] = [];
  for (const row of rows) {
    const key = (row.label || '') + '::' + row.description;
    if (!seenDesc.has(key)) {
      seenDesc.add(key);
      uniqueRows.push(row);
    }
  }

  return uniqueRows;
}

describe('Product Highlights Extraction & Styling Grounding Tests', () => {
  test('1. Extracts two-line and one-line highlights for iPhone 16 Pro Max from real data', () => {
    const iphone: Product = {
      store: 'flipkart',
      productId: 'fk_iphone_16_pro_max',
      title: 'Apple iPhone 16 Pro Max (Desert Titanium, 256 GB)',
      imageUrl: 'https://example.com/iphone.jpg',
      price: 144900,
      mrp: 144900,
      discountPct: 0,
      rating: 4.8,
      ratingCount: 1420,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'SuperComNet',
      inStock: true,
      productUrl: '#',
      affiliateUrl: '#',
      highlights: [
        '256 GB ROM',
        '17.53 cm (6.9 inch) Super Retina XDR Display',
        '48MP + 48MP + 12MP | 12MP Front Camera',
        'A18 Pro Chip, 6 Core Processor Processor',
        'All-Screen OLED Display | Promotion Technology'
      ],
      specifications: {
        'General': {
          'Processor': 'A18 Pro Chip, 6 Core Processor',
          'Internal Storage': '256 GB',
          'Display Size': '6.9 inch',
          'Primary Camera': '48MP + 48MP + 12MP',
          'Secondary Camera': '12MP'
        },
        'Performance': {
          'Processor': 'A18 Pro Chip'
        }
      }
    };

    const rows = extractProductHighlights(iphone);
    expect(rows.length).toBeGreaterThanOrEqual(4);

    // Verify Processor row
    const procRow = rows.find((r) => r.specType === 'processor');
    expect(procRow).toBeDefined();
    expect(procRow?.description).toMatch(/A18 Pro/i);

    // Verify Display row
    const displayRow = rows.find((r) => r.specType === 'display');
    expect(displayRow).toBeDefined();

    // Verify Camera rows
    const rearCamRow = rows.find((r) => r.specType === 'rear_camera');
    expect(rearCamRow).toBeDefined();
    expect(rearCamRow?.label).toBeDefined(); // Has two-line format
    expect(rearCamRow?.description).toBeDefined();
  });

  test('2. Extracts audio, battery, and Bluetooth highlights for boAt earbuds', () => {
    const earbuds: Product = {
      store: 'amazon',
      productId: 'amz_boat_airdopes_141',
      title: 'boAt Airdopes 141 Bluetooth Truly Wireless in Ear Earbuds',
      imageUrl: 'https://example.com/boat.jpg',
      price: 1299,
      mrp: 4490,
      discountPct: 71,
      rating: 4.1,
      ratingCount: 184500,
      deliveryDays: 2,
      shippingFee: 0,
      seller: 'Appario',
      inStock: true,
      productUrl: '#',
      affiliateUrl: '#',
      highlights: [
        '42 Hours Total Playtime with ASAP Charge',
        '8mm Dynamic Audio Drivers for boAt Signature Sound',
        'Bluetooth v5.1 with Instant Connect',
        'IPX4 Water & Sweat Resistance',
        'Quad Mic ENx Noise Cancellation'
      ],
      specifications: {
        'Battery and Power': {
          'Play Time': '42 Hours Playback',
          'Fast Charging': '5 mins = 75 mins'
        }
      }
    };

    const rows = extractProductHighlights(earbuds);
    expect(rows.length).toBeGreaterThanOrEqual(4);

    const batteryRow = rows.find((r) => r.specType === 'battery');
    expect(batteryRow).toBeDefined();
    expect(batteryRow?.description).toMatch(/Playtime|Playback/i);

    const audioRow = rows.find((r) => r.specType === 'audio');
    expect(audioRow).toBeDefined();
    expect(audioRow?.description).toMatch(/Drivers|Noise Cancellation/i);

    const btRow = rows.find((r) => r.specType === 'bluetooth');
    expect(btRow).toBeDefined();
  });

  test('3. Extracts apparel/clothing specifications for shirts', () => {
    const shirt: Product = {
      store: 'meesho',
      productId: 'msh_cotton_shirt_101',
      title: 'Men Slim Fit Pure Cotton Casual Shirt',
      imageUrl: 'https://example.com/shirt.jpg',
      price: 499,
      mrp: 999,
      discountPct: 50,
      rating: 4.3,
      ratingCount: 320,
      deliveryDays: 3,
      shippingFee: 0,
      seller: 'Fashion Hub',
      inStock: true,
      productUrl: '#',
      affiliateUrl: '#',
      highlights: [
        '100% Pure Combed Cotton Fabric',
        'Slim Fit Modern Styling',
        'Machine Wash Gentle Cycle',
        'Breathable Summer Wear'
      ]
    };

    const rows = extractProductHighlights(shirt);
    expect(rows.length).toBe(4);
    expect(rows[0].specType).toBe('clothing');
  });

  test('4. Hides section if product has no highlights or specs', () => {
    const emptyProduct: Product = {
      store: 'amazon',
      productId: 'empty_123',
      title: 'Generic Item',
      imageUrl: 'https://example.com/item.jpg',
      price: 199,
      mrp: 299,
      discountPct: 33,
      rating: 4.0,
      ratingCount: 10,
      deliveryDays: 2,
      shippingFee: 0,
      seller: 'Retailer',
      inStock: true,
      productUrl: '#',
      affiliateUrl: '#',
      highlights: [],
      specifications: {}
    };

    const rows = extractProductHighlights(emptyProduct);
    expect(rows.length).toBe(0);
  });
});
