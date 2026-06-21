# =============================================================================
# SGCM - Scheduler (cron déclenchant les rappels de RDV)
# =============================================================================

FROM alpine:3.20

# -----------------------------------------------------------------------------
# Dépendances :
#   - curl  : pour appeler l'API depuis le script
#   - bash  : interpréteur du Script_Cron_Rappels.sh
#   - tzdata : pour positionner correctement le fuseau horaire
#              (sinon le cron tournera en UTC !)
# -----------------------------------------------------------------------------
RUN apk add --no-cache \
        curl \
        bash \
        tzdata && \
    cp /usr/share/zoneinfo/Europe/Zurich /etc/localtime && \
    echo "Europe/Zurich" > /etc/timezone

# -----------------------------------------------------------------------------
# Préparation des chemins
# Le script et le crontab sont montés via docker-compose (volumes) :
#   ./scheduler/Script_Cron_Rappels.sh  ->  /usr/local/bin/rappels.sh
#   ./scheduler/crontab                 ->  /etc/crontabs/root
# -----------------------------------------------------------------------------
RUN mkdir -p /usr/local/bin && \
    touch /etc/crontabs/root && \
    chmod 0644 /etc/crontabs/root

# -----------------------------------------------------------------------------
# Wrapper de démarrage : rend le script exécutable (au cas où) puis lance cron
# -----------------------------------------------------------------------------
RUN printf '%s\n' \
    '#!/bin/sh' \
    'set -e' \
    'if [ -f /usr/local/bin/rappels.sh ]; then' \
    '    chmod +x /usr/local/bin/rappels.sh' \
    'fi' \
    'echo "[scheduler] Démarrage de crond (TZ=$(cat /etc/timezone))"' \
    'exec crond -f -L /dev/stdout' \
    > /usr/local/bin/entrypoint.sh && \
    chmod +x /usr/local/bin/entrypoint.sh

CMD ["/usr/local/bin/entrypoint.sh"]
