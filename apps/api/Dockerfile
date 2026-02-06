# Use an official Python runtime as a parent image
FROM python:3.12-slim-bookworm

# Build environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# The installer requires curl (and certificates) to download the release archive
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*

# Install uv directly using the official installer script
ADD https://astral.sh/uv/install.sh /uv-installer.sh
RUN env UV_INSTALL_DIR="/usr/local/bin" sh /uv-installer.sh && rm /uv-installer.sh

# Set working directory
WORKDIR /app

# Copy dependency files first for layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
# --frozen ensures we stick to the lockfile
# --no-dev excludes dev dependencies
RUN uv sync --frozen --no-dev

# Copy application code
COPY . .

# Don't run production as root for security and to avoid pip warnings
RUN groupadd --system --gid 1001 appuser && \
    useradd --system --uid 1001 --gid appuser appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port (Cloud Run defaults to 8080)
ENV PORT=8080

# Run the application
# We use `uv run` to execute in the environment created by `uv sync`
CMD ["/app/.venv/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
