export interface Country {
  id: number;
  name_fr: string;
  iso2: string | null;
  continent: string | null;
  popular_destination: boolean;
  image_url: string | null;
  processed_visas_count: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface OfficialPortal {
  id: number;
  country_id: number;
  url: string;
  label: string;
  created_at: Date;
  updated_at: Date;
}

export interface Nationality {
  id: number;
  name_fr: string;
  iso2: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EntryProfile {
  id: number;
  nationality_id: number;
  destination_country_id: number;
  purpose: string;
  last_checked: Date | null;
  source_confidence: number | null;
  needs_manual_review: boolean;
  llm_model: string | null;
  llm_prompt_version: string | null;
  llm_sources_json: string | null;
  llm_raw_json: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EntryDocument {
  id: number;
  profile_id: number;
  nom_document: string;
  type_document: string;
  required: boolean;
  duree_validite_text: string | null;
  duree_validite_days: number | null;
  nombre_entrees: 'single' | 'multiple' | 'unknown';
  duree_sejour_max_text: string | null;
  duree_sejour_max_days: number | null;
  prix_montant: number | null;
  prix_devise: string | null;
  prix_montant_eur: number | null;
  prix_libelle: string | null;
  temps_obtention_visa: string | null;
  application_url: string | null;
  source_officielle: string | null;
  confidence: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface TravelRequirements {
  id: number;
  profile_id: number;
  travel_authorization_required: boolean;
  travel_authorization_name: string | null;
  travel_authorization_url: string | null;
  arrival_form_required: boolean;
  arrival_form_name: string | null;
  arrival_form_url: string | null;
  other_requirements_json: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface HealthRequirements {
  id: number;
  profile_id: number;
  vaccines_required_json: string | null;
  vaccines_recommended_json: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CountryGuide {
  id: number;
  country_id: number;
  lang: string;
  guide_text: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SourceItem {
  url: string;
  title: string;
}

export interface RequirementsResponse {
  nationality: {
    id: number;
    name_fr: string;
    iso2: string | null;
  };
  destination: {
    id: number;
    name_fr: string;
    iso2: string | null;
    continent: string | null;
    image_url: string | null;
    official_portal: string | null;
  };
  purpose: string;
  last_checked: string | null;
  source_confidence: number | null;
  needs_manual_review: boolean;
  sections: {
    documents: Array<{
      id: number;
      nom_document: string;
      type_document: string;
      required: boolean;
      duree_validite_text: string | null;
      duree_validite_days: number | null;
      nombre_entrees: string;
      duree_sejour_max_text: string | null;
      duree_sejour_max_days: number | null;
      prix_montant: number | null;
      prix_devise: string | null;
      prix_montant_eur: number | null;
      prix_libelle: string | null;
      temps_obtention_visa: string | null;
      application_url: string | null;
      source_officielle: string | null;
      confidence: number | null;
    }>;
    travel_authorization: {
      required: boolean;
      name: string;
      url: string;
      message: string;
    };
    arrival_form: {
      required: boolean;
      name: string;
      url: string;
      notes: string;
    };
    vaccines: {
      required: Array<unknown>;
      recommended: Array<unknown>;
      notes: string | null;
    };
    guide: {
      lang: string;
      text: string | null;
    };
  };
  sources: SourceItem[];
  llm: {
    model: string | null;
    prompt_version: string | null;
  };
}

