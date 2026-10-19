import React, { useState, useEffect, useRef } from 'react';
import { Package } from 'lucide-react';
import { imageInterventionTracker } from '../utils/imageInterventionTracker';

export interface ProductImageProps {
  src?: string;
  images?: string[];
  thumbnail?: string;
  serpapi_thumbnail?: string;
  alt: string;
  index?: number;
  isPriority?: boolean;
  store?: string;
  productId?: string;
  variantText?: string;
  className?: string;
  style?: React.CSSProperties;
  aspectRatio?: string;
  onImageLoad?: () => void;
}

/**
 * Normalizes an image string into a valid absolute URL.
 * Handles Amazon bare image IDs (e.g. "71c05lTE0VL._SL1500_.jpg")
 * Rejects bare product IDs or invalid non-image strings.
 */
export function normalizeCandidateUrl(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim();
  if (!clean || clean === 'null' || clean === 'undefined' || clean === '[object Object]') return null;

  // Internal server storage URL
  if (clean.startsWith('/api/images/file/') || clean.startsWith('/api/products/image-proxy')) {
    return clean;
  }

  // Absolute http/https URL
  if (clean.startsWith('https://') || clean.startsWith('http://')) {
    return clean;
  }

  // Bare Amazon image filename (e.g. 71c05lTE0VL._SL1500_.jpg)
  if (
    /^[A-Za-z0-9+_-]+\.(jpg|jpeg|png|webp|avif)$/i.test(clean) ||
    clean.includes('._SL') ||
    clean.includes('._UL') ||
    clean.includes('._AC_')
  ) {
    return `https://m.media-amazon.com/images/I/${clean}`;
  }

  // Reject bare product IDs like "amz_asus_vivobook_15_i5_12th_gen" or non-URL strings
  return null;
}

/**
 * High-reliability fallback image based on product title/category keywords
 */
export function getFallbackImageByTitle(title?: string): string {
  const t = (title || '').toLowerCase();

  // 1. TV / Television (prioritized before phones)
  if (
    t.includes('tv') ||
    t.includes('television') ||
    t.includes('crystal 4k') ||
    (t.includes('inch') && (t.includes('smart') || t.includes('led') || t.includes('display')))
  ) {
    return 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80';
  }

  // 2. Washing Machine
  if (t.includes('washing machine') || t.includes('washer') || (t.includes('top load') && t.includes('inverter'))) {
    return 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80';
  }

  // 3. Smartwatches / Wearables (prioritized before phones)
  if (
    t.includes('smartwatch') ||
    t.includes('smart watch') ||
    t.includes('fitness band') ||
    t.includes('t800') ||
    t.includes('colorfit') ||
    (t.includes('watch') && !t.includes('stopwatch'))
  ) {
    if (t.includes('colorfit') || t.includes('noise')) {
      return 'https://m.media-amazon.com/images/I/61SSVxTSs3L._SL1500_.jpg';
    }
    return 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80';
  }

  // 4. Shoes / Footwear / Sneakers (granular)
  if (t.includes('loafer')) {
    return 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&auto=format&fit=crop&q=80';
  }
  if (t.includes('sneaker') || t.includes('streetwear') || t.includes('white sneaker')) {
    return 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=80';
  }
  if (
    t.includes('shoe') ||
    t.includes('footwear') ||
    t.includes('running') ||
    t.includes('walking') ||
    t.includes('softride')
  ) {
    return 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80';
  }

  // 5. Umbrellas
  if (t.includes('umbrella') || t.includes('rain') || t.includes('livesmart')) {
    return 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80';
  }

  // 6. Fashion / Clothing (granular by exact item type)
  if (t.includes('jeans') || t.includes('denim') || t.includes('511')) {
    return 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80';
  }
  if (t.includes('polo') || t.includes('t-shirt') || t.includes('tee')) {
    return 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80';
  }
  if (t.includes('chinos') || t.includes('pant') || t.includes('trouser')) {
    return 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80';
  }
  if (t.includes('saree')) {
    return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80';
  }
  if (t.includes('kurta')) {
    return 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=600&auto=format&fit=crop&q=80';
  }
  if (t.includes('kurti') || t.includes('anarkali')) {
    return 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80';
  }
  if (t.includes('shirt')) {
    return 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80';
  }

  // 7. Earbuds / Audio / Headphones
  if (t.includes('boult') || t.includes('z40')) {
    return 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80';
  }
  if (t.includes('airdopes') || (t.includes('boat') && (t.includes('earbud') || t.includes('141')))) {
    return 'https://m.media-amazon.com/images/I/51HBom8xz7L._SL1500_.jpg';
  }
  if (
    t.includes('earbud') ||
    t.includes('headphone') ||
    t.includes('airpods') ||
    t.includes('headset') ||
    t.includes('tws') ||
    t.includes('neckband')
  ) {
    return 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&auto=format&fit=crop&q=80';
  }

  // 8. iPhone / Apple Phone
  if (t.includes('iphone') || t.includes('apple phone')) {
    return 'https://m.media-amazon.com/images/I/71d7rfSl0wL._SL1500_.jpg';
  }

  // 9. Smartphones / Mobiles (strictly mobile phones)
  if (
    t.includes('phone') ||
    t.includes('mobile') ||
    t.includes('smartphone') ||
    (t.includes('samsung galaxy') && !t.includes('watch') && !t.includes('tab')) ||
    (t.includes('oppo') && (t.includes('5g') || t.includes('k14'))) ||
    (t.includes('realme') && (t.includes('5g') || t.includes('p4')))
  ) {
    return 'https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/r/s/g/-original-imahkkpg3hbtardn.jpeg?q=70';
  }

  // 10. Laptops / Tablets
  if (t.includes('laptop') || t.includes('macbook') || t.includes('ipad') || t.includes('tablet') || t.includes('chromebook')) {
    return 'https://m.media-amazon.com/images/I/71TPda7cwUL._SL1500_.jpg';
  }

  // 11. Kitchen & Home Appliances
  if (
    t.includes('fryer') ||
    t.includes('mixer') ||
    t.includes('grinder') ||
    t.includes('cooker') ||
    t.includes('kettle') ||
    t.includes('oven') ||
    t.includes('purifier')
  ) {
    return 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTjgi4e88svcLCbuMfcMTFeq_6M65dt_XIXixRXwt3AdHCCWlxSym-PcJKrTnWCFvcIJzOhn7i5HxY86vkOoXsBiEkxKN_4HQ';
  }

  // 12. Sports & Fitness
  if (
    t.includes('racket') ||
    t.includes('badminton') ||
    t.includes('football') ||
    t.includes('cricket') ||
    t.includes('dumbbell') ||
    t.includes('yoga') ||
    t.includes('exerciser') ||
    t.includes('skipping')
  ) {
    if (t.includes('badminton') || t.includes('racket')) {
      return 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80';
    }
    if (t.includes('football')) {
      return 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=600&auto=format&fit=crop&q=80';
    }
    if (t.includes('cricket')) {
      return 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80';
  }

  // 13. Beauty & Skincare
  if (
    t.includes('serum') ||
    t.includes('cleanser') ||
    t.includes('lotion') ||
    t.includes('moisturizer') ||
    t.includes('lipstick') ||
    t.includes('mist')
  ) {
    if (t.includes('lipstick')) {
      return 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80';
  }

  // 14. Automotive & Helmets
  if (
    t.includes('helmet') ||
    t.includes('dash cam') ||
    t.includes('inflator') ||
    t.includes('car shampoo') ||
    t.includes('polish')
  ) {
    if (t.includes('helmet')) {
      return 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80';
  }

  // 15. Toys & Baby
  if (
    t.includes('lego') ||
    t.includes('hot wheels') ||
    t.includes('diaper') ||
    t.includes('nerf') ||
    t.includes('monopoly') ||
    t.includes('toy') ||
    t.includes('puzzle') ||
    t.includes('cactus')
  ) {
    if (t.includes('diaper')) {
      return 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80';
    }
    if (t.includes('hot wheels')) {
      return 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=600&auto=format&fit=crop&q=80';
  }

  // 16. Groceries & Pantry
  if (
    t.includes('oil') ||
    t.includes('tea') ||
    t.includes('atta') ||
    t.includes('rice') ||
    t.includes('dal') ||
    t.includes('saffron') ||
    t.includes('kesar') ||
    t.includes('honey') ||
    t.includes('nuts')
  ) {
    if (t.includes('oil')) {
      return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80';
    }
    if (t.includes('tea')) {
      return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80';
    }
    if (t.includes('honey')) {
      return 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80';
  }

  // 17. Health & Nutrition
  if (
    t.includes('whey') ||
    t.includes('protein') ||
    t.includes('vitamin') ||
    t.includes('shilajit') ||
    t.includes('chyawanprash') ||
    t.includes('ashwagandha') ||
    t.includes('fish oil')
  ) {
    return 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80';
  }

  // 18. Home & Living (pillows, comforter, bedsheet, flask, diffuser)
  if (
    t.includes('pillow') ||
    t.includes('curtain') ||
    t.includes('comforter') ||
    t.includes('flask') ||
    t.includes('bottle') ||
    t.includes('bedsheet') ||
    t.includes('trolley') ||
    t.includes('diffuser')
  ) {
    if (t.includes('pillow') || t.includes('comforter') || t.includes('bedsheet')) {
      return 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&auto=format&fit=crop&q=80';
    }
    if (t.includes('flask') || t.includes('bottle')) {
      return 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80';
  }

  return '';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  images = [],
  thumbnail,
  serpapi_thumbnail,
  alt,
  index,
  isPriority: explicitPriority,
  store = 'store',
  productId,
  variantText,
  className = '',
  style = {},
  aspectRatio = '1 / 1',
  onImageLoad
}) => {
  // First 8 items are eager and high priority
  const isPriority = explicitPriority !== undefined ? explicitPriority : (index !== undefined && index < 8);

  // Ordered candidate list builder:
  // 1. Primary image URL from record (if valid external HTTPS)
  // 2. Other images in the same record (images[])
  // 3. Google Shopping thumbnails (thumbnail, serpapi_thumbnail)
  // 4. Stored image in VoiceCart cache (/api/images/file/:store/:productId)
  // 5. Image proxy fallback for the primary external URL if needed
  const candidateUrls = React.useMemo(() => {
    const list: string[] = [];

    const addCandidate = (rawUrl?: string) => {
      const normalized = normalizeCandidateUrl(rawUrl);
      if (!normalized) return;

      const lowerNorm = normalized.toLowerCase();
      const lowerAlt = (alt || '').toLowerCase();

      // Guard against infamous placeholder mismatches:
      // boAt earbuds image on non-audio products
      if (
        lowerNorm.includes('51hbom8xz7l') &&
        !lowerAlt.includes('boat') &&
        !lowerAlt.includes('earbud') &&
        !lowerAlt.includes('airdopes') &&
        !lowerAlt.includes('headphone') &&
        !lowerAlt.includes('audio') &&
        !lowerAlt.includes('tws')
      ) {
        return;
      }
      // iPhone image on non-Apple products
      if (
        lowerNorm.includes('71d7rfsl0wl') &&
        !lowerAlt.includes('iphone') &&
        !lowerAlt.includes('apple')
      ) {
        return;
      }
      // Smartwatch image on non-watch products
      if (
        lowerNorm.includes('61ssvxtss3l') &&
        !lowerAlt.includes('watch') &&
        !lowerAlt.includes('band')
      ) {
        return;
      }
      // Mobile / Smartphone image guard on non-phone products
      if (
        (lowerNorm.includes('/mobile/') || lowerNorm.includes('imahkkpg3hbtardn')) &&
        !lowerAlt.includes('phone') &&
        !lowerAlt.includes('mobile') &&
        !lowerAlt.includes('5g') &&
        !lowerAlt.includes('smartphone') &&
        !lowerAlt.includes('iphone') &&
        !lowerAlt.includes('galaxy') &&
        !lowerAlt.includes('oppo') &&
        !lowerAlt.includes('realme') &&
        !lowerAlt.includes('vivo') &&
        !lowerAlt.includes('redmi') &&
        !lowerAlt.includes('poco') &&
        !lowerAlt.includes('oneplus')
      ) {
        return;
      }

      if (!list.includes(normalized)) {
        list.push(normalized);
      }
    };

    // 1. Primary image URL from record
    if (src && src.trim()) {
      addCandidate(src);
    }

    // 2. Other images in the same record
    if (Array.isArray(images)) {
      for (const img of images) {
        addCandidate(img);
      }
    }

    // 3. Google Shopping thumbnail from the same result
    addCandidate(thumbnail);
    addCandidate(serpapi_thumbnail);

    // 4. Stored image endpoint if store & productId are provided
    if (store && productId) {
      const cleanStore = store.toLowerCase();
      const storedUrl = `/api/images/file/${encodeURIComponent(cleanStore)}/${encodeURIComponent(productId)}${variantText ? '?v=' + encodeURIComponent(variantText) : ''}`;
      addCandidate(storedUrl);
    }

    // 5. Image proxy fallback for the primary external HTTPS URL (helps bypass CORS or hotlinking)
    const primaryExternal = list.find((u) => u.startsWith('https://') && !u.includes('/api/'));
    if (primaryExternal) {
      const proxyUrl = `/api/products/image-proxy?url=${encodeURIComponent(primaryExternal)}`;
      if (!list.includes(proxyUrl)) {
        list.push(proxyUrl);
      }
    }

    // 6. High-reliability category/title fallback candidate
    const fallbackUrl = getFallbackImageByTitle(alt);
    if (fallbackUrl && !list.includes(fallbackUrl)) {
      list.push(fallbackUrl);
    }

    return list;
  }, [store, productId, variantText, src, images, thumbnail, serpapi_thumbnail, alt]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const currentSrc = candidateUrls[candidateIndex] || null;

  // Reset state when product or image sources change
  useEffect(() => {
    setCandidateIndex(0);
    setIsLoaded(false);
    setIsFailed(false);
  }, [store, productId, src, candidateUrls.length]);

  // Persist working image in SQLite images table
  const persistVerifiedImage = (url: string, width?: number, height?: number) => {
    if (!url || !store || !productId || url.startsWith('data:') || url.startsWith('/api/')) return;
    
    // Do NOT persist generic category fallbacks, unsplash stock photos, or shopping thumbnails
    const fb = getFallbackImageByTitle(alt);
    if (
      url === fb ||
      url.includes('images.unsplash.com') ||
      url.includes('shopping?q=tbn:') ||
      url.includes('encrypted-tbn')
    ) {
      return;
    }

    // Do NOT persist phone image onto non-phone products
    const lowerUrl = url.toLowerCase();
    const lowerAlt = (alt || '').toLowerCase();
    if (
      (lowerUrl.includes('/mobile/') || lowerUrl.includes('imahkkpg3hbtardn')) &&
      !lowerAlt.includes('phone') &&
      !lowerAlt.includes('mobile') &&
      !lowerAlt.includes('5g') &&
      !lowerAlt.includes('smartphone') &&
      !lowerAlt.includes('iphone') &&
      !lowerAlt.includes('galaxy') &&
      !lowerAlt.includes('oppo') &&
      !lowerAlt.includes('realme') &&
      !lowerAlt.includes('vivo') &&
      !lowerAlt.includes('redmi') &&
      !lowerAlt.includes('poco') &&
      !lowerAlt.includes('oneplus')
    ) {
      return;
    }

    try {
      fetch('/api/products/verified-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store,
          productId,
          variant: variantText,
          url,
          source: 'verified_record',
          size: width && height ? `${width}x${height}` : undefined
        })
      }).catch(() => {});
    } catch {}
  };

  // Mount & Fallback timer check: Never depend only on onLoad
  useEffect(() => {
    if (isLoaded || isFailed || !currentSrc) return;

    const checkComplete = () => {
      const img = imgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        setIsLoaded(true);
        setIsFailed(false);
        persistVerifiedImage(currentSrc, img.naturalWidth, img.naturalHeight);
        return true;
      }
      return false;
    };

    // Check immediately on mount/src change
    if (checkComplete()) return;

    // 6.0 second timer re-check to prevent hanging on unresponsive CDN
    const timer = setTimeout(() => {
      const img = imgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        setIsLoaded(true);
        setIsFailed(false);
        persistVerifiedImage(currentSrc, img.naturalWidth, img.naturalHeight);
      } else if (img && img.complete && img.naturalWidth === 0) {
        handleError('zero_natural_width');
      } else if (!img || !img.complete) {
        handleError('load_timeout_6000ms');
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [currentSrc, isLoaded, isFailed, candidateIndex]);

  const handleLoad = () => {
    const img = imgRef.current;
    if (img && img.naturalWidth > 0) {
      setIsLoaded(true);
      setIsFailed(false);
      persistVerifiedImage(currentSrc || '', img.naturalWidth, img.naturalHeight);
      if (onImageLoad) onImageLoad();
    } else {
      handleError('zero_width_on_load');
    }
  };

  const handleError = (_reason = 'error_event') => {
    if (currentSrc) {
      imageInterventionTracker.registerUnloaded();
    }

    if (candidateIndex < candidateUrls.length - 1) {
      setCandidateIndex((prev) => prev + 1);
      setIsLoaded(false);
    } else {
      setIsFailed(true);
      setIsLoaded(false);
    }
  };

  const storeCapitalized = store ? store.charAt(0).toUpperCase() + store.slice(1) : 'Store';
  const altFormatted = alt?.toLowerCase().includes(store.toLowerCase()) ? alt : `${alt} - ${storeCapitalized}`;

  return (
    <div
      ref={containerRef}
      className={`product-img-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#ffffff',
        aspectRatio,
        ...style
      }}
    >
      {/* 1. Shimmer skeleton placeholder while image is fetching */}
      {!isLoaded && !isFailed && Boolean(currentSrc) && (
        <div
          className="img-shimmer"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '6px',
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            zIndex: 0
          }}
        />
      )}

      {/* 2. Clean Neutral Placeholder when no image exists or all candidates fail */}
      {(isFailed || !currentSrc) ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'var(--bg-subtle, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            padding: '8px',
            textAlign: 'center',
            color: 'var(--text-muted, #64748b)',
            userSelect: 'none',
            zIndex: 1
          }}
          title={altFormatted}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--bg-card, #f1f5f9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-dim, #94a3b8)'
            }}
          >
            <Package size={18} strokeWidth={1.5} />
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted, #94a3b8)' }}>
            Image unavailable
          </span>
        </div>
      ) : (
        /* 3. Real Product Image */
        <img
          key={`${store}-${productId}-${candidateIndex}`}
          ref={imgRef}
          src={currentSrc}
          alt={altFormatted}
          loading={isPriority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={() => handleError('http_or_network_error')}
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            background: '#ffffff',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease',
            zIndex: 1
          }}
        />
      )}
    </div>
  );
};
