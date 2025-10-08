# Contribute to Plotly's [JavaScript Documentation](https://plotly.com/javascript/)

Plotly welcomes contributions to its [open-source JavaScript graphing libraries documentation](https://plotly.com/javascript) from its community of users.

Our JavaScript tutorials are written in HTML files in the `_posts/plotly_js` directory of this repository. 

## Contribute Quickly to Plotly's JavaScript Graphing Library Documentation
  
To quickly make a contribution to Plotly's JavaScript graphing libraries documentation, simply submit a pull request with the change you would like to suggest. This can be done using the GitHub graphical user interface at https://github.com/plotly/graphing-library-docs. 

The easiest way to do this is to follow the `Edit this page on GitHub` link at the top right of the page you are interested in contributing to:

![Screen Shot 2020-01-07 at 12 45 39 PM](https://user-images.githubusercontent.com/1557650/71916356-bfe53800-314b-11ea-92b6-eb763037f6d5.png)

**You don't have to worry about breaking the site when you submit a pull request!** This is because your change will not be merged to production immediately. A Plotly team member will first perform a code review on your pull request in order to ensure that it definitely increases the health of Plotly's graphing libraries codebase.

## Develop Locally

For contributions such as new example posts, we recommend setting up a local development environment so that you can test your changes as you work on them. 

**See the `How To Get The Application Working Locally` section of the [Contributing Guide](https://github.com/plotly/graphing-library-docs/blob/master/Contributing.md)  to learn how to clone this repository to your local development environment and install its dependencies.**

Then follow these instructions to create or modify a new post. If the post is the first of its chart type, you need to create an index page for it first. 

## Create An Index Page For A New Chart Type:

If you are documenting a new chart type, then you need to create an index page for it before creating the actual example page.  

1. In `documentation/_posts/plotly_js`, create a folder titled with the chart type or topic you're adding to the documentation (i.e. `bar`). 

2. `cd` into the folder you created and create an HTML index file for the chart type named: `yyyy-mm-dd-chart_type_plotly_js_index.html`. Copy the index file template below. Make sure to replace placeholder text!
```
---
name: Add-Chart-Type-or-Topic
permalink: javascript/add-chart-type-or-topic/
description: How to make a D3.js-based add-chart-type-or-topic in javascript. Add an additional sentence summarizing chart-type or topic.
layout: langindex
thumbnail: thumbnail/mixed.jpg 
language: plotly_js
page_type: example_index
display_as: **SEE BELOW
order: 5
---
  {% assign examples = site.posts | where:"language","plotly_js" | where:"suite","add-chart-type-or-topic"| sort: "order" %}
  {% include posts/auto_examples.html examples=examples %}
```
  - Make sure to update `_includes/posts/documentation_eg.html`, `_includes/layouts/side-bar.html`, and `_data/display_as_py_r_js.yml` and the CI python scripts with the new chart type!

  - Index pages for chart categories must have `order: 5`.

## Create A New Example Post:

1. In the folder containing the examples for the chart type you are writing documentation for, create a file named: `yyyy-mm-dd-example-title.html`. 

2. Copy the example post template below and write JavaScript code to demonstrate the feature you are documenting. 
  - If `plot_url` front-matter is not present, then the resulting chart will be displayed inline and a `Try It Codepen` button will be automatically generated. 
  - If `plot_url` front-matter is present, then the URL given will be embedded in an `iframe` below the example.
```
---
description: How to make a D3.js-based bar chart in javascript. Seven examples of
grouped, stacked, overlaid, and colored bar charts.
display_as: basic
language: plotly_js
layout: base
name: Bar Charts
order: 3
page_type: example_index
permalink: javascript/bar-charts/
redirect_from: javascript-graphing-library/bar-charts/
thumbnail: thumbnail/bar.jpg **MORE INFO ON ADDING THUMBNAILS BELOW
markdown_content: |
  indented content in markdown format which will prefix an example ****SEE BELOW
---
var data = [
  {
    x: ['giraffes', 'orangutans', 'monkeys'],
    y: [20, 14, 23],
    type: 'bar'
  }The
];

Plotly.newPlot('myDiv', data);
```

- `display_as` sets where your tutorial is displayed. Make sure to update `_includes/posts/documentation_eg.html` with the new chart type!:
  - 'file_settings' = https://plotly.com/javascript/plotly-fundamentals
  - 'basic' = https://plotly.com/javascript/basic-charts
  - 'statistical' = https://plotly.com/javascript/statistical-charts
  - 'scientific' = https://plotly.com/javascript/scientific-charts
  - 'financial' = https://plotly.com/javascript/financial-charts
  - 'maps' = https://plotly.com/javascript/maps
  - '3d_charts' = https://plotly.com/javascript/3d-charts
  - See additional options [HERE](https://github.com/plotly/graphing-library-docs/blob/master/_includes/posts/documentation_eg.html#L1)

  - `order` defines the order in which the tutorials appear in each section on plot.ly/javascript. 
    - <b>Note</b> The `order` of posts within a `display_as` must be a set of consecutive integers (i.e. [1, 2, 3, 4, 5, 6, ...]). 
    - If a post has an `order` less than 5, it **MUST** also have the `page_type: example_index` front-matter so that it gets displayed on the index page.
 
 - `markdown_content` is rendered directly above the examples. In general, it is best to *avoid* paragraph-formatted explanation and let the simplicity of the example speak for itself, but that's not always possible. Take note that headings in this block *are* reflected in the sidebar.

  - Thumbnail images should named `your-tutorial-chart.jpg` and be *EXACTLY* 160px X 160px.
    - posts in the following `display_as` categories **MUST** have a thumbnail
      - 'file_settings' = https://plotly.com/javascript/plotly-fundamentals
      - 'basic' = https://plotly.com/javascript/basic-charts
      - 'statistical' = https://plotly.com/javascript/statistical-charts
      - 'scientific' = https://plotly.com/javascript/scientific-charts
      - 'financial' = https://plotly.com/javascript/financial-charts
      - 'maps' = https://plotly.com/javascript/maps
      - '3d_charts' = https://plotly.com/javascript/3d-charts
    - Thumbnail images should be clear and interesting. You do not need to capture the ENTIRE chart, but rather focus on the most interesting part of the chart.
    - Use images.plot.ly for adding new images. The password is in the Plotly 1Password Engineering Vault. 
      - Log-in here: https://661924842005.signin.aws.amazon.com/console
      - From the <b>Amazon Web Services Console</b> select <b>S3 (Scalable Storage in the Cloud)</b> then select <b>plotly-tutorials</b> -> <b>plotly-documentation</b> -> <b>thumbnail</b>
      - Now from <b>All Buckets /plotly-tutorials/plotly-documentation/thumbnail</b> select the <b>Actions</b> dropdown and <b>upload</b> your .jpg file

## Modify An Existing Post:

1. Find the post you want to modify in `_posts/plotly_js`. Then, open the HTML file that contains that post and modify either the front-matter or the JavaScript.

# Best Practices:
  - `order` examples from basic to advanced
  - avoid the use of global JavaScript variables for `data` and `layout`. 
  - make the chart display in a DOM element named `myDiv`
  - use the `.newPlot()` function 
  - use "real" data to make the examples realistic and useful for users. 
    - avoid using random or dummy data as much as humanly possible! Should only be a last resort. 
  - upload data files to https://github.com/plotly/datasets as importing data rather than pasting a large chunk of data in the tutorial creates a cleaner example. 
   - use `var config = {mapboxAccessToken: "your access token"};` if your chart requires Mapbox authentication. `"your access token` will replaced by Plotly's private token at build time. In development mode, you will need to create a `_data/mapboxtoken.yml` file and paste Plotly's non-URL restricted Mapbox key into it. This is available in 1Password.
       
## Make a Pull Request
  - Ready for your changes to be reviewed? Make a pull request!

    - Create a feature branch and use `git status` to list changed files.
    ```
    git checkout -b your_feature_branch
    git status
    ```
    - Add, commit, and push the files that you'd like to add to your PR:
    ```
    git add file-a
    git add file-b
    git commit -m 'message about your changes'
    git push origin your_feature_branch
    ```
    - Visit the [documentation repo](https://github.com/plotly/graphing-library-docs) and open a pull request!. You can then tag **@jdamiba** for a review.

## Style Edits

Please refer to our [Styles README](https://github.com/plotly/graphing-library-docs/blob/master/style_README.md)

Thanks for contributing to our documentation!!
