.PHONY: setup setup-python setup-node dev build clean

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

# Run all AI checks (Format -> Lint -> Test)
ai-checks: 
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
	@echo "✨ Clean complete."
