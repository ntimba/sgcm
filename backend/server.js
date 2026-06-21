// =============================================================================
// SGCM - API Backend (Node.js + Express)
//
// Point d'entrée de l'application.
//   - Toute la configuration est dans config/env.js (valide les vars au démarrage)
//   - Toute la connexion BDD est dans config/db.js  (pool partagé + helpers)
// =============================================================================

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

// ⚠️ Import AVANT toute autre chose : valide les variables d'env et fait
//    quitter l'application si quelque chose manque.
const env = require("./config/env");
const db = require("./config/db");

const app = express();

// -----------------------------------------------------------------------------
// Middlewares globaux
// -----------------------------------------------------------------------------
app.use(helmet()); // en-têtes HTTP de sécurité
app.use(cors({ origin: false })); // pas de CORS (même origine via nginx)
app.use(express.json({ limit: "1mb" })); // parse les body JSON
app.use(express.urlencoded({ extended: true })); // parse les formulaires
app.use(morgan(env.isDev ? "dev" : "combined")); // logs requêtes (concis en dev)

// Expose le module db aux routes via req.app.locals.db
app.locals.db = db;

// -----------------------------------------------------------------------------
// /health  (utilisé par le HEALTHCHECK du Dockerfile)
// Vérifie aussi que la BDD répond -> renvoie 503 si la BDD est down
// -----------------------------------------------------------------------------
app.get("/health", async (req, res) => {
    try {
        await db.query("SELECT 1");
        res.status(200).json({
            status: "ok",
            db: "ok",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        res.status(503).json({
            status: "degraded",
            db: "down",
            error: err.message,
        });
    }
});

// -----------------------------------------------------------------------------
// Route racine (info API)
// -----------------------------------------------------------------------------
app.get("/", (req, res) => {
    res.json({
        message: "API du Système de Gestion de Centre Médical (SGCM)",
        version: "1.0.0",
        env: env.nodeEnv,
    });
});

// -----------------------------------------------------------------------------
// Routes métier (à décommenter au fur et à mesure que tu les crées)
// -----------------------------------------------------------------------------
app.use("/auth", require("./routes/authRoutes"));
// app.use("/patients", require("./routes/patientRoutes"));
// app.use("/rdv",      require("./routes/rendezVousRoutes"));
// app.use("/admin",    require("./routes/adminRoutes"));
// app.use("/employes", require("./routes/employeRoutes"));

// -----------------------------------------------------------------------------
// Endpoint appelé par le scheduler (cron) pour envoyer les rappels de RDV
// Protégé par un Bearer token interne (SCHEDULER_TOKEN)
// -----------------------------------------------------------------------------
app.post("/rappels/envoyer", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.replace(/^Bearer\s+/i, "");

    if (token !== env.schedulerToken) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // TODO : récupérer les RDV de J+1, envoyer les mails via Brevo
        // Exemple :
        //   const result = await db.query(`
        //       SELECT * FROM rendez_vous
        //       WHERE date_heure_debut::date = CURRENT_DATE + INTERVAL '1 day'
        //         AND statut = 'PLANIFIE'
        //         AND rappel_envoye_at IS NULL
        //   `);
        return res.json({ status: "ok", rappels_envoyes: 0 });
    } catch (err) {
        console.error("[Rappels] Erreur :", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// -----------------------------------------------------------------------------
// 404 - route non trouvée
// -----------------------------------------------------------------------------
app.use((req, res) => {
    res.status(404).json({ error: "Not Found", path: req.path });
});

// -----------------------------------------------------------------------------
// Gestionnaire d'erreurs global
// -----------------------------------------------------------------------------
app.use((err, req, res, next) => {
    console.error("[Error]", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
    });
});

// -----------------------------------------------------------------------------
// Démarrage (async pour pouvoir tester la BDD avant d'ouvrir le port)
// -----------------------------------------------------------------------------
async function start() {
    const dbOk = await db.testConnection();
    if (!dbOk && env.isProd) {
        console.error(
            "[SGCM] ❌ Impossible de démarrer sans BDD en production.",
        );
        process.exit(1);
    }

    const server = app.listen(env.port, "0.0.0.0", () => {
        console.log(`[SGCM] ✅ API en écoute sur http://0.0.0.0:${env.port}`);
        console.log(`[SGCM] Environnement : ${env.nodeEnv}`);
    });

    // -------------------------------------------------------------------------
    // Arrêt propre (SIGTERM = docker stop, SIGINT = Ctrl+C)
    // -------------------------------------------------------------------------
    const shutdown = async (signal) => {
        console.log(`\n[${signal}] Arrêt en cours...`);
        server.close(() => console.log("[HTTP] Serveur fermé"));
        await db.close();
        process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}

start();
