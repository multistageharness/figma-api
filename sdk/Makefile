##
## @internal/figma-sdk — self-contained Makefile
##
## Umbrella over the eleven figma-api workspace packages: one namespace and one
## subpath per package, no code of its own. It re-exports the siblings' BUILT
## output, so `make sdk` (the workspace-root build) must run before `build`,
## `typecheck`, `test` or `examples`. `install` is npm's: run inside a workspace
## member it installs and links the whole workspace.
##

.DEFAULT_GOAL := help

.PHONY: help install sdk build typecheck test examples audit clean

help: ## Show this help
	@echo "@internal/figma-sdk targets:"
	@echo "  make sdk         build the workspace packages this umbrella re-exports (workspace-root build)"
	@echo "  make build       compile src/ to dist/ (needs make sdk first)"
	@echo "  make typecheck   typecheck every source file (needs make sdk first)"
	@echo "  make test        build the workspace, then run the umbrella suite"
	@echo "  make examples    run this package's examples offline (needs make sdk first)"
	@echo "  make install     npm install (links every workspace package)"
	@echo "  make audit       typecheck + test"
	@echo "  make clean       remove build output"

install: ## Install/link dependencies (npm resolves the workspace root itself)
	npm install

sdk: ## Build the workspace packages this umbrella re-exports (runs the workspace-root build)
	npm --prefix .. run build

build: ## Compile src/ to dist/ (needs make sdk first)
	npm run build

typecheck: ## Typecheck every source file (needs make sdk first)
	npm run typecheck

test: sdk ## Build the workspace (this package included), then run the umbrella suite
	npm test

examples: ## Run this package's examples offline (needs make sdk first)
	node ../run-examples.mjs sdk

audit: typecheck test ## typecheck + test

clean: ## Remove build output
	npm run clean
