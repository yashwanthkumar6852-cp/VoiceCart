import React, { useState } from 'react';
import {
  Cpu,
  Camera,
  Smartphone,
  Battery,
  BatteryCharging,
  HardDrive,
  Headphones,
  Bluetooth,
  Tv,
  Watch,
  Shirt,
  Box,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Volume2,
  Activity,
  Layers
} from 'lucide-react';
import { Product } from '../types';
import { buildRealProductSpecifications, extractRealSpecBullets } from '../utils/productNormalizer';

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

interface ProductHighlightsProps {
  product: Product;
  className?: string;
  initiallyExpanded?: boolean;
}

/**
 * Extracts structured, real-data-grounded highlight rows from a product's
 * store highlights and normalized specifications. Never invents taglines.
 */
export function extractProductHighlights(product: Product): HighlightRow[] {
  if (!product) return [];

  const specs =
    product.specifications && Object.keys(product.specifications).length > 0
      ? product.specifications
      : buildRealProductSpecifications(product);
  const rawHighlights =
    product.highlights && product.highlights.length > 0
      ? product.highlights
      : extractRealSpecBullets({ ...product, specifications: specs });
  const rows: HighlightRow[] = [];
  const addedKeys = new Set<string>();

  // Helper to find raw highlight string matching regex
  const findRawHighlight = (pattern: RegExp): string | undefined => {
    return rawHighlights.find((h) => pattern.test(h));
  };

  // Helper to format 2-line or 1-line from a bullet
  const parseBullet = (bullet: string, defaultType: SpecType): HighlightRow => {
    // E.g. "A16 Bionic Chip, 6 Core Processor | Hexa Core" or "48MP + 12MP | DSLR Like Pictures"
    if (bullet.includes(' | ')) {
      const [p1, ...rest] = bullet.split(' | ');
      const p2 = rest.join(' | ');
      // If p1 looks like a spec (numbers/units), put p1 as label and p2 as description
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

  // 1. PROCESSOR / CHIP
  const processorSpec = specs['Performance']?.['Processor'] || specs['General']?.['Processor'];
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

  // 2. REAR CAMERA
  const rearCamSpec = specs['Camera']?.['Primary Camera'] || specs['General']?.['Primary Camera'];
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

  // 3. FRONT CAMERA
  const frontCamSpec = specs['Camera']?.['Secondary Camera'] || specs['General']?.['Secondary Camera'];
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

  // 4. DISPLAY / SCREEN
  const displaySize = specs['Display']?.['Display Size'] || specs['General']?.['Display Size'];
  const displayRes = specs['Display']?.['Resolution'] || specs['Display']?.['Resolution Type'];
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

  // 5. STORAGE & RAM (Memory)
  const ramSpec = specs['Memory and Storage']?.['RAM'] || specs['General']?.['RAM'];
  const storageSpec = specs['Memory and Storage']?.['Internal Storage'] || specs['General']?.['Internal Storage'];
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

  // 6. BATTERY & PLAYTIME
  const batteryCap = specs['Battery and Power']?.['Battery Capacity'] || specs['Battery and Power']?.['Play Time'];
  const fastCharge = specs['Battery and Power']?.['Fast Charging'];
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

  // 7. AUDIO / NOISE CANCELLATION / DRIVERS (Earbuds / Speakers)
  const audioRaw = findRawHighlight(/noise cancellation|anc|enc|driver|sound|bass|surround|audio|dolby|spatial/i);
  if (audioRaw && !addedKeys.has('audio')) {
    rows.push(parseBullet(audioRaw, 'audio'));
    addedKeys.add('audio');
  }

  // 8. BLUETOOTH / CONNECTIVITY
  const btRaw = findRawHighlight(/bluetooth|wireless|connectivity|wi-fi|5g|4g lte|latency/i);
  if (btRaw && !addedKeys.has('bluetooth')) {
    rows.push(parseBullet(btRaw, 'bluetooth'));
    addedKeys.add('bluetooth');
  }

  // 9. Process any remaining raw highlights from store that were not mapped
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

  // Deduplicate rows by description
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

/**
 * Returns corresponding icon for each spec type
 */
function getSpecIcon(type: SpecType) {
  const iconProps = { size: 22, color: '#2874f0', strokeWidth: 2 };
  switch (type) {
    case 'processor':
      return <Cpu {...iconProps} />;
    case 'rear_camera':
    case 'front_camera':
      return <Camera {...iconProps} />;
    case 'display':
      return <Smartphone {...iconProps} />;
    case 'battery':
      return <Battery {...iconProps} />;
    case 'storage':
    case 'ram':
      return <HardDrive {...iconProps} />;
    case 'audio':
      return <Headphones {...iconProps} />;
    case 'bluetooth':
      return <Bluetooth {...iconProps} />;
    case 'tv':
      return <Tv {...iconProps} />;
    case 'watch':
      return <Watch {...iconProps} />;
    case 'clothing':
      return <Shirt {...iconProps} />;
    case 'warranty':
      return <ShieldCheck {...iconProps} />;
    default:
      return <Layers {...iconProps} />;
  }
}

export const ProductHighlights: React.FC<ProductHighlightsProps> = ({
  product,
  className = '',
  initiallyExpanded = true
}) => {
  const [isSectionOpen, setIsSectionOpen] = useState(initiallyExpanded);
  const [showAllRows, setShowAllRows] = useState(false);

  const allHighlights = extractProductHighlights(product);

  // If no highlights or real spec data exists, gracefully hide the section
  if (allHighlights.length === 0) {
    return null;
  }

  const visibleRows = showAllRows ? allHighlights : allHighlights.slice(0, 6);
  const hasMore = allHighlights.length > 6;

  return (
    <section
      className={`product-highlights-container ${className}`}
      style={{
        margin: '20px 0',
        padding: '0',
        background: 'transparent',
        borderRadius: '12px'
      }}
      aria-label="Product highlights"
    >
      {/* Header Row: Title & Light Rounded Square Chevron Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isSectionOpen ? '18px' : '0',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setIsSectionOpen(!isSectionOpen)}
      >
        <h3
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--text-main, #212121)',
            letterSpacing: '-0.3px',
            margin: 0
          }}
        >
          Product highlights
        </h3>

        {/* Rounded square chevron button matching reference */}
        <button
          type="button"
          aria-expanded={isSectionOpen}
          aria-label={isSectionOpen ? 'Collapse product highlights' : 'Expand product highlights'}
          onClick={(e) => {
            e.stopPropagation();
            setIsSectionOpen(!isSectionOpen);
          }}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: '1px solid var(--border-color, #e5e7eb)',
            background: 'var(--bg-subtle, #f8fafc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary, #64748b)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
        >
          {isSectionOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Expandable Highlight Rows List */}
      {isSectionOpen && (
        <div>
          <ul
            role="list"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            {visibleRows.map((row) => (
              <li
                key={row.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                {/* Rounded Light-Blue Icon Tile (~48px, #EAF2FF, Blue Line Icon) */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    minWidth: '48px',
                    borderRadius: '12px',
                    background: '#EAF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(40, 116, 240, 0.08)'
                  }}
                  aria-hidden="true"
                >
                  {getSpecIcon(row.specType)}
                </div>

                {/* Text Content: Two-Line or One-Line */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                  {row.label && (
                    <span
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-highlight-label, #878787)',
                        fontWeight: 500,
                        lineHeight: 1.3,
                        wordBreak: 'break-word'
                      }}
                    >
                      {row.label}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '16px',
                      color: 'var(--text-main, #212121)',
                      fontWeight: 700,
                      lineHeight: 1.35,
                      wordBreak: 'break-word'
                    }}
                  >
                    {row.description}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* Show All / Show Less Toggle Button */}
          {hasMore && (
            <div style={{ marginTop: '14px', textAlign: 'left' }}>
              <button
                type="button"
                onClick={() => setShowAllRows(!showAllRows)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2874f0',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  padding: '4px 0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {showAllRows ? 'Show less highlights' : `Show all ${allHighlights.length} highlights`}
                {showAllRows ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
