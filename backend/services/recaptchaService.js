// =============================================================================
// SGCM - services/recaptchaService.js
// Vérifie un token ReCaptcha v2 auprès de l'API Google.
//
// Sans cette vérification SERVEUR, le widget ReCaptcha côté React ne serait
// que cosmétique : n'importe qui pourrait appeler POST /auth/register
// directement (curl, Postman) sans jamais résoudre le captcha.
// =============================================================================

const env = require("../config/env");

const GOOGLE_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

/**
 * Vérifie un token ReCaptcha v2 auprès de Google.
 *
 * @param {string} token - le token renvoyé par le widget côté client (g-recaptcha-response)
 * @param {string} [remoteIp] - IP du visiteur (optionnel, améliore la précision Google)
 * @returns {Promise<{success: boolean, errorCodes?: string[]}>}
 */
async function verifyRecaptcha(token, remoteIp) {
    if (!token || typeof token !== "string") {
        return { success: false, errorCodes: ["missing-input-response"] };
    }

    const params = new URLSearchParams({
        secret: env.recaptcha.secret,
        response: token,
    });
    if (remoteIp) {
        params.append("remoteip", remoteIp);
    }

    try {
        const response = await fetch(GOOGLE_VERIFY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });

        const data = await response.json();
        return {
            success: data.success === true,
            errorCodes: data["error-codes"] || [],
        };
    } catch (err) {
        console.error(
            "[ReCaptcha] Erreur lors de la vérification :",
            err.message,
        );
        return { success: false, errorCodes: ["verification-failed"] };
    }
}

module.exports = { verifyRecaptcha };
