"""Rebuild a reference page from the Jekyll HTML and plot schema JSON file."""

import argparse
from html import escape
import json
from pathlib import Path
import re
import sys

from utils import _log, _str


INCLUDE_BLOCK_RE = re.compile(
    r'{%\s*include\s+posts/reference-block.html\s+parentlink="(.+?)"\s+block="(.+?)"\s+parentpath="(.+?)"\s+mustmatch="(.+?)"\s*%}'
)
INCLUDE_TRACE_RE = re.compile(
    r'\{%\s*include\s+posts/reference-trace.html\s+trace_name="(.+?)"\s+trace_data=site\.data\.plotschema\.traces\.(.+?)\s*%}'
)
TITLE_RE = re.compile(r"<h2>.+?<code>(.+?)</code>.*</h2>")


PLOT_SCHEMA_METADATA = """\
---
trace_name: {trace_name}
---

"""

PLOT_SCHEMA_CONTENT = """\
<div class="description">
  A <code>{trace_name}</code> trace is an object with the key <code>"type"</code> equal to <code>"{trace_data_attributes_type}"</code>
  (i.e. <code>{{"type": "{trace_data_attributes_type}"}}</code>) and any of the keys listed below.
  <br><br>{trace_data_meta_description}<br><br>
</div>
"""

PLOT_SCHEMA_REPLACEMENTS = (
    ("*", '"'),
    ("{array}", "array"),
    ("{arrays}", "arrays"),
    ("{object}", "object"),
    ("{2D array}", "2D array"),
)

OBJ_EXCLUDES = {
    "_arrayAttrRegexps",
    "_deprecated",
    "_isLinkedToArray",
    "_isSubplotObj",
    "description",
    "editType",
    "extras",
    "flags",
    "impliedEdits",
    "items",
    "magic_underscores",
    "role",
    "stream",
    "transformsuid",
}

SKIP_MUSTMATCH = {
    "annotations",
    "coloraxis",
    "geo",
    "images",
    "mapbox",
    "polar",
    "scene",
    "shapes",
    "sliders",
    "smith",
    "ternary",
    "updatemenus",
    "xaxis",
    "yaxis",
}

ANNOTATION = " ".join(
    [
        "<br>An annotation is a text element that can be placed anywhere in the plot.",
        "It can be positioned with respect to relative coordinates in the plot",
        "or with respect to the actual data coordinates of the graph.",
        "Annotations can be shown with or without an arrow.",
    ]
)


def main():
    """Main driver."""
    args = _parse_args()
    schema = json.loads(args.schema.read_text())
    assert "traces" in schema, f"'traces' missing from {args.schema}"

    for src_path in args.inputs:
        _log(args.verbose > 0, f"...{src_path}")
        src_content = src_path.read_text()

        m = TITLE_RE.search(src_content)
        if _log(not m, f"failed to match title in {src_path}"):
            continue
        title = m.group(1)

        if m := INCLUDE_TRACE_RE.search(src_content):
            if _log(
                m.group(1) != title,
                f"title {title} != include title {m.group(1)} in {src_path}",
            ):
                continue
            trace_name = m.group(2)
            trace_data = schema["traces"].get(trace_name, None)
            if _log(
                trace_data is None, f"trace '{trace_name}' not found in {args.schema}"
            ):
                continue
            html = _reference_trace(args, schema, src_path, trace_name, trace_data)

        elif m := INCLUDE_BLOCK_RE.search(src_content):
            parent_link = m.group(1)
            block = m.group(2)
            parent_path = m.group(3)
            mustmatch = m.group(4)
            accum = []
            attributes = schema["layout"]["layoutAttributes"]
            _reference_block(
                args,
                src_path,
                accum,
                attributes,
                parent_link,
                parent_path,
                block,
                mustmatch,
            )
            html = _replace_special("".join([_str(a) for a in accum]))

        else:
            _log(not m, f"failed to match include in {src_path}")
            continue

        output_path = args.outdir / title.replace(".", "/") / "index.html"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(html)


def _bool_or_star(value):
    if isinstance(value, bool):
        return str(value).lower()
    else:
        return f"*{value}*"


def _comma(accum, i, text=","):
    """Conditionally insert comma in list."""
    if i > 0:
        accum.append(f"{text} ")


def _get(value, key, default=None):
    """Simulate Jekyll's obj.field (which is 'nil' if 'obj' is a string)."""
    if isinstance(value, str):
        return default
    assert isinstance(value, dict), f"{value} not recognized"
    return value.get(key, default)


def _parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Generate HTML reference documentation"
    )
    parser.add_argument("inputs", nargs="+", type=Path, help="Input Jekyll files")
    parser.add_argument("--schema", type=Path, help="Path to plot schema JSON file")
    parser.add_argument("--outdir", type=Path, help="Output directory")
    parser.add_argument(
        "--verbose", type=int, default=0, help="Integer verbosity level"
    )
    return parser.parse_args()


def _reference_block(
    args, src_path, accum, attributes, parent_link, parent_path, block, mustmatch=None
):
    """Generate HTML documentation for a trace's attributes."""
    accum.append("<ul>\n")
    for key, value in attributes.items():
        last_three = key[-3:]
        if (last_three == "src") or (key in OBJ_EXCLUDES):
            continue
        if _skip_mustmatch(key, mustmatch):
            continue
        accum.append("<li>\n")

        id = f"{parent_link}-{key}"
        accum.append(f'<a class="attribute-name" id="{id}" href="#{id}">\n')
        accum.append(f"    {key}\n")
        accum.append("</a>\n")

        accum.append(
            f"<br><em>Parent:</em> <code>{parent_path.replace('-', '.')}</code>\n"
        )

        if (key == "type") and (block == "data"):
            accum.append("<br />\n")
            accum.append(f"<em>Type:</em> *{value}*\n")

        if _get(value, "valType"):
            _reference_block_valtype(src_path, accum, key, value)

        if _get(value, "dflt"):
            _reference_block_dflt(src_path, accum, key, value)

        if _get(value, "items") and (_get(value, "valType") != "info_array"):
            _reference_block_array(src_path, accum, key, value)
        elif _get(value, "role") == "object":
            accum.append(
                "<br><em>Type:</em> {object} containing one or more of the keys listed below.\n"
            )

        if _get(value, "description", "") != "":
            accum.append(f"<p>{escape(value.get('description'))}</p>\n")

        if _get(value, "role") == "object":
            _reference_block_object(
                args, src_path, accum, parent_link, parent_path, key, value
            )

        accum.append("</li>\n")
    accum.append("</ul>\n")


def _reference_block_valtype(src_path, accum, key, value):
    """Handle a value type."""
    outer = " " * 12
    inner = " " * 20
    accum.append("<br>\n")

    if (_get(value, "valType") == "enumerated") or _get(
        _get(value, "valType"), "values"
    ):
        accum.append(f"{outer}<em>Type:</em>\n")
        accum.append(f"{inner}{_get(value, 'valType')}")
        if _get(value, "arrayOk"):
            accum.append(f" or array of {_get(value, 'valType')}s\n")
        accum.append(f"{inner}, one of (\n")
        for i, sub_value in enumerate(_get(value, "values")):
            _comma(accum, i, " | ")
            accum.append(f"<code>{_bool_or_star(sub_value)}</code>")
        accum.append(f"{inner})\n")

    elif _get(value, "valType") in {"number", "integer"}:
        accum.append(f"{inner}<em>Type:</em> {_get(value, 'valType')}")
        if _get(value, "arrayOk"):
            accum.append(f" or array of {_get(value, 'valType')}s")
        if _get(value, "min") and _get(value, "max"):
            accum.append(
                f" between or equal to {_get(value, 'min')} and {_get(value, 'max')}\n"
            )
        elif _get(value, "min"):
            accum.append(f" greater than or equal to {_get(value, 'min')}\n")
        elif _get(value, "max"):
            accum.append(f" less than or equal to {_get(value, 'max')}\n")

    elif _get(value, "valType") == "boolean":
        accum.append(f"{inner}<em>Type:</em> {_get(value, 'valType')}")
        if _get(value, "arrayOk"):
            accum.append(f" or array of {_get(value, 'valType')}s")

    elif _get(value, "valType") == "flaglist":
        accum.append(f"{inner}<em>Type:</em> {_get(value, 'valType')} string.\n\n")
        flags = _get(value, "flags")
        if not flags:
            print(f"no flags for flaglist {key} in {src_path}", file=sys.stderr)
            return

        accum.append(f"{inner}Any combination of ")
        for i, f in enumerate(flags):
            _comma(accum, i)
            accum.append(_bool_or_star(f))
        accum.append(" joined with a <code>*+*</code>\n")
        accum.append(f"{inner}OR ")

        extras = _get(value, "extras")
        if extras:
            for i, x in enumerate(extras):
                _comma(accum, i)
                accum.append(_bool_or_star(x))

        accum.append(".\n\n")
        accum.append(f"{inner}<br><em>Examples:</em> ")
        accum.append(f"<code>*{flags[0]}*</code>, ")
        accum.append(f"<code>*{flags[1]}*</code>, ")
        accum.append(f"<code>*{flags[0]}+{flags[1]}*</code>, ")
        if len(flags) > 2:
            accum.append(f"<code>*{flags[0]}+{flags[1]}+{flags[2]}*</code>, ")
        if extras:
            accum.append(f"<code>*{extras[0]}*</code>")
        accum.append("\n\n")

    elif _get(value, "valType") == "data_array":
        accum.append(f"{inner}<em>Type:</em> {_get(value, 'valType')}\n")

    elif _get(value, "valType") == "info_array":
        accum.append("{inner}<em>Type:</em> {{array}}\n")

    elif _get(value, "valType") == "color":
        accum.append(f"{inner}<em>Type:</em> {_get(value, 'valType')}")
        if _get(value, "arrayOk"):
            accum.append(f" or array of {_get(value, 'valType')}s")

    elif _get(value, "valType") == "any":
        accum.append(f"{inner}<em>Type:</em> number or categorical coordinate string\n")

    elif _get(value, "valType") == "string":
        if "src" in key:
            return
        accum.append(f"{inner}<em>Type:</em> string")
        if _get(value, "arrayOk"):
            accum.append(" or array of strings")

    else:
        accum.append(f"{inner}<em>Type:</em> {_get(value, 'valType')}\n")

    if _get(value, "role") == "object":
        if _get(value, "items"):
            accum.append(f"{inner}<em>Type:</em> {{array}} of {{object}}s")
        else:
            accum.append(f"{inner}<em>Type:</em> {{object}}")


def _reference_block_dflt(src_path, accum, key, value):
    """Handle a default."""
    outer = " " * 16
    if _get(value, "valType") == "flaglist":
        accum.append(
            f"{outer}<br><em>Default:</em> <code>*{_get(value, 'dflt')}*</code>\n"
        )
    else:
        accum.append(f"{outer}<br><em>Default:</em> <code>")
        if _get(value, "dflt") == "":
            accum.append("**")
        elif _get(value, "valType") == "colorscale":
            temp = [f"[{', '.join(_str(d))}]" for d in _get(value, "dflt")]
            accum.append(f"[{', '.join(temp)}]")
        elif _get(value, "valType") in {"info_array", "colorlist"}:
            accum.append(f"[{', '.join([_str(x) for x in _get(value, 'dflt')])}]")
        elif (_get(value, "valType") in {"string", "color"}) or (
            _get(value, "dflt") == "auto"
        ):
            accum.append(f"*{_get(value, 'dflt')}*")
        elif (_get(value, "valType") == "enumerated") and (
            _get(value, "dflt") not in {"true", "false"}
        ):
            accum.append(f"*{_get(value, 'dflt')}*")
        else:
            accum.append(_get(value, "dflt"))
        accum.append("</code>\n")


def _reference_block_array(src_path, accum, key, value):
    """Handle an array."""
    outer = " " * 12
    inner = " " * 16
    accum.append(f"{outer}<br><em>Type:</em> {{array}} of {{object}} where\n")
    accum.append(f"{outer}each {{object}} has one or more of the keys listed below.\n")
    if key == "annotations":
        if not _get(value, "descipription"):
            accum.append(f"{inner}{ANNOTATION}\n")


def _reference_block_object(
    args, src_path, accum, parent_link, parent_path, key, value
):
    """Handle an object with a recursive call."""
    parent_path = f"{parent_path}-{key}"
    if _get(value, "items"):
        # This will break if there is ever more than one type of item in items,
        # but for now it's just "shape" and "annotation"
        for item_key, item_value in _get(value, "items").items():
            attributes = item_value
    else:
        attributes = value
    _reference_block(
        args, src_path, accum, attributes, parent_link, parent_path, "nested"
    )


def _reference_trace(args, schema, src_path, trace_name, trace_data):
    """Generate HTML documentation for a trace."""
    plot_schema_metadata = PLOT_SCHEMA_METADATA.format(
        trace_name=trace_name,
    )
    plot_schema_content = PLOT_SCHEMA_CONTENT.format(
        trace_name=trace_name,
        trace_data_attributes_type=trace_data["attributes"]["type"],
        trace_data_meta_description=trace_data["meta"]["description"],
    )
    accum = [plot_schema_metadata, plot_schema_content]

    parent_link = trace_name
    parent_path = f"data[type={trace_name}]"
    attributes = trace_data["attributes"]
    _reference_block(
        args, src_path, accum, attributes, parent_link, parent_path, "data"
    )

    return _replace_special("".join([_str(a) for a in accum]))


def _replace_special(text):
    """Handle our funky special-case strings."""
    for original, replacement in PLOT_SCHEMA_REPLACEMENTS:
        text = text.replace(original, replacement)
    return text


def _skip_mustmatch(key, mustmatch):
    if mustmatch is None:
        return False
    if mustmatch == "global":
        return key in SKIP_MUSTMATCH
    elif key != mustmatch:
        return True
    else:
        return False


if __name__ == "__main__":
    main()
