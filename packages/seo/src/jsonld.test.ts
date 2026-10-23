import { test } from 'node:test';
import assert from 'node:assert/strict';
import { merchantReturnPolicy, productWebPage, shopProduct, website } from './jsonld.ts';

const URL = 'https://example.com';

test('website: an @id, and alternateName only when given', () => {
  const plain = website({ url: URL, name: 'Example', description: 'd' });
  assert.equal(plain['@id'], `${URL}/#website`);
  assert.equal('alternateName' in plain, false);
  const named = website({
    url: URL,
    name: 'Example',
    alternateName: ['Ex', 'example.com'],
    description: 'd',
  });
  assert.deepEqual(named.alternateName, ['Ex', 'example.com']);
  // The canonical home URL with its slash keeps the ids clean.
  const slash = website({ url: `${URL}/`, name: 'Example', description: 'd' });
  assert.equal(slash.url, `${URL}/`);
  assert.equal(slash['@id'], `${URL}/#website`);
  assert.deepEqual(slash.publisher, { '@id': `${URL}/#organization` });
});

test('merchantReturnPolicy: finite window; method, fees and refund only as given', () => {
  const p = merchantReturnPolicy({
    id: `${URL}/iade#policy`,
    country: 'TR',
    days: 14,
    fees: 'FreeReturn',
    method: 'ReturnByMail',
    refund: 'FullRefund',
  });
  assert.equal(p['@type'], 'MerchantReturnPolicy');
  assert.equal(p.merchantReturnDays, 14);
  assert.equal(p.applicableCountry, 'TR');
  assert.equal(p.returnFees, 'https://schema.org/FreeReturn');
  assert.equal(p.returnMethod, 'https://schema.org/ReturnByMail');
  assert.equal(p.refundType, 'https://schema.org/FullRefund');
  const bare = merchantReturnPolicy({ id: `${URL}/iade#policy`, country: 'TR', days: 14 });
  assert.equal('returnFees' in bare, false);
  assert.equal('returnMethod' in bare, false);
  assert.equal('refundType' in bare, false);
});

test('shopProduct: seller and return policy on the offer, never ratings', () => {
  const policy = merchantReturnPolicy({
    id: `${URL}/iade#policy`,
    country: 'TR',
    days: 14,
  });
  const p = shopProduct({
    url: `${URL}/p`,
    name: 'Tip',
    brand: 'Maker',
    alternateName: ['Tip2'],
    offer: {
      price: '1.00',
      priceCurrency: 'USD',
      seller: { id: `${URL}/#organization`, name: 'Maker Co', url: `${URL}/` },
      returnPolicy: policy,
    },
  }) as Record<string, unknown>;
  assert.deepEqual(p.alternateName, ['Tip2']);
  const offer = p.offers as Record<string, unknown>;
  assert.deepEqual(offer.seller, {
    '@type': 'Organization',
    '@id': `${URL}/#organization`,
    name: 'Maker Co',
    url: `${URL}/`,
  });
  assert.equal((offer.hasMerchantReturnPolicy as { '@id': string })['@id'], `${URL}/iade#policy`);
  assert.equal('aggregateRating' in p, false);
  assert.equal('review' in p, false);
  assert.equal('shippingDetails' in offer, false);
});

test('shopProduct / productWebPage: no alternateName when none is given', () => {
  assert.equal('alternateName' in shopProduct({ url: URL, name: 'n', brand: 'b' }), false);
  const w = productWebPage({ url: URL, name: 'n', brand: 'b', alternateName: ['m'] });
  assert.deepEqual(w.alternateName, ['m']);
  assert.match(w.keywords, /\bm\b/);
});
