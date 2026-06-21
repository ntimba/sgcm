// =============================================================================
// SGCM - controllers/authController.js
// =============================================================================

const bcrypt = require("bcrypt");
const db = require("../config/db");
const Utilisateur = require("../models/Utilisateur");
const Patient = require("../models/Patient");

const BCRYPT_ROUNDS = 12;

// -----------------------------------------------------------------------------
// Validation basique des champs d'inscription patient
// -----------------------------------------------------------------------------
function validateRegisterInput(body) {
    const errors = [];
    const {
        email,
        motDePasse,
        nom,
        prenom,
        dateNaissance,
        adresse,
        numeroAssure,
    } = body;

    if (
        !email ||
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        errors.push("Email invalide.");
    }
    if (
        !motDePasse ||
        typeof motDePasse !== "string" ||
        motDePasse.length < 8
    ) {
        errors.push("Le mot de passe doit contenir au moins 8 caractères.");
    }
    if (!nom || typeof nom !== "string" || nom.trim().length === 0) {
        errors.push("Le nom est requis.");
    }
    if (!prenom || typeof prenom !== "string" || prenom.trim().length === 0) {
        errors.push("Le prénom est requis.");
    }
    if (!dateNaissance || isNaN(Date.parse(dateNaissance))) {
        errors.push("Date de naissance invalide.");
    }
    if (
        !adresse ||
        typeof adresse !== "string" ||
        adresse.trim().length === 0
    ) {
        errors.push("L'adresse est requise.");
    }
    if (
        !numeroAssure ||
        typeof numeroAssure !== "string" ||
        numeroAssure.trim().length === 0
    ) {
        errors.push("Le numéro d'assuré est requis.");
    }

    return errors;
}

// -----------------------------------------------------------------------------
// POST /auth/register
//
// Crée un compte Utilisateur + Patient en une transaction.
//   - Hash du mot de passe (bcrypt, 12 rounds)
//   - Rôle FORCÉ à 'patient' (jamais lu depuis req.body -> anti-élévation de privilège)
//   - 400 si email déjà utilisé
//   - 400 si téléphone/numéro d'assuré déjà utilisés (contraintes MLD)
// -----------------------------------------------------------------------------
async function register(req, res) {
    try {
        // 1. Validation des champs
        const errors = validateRegisterInput(req.body);
        if (errors.length > 0) {
            return res
                .status(400)
                .json({ error: "Validation échouée", details: errors });
        }

        const {
            email,
            motDePasse,
            nom,
            prenom,
            dateNaissance,
            telephone,
            adresse,
            numeroAssure,
        } = req.body;
        const normalizedEmail = email.trim().toLowerCase();

        // 2. Vérifier que l'email n'existe pas déjà
        const existing = await Utilisateur.findByEmail(normalizedEmail);
        if (existing) {
            return res
                .status(400)
                .json({ error: "Cette adresse email est déjà utilisée." });
        }

        // 3. Vérifier l'unicité du téléphone (si fourni) et du numéro d'assuré
        if (telephone) {
            const telExists = await Patient.telephoneExists(db, telephone);
            if (telExists) {
                return res
                    .status(400)
                    .json({
                        error: "Ce numéro de téléphone est déjà utilisé.",
                    });
            }
        }
        const assureExists = await Patient.numeroAssureExists(db, numeroAssure);
        if (assureExists) {
            return res
                .status(400)
                .json({ error: "Ce numéro d'assuré est déjà utilisé." });
        }

        // 4. Hash du mot de passe (JAMAIS stocké en clair)
        const motDePasseHash = await bcrypt.hash(motDePasse, BCRYPT_ROUNDS);

        // 5. Transaction : crée Utilisateur PUIS Patient (cohérence garantie)
        //    ⚠️ role: 'patient' est codé en dur ici. Le client ne peut JAMAIS
        //    injecter un autre rôle, même s'il envoie { "role": "administrateur" }
        //    dans le body -> ce champ est tout simplement ignoré.
        const result = await db.transaction(async (client) => {
            const utilisateur = await Utilisateur.create(client, {
                email: normalizedEmail,
                motDePasseHash,
                nom: nom.trim(),
                prenom: prenom.trim(),
                role: "patient", // 🔒 forcé, non négociable
            });

            const patient = await Patient.create(client, {
                utilisateurNum: utilisateur.num,
                dateNaissance,
                telephone: telephone || null,
                adresse: adresse.trim(),
                numeroAssure,
            });

            return { utilisateur, patient };
        });

        // 6. Réponse : ne JAMAIS renvoyer le hash du mot de passe
        return res.status(201).json({
            message: "Compte patient créé avec succès.",
            utilisateur: {
                num: result.utilisateur.num,
                email: result.utilisateur.email,
                nom: result.utilisateur.nom,
                prenom: result.utilisateur.prenom,
                role: result.utilisateur.role,
            },
        });
    } catch (err) {
        // Filet de sécurité : si une contrainte UNIQUE a été violée en base
        // malgré nos vérifications préalables (race condition), Postgres renvoie
        // le code 23505 -> on le traduit en 400 propre plutôt qu'en 500.
        if (err.code === "23505") {
            return res.status(400).json({
                error: "Une donnée fournie existe déjà (email, téléphone ou numéro d'assuré).",
            });
        }

        console.error("[Auth] Erreur register :", err);
        return res.status(500).json({ error: "Erreur interne du serveur." });
    }
}

module.exports = {
    register,
};
