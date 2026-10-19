import { intentParser } from '../src/voice/intentParser';

describe('Multilingual Voice IntentParser Tests (English, Hindi, Kannada)', () => {
  test('should extract product and budget from English voice input', async () => {
    const result = await intentParser.parseIntent('find me the best wireless earbuds under 2000 rupees');
    expect(result.intent).toBe('SEARCH');
    expect(result.language).toBe('en');
    expect(result.maxBudget).toBe(2000);
    expect(result.productQuery).toContain('wireless earbuds');
  });

  test('should detect cheapest preference in voice query', async () => {
    const result = await intentParser.parseIntent('show me the cheapest running shoes under 1500');
    expect(result.preference).toBe('cheapest');
    expect(result.maxBudget).toBe(1500);
  });

  test('should parse order tracking intent with order id', async () => {
    const result = await intentParser.parseIntent('where is my order 402-1234567-8901234');
    expect(result.intent).toBe('TRACK_ORDER');
    expect(result.orderId).toBe('402-1234567-8901234');
  });

  test('should detect Hindi language input correctly', async () => {
    const result = await intentParser.parseIntent('2000 रुपये के अंदर सबसे अच्छे ईयरबड्स दिखाओ');
    expect(result.language).toBe('hi');
    expect(result.intent).toBe('SEARCH');
    expect(result.maxBudget).toBe(2000);
  });

  test('should detect Kannada language and extract mixed code-switching query', async () => {
    // "ಒಳ್ಳೆಯ boAt earbuds ಹೇಳು 2000 ಒಳಗೆ"
    const result = await intentParser.parseIntent('ಒಳ್ಳೆಯ boAt earbuds ಹೇಳು 2000 ಒಳಗೆ');
    expect(result.language).toBe('kn');
    expect(result.intent).toBe('SEARCH');
    expect(result.maxBudget).toBe(2000);
    expect(result.brand?.toLowerCase()).toBe('boat');
  });

  test('should parse Kannada voice command for order tracking', async () => {
    const result = await intentParser.parseIntent('ನನ್ನ ಆರ್ಡರ್ ಎಲ್ಲಿದೆ?');
    expect(result.language).toBe('kn');
    expect(result.intent).toBe('TRACK_ORDER');
  });

  test('should parse mixed Kannada-English queries and extract clean English search keywords', async () => {
    // Mixed Kannada query: "2000 ರೂಪಾಯಿ ಒಳಗೆ boAt earbuds ತೋರಿಸಿ"
    const result = await intentParser.parseIntent('2000 ರೂಪಾಯಿ ಒಳಗೆ boAt earbuds ತೋರಿಸಿ');
    expect(result.language).toBe('kn');
    expect(result.intent).toBe('SEARCH');
    expect(result.maxBudget).toBe(2000);
    expect(result.brand?.toLowerCase()).toBe('boat');
    expect(result.productQuery?.toLowerCase()).toContain('earbuds');
  });

  test('should parse mixed Samsung smartphone Kannada query', async () => {
    const result = await intentParser.parseIntent('Samsung ಮೊಬೈಲ್ 15000 ಒಳಗೆ ತೋರಿಸಿ');
    expect(result.language).toBe('kn');
    expect(result.brand?.toLowerCase()).toBe('samsung');
    expect(result.maxBudget).toBe(15000);
    expect(result.productQuery?.toLowerCase()).toMatch(/smartphone|phone|samsung/);
  });
});
