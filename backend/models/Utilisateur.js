// =============================================================================
// SGCM - models/Utilisateur.js
// Requêtes SQL relatives à la table utilisateurs (table mère, conforme au MLD).
//
// ⚠️ Noms de colonnes en minuscules (comportement par défaut PostgreSQL) :
//    motdepasse, archived_at, created_at, updated_at, etc.
// =============================================================================

const db = require("../config/db");

/**
 * Recherche un utilisateur par email.
 * Utilisé pour vérifier l'unicité avant inscription, et pour le login.
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findByEmail(email) {
    const result = await db.query(
        `SELECT num, email, motdepasse, nom, prenom, role, actif
         FROM utilisateurs
         WHERE email = $1
           AND archived_at IS NULL`,
        [email],
    );
    return result.rows[0] || null;
}

/**
 * Recherche un utilisateur par son num (PK).
 * @param {number} num
 * @returns {Promise<object|null>}
 */
async function findById(num) {
    const result = await db.query(
        `SELECT num, email, nom, prenom, role, actif
         FROM utilisateurs
         WHERE num = $1
           AND archived_at IS NULL`,
        [num],
    );
    return result.rows[0] || null;
}

/**
 * Crée un nouvel utilisateur dans la table mère utilisateurs.
 * Le mot de passe doit déjà être hashé avant d'arriver ici.
 * Le rôle est TOUJOURS fourni par le contrôleur (jamais par le client).
 *
 * @param {object} client - Client BDD (pour transaction) ou pool
 * @param {object} data
 * @param {string} data.email
 * @param {string} data.motDePasseHash
 * @param {string} data.nom
 * @param {string} data.prenom
 * @param {string} data.role - 'patient' | 'secretaire' | 'praticien' | 'administrateur'
 * @returns {Promise<object>} la ligne créée
 */
async function create(client, { email, motDePasseHash, nom, prenom, role }) {
    const result = await client.query(
        `INSERT INTO utilisateurs (email, motdepasse, nom, prenom, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING num, email, nom, prenom, role, created_at`,
        [email, motDePasseHash, nom, prenom, role],
    );
    return result.rows[0];
}

module.exports = {
    findByEmail,
    findById,
    create,
};
