---
description: How to export graphs as static images in JavaScript. The Plotly JavaScript
  graphing library supports `.jpg`, `.png`, and `.svg` as formats for static image
  export.
display_as: file_settings
language: plotly_js
layout: base
name: Static Image Export
order: 25
page_type: u-guide
permalink: javascript/static-image-export/
sitemap: false
thumbnail: thumbnail/png-export.png
---

You can save graphs created with `plotly.js` to static images and view them in your browser. Consider the following example:

    var img_jpg= d3.select('#jpg-export');

    // Plotting the Graph

    var trace={x:[3,9,8,10,4,6,5],y:[5,7,6,7,8,9,8],type:"scatter"};
    var trace1={x:[3,4,1,6,8,9,5],y:[4,2,5,2,1,7,3],type:"scatter"};
    var data = [trace,trace1];
    var layout = {title : "Simple JavaScript Graph"};
    Plotly.newPlot(
      'plotly_div',
       data,
       layout)

    // static image in jpg format

    .then(
        function(gd)
         {
          Plotly.toImage(gd,{height:300,width:300})
             .then(
                 function(url)
             {
                 img_jpg.attr("src", url);
             }
             )
        });
To view this image in your page include following HTML tag:

    <img id="jpg-export"></img>

Height and width of the image can be adjusted by specifying the same in `toImage` call:

    Plotly.toImage(
    gd,{
      format:'jpeg',
      height:desired_height,
      width:desired_width,
    });

You can also save the image using different formats.

# Formats Supported

The common image formats: 'PNG', 'JPG/JPEG' are supported. In addition, formats like 'EPS', 'SVG' and 'PDF' are also available for user with a Personal or Professional subscription. You can get more details on our [pricing page] (https://plotly.com/products/cloud/)

**Note:** It is important to note that any figures containing WebGL traces (i.e. of type scattergl, heatmapgl, contourgl, scatter3d, surface, mesh3d, scatterpolargl, cone, streamtube, splom, or parcoords) that are exported in a vector format like SVG, EPS or PDF will include encapsulated rasters instead of vectors for some parts of the image.

## Saving as PNG ##
      img_png.attr("src", url);
      Plotly.toImage(gd,{format:'png',height:400,width:400});

## Saving as SVG ##
    img_svg.attr("src", url);
    Plotly.toImage(gd,{format:'svg',height:800,width:800});
