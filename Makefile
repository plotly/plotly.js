# Manage plotly.js documentation.

RUN = uv run
SCHEMA_SRC = test/plot-schema.json
HANDWRITTEN = content
TMP = tmp

EXAMPLES_DIR = ${HANDWRITTEN}/plotly_js
EXAMPLES_IN := $(shell find "${EXAMPLES_DIR}" -name '*.html')
EXAMPLES_TMP = ${TMP}/javascript
EXAMPLES_OUT = ${EXAMPLES_TMP}/axes/index.html # could be any of the generated files

REFERENCE_DIR = ${HANDWRITTEN}/reference_pages/javascript/
REFERENCE_IN := $(wildcard ${REFERENCE_DIR}/*.html)
REFERENCE_TMP = ${TMP}/reference
REFERENCE_OUT = ${REFERENCE_TMP}/bar/index.html # could be any of the generated files

DOCS_DIR=docs
DOCS_OUT=${DOCS_DIR}/sitemap.xml

## commands: show available commands
commands:
	@grep -h -E '^##' ${MAKEFILE_LIST} | sed -e 's/## //g' | column -t -s ':'

## docs: rebuild full documentation in `./docs`
.PHONY: docs
docs: ${DOCS_OUT}

${DOCS_OUT}: ${EXAMPLES_OUT} ${REFERENCE_OUT}
	@${RUN} mkdocs build

## examples: build intermediate example documentation in ./tmp
examples: ${EXAMPLES_OUT}

${EXAMPLES_OUT}: bin/example_pages.py ${EXAMPLES_IN}
	@mkdir -p ${TMP}
	@${RUN} bin/example_pages.py --indir ${EXAMPLES_DIR} --outdir ${EXAMPLES_TMP} --jsversion 3.2.1

## reference: build intermediate reference documentation in ./tmp
reference: ${REFERENCE_OUT}

${REFERENCE_OUT}: bin/reference_pages.py ${SCHEMA_SRC} ${REFERENCE_IN}
	@mkdir -p ${TMP}
	@${RUN} bin/reference_pages.py --schema ${SCHEMA_SRC} --outdir ${REFERENCE_TMP} ${REFERENCE_IN}

## serve: display documentation
serve:
	${RUN} mkdocs serve

## --: --

## clean: clean up repository
clean:
	@find . -name '*~' -delete
	@find . -name '.DS_Store' -delete
	@rm -rf docs ${TMP}

## format: reformat Python code
format:
	@ruff format bin

## lint: check code and project
lint:
	@ruff check bin
