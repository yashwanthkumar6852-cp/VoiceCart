import { ParsedProductQuery, ProductSpec } from '../types/product';
import { querySpecExtractor } from './querySpecExtractor';

export { ParsedProductQuery };

export class QueryExtractor {
  public extract(rawText: string): ParsedProductQuery {
    const spec = querySpecExtractor.extractRuleSpec(rawText, rawText);
    querySpecExtractor.applyDefaultExcludes(spec);
    querySpecExtractor.buildCleanQueries(spec);

    return {
      rawQuery: spec.rawQuery,
      cleanQuery: spec.cleanSearchQuery,
      brand: spec.brand,
      product: spec.productType,
      model: spec.model,
      storage: spec.variant?.storage,
      ram: spec.variant?.ram,
      size: spec.variant?.size,
      color: spec.variant?.color,
      displayName: spec.cleanSearchQuery || spec.rawQuery,
      spec
    };
  }

  public async extractAsync(rawText: string): Promise<ParsedProductQuery> {
    const spec = await querySpecExtractor.extractSpec(rawText);
    return {
      rawQuery: spec.rawQuery,
      cleanQuery: spec.cleanSearchQuery,
      brand: spec.brand,
      product: spec.productType,
      model: spec.model,
      storage: spec.variant?.storage,
      ram: spec.variant?.ram,
      size: spec.variant?.size,
      color: spec.variant?.color,
      displayName: spec.cleanSearchQuery || spec.rawQuery,
      spec
    };
  }
}

export const queryExtractor = new QueryExtractor();
