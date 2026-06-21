// =============================================================================
// SGCM - config/db.js
// Connexion PostgreSQL via un pool partagé (pg).
// Expose :
//   - pool             : le pool brut (pour cas avancés)
//   - query(sql,params): wrapper avec logging
//   - transaction(cb)  : helper pour transactions (BEGIN/COMMIT/ROLLBACK)
//   - testConnection() : ping de la BDD (à appeler au démarrage)
//   - close()          : ferme le pool proprement (à appeler sur SIGTERM)
// =============================================================================

const { Pool } = require("pg");
const env = require("./env");

// -----------------------------------------------------------------------------
// Création du pool
// -----------------------------------------------------------------------------
const pool = new Pool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password,

    // Configuration du pool
    max: 20, // nombre max de connexions simultanées
    idleTimeoutMillis: 30000, // ferme une connexion idle après 30s
    connectionTimeoutMillis: 5000, // erreur si pas de connexion en 5s
});

// -----------------------------------------------------------------------------
// Événements du pool
// -----------------------------------------------------------------------------
pool.on("error", (err) => {
    console.error("[DB] Erreur sur un client idle du pool :", err.message);
});

if (env.isDev) {
    pool.on("connect", () => {
        console.log("[DB] Nouvelle connexion au pool");
    });
}

// -----------------------------------------------------------------------------
// query() : exécute une requête avec logging en dev
// -----------------------------------------------------------------------------
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        if (env.isDev) {
            const duration = Date.now() - start;
            console.log(
                `[DB Query] ${duration}ms | ${result.rowCount} ligne(s) | ${text.slice(0, 80).replace(/\s+/g, " ")}...`,
            );
        }
        return result;
    } catch (err) {
        console.error("[DB Query Error]", err.message, "\nSQL:", text);
        throw err;
    }
}

// -----------------------------------------------------------------------------
// transaction() : exécute un callback dans une transaction
// Usage :
//   await transaction(async (client) => {
//     await client.query('INSERT INTO ...');
//     await client.query('UPDATE ...');
//   });
// -----------------------------------------------------------------------------
async function transaction(callback) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

// -----------------------------------------------------------------------------
// testConnection() : vérifie que la BDD répond
// À appeler au démarrage de server.js pour échouer vite si la BDD est down
// -----------------------------------------------------------------------------
async function testConnection() {
    try {
        const result = await pool.query(
            "SELECT NOW() as now, current_database() as db, version() as version",
        );
        const row = result.rows[0];
        console.log("[DB] ✅ Connecté à PostgreSQL");
        console.log(`     Base       : ${row.db}`);
        console.log(`     Heure SGBD : ${row.now}`);
        console.log(`     Version    : ${row.version.split(",")[0]}`);
        return true;
    } catch (err) {
        console.error("[DB] ❌ Échec de connexion :", err.message);
        console.error(
            `     Host: ${env.db.host}:${env.db.port}, DB: ${env.db.name}, User: ${env.db.user}`,
        );
        return false;
    }
}

// -----------------------------------------------------------------------------
// close() : fermeture propre du pool (à appeler sur SIGTERM/SIGINT)
// -----------------------------------------------------------------------------
async function close() {
    await pool.end();
    console.log("[DB] Pool fermé");
}

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    close,
};
