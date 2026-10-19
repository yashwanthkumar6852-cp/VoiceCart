import fs from 'fs';
import path from 'path';

describe('Zero Dummy / Fake Product Data Compliance Scanner', () => {
  const backendSrcDir = path.resolve(__dirname, '../src');

  function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        getAllFiles(filePath, fileList);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        fileList.push(filePath);
      }
    }
    return fileList;
  }

  it('ensures productRoutes.ts contains zero hardcoded bank offers or fake competitor sellers', () => {
    const routeFile = path.join(backendSrcDir, 'routes/productRoutes.ts');
    const content = fs.readFileSync(routeFile, 'utf-8');

    expect(content).not.toContain('Axis Bank Card');
    expect(content).not.toContain('Spotify Premium');
    expect(content).not.toContain('Omni Retail India');
    expect(content).not.toContain('soundQuality: 4.6');
  });

  it('ensures productDetailService.ts contains zero hardcoded fallback smartwatch images or dummy titles', () => {
    const serviceFile = path.join(backendSrcDir, 'services/productDetailService.ts');
    const content = fs.readFileSync(serviceFile, 'utf-8');

    expect(content).not.toContain('photo-1523275335684-37898b6baf30');
    expect(content).not.toContain('Verified Merchant');
    expect(content).not.toContain('price: 1999');
  });
});
