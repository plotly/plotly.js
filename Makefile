# Manage plotly.js documentation.

RUN = uv run
DOC_SRC=docs/_posts
SCHEMA_SRC=test/plot-schema.json

## commands: show available commands
commands:
	@grep -h -E '^##' ${MAKEFILE_LIST} | sed -e 's/## //g' | column -t -s ':'

## doc: rebuild documentation
.PHONY: doc
doc:
	make examples
	make reference
	make build

## examples: build example documentation in ./tmp
examples:
	@mkdir -p tmp
	${RUN} bin/example_pages.py --indir ${DOC_SRC}/plotly_js --outdir tmp/javascript --jsversion 3.2.1

## format: reformat Python code
format:
	@ruff format bin

## lint: check code and project
lint:
	@ruff check bin

## reference: build reference documentation in ./tmp
reference:
	@mkdir -p tmp
	${RUN} bin/reference_pages.py --schema ${SCHEMA_SRC} --outdir tmp/reference ${DOC_SRC}/reference_pages/javascript/*.html

## serve: display documentation
serve:
	${RUN} mkdocs serve

## website: build documentation with mkdocs using already-built examples and reference
website:
	${RUN} mkdocs build

## --: --

## clean: clean up repository
clean:
	@find . -name '*~' -delete
	@find . -name '.DS_Store' -delete
	@rm -rf _site
	@rm -f ${SCHEMA_DST}
