/**
 * Unit tests for resolveApiBaseUrl logic
 */

function resolveApiBaseUrl(rawUrl?: string, isProd = false): string {
  if (isProd && rawUrl && /localhost|127\.0\.0\.1/i.test(rawUrl)) {
    throw new Error(
      `[VoiceCart Build Error] VITE_API_URL cannot contain "localhost" in production build! Received: "${rawUrl}". Please use same-origin "/api" or your public HTTPS backend URL.`
    );
  }

  if (!rawUrl || !rawUrl.trim()) {
    return '/api';
  }

  let clean = rawUrl.trim();
  // Strip trailing slashes
  clean = clean.replace(/\/+$/, '');

  // Prevent doubled /api/api
  if (clean.endsWith('/api/api')) {
    clean = clean.slice(0, -4);
  }

  return clean;
}

describe('resolveApiBaseUrl Unit Tests', () => {
  test('returns "/api" when rawUrl is undefined or empty string', () => {
    expect(resolveApiBaseUrl(undefined, false)).toBe('/api');
    expect(resolveApiBaseUrl('', false)).toBe('/api');
    expect(resolveApiBaseUrl('   ', false)).toBe('/api');
  });

  test('strips trailing slashes correctly', () => {
    expect(resolveApiBaseUrl('https://api.voicecart.com/', false)).toBe('https://api.voicecart.com');
    expect(resolveApiBaseUrl('https://api.voicecart.com///', false)).toBe('https://api.voicecart.com');
    expect(resolveApiBaseUrl('/api/', false)).toBe('/api');
  });

  test('normalizes doubled /api/api to /api', () => {
    expect(resolveApiBaseUrl('https://backend.com/api/api', false)).toBe('https://backend.com/api');
    expect(resolveApiBaseUrl('/api/api', false)).toBe('/api');
  });

  test('allows localhost in development mode', () => {
    expect(resolveApiBaseUrl('http://localhost:5000', false)).toBe('http://localhost:5000');
    expect(resolveApiBaseUrl('http://127.0.0.1:5000', false)).toBe('http://127.0.0.1:5000');
  });

  test('throws descriptive build error when localhost is configured in production build', () => {
    expect(() => {
      resolveApiBaseUrl('http://localhost:5000', true);
    }).toThrow(/\[VoiceCart Build Error\]/);

    expect(() => {
      resolveApiBaseUrl('http://127.0.0.1:5000/api', true);
    }).toThrow(/VITE_API_URL cannot contain "localhost" in production build/);
  });

  test('allows valid public HTTPS URLs in production build', () => {
    const prodUrl = 'https://voicecart-backend.onrender.com';
    expect(resolveApiBaseUrl(prodUrl, true)).toBe('https://voicecart-backend.onrender.com');
  });
});
