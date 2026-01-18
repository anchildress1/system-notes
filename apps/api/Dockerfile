# Use an official Python runtime as a parent image
FROM python:3.12-slim-bookworm

# The installer requires curl (and certificates) to download the release archive
# Also upgrade all packages to fix OS-level vulnerabilities (zlib, gnupg2, pam)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*

# Fix CVE-2025-8869 by upgrading pip
RUN python -m pip install --upgrade pip

# Download the latest installer
ADD https://astral.sh/uv/install.sh /uv-installer.sh

# Run the installer then remove it
RUN sh /uv-installer.sh && rm /uv-installer.sh

# Ensure the installed binary is on the `PATH`
ENV PATH="/root/.local/bin/:$PATH"

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
# --frozen ensures we stick to the lockfile
# --no-dev excludes dev dependencies
RUN uv sync --frozen --no-dev

# Copy application code
COPY . .

# Expose port (Cloud Run defaults to 8080)
ENV PORT=8080

# Run the application
# We use `uv run` to execute in the environment created by `uv sync`
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
