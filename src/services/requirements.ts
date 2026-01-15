import { FastifyInstance } from 'fastify';
import {
  getNationalityByIso2,
  getNationalityByName,
  getCountryByIso2,
  getCountryByName,
  getEntryProfile,
  getEntryDocuments,
  getTravelRequirements,
  getHealthRequirements,
  getCountryGuide,
  getOfficialPortal,
} from '../db/queries';
import { RequirementsResponse, SourceItem } from '../types';

export async function aggregateRequirements(
  fastify: FastifyInstance,
  nationalityParam: string,
  destinationParam: string,
  purpose: string,
  lang: string
): Promise<RequirementsResponse> {
  const db = fastify.db;

  // Resolve nationality
  let nationality;
  if (nationalityParam.length === 2) {
    nationality = await getNationalityByIso2(db, nationalityParam.toUpperCase());
  }
  if (!nationality) {
    nationality = await getNationalityByName(db, nationalityParam);
  }
  if (!nationality) {
    throw new Error('Nationality not found');
  }

  // Resolve destination
  let destination;
  if (destinationParam.length === 2) {
    destination = await getCountryByIso2(db, destinationParam.toUpperCase());
  }
  if (!destination) {
    destination = await getCountryByName(db, destinationParam);
  }
  if (!destination) {
    throw new Error('Destination country not found');
  }

  // Get entry profile
  const profile = await getEntryProfile(db, nationality.id, destination.id, purpose);
  if (!profile) {
    throw new Error('Entry profile not found');
  }

  // Get all related data
  const [documents, travelReq, healthReq, guide, officialPortal] = await Promise.all([
    getEntryDocuments(db, profile.id),
    getTravelRequirements(db, profile.id),
    getHealthRequirements(db, profile.id),
    getCountryGuide(db, destination.id, lang),
    getOfficialPortal(db, destination.id),
  ]);

  // Parse sources
  let sources: SourceItem[] = [];
  if (profile.llm_sources_json) {
    try {
      sources = JSON.parse(profile.llm_sources_json) as SourceItem[];
    } catch {
      sources = [];
    }
  }

  // Parse vaccines JSON
  let vaccinesRequired: unknown[] = [];
  let vaccinesRecommended: unknown[] = [];
  if (healthReq?.vaccines_required_json) {
    try {
      vaccinesRequired = JSON.parse(healthReq.vaccines_required_json) as unknown[];
    } catch {
      vaccinesRequired = [];
    }
  }
  if (healthReq?.vaccines_recommended_json) {
    try {
      vaccinesRecommended = JSON.parse(healthReq.vaccines_recommended_json) as unknown[];
    } catch {
      vaccinesRecommended = [];
    }
  }

  // Generate travel authorization message
  let travelAuthMessage = '';
  if (!travelReq?.travel_authorization_required) {
    travelAuthMessage = "Vous n'avez PAS besoin d'autorisation de voyage pour ce trajet.";
  } else if (travelReq.travel_authorization_name) {
    travelAuthMessage = `Autorisation requise: ${travelReq.travel_authorization_name}`;
  } else {
    travelAuthMessage = 'Une autorisation de voyage est requise.';
  }

  // Build response
  const response: RequirementsResponse = {
    nationality: {
      id: nationality.id,
      name_fr: nationality.name_fr,
      iso2: nationality.iso2,
    },
    destination: {
      id: destination.id,
      name_fr: destination.name_fr,
      iso2: destination.iso2,
      continent: destination.continent,
      image_url: destination.image_url,
      official_portal: officialPortal?.url || null,
    },
    purpose,
    last_checked: profile.last_checked ? profile.last_checked.toISOString().split('T')[0] : null,
    source_confidence: profile.source_confidence,
    needs_manual_review: profile.needs_manual_review,
    sections: {
      documents: documents.map((doc) => ({
        id: doc.id,
        nom_document: doc.nom_document,
        type_document: doc.type_document,
        required: doc.required,
        duree_validite_text: doc.duree_validite_text,
        duree_validite_days: doc.duree_validite_days,
        nombre_entrees: doc.nombre_entrees,
        duree_sejour_max_text: doc.duree_sejour_max_text,
        duree_sejour_max_days: doc.duree_sejour_max_days,
        prix_montant: doc.prix_montant,
        prix_devise: doc.prix_devise,
        prix_montant_eur: doc.prix_montant_eur,
        prix_libelle: doc.prix_libelle,
        temps_obtention_visa: doc.temps_obtention_visa,
        application_url: doc.application_url,
        source_officielle: doc.source_officielle,
        confidence: doc.confidence,
      })),
      travel_authorization: {
        required: travelReq?.travel_authorization_required || false,
        name: travelReq?.travel_authorization_name || '',
        url: travelReq?.travel_authorization_url || '',
        message: travelAuthMessage,
      },
      arrival_form: {
        required: travelReq?.arrival_form_required || false,
        name: travelReq?.arrival_form_name || '',
        url: travelReq?.arrival_form_url || '',
        notes: '',
      },
      vaccines: {
        required: vaccinesRequired,
        recommended: vaccinesRecommended,
        notes: healthReq?.notes || null,
      },
      guide: {
        lang: guide?.lang || lang,
        text: guide?.guide_text || null,
      },
    },
    sources,
    llm: {
      model: profile.llm_model,
      prompt_version: profile.llm_prompt_version,
    },
  };

  return response;
}

