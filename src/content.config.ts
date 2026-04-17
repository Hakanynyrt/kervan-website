import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

const localizedString = z.object({ tr: z.string(), en: z.string() });

const breakers = defineCollection({
  loader: file('src/data/breakers.json'),
  schema: z.object({
    id: z.string(),
    name: localizedString,
    shortDesc: localizedString,
    material: z.string(),
    hardnessHRC: z.string(),
    diameterRangeMm: z.string(),
    lengthRangeMm: z.string(),
    image: z.string(),
    model3d: z.boolean().optional(),
    model3dUrl: z.string().nullable().optional(),
    model3dPoster: z.string().nullable().optional(),
    uniqueParagraphs: z.object({
      tr: z.string().min(200),
      en: z.string().min(200),
    }),
  }),
});

const services = defineCollection({
  loader: file('src/data/services.json'),
  schema: z.object({
    id: z.string(),
    name: localizedString,
    slug: localizedString,
    shortDesc: localizedString,
    process: z.object({ tr: z.string().min(120), en: z.string().min(120) }),
    applications: z.object({ tr: z.array(z.string()), en: z.array(z.string()) }),
    specs: z.record(z.string(), z.string()),
    faq: z.array(
      z.object({
        q: localizedString,
        a: localizedString,
      })
    ),
  }),
});

const locations = defineCollection({
  loader: file('src/data/locations.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    distance: z.string(),
    industries: z.array(z.string()),
    content: z.string().min(200),
  }),
});

const certifications = defineCollection({
  loader: file('src/data/certifications.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    issuer: z.string(),
    issuerName: z.string(),
    number: z.string(),
    validUntil: z.string(),
    scope: localizedString,
    image: z.string(),
    description: localizedString,
  }),
});

const caseStudies = defineCollection({
  loader: file('src/data/case-studies.json'),
  schema: z.object({
    id: z.string(),
    slug: localizedString,
    title: localizedString,
    industry: z.string(),
    year: z.number(),
    specs: z.record(z.string(), z.union([z.string(), z.number()])),
    challenge: localizedString,
    solution: localizedString,
    result: localizedString,
    image: z.string(),
  }),
});

const resources = defineCollection({
  loader: file('src/data/resources.json'),
  schema: z.object({
    id: z.string(),
    slug: localizedString,
    title: localizedString,
    excerpt: localizedString,
    body: z.object({ tr: z.string().min(500), en: z.string().min(500) }),
    tableData: z
      .object({
        columns: z.array(z.string()),
        rows: z.array(z.array(z.string())),
      })
      .optional(),
    publishedAt: z.string(),
    image: z.string(),
  }),
});

export const collections = {
  breakers,
  services,
  locations,
  certifications,
  caseStudies,
  resources,
};
