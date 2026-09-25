import { getAbsoluteUrl, getSiteUrl } from './site-url';
import type { ProductWithDetails } from '@/types/database';

/**
 * Generates Schema.org Organization structured data.
 * Uses only genuine TOOLSMAN information.
 */
export function generateOrganizationSchema() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TOOLSMAN',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      'Buy genuine power tools, hand tools, machinery and accessories at TOOLSMAN with fast delivery across Kerala. 100% authentic brands.',
  };
}

/**
 * Generates Schema.org WebSite structured data with genuine Sitelinks Searchbox action.
 */
export function generateWebSiteSchema() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TOOLSMAN',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/shop?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates Schema.org Product structured data from actual database fields.
 * Omits aggregate ratings unless genuine reviews exist.
 */
export function generateProductSchema(
  product: {
    name: string;
    slug: string;
    short_description?: string | null;
    description?: string | null;
    product_code?: string | null;
    selling_price: number;
    stock_quantity: number;
    primary_image_url?: string | null;
    brand_name?: string | null;
    brand?: { name: string } | null;
  },
  currentUrl?: string
) {
  const siteUrl = getSiteUrl();
  const canonicalUrl = currentUrl || `${siteUrl}/product/${product.slug}`;
  const images = product.primary_image_url ? [product.primary_image_url] : [];
  const brandName = product.brand?.name || product.brand_name;

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description:
      product.short_description ||
      product.description ||
      `Buy genuine ${product.name} at best price with warranty at TOOLSMAN.`,
    image: images,
    url: canonicalUrl,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.selling_price,
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.stock_quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
      seller: {
        '@type': 'Organization',
        name: 'TOOLSMAN',
      },
    },
  };

  if (product.product_code) {
    schema.sku = product.product_code;
    schema.mpn = product.product_code;
  }

  if (brandName) {
    schema.brand = {
      '@type': 'Brand',
      name: brandName,
    };
  }

  return schema;
}

/**
 * Generates Schema.org BreadcrumbList structured data.
 */
export function generateBreadcrumbSchema(items: { name: string; url?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const listItem: Record<string, any> = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
      };

      if (item.url) {
        listItem.item = item.url.startsWith('http')
          ? item.url
          : getAbsoluteUrl(item.url);
      }

      return listItem;
    }),
  };
}

/**
 * Generates Schema.org CollectionPage structured data for Category/Collection views.
 */
export function generateCollectionPageSchema(
  name: string,
  description: string,
  url: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: url.startsWith('http') ? url : getAbsoluteUrl(url),
  };
}
