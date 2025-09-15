# Manage plotly.js documentation.

JEKYLL=bundle exec jekyll
RUN = uv run
SCHEMA_SRC=../test/plot-schema.json
SCHEMA_DST=_data/plotschema.json

## commands: show available commands
commands:
	@grep -h -E '^##' ${MAKEFILE_LIST} | sed -e 's/## //g' | column -t -s ':'

## build: rebuild documentation
build:
	@mkdir -p _data
	cp ${SCHEMA_SRC} ${SCHEMA_DST}
	${JEKYLL} build

## examples: build example documentation in ./tmp
examples:
	@mkdir -p tmp
	${RUN} bin/example_pages.py --indir _posts/plotly_js --outdir tmp/javascript --jsversion 3.2.1

## format: reformat Python code
format:
	@ruff format bin

## lint: check code and project
lint:
	@ruff check bin

## reference: build reference documentation in ./tmp
reference:
	@mkdir -p tmp
	${RUN} bin/reference_pages.py --schema ${SCHEMA_SRC} --outdir tmp/reference _posts/reference_pages/javascript/*.html

## serve: display documentation
serve:
	@mkdir -p _data
	cp ${SCHEMA_SRC} ${SCHEMA_DST}
	${JEKYLL} serve

## --: --

## clean: clean up repository
clean:
	@find . -name '*~' -delete
	@find . -name '.DS_Store' -delete
	@rm -rf _site
	@rm -f ${SCHEMA_DST}
