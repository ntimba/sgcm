# SGCM - Système de Gestion de Centre Médical 🏥

> **Une plateforme web open source et auto-hébergeable conçue pour optimiser la gestion des centres médicaux, réduire les rendez-vous manqués et alléger la charge administrative.**

## Présentation du projet

Le **SGCM** est une solution complète permettant de centraliser les agendas, les dossiers des patients et d'automatiser les rappels. Développé dans le cadre d'un projet de conception d'applications, le système propose des interfaces dédiées pour chaque type d'utilisateur afin d'assurer une gestion fluide et sécurisée d'un centre médical.

## Fonctionnalités clés

Le système est divisé en plusieurs espaces distincts :

- **Espace Public :** Informations sur le centre, formulaire de contact (protégé par anti-spam), création de compte patient.
- **Espace Patient :** Prise et gestion de rendez-vous en ligne (avec vérification des disponibilités en temps réel), consultation de l'historique des visites et des traitements.
- **Espace Secrétaire :** Gestion des rendez-vous du centre, administration et archivage sécurisé des comptes patients.
- **Espace Praticien :** Réalisation des consultations, rédaction de comptes-rendus (avec verrouillage légal), mise à jour des traitements et accès complet à l'historique médical chiffré.
- **Espace Administrateur :** Paramétrage global du système, gestion des horaires d'ouverture, définition des types de rendez-vous et gestion des employés.

## Technologies utilisées

Le projet repose sur une architecture robuste et moderne, avec une séparation claire entre le front-end et le back-end :

- **Front-end :** React, Tailwind CSS (Interface responsive multi-appareils).
- **Back-end :** Node.js, Express.
- **Base de données :** PostgreSQL (SGBDR).
- **Sécurité :** JWT (JSON Web Tokens) pour l'authentification sécurisée, chiffrement des données médicales.
- **Services Tiers :** Brevo (API Email transactionnel), ReCaptcha (Protection Google).

## Conception & Architecture UML

La conception logicielle de ce projet a fait l'objet d'une modélisation UML complète et rigoureuse avant le développement :

- **Diagrammes de Cas d'Utilisation :** Identification des acteurs et de leurs périmètres d'action.
- **Diagramme de Classes :** Modèle de domaine riche intégrant l'héritage des utilisateurs, les compositions médicales (dossiers, consultations) et les exceptions métier.
- **Diagrammes d'Activités :** Modélisation des processus complexes (Prise de rendez-vous, rédaction de compte-rendu, création de compte, etc.).
- **Diagrammes de Séquence :** Modélisation de la dynamique du système.
- **Diagramme de Déploiement :** Vue de l'infrastructure d'auto-hébergement et de ses interactions avec les services tiers.

## Installation (Auto-hébergement)

_(Section à compléter lorsque le code source et les scripts de déploiement seront prêts. Précisez ici les commandes comme `npm install`, la configuration de la base de données PostgreSQL, et les variables d'environnement nécessaires pour Brevo et le JWT)._

## Auteur

**NT1MBA**
Projet développé en méthode Agile (Scrum). Toute contribution est la bienvenue !
