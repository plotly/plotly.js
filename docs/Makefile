# Manage plotly.js documentation.

JEKYLL=bundle exec jekyll
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
