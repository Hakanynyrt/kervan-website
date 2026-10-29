import { ORG_PHONE_E164 } from '@kervan/seo';

/** WhatsApp chat with the company number (same number as the phone, from @kervan/seo). */
export const WHATSAPP_URL = `https://wa.me/${ORG_PHONE_E164.replace(/^\+/, '')}`;
