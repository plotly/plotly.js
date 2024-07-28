Introducing a tooltip feature that can be activated by a new modebar button. It allows to add an annotation to every clicked point.
By default, tooltips contain x and y coordinates. They can be customized to contain any additional data attached to the trace or points, which makes it a powerful tool for data exploration and presentation.

When a plot is created with `editable: true`, the tooltips can be dragged around or deleted interactively. Their text can also be edited.
To delete a tooltip, click on its text and delete it.

Tooltips can be customized with an optional `tooltiptemplate` (possibilities equivalent to [hovertemplate](https://plotly.com/javascript/reference/scatter/#scatter-hovertemplate)) and `tooltip` annotation options (possibilities equivalent to [annotations](https://plotly.com/javascript/text-and-annotations/))
![image](https://github.com/kb-/plotly.js/assets/2260417/f7258b47-6eb2-4c3c-a3ce-f23899fe57e1)