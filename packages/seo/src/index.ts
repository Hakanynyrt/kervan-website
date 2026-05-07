// JSON-LD schema builders
export {
  organization,
  website,
  service,
  product,
  breadcrumbList,
  itemList,
  type BreadcrumbItem,
  type BuildOrgOpts,
  type BuildWebsiteOpts,
  type BuildServiceOpts,
  type BuildProductOpts,
  type BuildItemListOpts,
} from './jsonld.js';

// React components
export { JsonLd } from './JsonLd.js';
export { PageMeta } from './PageMeta.js';

// Constants
export {
  KERVAN_HEAT_URL,
  KERVAN_BREAKER_URL,
  ORG_LEGAL_NAME,
  ORG_TRADING_NAME,
  ORG_PHONE,
  ORG_PHONE_E164,
  ORG_EMAIL,
  ORG_LOCALITY,
  ORG_REGION,
  ORG_COUNTRY,
  ORG_STREET,
  ORG_INSTAGRAM,
  ORG_SAME_AS,
} from './constants.js';
