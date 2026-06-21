// =============================================================================
// SGCM - services/apiAuth.js
// Appels HTTP vers l'API backend pour l'authentification.
// =============================================================================

// En prod, nginx route /api/* vers le backend Express (voir nginx/conf.d).
// En dev avec `vite dev` standalone, VITE_API_URL peut pointer ailleurs.
const API_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Erreur typée pour les réponses API en échec.
 * Permet au composant d'afficher le bon message sans parser le JSON deux fois.
 */
export class ApiError extends Error {
    constructor(message, status, details) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details || null;
    }
}

/**
 * Inscrit un nouveau patient.
 *
 * @param {object} payload
 * @param {string} payload.email
 * @param {string} payload.motDePasse
 * @param {string} payload.nom
 * @param {string} payload.prenom
 * @param {string} payload.dateNaissance - format YYYY-MM-DD
 * @param {string} [payload.telephone]
 * @param {string} payload.adresse
 * @param {string} payload.numeroAssure
 * @param {string} payload.recaptchaToken - token renvoyé par le widget ReCaptcha
 * @returns {Promise<object>} la réponse JSON de l'API (utilisateur créé)
 * @throws {ApiError} si l'inscription échoue (400, 500, etc.)
 */
export async function registerPatient(payload) {
    let response;
    try {
        response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch (networkErr) {
        // Le serveur est injoignable (réseau coupé, backend down, etc.)
        throw new ApiError(
            "Impossible de contacter le serveur. Vérifiez votre connexion.",
            0,
        );
    }

    let data;
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new ApiError(
            data.error || "Une erreur est survenue.",
            response.status,
            data.details || null,
        );
    }

    return data;
}
