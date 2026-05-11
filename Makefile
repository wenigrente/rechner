.PHONY: help install dev build preview test check lint clean deploy-check

help:
	@echo ""
	@echo "  Pension Calculator – Makefile"
	@echo "  ============================="
	@echo ""
	@echo "  ── Setup ─────────────────────────────────────────────"
	@echo "    make install          Install npm dependencies"
	@echo ""
	@echo "  ── Development ───────────────────────────────────────"
	@echo "    make dev              Vite dev server (localhost:5173)"
	@echo "    make test             Run all tests (Vitest)"
	@echo "    make check            TypeScript type check"
	@echo "    make lint             ESLint"
	@echo ""
	@echo "  ── Deploy ────────────────────────────────────────────"
	@echo "    make deploy-check     Tests + build (run before git push)"
	@echo ""
	@echo "  ── Cleanup ───────────────────────────────────────────"
	@echo "    make clean            Remove dist and node_modules"
	@echo ""

install:
	npm install

dev:
	npm run dev

build:
	npm run build

preview: build
	npm run preview

test:
	npm test

test-watch:
	npm run test:watch

check:
	npm run check

lint:
	npm run lint

deploy-check: test build
	@echo ""
	@echo "  ✅ Tests passed, build successful."
	@echo "  Ready for: git push origin main"
	@echo ""

clean:
	rm -rf dist node_modules
