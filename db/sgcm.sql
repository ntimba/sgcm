-- =============================================================================
-- SGCM - Schéma PostgreSQL
-- Système de Gestion de Centre Médical
--
-- Aligné sur le MLD (Modèle Logique de Données) :
--   - Héritage strict Table-Per-Type (Utilisateurs -> Patients/Employes
--     -> Administrateurs/Secretaires/Praticiens)
--   - Clés primaires nommées `num` de type INTEGER (conformité MLD)
--   - Noms de tables au pluriel
--   - Foreign Keys explicites avec nommage conforme au MLD
--
-- Conventions :
--   - `num` est INTEGER, auto-incrémenté via GENERATED ALWAYS AS IDENTITY
--   - Pas de DELETE -> archivage via `archived_at`
--   - Chiffrement des données sensibles : effectué côté Node.js (AES-256)
--     Les colonnes concernées sont TEXT (stockent du chiffré base64)
-- =============================================================================

SET client_encoding = 'UTF8';
SET TIME ZONE 'Europe/Zurich';


-- =============================================================================
-- 1. EXTENSIONS & TYPES
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Type ENUM pour les rôles (conforme au CHECK CK_Uti_role du MLD)
CREATE TYPE role_utilisateur AS ENUM (
    'patient',
    'administrateur',
    'secretaire',
    'praticien'
);

-- Type ENUM pour les statuts de RDV (conforme au CHECK CK_Rdv_statut du MLD)
CREATE TYPE statut_rendez_vous AS ENUM (
    'PLANIFIE',
    'ANNULE',
    'REALISE',
    'ABSENT'
);


-- =============================================================================
-- 2. FONCTION UTILITAIRE : trigger updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- 3. STRUCTURE DU CENTRE (CentresMedicaux + HorairesCentres)
-- =============================================================================

CREATE TABLE CentresMedicaux (
    num             INTEGER      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nom             VARCHAR(200) NOT NULL,
    adresse         VARCHAR(500) NOT NULL,
    telephone       VARCHAR(30),
    email           VARCHAR(255),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_cme_updated
    BEFORE UPDATE ON CentresMedicaux
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO CentresMedicaux (nom, adresse)
VALUES ('Centre Médical SGCM', 'À configurer');


CREATE TABLE HorairesCentres (
    num                INTEGER      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    Cme_definit_num    INTEGER      NOT NULL,
    jourSemaine        INTEGER      NOT NULL CHECK (jourSemaine BETWEEN 0 AND 6),
    heureOuverture     TIME         NOT NULL,
    heureFermeture     TIME         NOT NULL,
    CONSTRAINT FK1_Hce_Cme_definit
        FOREIGN KEY (Cme_definit_num) REFERENCES CentresMedicaux(num),
    CONSTRAINT CK_Hce_heures CHECK (heureFermeture > heureOuverture),
    UNIQUE (Cme_definit_num, jourSemaine)
);


-- =============================================================================
-- 4. UTILISATEURS (table mère abstraite)
-- =============================================================================
CREATE TABLE Utilisateurs (
    num             INTEGER             PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email           VARCHAR(255)        NOT NULL,
    motDePasse      VARCHAR(255)        NOT NULL,
    nom             VARCHAR(100)        NOT NULL,
    prenom          VARCHAR(100)        NOT NULL,
    role            role_utilisateur    NOT NULL,
    actif           BOOLEAN             NOT NULL DEFAULT TRUE,
    archived_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    CONSTRAINT U1_Uti_email UNIQUE (email)
);

CREATE INDEX idx_uti_role  ON Utilisateurs(role);
CREATE INDEX idx_uti_email ON Utilisateurs(email);

CREATE TRIGGER trg_uti_updated
    BEFORE UPDATE ON Utilisateurs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- 5. PATIENTS (héritage de Utilisateurs)
-- =============================================================================
CREATE TABLE Patients (
    num                INTEGER      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    Uti_gs_num         INTEGER      NOT NULL,
    dateNaissance      DATE         NOT NULL,
    telephone          TEXT,
    adresse            VARCHAR(500) NOT NULL,
    numeroAssure       TEXT         NOT NULL,
    CONSTRAINT FK1_Pat_Uti_gs
        FOREIGN KEY (Uti_gs_num) REFERENCES Utilisateurs(num) ON DELETE CASCADE,
    CONSTRAINT FK1_Pat_MaxOne UNIQUE (Uti_gs_num),
    CONSTRAINT U1_Pat_telephone UNIQUE (telephone),
    CONSTRAINT NID1_Pat_numeroAssure UNIQUE (numeroAssure)
);

CREATE INDEX idx_pat_uti ON Patients(Uti_gs_num);


-- =============================================================================
-- 6. EMPLOYES (héritage de Utilisateurs, mère abstraite)
-- =============================================================================
CREATE TABLE Employes (
    num                  INTEGER     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    Uti_gs_num           INTEGER     NOT NULL,
    Cme_emploie_num      INTEGER     NOT NULL,
    matricule            VARCHAR(20) NOT NULL,
    CONSTRAINT FK1_Emp_Uti_gs
        FOREIGN KEY (Uti_gs_num) REFERENCES Utilisateurs(num) ON DELETE CASCADE,
    CONSTRAINT FK2_Emp_Cme_emploie
        FOREIGN KEY (Cme_emploie_num) REFERENCES CentresMedicaux(num),
    CONSTRAINT FK1_Emp_MaxOne UNIQUE (Uti_gs_num),
    CONSTRAINT NID1_Emp_matricule UNIQUE (matricule)
);

CREATE INDEX idx_emp_uti ON Employes(Uti_gs_num);
CREATE INDEX idx_emp_cme ON Employes(Cme_emploie_num);


-- =============================================================================
-- 7. ADMINISTRATEURS (héritage de Employes)
-- =============================================================================
CREATE TABLE Administrateurs (
    num                INTEGER   PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    Emp_gs_num         INTEGER   NOT NULL,
    CONSTRAINT FK1_Adm_Emp_gs
        FOREIGN KEY (Emp_gs_num) REFERENCES Employes(num) ON DELETE CASCADE,
    CONSTRAINT FK1_Adm_MaxOne UNIQUE (Emp_gs_num)
);


-- =============================================================================
-- 8. SECRETAIRES (héritage de Employes)
-- =============================================================================
CREATE TABLE Secretaires (
    num                INTEGER   PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    Emp_gs_num         INTEGER   NOT NULL,
    CONSTRAINT FK1_Sec_Emp_gs
        FOREIGN KEY (Emp_gs_num) REFERENCES Employes(num) ON DELETE CASCADE,
    CONSTRAINT FK1_Sec_MaxOne UNIQUE (Emp_gs_num)
);


-- =============================================================================
-- 9. PRATICIENS (héritage de Employes)
-- =============================================================================
CREATE TABLE Praticiens (
    num                INTEGER      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    Emp_gs_num         INTEGER      NOT NULL,
    specialite         VARCHAR(100) NOT NULL,
    CONSTRAINT FK1_Pra_Emp_gs
        FOREIGN KEY (Emp_gs_num) REFERENCES Employes(num) ON DELETE CASCADE,
    CONSTRAINT FK1_Pra_MaxOne UNIQUE (Emp_gs_num)
);


-- =============================================================================
-- 10. DOSSIERS PATIENTS
-- =============================================================================
CREATE TABLE DossiersPatients (
    num                 INTEGER      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    Pat_possede_num     INTEGER      NOT NULL,
    dateCreation        DATE         NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT FK1_Dpa_Pat_possede
        FOREIGN KEY (Pat_possede_num) REFERENCES Patients(num) ON DELETE CASCADE,
    CONSTRAINT FK1_Dpa_MaxOne UNIQUE (Pat_possede_num)
);


-- =============================================================================
-- 11. CONSULTATIONS
-- =============================================================================
CREATE TABLE Consultations (
    num                INTEGER      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    Dpa_contient_num   INTEGER      NOT NULL,
    Pra_realise_num    INTEGER      NOT NULL,
    date               TIMESTAMP    NOT NULL,
    compteRendu        VARCHAR,
    estVerrouille      BOOLEAN      NOT NULL DEFAULT FALSE,
    verrouille_le      TIMESTAMPTZ,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT FK1_Con_Dpa_contient
        FOREIGN KEY (Dpa_contient_num) REFERENCES DossiersPatients(num) ON DELETE CASCADE,
    CONSTRAINT FK2_Con_Pra_realise
        FOREIGN KEY (Pra_realise_num) REFERENCES Praticiens(num)
);

CREATE INDEX idx_con_dpa  ON Consultations(Dpa_contient_num);
CREATE INDEX idx_con_pra  ON Consultations(Pra_realise_num);
CREATE INDEX idx_con_date ON Consultations(date);

CREATE OR REPLACE FUNCTION protege_consultation_verrouillee()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estVerrouille = TRUE THEN
        RAISE EXCEPTION 'Cette consultation est verrouillée et ne peut plus être modifiée';
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_con_protect
    BEFORE UPDATE ON Consultations
    FOR EACH ROW EXECUTE FUNCTION protege_consultation_verrouillee();


-- =============================================================================
-- 12. TRAITEMENTS
-- =============================================================================
CREATE TABLE Traitements (
    num                INTEGER      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    Dpa_contient_num   INTEGER      NOT NULL,
    description        VARCHAR      NOT NULL,
    dateDebut          DATE         NOT NULL,
    dateFin            DATE         NOT NULL,
    actif              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT FK1_Tra_Dpa_contient
        FOREIGN KEY (Dpa_contient_num) REFERENCES DossiersPatients(num) ON DELETE CASCADE,
    CONSTRAINT CK_Tra_dates CHECK (dateFin >= dateDebut)
);

CREATE INDEX idx_tra_dpa   ON Traitements(Dpa_contient_num);
CREATE INDEX idx_tra_actif ON Traitements(actif);

CREATE TRIGGER trg_tra_updated
    BEFORE UPDATE ON Traitements
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- 13. HISTORISATION DES TRAITEMENTS
-- =============================================================================
CREATE TABLE TraitementsHistorique (
    num              INTEGER       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    Tra_num          INTEGER       NOT NULL,
    description      VARCHAR       NOT NULL,
    dateDebut        DATE          NOT NULL,
    dateFin          DATE,
    actif            BOOLEAN       NOT NULL,
    action           VARCHAR(20)   NOT NULL,
    modifie_par      INTEGER,
    modifie_le       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT FK1_Trh_Tra FOREIGN KEY (Tra_num) REFERENCES Traitements(num),
    CONSTRAINT FK2_Trh_Uti FOREIGN KEY (modifie_par) REFERENCES Utilisateurs(num)
);

CREATE INDEX idx_trh_tra ON TraitementsHistorique(Tra_num);

CREATE OR REPLACE FUNCTION historise_traitement()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO TraitementsHistorique (
        Tra_num, description, dateDebut, dateFin, actif, action, modifie_le
    ) VALUES (
        OLD.num, OLD.description, OLD.dateDebut, OLD.dateFin, OLD.actif,
        CASE WHEN NEW.actif = FALSE AND OLD.actif = TRUE THEN 'STOP' ELSE 'UPDATE' END,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tra_historise
    BEFORE UPDATE ON Traitements
    FOR EACH ROW EXECUTE FUNCTION historise_traitement();


-- =============================================================================
-- 14. TYPES DE RENDEZ-VOUS
-- =============================================================================
CREATE TABLE TypesRendezVous (
    num                INTEGER       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nom                VARCHAR(100)  NOT NULL,
    dureeMinutes       INTEGER       NOT NULL CHECK (dureeMinutes > 0),
    archived_at        TIMESTAMPTZ,
    CONSTRAINT NID1_Trv_nom UNIQUE (nom)
);

INSERT INTO TypesRendezVous (nom, dureeMinutes) VALUES
    ('Consultation standard', 30),
    ('Première consultation', 45),
    ('Consultation longue', 60),
    ('Suivi rapide', 15);


-- =============================================================================
-- 15. RENDEZ-VOUS
-- =============================================================================
CREATE TABLE RendezVous (
    num                  INTEGER              PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    Pra_assure_num       INTEGER              NOT NULL,
    Pat_prend_num        INTEGER              NOT NULL,
    Trv_type_num         INTEGER              NOT NULL,
    dateHeureDebut       TIMESTAMP            NOT NULL,
    dateHeureFin         TIMESTAMP            NOT NULL,
    statut               statut_rendez_vous   NOT NULL DEFAULT 'PLANIFIE',
    motif                TEXT,
    rappel_envoye_at     TIMESTAMPTZ,
    created_at           TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    CONSTRAINT FK1_Rdv_Pra_assure
        FOREIGN KEY (Pra_assure_num) REFERENCES Praticiens(num),
    CONSTRAINT FK2_Rdv_Pat_prend
        FOREIGN KEY (Pat_prend_num) REFERENCES Patients(num),
    CONSTRAINT FK3_Rdv_Trv_type
        FOREIGN KEY (Trv_type_num) REFERENCES TypesRendezVous(num),
    CONSTRAINT CK_Rdv_dates CHECK (dateHeureFin > dateHeureDebut)
);

CREATE INDEX idx_rdv_pra    ON RendezVous(Pra_assure_num);
CREATE INDEX idx_rdv_pat    ON RendezVous(Pat_prend_num);
CREATE INDEX idx_rdv_date   ON RendezVous(dateHeureDebut);
CREATE INDEX idx_rdv_statut ON RendezVous(statut);

CREATE TRIGGER trg_rdv_updated
    BEFORE UPDATE ON RendezVous
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- 16. AUDIT / LOGS
-- =============================================================================
CREATE TABLE AuditLogs (
    num                INTEGER         PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    Uti_num            INTEGER,
    action             VARCHAR(100)    NOT NULL,
    entite             VARCHAR(50),
    entite_num         INTEGER,
    details            JSONB,
    ip_address         INET,
    user_agent         TEXT,
    created_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT FK_Aud_Uti FOREIGN KEY (Uti_num) REFERENCES Utilisateurs(num)
);

CREATE INDEX idx_aud_uti    ON AuditLogs(Uti_num);
CREATE INDEX idx_aud_action ON AuditLogs(action);
CREATE INDEX idx_aud_date   ON AuditLogs(created_at);


-- =============================================================================
-- 17. SEED : horaires d'ouverture par défaut
-- =============================================================================
INSERT INTO HorairesCentres (Cme_definit_num, jourSemaine, heureOuverture, heureFermeture) VALUES
    (1, 1, '08:00', '18:00'),
    (1, 2, '08:00', '18:00'),
    (1, 3, '08:00', '18:00'),
    (1, 4, '08:00', '18:00'),
    (1, 5, '08:00', '18:00'),
    (1, 6, '09:00', '12:00');