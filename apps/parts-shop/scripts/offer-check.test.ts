import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkOffer, offersIn, shownPrice } from './offer-check.mjs';

// Invented prices only (never a catalogue price).
const offer = (price: string, cur: 'TRY' | 'USD', vat: boolean) => ({
  '@type': 'Offer',
  price,
  priceCurrency: cur,
  priceSpecification: {
    '@type': 'UnitPriceSpecification',
    price,
    priceCurrency: cur,
    valueAddedTaxIncluded: vat,
  },
});
const shownOf = (html: string) =>
  [...html.matchAll(/data-offer=""[^>]*>([^<]*)</g)].map((m) => m[1]);

test('shownPrice: tr-TR and en-GB number forms', () => {
  assert.deepEqual(shownPrice('1.200 TL', false), { n: 1200, cur: 'TRY' });
  assert.deepEqual(shownPrice('1.850,5 USD', false), { n: 1850.5, cur: 'USD' });
  assert.deepEqual(shownPrice('1,850 USD', true), { n: 1850, cur: 'USD' });
  assert.equal(shownPrice('Fiyat için sorun', false), null);
});

test('offersIn: finds the Offer inside a Product', () => {
  const ld = [{ '@type': 'Product', offers: offer('1.00', 'USD', false) }, { '@type': 'X' }];
  assert.equal(offersIn(ld).length, 1);
});

test('checkOffer: TR with a rate wants TRY incl. VAT equal to the shown TL price', () => {
  const shown = shownOf('<p data-offer="" class="x">1.200 TL<span> (vergiler dahil)</span></p>');
  assert.deepEqual(shown, ['1.200 TL']);
  assert.deepEqual(checkOffer([offer('1200.00', 'TRY', true)], shown, false, true), {
    currency: 'TRY',
  });
  assert.ok(checkOffer([offer('1201.00', 'TRY', true)], shown, false, true).problem);
  assert.ok(checkOffer([offer('1200.00', 'TRY', false)], shown, false, true).problem);
  assert.ok(checkOffer([offer('12.00', 'USD', false)], shown, false, true).problem);
});

test('checkOffer: EN (and TR without a rate) wants net USD', () => {
  assert.deepEqual(checkOffer([offer('1850.00', 'USD', false)], ['1,850 USD'], true, true), {
    currency: 'USD',
  });
  assert.deepEqual(checkOffer([offer('1850.50', 'USD', false)], ['1.850,5 USD'], false, false), {
    currency: 'USD',
  });
  assert.ok(checkOffer([offer('1850.00', 'USD', true)], ['1,850 USD'], true, true).problem);
  // Two shown prices, or none, is a problem too; no problem text names a price.
  const p = checkOffer([offer('1850.00', 'USD', false)], [], true, true).problem ?? '';
  assert.ok(p && !/\d{3}/.test(p));
});
