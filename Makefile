.PHONY: install dev build deploy clean ai-checks secret-scan test test-e2e format format-check lint typecheck test-perf images

GITLEAKS_IMAGE := ghcr.io/gitleaks/gitleaks@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f

# Always invoke rather than using a prerequisite list: the script also compares
# source membership, which make cannot, since `mv` preserves mtime and a renamed
# source would leave make believing the target was current.
images:
	@node scripts/generate-image-variants.mjs

# npm ci runs with --ignore-scripts, so no package's postinstall runs — including
# the one that fetches Playwright's browsers. They have to be asked for by name, or
# the first `make test-e2e` after a `make clean` dies on a missing executable rather
# than on anything it asserts. The three are the engines playwright.config.ts
# schedules; adding a project there means adding it here.
install:
	@echo "📦 Installing Node dependencies..."
	npm ci --ignore-scripts
	npm exec lefthook install
	@echo "🎭 Installing Playwright browsers..."
	npm exec -- playwright install chromium firefox webkit

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
	INDEX_PULSE_DISABLED=true \
	NEXT_PUBLIC_BASE_URL=http://localhost:3002 \
	npm run build
	INDEX_PULSE_DISABLED=true env -u NO_COLOR CI=true npm exec playwright test

test-perf:
	@echo "🚀 Running Performance tests..."
	ANALYZE=false \
	NEXT_PUBLIC_ALGOLIA_APPLICATION_ID=TESTAPPID1 \
	NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=test_search_key_valid_length_20 \
	NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME=system-notes \
	INDEX_PULSE_DISABLED=true \
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

# Report directories too. lhci asserts over every report left in .lighthouseci,
# so one kept from an earlier build fails a run that had nothing wrong with it.
clean:
	@echo "🧹 Cleaning up..."
	rm -rf node_modules .next coverage .lighthouseci .lighthouseci-desktop test-results playwright-report
	@echo "✨ Clean complete."
