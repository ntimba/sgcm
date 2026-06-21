#!/bin/bash
# =============================================================================
# Script_Cron_Rappels.sh
# Déclenche l'envoi des rappels de RDV via l'API backend.
# Appelé par crond (voir scheduler/crontab).
#
# Variables d'environnement attendues (injectées par docker-compose) :
#   APP_URL          - URL interne du backend (ex: http://app:3000)
#   SCHEDULER_TOKEN  - Token d'authentification interne
# =============================================================================

set -euo pipefail

ENDPOINT="${APP_URL}/api/rappels/envoyer"

echo "[$(date -Iseconds)] Déclenchement des rappels via ${ENDPOINT}"

HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${SCHEDULER_TOKEN}" \
    "${ENDPOINT}")

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "[$(date -Iseconds)] OK ($HTTP_CODE) : $(cat /tmp/response.json)"
    exit 0
else
    echo "[$(date -Iseconds)] ERREUR ($HTTP_CODE) : $(cat /tmp/response.json)" >&2
    exit 1
fi
