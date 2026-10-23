import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildHeadTags } from './head.ts';

const IMG = 'https://example.com/og/og-x-v1.jpg';

test('buildHeadTags: og:image size only with an og:image', () => {
  const sized = buildHeadTags({
    lang: 'tr',
    title: 't',
    ogImage: IMG,
    ogImageSize: { width: 1200, height: 630 },
  });
  assert.match(
    sized,
    /<meta property="og:image" content="https:\/\/example\.com\/og\/og-x-v1\.jpg" \/>/,
  );
  assert.match(sized, /<meta property="og:image:width" content="1200" \/>/);
  assert.match(sized, /<meta property="og:image:height" content="630" \/>/);
  assert.match(
    sized,
    /<meta name="twitter:image" content="https:\/\/example\.com\/og\/og-x-v1\.jpg" \/>/,
  );

  const unsized = buildHeadTags({ lang: 'tr', title: 't', ogImage: IMG });
  assert.doesNotMatch(unsized, /og:image:width/);

  const none = buildHeadTags({ lang: 'tr', title: 't', ogImageSize: { width: 1200, height: 630 } });
  assert.doesNotMatch(none, /og:image/);
});
