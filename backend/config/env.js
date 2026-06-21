// =============================================================================
// SGCM - config/env.js
// Charge le fichier .env (si présent) et valide TOUTES les variables requises
// au démarrage. Si quelque chose manque, l'application s'arrête avec un message
// clair plutôt que d'échouer plus tard de manière obscure.
// =============================================================================

require("dotenv").config();

// Liste des erreurs accumulées pour les afficher d'un coup
const errors = [];

/**
 * Récupère une variable obligatoire.
 * Si elle est absente ou vide, ajoute une erreur dans la liste.
 */
function required(name) {
    const value = process.env[name];
    if (value === undefined || value === null || value === "") {
        errors.push(`   - ${name} (requise)`);
        return undefined;
    }
    return value;
}

/**
 * Récupère une variable optionnelle avec une valeur par défaut.
 */
function optional(name, defaultValue) {
    const value = process.env[name];
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }
    return value;
}

/**
 * Validation supplémentaire : longueur minimale d'une chaîne.
 */
function ensureMinLength(name, value, minLength) {
    if (value && value.length < minLength) {
        errors.push(
            `   - ${name} doit faire au moins ${minLength} caractères (actuel : ${value.length})`,
        );
    }
}

// -----------------------------------------------------------------------------
// Construction de l'objet de configuration
// -----------------------------------------------------------------------------
const env = {
    // ------ Application ------
    nodeEnv: optional("NODE_ENV", "development"),
    port: parseInt(optional("PORT", "3000"), 10),
    get isDev() {
        return this.nodeEnv === "development";
    },
    get isProd() {
        return this.nodeEnv === "production";
    },

    // ------ Base de données PostgreSQL ------
    db: {
        host: required("DB_HOST"),
        port: parseInt(optional("DB_PORT", "5432"), 10),
        name: required("DB_NAME"),
        user: required("DB_USER"),
        password: required("DB_PASSWORD"),
    },

    // ------ JWT (authentification) ------
    jwt: {
        secret: required("JWT_SECRET"),
        expiresIn: optional("JWT_EXPIRES_IN", "1h"),
    },

    // ------ Chiffrement des données médicales (AES-256) ------
    encryptionKey: required("ENCRYPTION_KEY"),

    // ------ Brevo (e-mails transactionnels) ------
    brevo: {
        apiUrl: optional(
            "BREVO_API_URL",
            "https://api.brevo.com/v3/smtp/email",
        ),
        apiKey: required("BREVO_API_KEY"),
        mailFrom: required("MAIL_FROM"),
    },

    // ------ Google ReCaptcha ------
    recaptcha: {
        siteKey: optional("RECAPTCHA_SITE_KEY", ""),
        secret: required("RECAPTCHA_SECRET"),
    },

    // ------ Scheduler (token interne pour le cron) ------
    schedulerToken: required("SCHEDULER_TOKEN"),
};

// -----------------------------------------------------------------------------
// Validations supplémentaires
// -----------------------------------------------------------------------------
ensureMinLength("JWT_SECRET", env.jwt.secret, 32);
ensureMinLength("ENCRYPTION_KEY", env.encryptionKey, 32);

// -----------------------------------------------------------------------------
// Si des erreurs ont été collectées : afficher et quitter
// -----------------------------------------------------------------------------
if (errors.length > 0) {
    console.error(
        "\n❌ Configuration invalide. Variables manquantes ou incorrectes :\n",
    );
    errors.forEach((err) => console.error(err));
    console.error(
        "\n💡 Vérifie ton fichier .env (copie depuis .env.example si besoin).\n",
    );
    process.exit(1);
}

module.exports = env;
