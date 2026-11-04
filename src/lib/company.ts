/**
 * Company details for the info pages and the footer (RP-36). Fields that are not set
 * are left out instead of showing a placeholder. Set them in Vercel once known:
 * COMPANY_LEGAL_NAME, COMPANY_KVK, COMPANY_VAT, COMPANY_ADDRESS.
 *
 * Note: a Dutch business must show its KvK number and a physical address on its
 * website; until those are set the site shows only the e-mail address.
 */
export type CompanyDetails = {
  tradeName: string;
  email: string;
  legalName: string | null;
  kvk: string | null;
  vat: string | null;
  address: string | null;
};

const value = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

export function companyDetails(): CompanyDetails {
  return {
    tradeName: "Racketpicker",
    email: "hello@racketpicker.com",
    legalName: value(process.env.COMPANY_LEGAL_NAME),
    kvk: value(process.env.COMPANY_KVK),
    vat: value(process.env.COMPANY_VAT),
    address: value(process.env.COMPANY_ADDRESS),
  };
}

/** Whether the legally required identification (KvK + address) is complete. */
export function hasLegalIdentification(c: CompanyDetails): boolean {
  return Boolean(c.kvk && c.address);
}
