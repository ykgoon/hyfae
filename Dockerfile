# Hyfae opportunity machine — one-shot chain container.
# Base: official prebuilt Swamp image (swamp binary + Deno runtime included).
# Pinned to a date-sha release tag; bump deliberately, not on rebuild.
FROM swampclub/swamp:20260922.011324.0-sha.2e949db5

# Only jq is missing from the base (Debian trixie; bash + tzdata included).
USER root
RUN apt-get update \
  && apt-get install -y --no-install-recommends jq \
  && rm -rf /var/lib/apt/lists/*

ENV TZ=Asia/Kuala_Lumpur

WORKDIR /machine
COPY . .
# Base runs as uid 1000 (swamp); keep state dirs writable by that user
# (host uid 1000 aligns for the reports bind mount).
RUN mkdir -p /machine/.swamp /machine/reports && chown -R swamp:swamp /machine
USER swamp

# State (store, bundles, vault) and digest output live outside the image.
VOLUME ["/machine/.swamp", "/machine/reports"]

# Base ENTRYPOINT is ["swamp"]; clear it so compose commands run as scripts.
ENTRYPOINT []
