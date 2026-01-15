import mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import {
  Country,
  Nationality,
  EntryProfile,
  EntryDocument,
  TravelRequirements,
  HealthRequirements,
  CountryGuide,
  OfficialPortal,
} from '../types';

// Countries
export async function getCountries(
  pool: mysql.Pool,
  options: { search?: string; continent?: string; popular?: boolean; limit?: number; offset?: number }
): Promise<Country[]> {
  let query = 'SELECT * FROM countries WHERE 1=1';
  const params: unknown[] = [];

  if (options.search) {
    query += ' AND (name_fr LIKE ? OR iso2 LIKE ?)';
    const searchTerm = `%${options.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (options.continent) {
    query += ' AND continent = ?';
    params.push(options.continent);
  }

  if (options.popular !== undefined) {
    query += ' AND popular_destination = ?';
    params.push(options.popular);
  }

  query += ' ORDER BY name_fr ASC';

  if (options.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
    if (options.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  return rows as Country[];
}

export async function getCountryByIso2(pool: mysql.Pool, iso2: string): Promise<Country | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM countries WHERE iso2 = ? LIMIT 1',
    [iso2]
  );
  return (rows[0] as Country) || null;
}

export async function getCountryByName(pool: mysql.Pool, name: string): Promise<Country | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM countries WHERE name_fr = ? LIMIT 1',
    [name]
  );
  return (rows[0] as Country) || null;
}

export async function upsertCountry(
  pool: mysql.Pool,
  data: {
    name_fr: string;
    iso2?: string | null;
    continent?: string | null;
    popular_destination?: boolean;
    image_url?: string | null;
    processed_visas_count?: number | null;
  }
): Promise<number> {
  const query = `
    INSERT INTO countries (name_fr, iso2, continent, popular_destination, image_url, processed_visas_count, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      name_fr = VALUES(name_fr),
      continent = VALUES(continent),
      popular_destination = VALUES(popular_destination),
      image_url = VALUES(image_url),
      processed_visas_count = VALUES(processed_visas_count),
      updated_at = NOW()
  `;
  const [result] = await pool.execute<ResultSetHeader>(query, [
    data.name_fr,
    data.iso2 || null,
    data.continent || null,
    data.popular_destination ?? false,
    data.image_url || null,
    data.processed_visas_count || null,
  ]);
  if (result.insertId === 0) {
    // ON DUPLICATE KEY UPDATE, get the existing ID
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM countries WHERE iso2 = ? OR (iso2 IS NULL AND name_fr = ?) LIMIT 1',
      [data.iso2 || null, data.name_fr]
    );
    return (rows[0] as { id: number }).id;
  }
  return result.insertId;
}

// Official Portals
export async function getOfficialPortal(
  pool: mysql.Pool,
  countryId: number
): Promise<OfficialPortal | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM official_portals WHERE country_id = ? AND label = 'official_portal' LIMIT 1",
    [countryId]
  );
  return (rows[0] as OfficialPortal) || null;
}

export async function upsertOfficialPortal(
  pool: mysql.Pool,
  countryId: number,
  url: string
): Promise<number> {
  const query = `
    INSERT INTO official_portals (country_id, url, label, updated_at)
    VALUES (?, ?, 'official_portal', NOW())
    ON DUPLICATE KEY UPDATE
      url = VALUES(url),
      updated_at = NOW()
  `;
  const [result] = await pool.execute<ResultSetHeader>(query, [countryId, url]);
  if (result.insertId === 0) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM official_portals WHERE country_id = ? AND label = 'official_portal' LIMIT 1",
      [countryId]
    );
    return (rows[0] as { id: number }).id;
  }
  return result.insertId;
}

// Nationalities
export async function getNationalities(
  pool: mysql.Pool,
  options: { search?: string; limit?: number; offset?: number }
): Promise<Nationality[]> {
  let query = 'SELECT * FROM nationalities WHERE 1=1';
  const params: unknown[] = [];

  if (options.search) {
    query += ' AND (name_fr LIKE ? OR iso2 LIKE ?)';
    const searchTerm = `%${options.search}%`;
    params.push(searchTerm, searchTerm);
  }

  query += ' ORDER BY name_fr ASC';

  if (options.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
    if (options.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  return rows as Nationality[];
}

export async function getNationalityByIso2(pool: mysql.Pool, iso2: string): Promise<Nationality | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM nationalities WHERE iso2 = ? LIMIT 1',
    [iso2]
  );
  return (rows[0] as Nationality) || null;
}

export async function getNationalityByName(pool: mysql.Pool, name: string): Promise<Nationality | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM nationalities WHERE name_fr = ? LIMIT 1',
    [name]
  );
  return (rows[0] as Nationality) || null;
}

export async function upsertNationality(
  pool: mysql.Pool,
  data: { name_fr: string; iso2?: string | null }
): Promise<number> {
  const query = `
    INSERT INTO nationalities (name_fr, iso2, updated_at)
    VALUES (?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      iso2 = VALUES(iso2),
      updated_at = NOW()
  `;
  const [result] = await pool.execute<ResultSetHeader>(query, [data.name_fr, data.iso2 || null]);
  if (result.insertId === 0) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM nationalities WHERE name_fr = ? LIMIT 1',
      [data.name_fr]
    );
    return (rows[0] as { id: number }).id;
  }
  return result.insertId;
}

// Entry Profiles
export async function getEntryProfile(
  pool: mysql.Pool,
  nationalityId: number,
  destinationCountryId: number,
  purpose: string
): Promise<EntryProfile | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM entry_profiles WHERE nationality_id = ? AND destination_country_id = ? AND purpose = ? LIMIT 1',
    [nationalityId, destinationCountryId, purpose]
  );
  return (rows[0] as EntryProfile) || null;
}

export async function getEntryProfileById(pool: mysql.Pool, id: number): Promise<EntryProfile | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM entry_profiles WHERE id = ? LIMIT 1',
    [id]
  );
  return (rows[0] as EntryProfile) || null;
}

export async function upsertEntryProfile(
  pool: mysql.Pool,
  data: {
    nationality_id: number;
    destination_country_id: number;
    purpose: string;
    last_checked?: string | null;
    source_confidence?: number | null;
    needs_manual_review?: boolean;
    llm_model?: string | null;
    llm_prompt_version?: string | null;
    llm_sources_json?: string | null;
    llm_raw_json?: string | null;
  }
): Promise<number> {
  const query = `
    INSERT INTO entry_profiles (
      nationality_id, destination_country_id, purpose,
      last_checked, source_confidence, needs_manual_review,
      llm_model, llm_prompt_version, llm_sources_json, llm_raw_json,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      last_checked = VALUES(last_checked),
      source_confidence = VALUES(source_confidence),
      needs_manual_review = VALUES(needs_manual_review),
      llm_model = VALUES(llm_model),
      llm_prompt_version = VALUES(llm_prompt_version),
      llm_sources_json = VALUES(llm_sources_json),
      llm_raw_json = VALUES(llm_raw_json),
      updated_at = NOW()
  `;
  const [result] = await pool.execute<ResultSetHeader>(query, [
    data.nationality_id,
    data.destination_country_id,
    data.purpose,
    data.last_checked || null,
    data.source_confidence || null,
    data.needs_manual_review ?? false,
    data.llm_model || null,
    data.llm_prompt_version || null,
    data.llm_sources_json || null,
    data.llm_raw_json || null,
  ]);
  if (result.insertId === 0) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM entry_profiles WHERE nationality_id = ? AND destination_country_id = ? AND purpose = ? LIMIT 1',
      [data.nationality_id, data.destination_country_id, data.purpose]
    );
    return (rows[0] as { id: number }).id;
  }
  return result.insertId;
}

// Entry Documents
export async function getEntryDocuments(pool: mysql.Pool, profileId: number): Promise<EntryDocument[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM entry_documents WHERE profile_id = ? ORDER BY id ASC',
    [profileId]
  );
  return rows as EntryDocument[];
}

export async function replaceEntryDocuments(
  connection: mysql.PoolConnection,
  profileId: number,
  documents: Array<{
    nom_document: string;
    type_document: string;
    required: boolean;
    duree_validite_text?: string | null;
    duree_validite_days?: number | null;
    nombre_entrees: string;
    duree_sejour_max_text?: string | null;
    duree_sejour_max_days?: number | null;
    prix_montant?: number | null;
    prix_devise?: string | null;
    prix_montant_eur?: number | null;
    prix_libelle?: string | null;
    temps_obtention_visa?: string | null;
    application_url?: string | null;
    source_officielle?: string | null;
    confidence?: number | null;
  }>
): Promise<void> {
  await connection.beginTransaction();
  try {
    await connection.execute('DELETE FROM entry_documents WHERE profile_id = ?', [profileId]);

    if (documents.length > 0) {
      const insertQuery = `
        INSERT INTO entry_documents (
          profile_id, nom_document, type_document, required,
          duree_validite_text, duree_validite_days, nombre_entrees,
          duree_sejour_max_text, duree_sejour_max_days,
          prix_montant, prix_devise, prix_montant_eur, prix_libelle,
          temps_obtention_visa, application_url, source_officielle, confidence,
          updated_at
        )
        VALUES ?
      `;
      const values = documents.map((doc) => [
        profileId,
        doc.nom_document,
        doc.type_document,
        doc.required,
        doc.duree_validite_text || null,
        doc.duree_validite_days || null,
        doc.nombre_entrees,
        doc.duree_sejour_max_text || null,
        doc.duree_sejour_max_days || null,
        doc.prix_montant || null,
        doc.prix_devise || null,
        doc.prix_montant_eur || null,
        doc.prix_libelle || null,
        doc.temps_obtention_visa || null,
        doc.application_url || null,
        doc.source_officielle || null,
        doc.confidence || null,
        new Date(),
      ]);
      await connection.query(insertQuery, [values]);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

// Travel Requirements
export async function getTravelRequirements(
  pool: mysql.Pool,
  profileId: number
): Promise<TravelRequirements | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM travel_requirements WHERE profile_id = ? LIMIT 1',
    [profileId]
  );
  return (rows[0] as TravelRequirements) || null;
}

export async function upsertTravelRequirements(
  pool: mysql.Pool,
  profileId: number,
  data: {
    travel_authorization_required: boolean;
    travel_authorization_name?: string | null;
    travel_authorization_url?: string | null;
    arrival_form_required: boolean;
    arrival_form_name?: string | null;
    arrival_form_url?: string | null;
    other_requirements_json?: string | null;
  }
): Promise<number> {
  const query = `
    INSERT INTO travel_requirements (
      profile_id, travel_authorization_required, travel_authorization_name, travel_authorization_url,
      arrival_form_required, arrival_form_name, arrival_form_url, other_requirements_json,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      travel_authorization_required = VALUES(travel_authorization_required),
      travel_authorization_name = VALUES(travel_authorization_name),
      travel_authorization_url = VALUES(travel_authorization_url),
      arrival_form_required = VALUES(arrival_form_required),
      arrival_form_name = VALUES(arrival_form_name),
      arrival_form_url = VALUES(arrival_form_url),
      other_requirements_json = VALUES(other_requirements_json),
      updated_at = NOW()
  `;
  const [result] = await pool.execute<ResultSetHeader>(query, [
    profileId,
    data.travel_authorization_required,
    data.travel_authorization_name || null,
    data.travel_authorization_url || null,
    data.arrival_form_required,
    data.arrival_form_name || null,
    data.arrival_form_url || null,
    data.other_requirements_json || null,
  ]);
  if (result.insertId === 0) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM travel_requirements WHERE profile_id = ? LIMIT 1',
      [profileId]
    );
    return (rows[0] as { id: number }).id;
  }
  return result.insertId;
}

// Health Requirements
export async function getHealthRequirements(
  pool: mysql.Pool,
  profileId: number
): Promise<HealthRequirements | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM health_requirements WHERE profile_id = ? LIMIT 1',
    [profileId]
  );
  return (rows[0] as HealthRequirements) || null;
}

export async function upsertHealthRequirements(
  pool: mysql.Pool,
  profileId: number,
  data: {
    vaccines_required_json?: string | null;
    vaccines_recommended_json?: string | null;
    notes?: string | null;
  }
): Promise<number> {
  const query = `
    INSERT INTO health_requirements (profile_id, vaccines_required_json, vaccines_recommended_json, notes, updated_at)
    VALUES (?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      vaccines_required_json = VALUES(vaccines_required_json),
      vaccines_recommended_json = VALUES(vaccines_recommended_json),
      notes = VALUES(notes),
      updated_at = NOW()
  `;
  const [result] = await pool.execute<ResultSetHeader>(query, [
    profileId,
    data.vaccines_required_json || null,
    data.vaccines_recommended_json || null,
    data.notes || null,
  ]);
  if (result.insertId === 0) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM health_requirements WHERE profile_id = ? LIMIT 1',
      [profileId]
    );
    return (rows[0] as { id: number }).id;
  }
  return result.insertId;
}

// Country Guides
export async function getCountryGuide(
  pool: mysql.Pool,
  countryId: number,
  lang: string
): Promise<CountryGuide | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM country_guides WHERE country_id = ? AND lang = ? LIMIT 1',
    [countryId, lang]
  );
  return (rows[0] as CountryGuide) || null;
}

export async function upsertCountryGuide(
  pool: mysql.Pool,
  countryId: number,
  lang: string,
  guideText: string | null
): Promise<number> {
  const query = `
    INSERT INTO country_guides (country_id, lang, guide_text, updated_at)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      guide_text = VALUES(guide_text),
      updated_at = NOW()
  `;
  const [result] = await pool.execute<ResultSetHeader>(query, [countryId, lang, guideText || null]);
  if (result.insertId === 0) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM country_guides WHERE country_id = ? AND lang = ? LIMIT 1',
      [countryId, lang]
    );
    return (rows[0] as { id: number }).id;
  }
  return result.insertId;
}

