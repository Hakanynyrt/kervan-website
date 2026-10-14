import { ORG_LOCALITY, ORG_PHONE_E164, ORG_REGION, ORG_STREET } from '@kervan/seo';

/** WhatsApp chat with the company number (same number as the phone, from @kervan/seo). */
export const WHATSAPP_URL = `https://wa.me/${ORG_PHONE_E164.replace(/^\+/, '')}`;

/** Google Maps search for the street address: a plain link, no embed and no cookies on our page. */
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${ORG_STREET}, ${ORG_LOCALITY} / ${ORG_REGION}`,
)}`;
