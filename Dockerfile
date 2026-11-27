FROM alpine:3.21

# ripgrep + libgcc/libstdc++ mengikuti Dockerfile resmi OpenCode.
RUN apk add --no-cache bash ca-certificates curl git libgcc libstdc++ ripgrep tar \
    && mkdir -p /data/opencode /data/config/opencode /data/cache /data/state \
    && curl -fsSL https://opencode.ai/v2/install | bash

ENV PATH="/root/.opencode/bin:${PATH}" \
    XDG_DATA_HOME=/data \
    XDG_CONFIG_HOME=/data/config \
    XDG_CACHE_HOME=/data/cache \
    XDG_STATE_HOME=/data/state \
    OPENCODE_DB=/data/opencode/opencode.db \
    OPENCODE_SERVER_USERNAME=opencode

VOLUME /data
EXPOSE 4096

# Password di-set lewat environment (lihat .env.example). Jangan taruh di image.
# PaaS biasanya inject PORT; kalau tidak, pakai 4096.
CMD ["sh", "-c", "exec opencode serve --hostname 0.0.0.0 --port \"${PORT:-4096}\""]
