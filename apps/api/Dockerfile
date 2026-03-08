# Use an official Python runtime as a parent image
FROM python:3.12-slim-bookworm

# Build environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Install system dependencies and uv in a single layer to minimize image size
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/* && \
    curl -fsSL https://astral.sh/uv/install.sh | UV_INSTALL_DIR="/usr/local/bin" sh

# Set working directory
WORKDIR /app

# Copy dependency files first for layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
# --frozen ensures we stick to the lockfile
# --no-dev excludes dev dependencies
RUN uv sync --frozen --no-dev

# Copy application code
# .dockerignore excludes .env, .venv, __pycache__, and tests (S6470 reviewed SAFE)
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
