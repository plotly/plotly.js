"""Rebuild plotly.js example pages from Jekyll HTML."""

import argparse
import frontmatter
from pathlib import Path
import re

from utils import _log, _str


SUITE_RE = re.compile(r'where:"suite","(.+?)"')


def main():
    """Main driver."""
    args = _parse_args()
    index_files, example_files = _get_source_files(args)
    for path, record in index_files.items():
        _process(args, path, record, example_files)


def _get_source_files(args):
    """Load and classify source files."""
    index_files = {}
    example_files = {}
    for filepath in args.indir.glob("**/*.html"):
        page = frontmatter.load(filepath)
        record = {"header": page.metadata, "content": page.content}
        if not str(filepath).endswith("index.html"):
            example_files[filepath] = record
        elif "posts/auto_examples.html" in page.content:
            index_files[filepath] = record
    return index_files, example_files


def _get_suite(path, content):
    """Get suite specification from index file."""
    m = SUITE_RE.search(content)
    if _log(not m, f"cannot find 'suite' in index file {path}"):
        return None
    return m.group(1)


def _parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Generate HTML example documentation")
    parser.add_argument("--indir", type=Path, help="Input directory")
    parser.add_argument("--schema", type=Path, help="Path to plot schema JSON file")
    parser.add_argument("--outdir", type=Path, help="Output directory")
    parser.add_argument("--verbose", type=int, default=0, help="Integer verbosity level")
    return parser.parse_args()


def _process(args, path, record, example_files):
    """Process a section."""
    if (suite := _get_suite(path, record["content"])) is None:
        return

    children = [
        p for p, r in example_files.items()
        if r["header"].get("suite", None) == suite
    ]
    children.sort(key=lambda p: (example_files[p]["header"]["order"], str(p)))

    section = record["header"]["permalink"].strip("/").split("/")[-1]
    _log(args.verbose > 0, f"...{section}: {len(children)}")

    output_path = args.outdir / section / "index.html"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(record["header"]["name"])


if __name__ == "__main__":
    main()
