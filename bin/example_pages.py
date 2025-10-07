"""Rebuild plotly.js example pages from Jekyll HTML."""

import argparse
import frontmatter
from html import escape
import json
from markdown import markdown
from pathlib import Path
import re
from mkdocs.config import load_config
from utils import _log


HTML_TAG_RE = re.compile(r"<[^>]*>")
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


def _make_html(args, examples):
    """Build HTML page full of examples."""
    accum = []
    for counter, (path, record) in enumerate(examples):
        header = record["header"]
        content = record["content"]
        accum.append('<div class="section">\n')
        accum.append('  <div class="row auto-eg-padding">\n')

        _make_html_name(accum, path, header)

        accum.append('    <div class="row">\n')
        _make_html_text(accum, path, header, content)
        if _make_plot_url(accum, path, header, content):
            pass
        elif _make_mydiv(args, accum, path, header, content, counter):
            pass
        accum.append("    </div>\n")

        accum.append("  </div>\n")
        accum.append("</div>\n\n")

    return "".join(accum)


HTML_NAME = """\
      <h3 id="{name}">
        <a class="no_underline plot-blue" href="#{name}">{name}</a>
      </h3>
"""


def _make_html_name(accum, path, header):
    """Make example name block."""
    name = header["name"] if header["name"] else ""
    _log(not name, f"{path} does not have name")
    name = _strip_html(name.replace(" ", "-").replace(",", "").lower())
    accum.append(HTML_NAME.format(name=name))


HTML_TEXT = """\
    {markdown_content}
    {page_content}
    {description}
"""

HTML_TEXT_PAGE_CONTENT = """\
      <div class="z-depth-1">
        <pre><code class="javascript">{text}</code></pre>
      </div>
"""

HTML_TEXT_DESCRIPTION = """\
      <blockquote>
        {text}
      </blockquote>
"""


def _make_html_text(accum, path, header, content):
    """Make text of example."""
    # columns = "twelve" if "horizontal" in header.get("arrangement", "") else "six"
    markdown_content = markdown(header.get("markdown_content", ""))
    page_content = (
        HTML_TEXT_PAGE_CONTENT.format(text=escape(content)) if content else ""
    )
    description = header.get("description", "")
    description = HTML_TEXT_DESCRIPTION.format(text=description) if description else ""
    accum.append(
        HTML_TEXT.format(
            markdown_content=markdown_content,
            page_content=page_content,
            description=description,
        )
    )


MYDIV_D3 = "\n\t&lt;script src='https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js'>&lt;/script&gt;"
MYDIV_MATHJAX = "\n\t&lt;script src='//cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-MML-AM_CHTML'>&lt;/script&gt;"

MYDIV = """\
              <form style="margin-bottom: 35px; font-weight: 'Open Sans', sans-serif;"
                    action="https://codepen.io/pen/define" method="POST" target="_blank">
                <input type="hidden" name="data"
                  value="{{&quot;title&quot;:&quot;Plotly.js {name}&quot;,&quot;html&quot;:&quot;&lt;head&gt;\n\t&lt;!-- Load plotly.js into the DOM --&gt;{mathjax}\n\t&lt;script src='https://cdn.plot.ly/plotly-{jsversion}.min.js'>&lt;/script&gt;{d3}\n&lt;/head>\n\n&lt;body&gt;\n\t&lt;div id='myDiv'&gt;&lt;!-- Plotly chart will be drawn inside this DIV --&gt;&lt;/div&gt;\n&lt;/body&gt;&quot;,&quot;js&quot;:{content_json}}}">
                <input style=" float: right; border-radius: 4px;" class="codepen-submit" type="submit" value="Try It On CodePen!">
              </form>
              <div style="max-width: 100%; margin: auto" id="{unique_mydiv}"></div>
              <script>
                {content_mydiv}
              </script>
"""


def _make_mydiv(args, accum, path, header, content, counter):
    """Handle myDiv case."""
    if ("'myDiv'" not in content) and ('"myDiv"' not in content):
        return False

    d3 = MYDIV_D3 if "d3." in content else ""
    mathjax = MYDIV_MATHJAX if "remember to load MathJax.js" in content else ""
    # columns = "twelve" if "horizontal" in header.get("arrangement", "") else "six"
    name = header["name"]
    unique_mydiv = f"myDiv_{counter}"
    content_mydiv = content.replace("myDiv", unique_mydiv)
    content_json = escape(json.dumps(content))
    
    # Get JS Version
    mkdocs_path = Path(__file__).resolve().parent.parent / "mkdocs.yml"
    config = load_config(config_file=str(mkdocs_path))
    extra = config.get('extra', {})
    version = extra.get('js-version')

    accum.append(
        MYDIV.format(
            d3=d3,
            mathjax=mathjax,
            name=name,
            unique_mydiv=unique_mydiv,
            content_mydiv=content_mydiv,
            content_json=content_json,
            jsversion=version,
        )
    )

    return True


PLOT_URL = """\
              {plot_url_img}
              {plot_url_embed}
"""

PLOT_URL_IMG = """\
                <img src="{plot_url}" />
"""

PLOT_URL_EMBED = """\
                <iframe id="auto-examples" src="{plot_url}{embed_class}"
                style="width: {width} height: {height} border: none;"></iframe>
"""


def _make_plot_url(accum, path, header, content):
    """Handle specified plot URL."""
    plot_url = header.get("plot_url")
    if not plot_url:
        return False
    columns = "twelve" if "horizontal" in header.get("arrangement", "") else "six"

    plot_url_img = ""
    plot_url_embed = ""
    if (".gif" in plot_url) or (".png" in plot_url):
        plot_url_img = PLOT_URL_IMG.format(plot_url=plot_url)
    else:
        embed_class = ".embed" if "plot.ly" in plot_url else ""
        width = f"{header.get('width', '550')}px"
        height = f"{header.get('height', '550')}px"
        plot_url_embed = PLOT_URL_EMBED.format(
            plot_url=plot_url,
            embed_class=embed_class,
            width=width,
            height=height,
        )
    accum.append(
        PLOT_URL.format(
            columns=columns,
            plot_url=plot_url,
            plot_url_img=plot_url_img,
            plot_url_embed=plot_url_embed,
        )
    )

    return True


def _parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Generate HTML example documentation")
    parser.add_argument("--indir", type=Path, help="Input directory")
    parser.add_argument("--jsversion", help="Plotly JS version")
    parser.add_argument("--schema", type=Path, help="Path to plot schema JSON file")
    parser.add_argument("--outdir", type=Path, help="Output directory")
    parser.add_argument(
        "--verbose", type=int, default=0, help="Integer verbosity level"
    )
    return parser.parse_args()


def _process(args, path, record, example_files):
    """Process a section."""
    if (suite := _get_suite(path, record["content"])) is None:
        return

    examples = [
        (p, r)
        for p, r in example_files.items()
        if r["header"].get("suite", None) == suite
    ]
    examples.sort(
        key=lambda pair: (example_files[pair[0]]["header"]["order"], str(pair[0]))
    )

    section = record["header"]["permalink"].strip("/").split("/")[-1]
    _log(args.verbose > 0, f"...{section}: {len(examples)}")

    html = _make_html(args, examples)

    output_path = args.outdir / section / "index.html"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html)


def _strip_html(text):
    """Remove HTML tags from text."""
    return HTML_TAG_RE.sub("", text)


if __name__ == "__main__":
    main()
