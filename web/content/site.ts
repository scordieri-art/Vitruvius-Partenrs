// Company data shown in footer, contact page and structured data.
// Source: vitruviusandpartners.com (October 2026).
export const company = {
  name: "Vitruvius & Partners",
  legalName: "Vitruvius & Partners Srl",
  vat: "IT11391180962",
  shareCapital: "1.000.000 €",
  email: "info@vitruviusandpartners.com",
  pec: "vitruviusandpartners@pec.it",
  url: "https://vitruviusandpartners.com",
  offices: [
    {
      key: "milano",
      city: "Milano",
      street: "Via Stresa, 6",
      postal: "20125 Milano (MI)",
      phone: "+39 380 648 3004",
      phoneHref: "tel:+393806483004",
      region: "MI",
      zip: "20125",
      coords: { lat: 45.4977, lon: 9.2033 },
    },
    {
      key: "asti",
      city: "Asti",
      street: "Corso Torino, 285",
      postal: "14100 Asti (AT)",
      phone: "+39 327 988 4910",
      phoneHref: "tel:+393279884910",
      region: "AT",
      zip: "14100",
      coords: { lat: 44.9056, lon: 8.1868 },
    },
  ],
  social: {
    linkedin: "https://www.linkedin.com/company/vitruvius-partners-srl/",
    facebook: "https://www.facebook.com/people/Vitruvius-Partners/100088430472621/",
    x: "https://x.com/VitruviusandP",
  },
  divisions: {
    construction: "https://vitruvius-construction.com/",
    living: "https://vitruviusliving.com/",
  },
  certifications: {
    iso9001: "https://vitruviusandpartners.com/wp-content/uploads/2022/12/ISO9001-2015-VITRUVIUS-PARTNER-SRL-QMS-Certificate.pdf",
    iso9001Renewal: "https://vitruviusandpartners.com/wp-content/uploads/2025/11/RINNOVO-ISO-9001.pdf",
  },
  governanceImage: "https://vitruviusandpartners.com/wp-content/uploads/2024/12/VandP-Governance.jpg",
  careersImage: "https://vitruviusandpartners.com/wp-content/uploads/2023/01/team-work-guys.jpg",
} as const;

export type Office = (typeof company.offices)[number];
