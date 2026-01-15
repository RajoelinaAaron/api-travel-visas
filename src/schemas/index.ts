import { z } from 'zod';

// Query schemas
export const countriesQuerySchema = z.object({
  search: z.string().optional(),
  continent: z.string().optional(),
  popular: z.enum(['0', '1']).optional().transform((val) => val === '1'),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
});

export const nationalitiesQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
});

export const requirementsQuerySchema = z.object({
  nationality: z.string().min(1, 'nationality is required'),
  destination: z.string().min(1, 'destination is required'),
  purpose: z.string().default('tourism'),
  lang: z.string().default('fr'),
});

// Body schemas for admin endpoints
export const createNationalitySchema = z.object({
  name_fr: z.string().min(1),
  iso2: z.string().length(2).nullable().optional(),
});

export const createCountrySchema = z.object({
  name_fr: z.string().min(1),
  iso2: z.string().length(2).nullable().optional(),
  continent: z.string().nullable().optional(),
  popular_destination: z.boolean().default(false),
  image_url: z.string().url().nullable().optional(),
  processed_visas_count: z.number().int().nullable().optional(),
});

export const officialPortalSchema = z.object({
  url: z.string().url(),
});

export const entryProfileSchema = z.object({
  nationality_id: z.number().int().positive(),
  destination_country_id: z.number().int().positive(),
  purpose: z.string().min(1),
  last_checked: z.string().date().nullable().optional(),
  source_confidence: z.number().min(0).max(1).nullable().optional(),
  needs_manual_review: z.boolean().default(false),
  llm_model: z.string().nullable().optional(),
  llm_prompt_version: z.string().nullable().optional(),
  llm_sources_json: z.string().nullable().optional(),
  llm_raw_json: z.string().nullable().optional(),
});

export const entryDocumentSchema = z.object({
  nom_document: z.string().min(1),
  type_document: z.enum(['passport_only', 'eta', 'evisa', 'visa', 'visa_on_arrival', 'esta', 'etias', 'other', 'unknown']),
  required: z.boolean(),
  duree_validite_text: z.string().nullable().optional(),
  duree_validite_days: z.number().int().nullable().optional(),
  nombre_entrees: z.enum(['single', 'multiple', 'unknown']),
  duree_sejour_max_text: z.string().nullable().optional(),
  duree_sejour_max_days: z.number().int().nullable().optional(),
  prix_montant: z.number().nullable().optional(),
  prix_devise: z.string().length(3).nullable().optional(),
  prix_montant_eur: z.number().nullable().optional(),
  prix_libelle: z.string().nullable().optional(),
  temps_obtention_visa: z.string().nullable().optional(),
  application_url: z.string().url().nullable().optional(),
  source_officielle: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

export const documentsBodySchema = z.object({
  documents: z.array(entryDocumentSchema),
});

export const travelRequirementsSchema = z.object({
  travel_authorization_required: z.boolean(),
  travel_authorization_name: z.string().nullable().optional(),
  travel_authorization_url: z.string().url().nullable().optional(),
  arrival_form_required: z.boolean(),
  arrival_form_name: z.string().nullable().optional(),
  arrival_form_url: z.string().url().nullable().optional(),
  other_requirements_json: z.string().nullable().optional(),
});

export const healthRequirementsSchema = z.object({
  vaccines_required_json: z.string().nullable().optional(),
  vaccines_recommended_json: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const countryGuideSchema = z.object({
  lang: z.string().default('fr'),
  guide_text: z.string().nullable().optional(),
});

