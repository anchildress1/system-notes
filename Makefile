.PHONY: setup setup-node dev build deploy clean kill ai-checks secret-scan test test-e2e format format-check lint typecheck test-perf

# Default target
all: setup

setup: setup-node
	@echo "✅ Project setup complete. Run 'make dev' to start."

# Setup Node.js dependencies
setup-node:
	@echo "📦 Installing Node dependencies..."
	npm install

# Kill this project's dev and test servers by port (avoids self-kill from pkill -f matching own cmdline)
kill:
	@echo "🛑 Killing dev/test servers..."
	@kill $$(lsof -ti:3000,3002,8000 2>/dev/null) 2>/dev/null || true
	@echo "✅ Servers stopped."

# Run the development environment (Turbo)
dev:
	@echo "🚀 Starting development servers..."
	$(MAKE) kill
	[ -f ./.env ] && { set -a; . ./.env; set +a; }; npm run dev -- --parallel

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

test:
	@echo "🧪 Running tests..."
	npm run test

# Secret scanning (Non-interactive)
secret-scan:
	@echo "🔐 Scanning for secrets (gitleaks)..."
	@if command -v gitleaks > /dev/null; then \
		gitleaks dir . --redact --no-banner; \
	else \
		echo "❌ gitleaks not found. Install with 'brew install gitleaks'."; \
		exit 1; \
	fi

# Run Playwright E2E tests
test-e2e:
	@echo "🎭 Running Playwright E2E tests..."
	$(MAKE) kill
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
	[ -f ./.env ] && { set -a; . ./.env; set +a; }; npm run build

# Deploy the application to Google Cloud
deploy:
	@echo "🚀 Deploying to Google Cloud..."
	npm install
	./deploy.sh

# Clean up all dependencies and build artifacts
clean:
	@echo "🧹 Cleaning up..."
	rm -rf node_modules
	rm -rf .turbo
	rm -rf apps/web/.next
	rm -rf apps/web/node_modules
	@echo "✨ Clean complete."

