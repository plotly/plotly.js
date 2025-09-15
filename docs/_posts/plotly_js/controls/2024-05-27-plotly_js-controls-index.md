---
permalink: javascript/controls/
description: Plotly.js makes interactive, publication-quality graphs online. Examples of how to make controls in charts.
name: Add Custom Controls
layout: langindex
language: plotly_js
display_as: controls
thumbnail: thumbnail/mixed.jpg
page_type: example_index
---


<header class="--welcome">
	<div class="--welcome-body">
		<!--div.--wrap-inner-->
		<div class="--title">

			<div class="--body">
				<h1>Add Custom Controls</h1>
				<p>{{page.description}}</p>
				{% include layouts/dashplug.html %}
			</div>
		</div>
	</div>
</header>

		{% assign languagelist = site.posts | where:"language","plotly_js" | where:"display_as","controls" | where: "layout","base" | sort: "order" %}
        {% include posts/documentation_eg.html %}
