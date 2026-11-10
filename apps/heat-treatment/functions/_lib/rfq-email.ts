/** The e-mail check of the RFQ: the same rule in functions/api/rfq.ts and in the form. */
export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
