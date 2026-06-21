// =============================================================================
// SGCM - models/Patient.js
// Requêtes SQL relatives à la table patients (héritage de utilisateurs).
//
// ⚠️ Noms de colonnes en minuscules : uti_gs_num, datenaissance, numeroassure
// =============================================================================

/**
 * Crée la ligne Patient liée à un utilisateur déjà créé.
 * Doit être appelé dans la MÊME transaction que Utilisateur.create(),
 * pour garantir l'intégrité de l'héritage (fk1_pat_maxone).
 *
 * @param {object} client - Client BDD (transaction en cours)
 * @param {object} data
 * @param {number} data.utilisateurNum - FK vers utilisateurs.num
 * @param {string} data.dateNaissance - format YYYY-MM-DD
 * @param {string} [data.telephone]
 * @param {string} data.adresse
 * @param {string} data.numeroAssure
 * @returns {Promise<object>} la ligne créée
 */
async function create(
    client,
    { utilisateurNum, dateNaissance, telephone, adresse, numeroAssure },
) {
    const result = await client.query(
        `INSERT INTO patients (uti_gs_num, datenaissance, telephone, adresse, numeroassure)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING num, uti_gs_num, datenaissance`,
        [
            utilisateurNum,
            dateNaissance,
            telephone || null,
            adresse,
            numeroAssure,
        ],
    );
    return result.rows[0];
}

/**
 * Vérifie si un téléphone est déjà utilisé (contrainte u1_pat_telephone).
 * @param {object} db
 * @param {string} telephone
 * @returns {Promise<boolean>}
 */
async function telephoneExists(db, telephone) {
    if (!telephone) return false;
    const result = await db.query(
        `SELECT 1 FROM patients WHERE telephone = $1`,
        [telephone],
    );
    return result.rowCount > 0;
}

/**
 * Vérifie si un numéro d'assuré est déjà utilisé (contrainte nid1_pat_numeroassure).
 * @param {object} db
 * @param {string} numeroAssure
 * @returns {Promise<boolean>}
 */
async function numeroAssureExists(db, numeroAssure) {
    const result = await db.query(
        `SELECT 1 FROM patients WHERE numeroassure = $1`,
        [numeroAssure],
    );
    return result.rowCount > 0;
}

module.exports = {
    create,
    telephoneExists,
    numeroAssureExists,
};
