import { MOBILES_CATALOG } from './mobiles';
import { LAPTOPS_CATALOG } from './laptops';
import { FASHION_CATALOG } from './fashion';
import { SHOES_CATALOG } from './shoes';
import { ELECTRONICS_CATALOG } from './electronics';
import { APPLIANCES_CATALOG } from './appliances';
import { HOME_LIVING_CATALOG } from './homeLiving';
import { BEAUTY_CATALOG } from './beautyPersonalCare';
import { OTHER_CATEGORIES_CATALOG } from './otherCategories';
import { Product } from '../../types/product';

export const MASSIVE_EXPANDED_CATALOG: Product[] = [
  ...MOBILES_CATALOG,
  ...LAPTOPS_CATALOG,
  ...FASHION_CATALOG,
  ...SHOES_CATALOG,
  ...ELECTRONICS_CATALOG,
  ...APPLIANCES_CATALOG,
  ...HOME_LIVING_CATALOG,
  ...BEAUTY_CATALOG,
  ...OTHER_CATEGORIES_CATALOG
];

export {
  MOBILES_CATALOG,
  LAPTOPS_CATALOG,
  FASHION_CATALOG,
  SHOES_CATALOG,
  ELECTRONICS_CATALOG,
  APPLIANCES_CATALOG,
  HOME_LIVING_CATALOG,
  BEAUTY_CATALOG,
  OTHER_CATEGORIES_CATALOG
};
