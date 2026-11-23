##
## @internal/figma-api — workspace umbrella Makefile
##
## Aggregate entry point for the TypeScript workspace packages declared in
## package.json `workspaces` (12 today, `sdk` last). Tests are plain-ESM suites that import
## each package's BUILT output (see jest.base.config.mjs), so `make test`
## always builds every workspace first — a red run is a real test failure,
## never build staleness. Coverage tracks the workspace list; adding a package
## to `workspaces` needs no Makefile edit. `make build` also builds the sibling
## figma-find engine first and the umbrella package last. `make install` pins the public
## registry (REGISTRY knob) because the machine's default npm registry may be
## an unreachable local Verdaccio.
##

REGISTRY ?= https://registry.npmjs.org/

## Keychain secret store (docs/keychain-env.md): the Figma token comes from the
## environment, else from the macOS keychain through the vendored
## macos-keychain-env. Override the repo, ref and service from the environment.
VENDOR_DIR        := vendor
KEYCHAIN_ENV_DIR  := $(VENDOR_DIR)/macos-keychain-env
KEYCHAIN_ENV_REPO ?= https://github.com/multistageharness/macos-keychain-env
KEYCHAIN_ENV_REF  ?= main
KEYCHAIN_SERVICE  ?= $(or $(FIGMA_KEYCHAIN_SERVICE),figma-api)
KEYCHAIN_KEYS     := FIGMA_TOKEN
KEYCHAIN_CLI      := node $(KEYCHAIN_ENV_DIR)/bin/keychain-env.js

.DEFAULT_GOAL := help

.PHONY: help install build typecheck test test-pkg test-integration mutation examples examples-pkg audit vendor secret secrets clean

help: ## Show this help
	@echo "@internal/figma-api workspace targets:"
	@echo "  make test                build every workspace package, then run every test suite"
	@echo "  make test-pkg PKG=<dir>  build + test a single workspace package (e.g. PKG=comments)"
	@echo "  make test-integration    build, then run integration tests (live tier if a token is in the keychain)"
	@echo "  make mutation [PKG=<dir>]  build, then mutation-test every package (or one); fails below its floor"
	@echo "  make examples            run every package's examples offline (no token; assumes build)"
	@echo "  make examples-pkg PKG=<dir>  run one package's examples offline"
	@echo "  make build               build every workspace package (fresh dist/ + lib/)"
	@echo "  make typecheck           typecheck every workspace package"
	@echo "  make audit               typecheck + test"
	@echo "  make install             npm install (REGISTRY=$(REGISTRY))"
	@echo "  make vendor          fetch vendor/macos-keychain-env (keychain secret store)"
	@echo "  make secret KEY=FIGMA_TOKEN  store the token in the macOS keychain (hidden prompt)"
	@echo "  make secrets         list which keychain items exist (reads no values)"
	@echo "  make clean               workspace cleans + remove root node_modules"

install: ## Install/link workspace dependencies (REGISTRY knob overrides the default npm registry)
	npm install --registry=$(REGISTRY)

build: ## Build every workspace package (fresh dist/ + lib/ output)
	npm run build

typecheck: ## Typecheck every workspace package
	npm run typecheck

test: build ## Build every workspace, then run every suite (exit 0 iff all pass)
	npm test

test-pkg: ## Build + test one workspace: make test-pkg PKG=<dir>
	@test -n "$(PKG)" || { echo "usage: make test-pkg PKG=<workspace dir, e.g. comments>"; exit 2; }
	npm run build --workspace=$(PKG)
	npm run test --workspace=$(PKG) --if-present

test-integration: build ## Offline wire + CLI integration; live Figma tier when a token is available
	npm run test:integration

mutation: build ## Mutation-test every package, or one: make mutation PKG=<dir> (reports/mutation/<pkg>.html)
	npm run test:mutation -- $(PKG)

examples: ## Run every package's examples offline (FIGMA_EXAMPLES_OFFLINE=1; see EXAMPLES-CONVENTIONS.md)
	node run-examples.mjs

examples-pkg: ## Run one package's examples offline: make examples-pkg PKG=<dir>
	@test -n "$(PKG)" || { echo "usage: make examples-pkg PKG=<workspace dir, e.g. comments>"; exit 2; }
	node run-examples.mjs $(PKG)

audit: typecheck test ## typecheck + test

vendor: ## Clone or fast-forward vendor/macos-keychain-env (keychain secret store; git-ignored)
	@if [ -d "$(KEYCHAIN_ENV_DIR)/.git" ]; then \
	  git -C "$(KEYCHAIN_ENV_DIR)" pull --ff-only --quiet && echo "$(KEYCHAIN_ENV_DIR) up to date ($$(git -C "$(KEYCHAIN_ENV_DIR)" rev-parse --short HEAD))" \
	    || echo "WARN: could not update $(KEYCHAIN_ENV_DIR); using the existing checkout"; \
	else \
	  mkdir -p "$(VENDOR_DIR)" && git clone --quiet --depth 1 --branch "$(KEYCHAIN_ENV_REF)" "$(KEYCHAIN_ENV_REPO)" "$(KEYCHAIN_ENV_DIR)" \
	    && echo "cloned $(KEYCHAIN_ENV_REPO) ($(KEYCHAIN_ENV_REF)) -> $(KEYCHAIN_ENV_DIR)"; \
	fi

secret: vendor ## Store one value in the keychain: make secret KEY=FIGMA_TOKEN (hidden prompt; never on argv)
	@[ -n "$(KEY)" ] || { echo "usage: make secret KEY=<$(subst $() ,|,$(KEYCHAIN_KEYS))>   (hidden prompt; the value never touches argv)"; exit 2; }
	$(KEYCHAIN_CLI) set "$(KEYCHAIN_SERVICE)" "$(KEY)"

secrets: vendor ## List which keychain items exist for this package (reads no values)
	@echo "keychain service: $(KEYCHAIN_SERVICE)"; for k in $(KEYCHAIN_KEYS); do \
	  if $(KEYCHAIN_CLI) has "$(KEYCHAIN_SERVICE)" "$$k" >/dev/null 2>&1; then echo "present  $$k"; else echo "missing  $$k"; fi; done

clean: ## Run every workspace's clean, then remove root node_modules
	npm run clean
