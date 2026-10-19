import { Product } from '../types/product';
import { relevanceFilter, EvaluatedProduct } from './relevanceFilter';
import { querySpecExtractor } from './querySpecExtractor';

export interface ScoredProductResult {
  product: Product;
  matchScore: number;
  isExactMatch: boolean;
  isPartialMatch: boolean;
  isAlternative: boolean;
  matchReason: string;
}

export class ProductScorer {
  public scoreProduct(product: Product, query: any): ScoredProductResult {
    const spec = query?.spec || querySpecExtractor.extractRuleSpec(query.rawQuery || query.cleanQuery || '', query.rawQuery || '');
    const evaluated: EvaluatedProduct = relevanceFilter.evaluateSingleProduct(product, spec);

    return {
      product: evaluated.product,
      matchScore: evaluated.relevanceScore,
      isExactMatch: evaluated.isExactMatch,
      isPartialMatch: evaluated.isPartialMatch,
      isAlternative: evaluated.isSimilar || !evaluated.passedRelevanceFilter,
      matchReason: evaluated.rejectionReason || evaluated.matchReasons.join(', ') || 'Evaluated'
    };
  }
}

export const productScorer = new ProductScorer();
