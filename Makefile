.PHONY: install dev build deploy clean ai-checks secret-scan test test-e2e format format-check lint typecheck test-perf images

GITLEAKS_IMAGE := ghcr.io/gitleaks/gitleaks@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f

# Always invoke rather than using a prerequisite list: the script also compares
# source membership, which make cannot, since `mv` preserves mtime and a renamed
# source would leave make believing the target was current.
images:
	@node scripts/generate-image-variants.mjs

install:
	@echo "📦 Installing Node dependencies..."
	npm ci --ignore-scripts
	npm exec lefthook install

dev: images
	@echo "🚀 Starting development server..."
	[ -f ./.env ] && { set -a; . ./.env; set +a; }; npm run dev

format:
	@echo "✨ Formatting code..."
	npm run format

format-check:
	@echo "✨ Checking formatting..."
	npm run format:check

lint: images
	@echo "🔍 Linting code..."
	npm run lint

typecheck: images
	@echo "🔎 Type checking..."
	npm run typecheck

test: images
	@echo "🧪 Running tests..."
	npm run test

secret-scan:
	@echo "🔐 Scanning for secrets (gitleaks)..."
	docker run --rm --volume "$(CURDIR):/repo:ro" --workdir /repo \
		$(GITLEAKS_IMAGE) dir . --redact --no-banner

test-e2e: images
	@echo "🎭 Running Playwright E2E tests..."
	ANALYZE=false \
	NEXT_PUBLIC_ALGOLIA_APPLICATION_ID=TESTAPPID1 \
	NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=test_search_key_valid_length_20 \
	NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME=system-notes \
	NEXT_PUBLIC_BASE_URL=http://localhost:3002 \
	npm run build
	env -u NO_COLOR CI=true npm exec playwright test

test-perf:
	@echo "🚀 Running Performance tests..."
	ANALYZE=false \
	NEXT_PUBLIC_ALGOLIA_APPLICATION_ID=TESTAPPID1 \
	NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=test_search_key_valid_length_20 \
	NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME=system-notes \
	NEXT_PUBLIC_BASE_URL=https://anchildress1.dev \
	env -u NO_COLOR npm run test:perf

ai-checks:
	$(MAKE) install
	$(MAKE) secret-scan
	npm run audit
	$(MAKE) format-check
	$(MAKE) lint
	$(MAKE) typecheck
	$(MAKE) test
	$(MAKE) test-e2e
	$(MAKE) test-perf
	@echo "🤖 AI Checks Complete: All Systems Nominal."

build: images
	@echo "🏗️ Building project..."
	[ -f ./.env ] && { set -a; . ./.env; set +a; }; npm run build

deploy:
	@echo "🚀 Deploying to Google Cloud..."
	./deploy.sh

clean:
	@echo "🧹 Cleaning up..."
	rm -rf node_modules .next coverage
	@echo "✨ Clean complete."
