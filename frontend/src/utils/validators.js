// =============================================================================
// SGCM - utils/validators.js
// Validation côté client. Ne remplace PAS la validation serveur (déjà en place
// dans authController.js) -- c'est une couche de confort UX pour éviter les
// allers-retours réseau inutiles.
// =============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valide un email.
 * @param {string} email
 * @returns {string|null} message d'erreur, ou null si valide
 */
export function validateEmail(email) {
    if (!email || !email.trim()) return "L'email est requis.";
    if (!EMAIL_REGEX.test(email.trim())) return "Format d'email invalide.";
    return null;
}

/**
 * Valide la robustesse d'un mot de passe.
 * Règles : au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre.
 * @param {string} motDePasse
 * @returns {string|null}
 */
export function validateMotDePasse(motDePasse) {
    if (!motDePasse) return "Le mot de passe est requis.";
    if (motDePasse.length < 8)
        return "Le mot de passe doit contenir au moins 8 caractères.";
    if (!/[a-z]/.test(motDePasse))
        return "Le mot de passe doit contenir au moins une minuscule.";
    if (!/[A-Z]/.test(motDePasse))
        return "Le mot de passe doit contenir au moins une majuscule.";
    if (!/[0-9]/.test(motDePasse))
        return "Le mot de passe doit contenir au moins un chiffre.";
    return null;
}

/**
 * Valide que la confirmation correspond au mot de passe.
 * @param {string} motDePasse
 * @param {string} confirmation
 * @returns {string|null}
 */
export function validateConfirmation(motDePasse, confirmation) {
    if (!confirmation) return "Merci de confirmer le mot de passe.";
    if (motDePasse !== confirmation)
        return "Les mots de passe ne correspondent pas.";
    return null;
}

/**
 * Valide un champ texte simple obligatoire (nom, prénom, adresse...).
 * @param {string} value
 * @param {string} label - utilisé dans le message d'erreur
 * @returns {string|null}
 */
export function validateRequired(value, label) {
    if (!value || !value.trim()) return `${label} est requis.`;
    return null;
}

/**
 * Valide une date de naissance : doit être une date valide, dans le passé,
 * et correspondre à une personne d'au moins 0 an et de moins de 120 ans.
 * @param {string} dateNaissance - format YYYY-MM-DD
 * @returns {string|null}
 */
export function validateDateNaissance(dateNaissance) {
    if (!dateNaissance) return "La date de naissance est requise.";
    const date = new Date(dateNaissance);
    if (isNaN(date.getTime())) return "Date de naissance invalide.";

    const now = new Date();
    if (date > now)
        return "La date de naissance ne peut pas être dans le futur.";

    const age = (now - date) / (1000 * 60 * 60 * 24 * 365.25);
    if (age > 120) return "Date de naissance invalide.";

    return null;
}

/**
 * Valide l'ensemble du formulaire d'inscription.
 * @param {object} values
 * @returns {object} objet { champ: messageErreur } -- vide si tout est valide
 */
export function validateRegisterForm(values) {
    const errors = {};

    const emailErr = validateEmail(values.email);
    if (emailErr) errors.email = emailErr;

    const mdpErr = validateMotDePasse(values.motDePasse);
    if (mdpErr) errors.motDePasse = mdpErr;

    const confirmErr = validateConfirmation(
        values.motDePasse,
        values.confirmation,
    );
    if (confirmErr) errors.confirmation = confirmErr;

    const nomErr = validateRequired(values.nom, "Le nom");
    if (nomErr) errors.nom = nomErr;

    const prenomErr = validateRequired(values.prenom, "Le prénom");
    if (prenomErr) errors.prenom = prenomErr;

    const dateErr = validateDateNaissance(values.dateNaissance);
    if (dateErr) errors.dateNaissance = dateErr;

    const adresseErr = validateRequired(values.adresse, "L'adresse");
    if (adresseErr) errors.adresse = adresseErr;

    const assureErr = validateRequired(
        values.numeroAssure,
        "Le numéro d'assuré",
    );
    if (assureErr) errors.numeroAssure = assureErr;

    return errors;
}
