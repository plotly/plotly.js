# Contribute to Plotly's [JavaScript Documentation](https://plotly.com/javascript/)

Plotly welcomes contributions to its [open-source JavaScript graphing libraries documentation](https://plotly.com/javascript) from its community of users.

Our JavaScript tutorials are written in HTML files in the `docs/content/` directory of this repository. 

## Contribute Quickly to Plotly's JavaScript Graphing Library Documentation
  
To quickly make a contribution to Plotly's JavaScript graphing libraries documentation, simply submit a pull request with the change you would like to suggest. This can be done using the GitHub graphical user interface at https://github.com/plotly/plotly.js/. 

The easiest way to do this is to follow the `Edit this page on GitHub` link at the top right of the page you are interested in contributing to:

![Screen Shot 2020-01-07 at 12 45 39 PM](https://user-images.githubusercontent.com/1557650/71916356-bfe53800-314b-11ea-92b6-eb763037f6d5.png)

**You don't have to worry about breaking the site when you submit a pull request!** This is because your change will not be merged to production immediately. A Plotly team member will first perform a code review on your pull request in order to ensure that it definitely increases the health of Plotly's graphing libraries codebase.

## Mkdocs Setup

Before proceeding, make sure you are working in the `docs` directory. This is where all of the files needed
to build the site using Mkdocs are.

### Create a Virtual Environment

Create a *virtual environment* for the project so that packages you install won't affect other projects you are working on.
We recommend using [`uv`](https://docs.astral.sh/uv/) for this:

```bash
uv venv --python 3.12
source .venv/bin/activate
```

Alternatively,
you can use [conda](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#creating-an-environment-with-commands)
or [virtualenv](http://docs.python-guide.org/en/latest/dev/virtualenvs/)
to create and manage your virtual environment;
see those tools' documentation for more information.

### Install Packages

If you are using `uv`, you can install the dependencies using this command:

```bash
uv pip install -r requirements.txt
```

If you are using `conda` or `virtualenv`, you can install all dependencies with:

```bash
pip install -r requirements.txt
```

### File Structure

- `build/` is where Mkdocs builds the local copy of the site. This is only updated if you run `mkdocs build`.
- `tmp/` includes the generated HTML snippets for examples and reference pages. `make examples` builds the HTML files in `tmp/javascript/` while `make reference` builds the HTML files in `tmp/reference/`.
- `pages/` is where Mkdocs looks for content to build the site. It includes markdown files that uses `pymdownx.snippets` syntax to insert the HTML snippets from `tmp/` and handwritten files such as `pages/plotlyjs-function-reference.md` for the Quick Reference section in the navigation. It also includes the custom css files used for styling (`pages/css/`), extra javascript files (`pages/javascript`), and HTML files that override Mkdocs templates to add custom functionality (`pages/overrides/`). There is one special case in `static-image-export.md` that uses `img.show()`. To insert the images into the markdown file, `bin/run_markdown.py` saves the images into `pages/imgs/`.
- `mkdocs.yml` contains the configuration for the Mkdocs build such as extensions, site name and navigation.


### Building the Site

Before building the site, you need to generate the HTML snippets found in `tmp/` that the mkdocs build depends on. This can be done by running both `make examples` and `make reference` which will create HTML snippets in `tmp/javascript/` and `tmp/reference/` respectively.

If you ever add more HTML snippets generated into any of those folders, you may need to add more markdown files to `pages/` to add a new page. To do this, you can rerun the script that generates each markdown file with the `pyxmdown.snippets` syntax to insert the HTML snippets. You can do this by running the `bin/generate_reference_pages.py` script.

Run `mkdocs build` to rebuild the local copy of the site in `build/` or `mkdocs serve` to run the site on local host.


### Macros

In `mkdocs.yml`, the `extra` section defines configuration values used across the documentation. For example, you can specify the Plotly.js version in `extra.js_version`. The `macros` plugin makes `js_version` accessible in scripts such as `bin/examples_pages.py` when CodePen examples are being embedded into the HTML snippets generated into `tmp/javascript`.


## Overriding Mkdocs material themes

To modify the HTML components of the Mkdocs site, copy the template from the [`mkdocs-material` repository](https://github.com/squidfunk/mkdocs-material/tree/master/material/templates). Then, make these changes in `pages/overrides`.

You can either modify the existing files in `pages/overrides` or add a new file, paste the template for the component you are modifying and make your changes. Make sure to use the same file structure as the `mkdocs-material` default theme.

For example, to change the footer, copy the `footer.html` template from the [`mkdocs-material` repository](https://github.com/squidfunk/mkdocs-material/blob/master/material/templates/partials/footer.html), then create a `footer.html` file under `pages/overrides/partials/`, paste and modify it.

See [the official documentation](https://squidfunk.github.io/mkdocs-material/customization/) for more details.


## Mkdocs Validation

In `mkdocs.yml`, there is a section `validation` that defines how Mkdocs presents any issues and resolves links. When you build the site, there are some `INFO` logs that can be ignored.

`Doc file <source_file_name>.md contains an unrecognized relative link '../<target_file_name>/', it was left as is` is an `INFO` log that happens because Mkdocs cannot resolve the link during build, but when the site is running, the redirects defined in `mkdocs.yml` will make sure these links redirect to the proper page. If a redirect does not exist for the page referenced in the link, then it is a regular missing page error and needs to be fixed.

Any internal references in the markdown files, are resolved by Mkdocs relative to `docs/`. So, absolute links will be correctly resolved when the site is running. This is configured `mkdocs.yml` with the line `absolute_links: relative_to_docs`.