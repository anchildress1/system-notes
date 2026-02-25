.PHONY: setup setup-python setup-node dev build deploy clean ai-checks secret-scan test test-e2e format format-check lint typecheck test-perf

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
	npm run dev -- --parallel

# Format code (Prettier)
format:
	@echo "✨ Formatting code..."
	npm run format

# Check formatting (non-destructive, for CI)
format-check:
	@echo "✨ Checking formatting..."
	npx prettier --check "**/*.{ts,tsx,md,json,js}"

# Lint code (ESLint)
lint:
	@echo "🔍 Linting code..."
	npm run lint

# TypeScript type checking
typecheck:
	@echo "🔎 Type checking..."
	cd apps/web && npx tsc --noEmit

# Run tests
test:
	@echo "🧪 Running tests..."
	npm run test

# Secret scanning (Non-interactive)
secret-scan:
	@echo "🔐 Scanning for secrets..."
	@_run_scan() { \
		SCANNER="$$1"; \
		$$SCANNER scan --exclude-files 'node_modules|dist|.next|.turbo|.venv|.secrets.baseline|.secrets.baseline.tmp' > .secrets.baseline.tmp 2>&1 || true; \
		if [ ! -f .secrets.baseline.tmp ]; then \
			echo "⚠️ detect-secrets scan did not produce output. Skipping."; \
			return 0; \
		fi; \
		if [ -f .secrets.baseline ]; then \
			echo "Checking against baseline..."; \
			NEW_SECRETS=$$($$SCANNER scan --baseline .secrets.baseline --exclude-files 'node_modules|dist|.next|.turbo|.venv' | jq '.results | length' 2>/dev/null || echo 0); \
			if [ "$${NEW_SECRETS:-0}" -gt 0 ]; then \
				echo "❌ New secrets found! Run 'detect-secrets audit .secrets.baseline' to review."; \
				$$SCANNER scan --baseline .secrets.baseline --exclude-files 'node_modules|dist|.next|.turbo|.venv' | jq '.results'; \
				rm -f .secrets.baseline.tmp; \
				return 1; \
			else \
				echo "✅ No new secrets found. Updating baseline timestamp."; \
				[ -f .secrets.baseline.tmp ] && mv .secrets.baseline.tmp .secrets.baseline || true; \
			fi; \
		else \
			[ -f .secrets.baseline.tmp ] && mv .secrets.baseline.tmp .secrets.baseline && echo "✅ Secrets baseline created at .secrets.baseline" || echo "⚠️ Could not create baseline."; \
		fi; \
	}; \
	if command -v uvx > /dev/null; then \
		_run_scan "uvx detect-secrets" || exit 1; \
	elif command -v detect-secrets > /dev/null; then \
		_run_scan "detect-secrets" || exit 1; \
	else \
		echo "⚠️ detect-secrets not found. Skipping scan."; \
	fi

# Run Playwright E2E tests
test-e2e:
	@echo "🎭 Running Playwright E2E tests..."
	@lsof -ti:3002 | xargs kill -9 2>/dev/null || true
	NEXT_PUBLIC_ALGOLIA_APPLICATION_ID=TESTAPPID1 \
	NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=test_search_key_valid_length_20 \
	NEXT_PUBLIC_ALGOLIA_AGENT_ID=test_agent_id \
	NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID=test_ai_id \
	NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME=system-notes \
	npm run build
	CI=true npm exec playwright test

# Run Performance tests
test-perf:
	@echo "🚀 Running Performance tests..."
	NEXT_PUBLIC_ALGOLIA_APPLICATION_ID=TESTAPPID1 \
	NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=test_search_key_valid_length_20 \
	NEXT_PUBLIC_ALGOLIA_AGENT_ID=test_agent_id \
	NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID=test_ai_id \
	NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME=system-notes \
	npm run test:perf -w apps/web

# Run all AI checks (Scan -> Format -> Lint -> Test -> E2E -> Perf)
# Note: Includes build step to ensure artifacts exist before tests
ai-checks:
	$(MAKE) setup
	$(MAKE) secret-scan
	$(MAKE) format
	$(MAKE) lint
	$(MAKE) build
	$(MAKE) test
	$(MAKE) test-e2e
	$(MAKE) test-perf
	@echo "🤖 AI Checks Complete: All Systems Nominal."

# Build the project
build:
	@echo "🏗️ Building project..."
	npm run build

# Deploy the application to Google Cloud
deploy:
	@echo "🚀 Deploying to Google Cloud..."
	cd apps/api && uv sync --no-dev
	npm install
	./deploy.sh

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

