.PHONY: setup setup-python setup-node dev build clean ai-checks secret-scan

# Default target
all: setup

# Setup the entire project (Node + Python)
setup: setup-node setup-python
	@echo "✅ Project setup complete. Run 'make dev' to start."

# Setup Node.js dependencies
setup-node:
	@echo "📦 Installing Node dependencies..."
	npm install

# Setup Python environment for the API
setup-python:
	@echo "🐍 Setting up Python with uv sync..."
	cd apps/api && uv sync

# Run the development environment (Turbo)
dev:
	@echo "🚀 Starting development servers..."
	npm run dev

# Format code (Prettier)
format:
	@echo "✨ Formatting code..."
	npm run format

# Lint code (ESLint)
lint:
	@echo "🔍 Linting code..."
	npm run lint

# Run tests
test:
	@echo "🧪 Running tests..."
	npm run test

# Secret scanning (Non-interactive)
secret-scan:
	@echo "🔐 Scanning for secrets..."
	@if command -v detect-secrets > /dev/null; then \
		detect-secrets scan --exclude-files 'node_modules|dist|.next|.turbo|.venv|.secrets.baseline|.secrets.baseline.tmp' > .secrets.baseline.tmp; \
		if [ -f .secrets.baseline ]; then \
			echo "Checking against baseline..."; \
			detect-secrets scan --baseline .secrets.baseline --exclude-files 'node_modules|dist|.next|.turbo|.venv' > .secrets.baseline.tmp; \
			DIFF=$$(jq '.results | length' .secrets.baseline.tmp); \
			if [ "$$DIFF" -gt 0 ]; then \
				echo "❌ Secrets found! Check .secrets.baseline.tmp or run 'detect-secrets audit .secrets.baseline'"; \
				jq '.results' .secrets.baseline.tmp; \
				rm .secrets.baseline.tmp; \
				exit 1; \
			else \
				echo "✅ No new secrets found."; \
				rm .secrets.baseline.tmp; \
			fi; \
		else \
			mv .secrets.baseline.tmp .secrets.baseline; \
			echo "✅ Secrets baseline created at .secrets.baseline"; \
		fi; \
	else \
		echo "⚠️ detect-secrets not found. Skipping scan."; \
	fi

# Run all AI checks (Scan -> Format -> Lint -> Test)
ai-checks: secret-scan
	$(MAKE) format
	$(MAKE) lint
	$(MAKE) test
	@echo "🤖 AI Checks Complete: All Systems Nominal."

# Build the project
build:
	@echo "🏗️ Building project..."
	npm run build

# Clean up all dependencies and build artifacts
clean:
	@echo "🧹 Cleaning up..."
	rm -rf node_modules
	rm -rf .turbo
	rm -rf apps/web/.next
	rm -rf apps/web/node_modules
	rm -rf packages/*/node_modules
	rm -rf packages/*/dist
	rm -rf apps/api/.venv
	rm -rf apps/api/__pycache__
	rm -f .secrets.baseline.tmp
	@echo "✨ Clean complete."
