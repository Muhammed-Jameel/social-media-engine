# Exact deployed upstream image. Deliberately fail closed on upgrades.
FROM ghcr.io/gitroomhq/postiz-app@sha256:785f97312f66a347fb96cdccc4ded5a33ced69a672c89a9adc8054e7d6a21dc5
COPY patch.cjs contract.test.cjs /opt/social-tiktok/
RUN node /opt/social-tiktok/patch.cjs && node --test /opt/social-tiktok/contract.test.cjs
