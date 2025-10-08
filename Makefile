# Manage plotly.js documentation.

RUN = uv run
HANDWRITTEN=content
SCHEMA_SRC=test/plot-schema.json
TMP=tmp
EXAMPLES_DIR=${TMP}/javascript
EXAMPLES_FILE=${EXAMPLES_DIR}/axes/index.html
REFERENCE_DIR=${TMP}/reference
REFERENCE_FILE=${REFERENCE_DIR}/bar/index.html

## commands: show available commands
commands:
	@grep -h -E '^##' ${MAKEFILE_LIST} | sed -e 's/## //g' | column -t -s ':'

## docs: rebuild documentation
.PHONY: docs
docs: ${EXAMPLES_FILE} ${REFERENCE_FILE}
	${RUN} mkdocs build

## examples: build example documentation in ./tmp
examples: ${EXAMPLES_FILE}

${EXAMPLES_FILE}:
	@mkdir -p ${TMP}
	${RUN} bin/example_pages.py --indir ${HANDWRITTEN}/plotly_js --outdir ${EXAMPLES_DIR} --jsversion 3.2.1

## reference: build reference documentation in ./tmp
reference: ${REFERENCE_FILE}

${REFERENCE_FILE}:
	@mkdir -p ${TMP}
	${RUN} bin/reference_pages.py --schema ${SCHEMA_SRC} --outdir ${TMP}/reference ${HANDWRITTEN}/reference_pages/javascript/*.html

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
