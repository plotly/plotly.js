import plotly.graph_objs as go
import plotly.io as pio
import datetime
import numpy as np

custom_output_file = 'plot.html'
plotly_js_path = '../../dist/plotly.js'


def generate_date_time(start, count):
    dates = []
    current = datetime.datetime.fromisoformat(start)
    for _ in range(count):
        dates.append(current)
        current += datetime.timedelta(hours=7)
    return dates


def generate_random_y_values(count):
    return np.random.random(count) * 20


# Define the base trace dictionary
base_trace = {
    'name': None,
    'x': None,
    'y': None,
    'type': 'scatter',
    'mode': 'markers',
    'marker': {'size': 10},
    'tooltiptemplate': "%{fullData.name}<br>%{x|%H:%M:%S}<br>y: %{y:.2e}",
    'tooltip': {
        'align': 'left',
        'arrowcolor': 'blue',
        'arrowhead': 2,
        'arrowsize': 1.2,
        'arrowwidth': 1,
        'font': {
            'color': 'red',
            'family': 'Arial',
            'size': 16
        },
        'showarrow': True,
        'xanchor': 'left'
    }
}

# Create 3 traces using dictionary comprehension
traces = [
    go.Scatter(
        name=f'Trace {i+1}',
        x=generate_date_time(f'2025-04-0{i+1}T12:00:00', 5),
        y=generate_random_y_values(5),
        mode='markers',
        marker={'size': 10},
        # not supported yet. additional properties are blocked
        # by plotly\basedatatypes.py", line 4392, in _process_kwargs
        # tooltiptemplate=base_trace['tooltiptemplate'],
        # tooltip=base_trace['tooltip']
    )
    for i in range(3)
]

# Define the layout for the plot
layout = go.Layout(
    title='Custom Tooltip Example',
    hovermode='closest'
)

# Create the figure
fig = go.Figure(data=[trace.to_plotly_json() for trace in traces], layout=layout)

# Define the configuration options
config = {
    'editable': True,
    'modeBarButtonsToAdd': ['tooltip', 'hoverclosest', 'hovercompare', 'togglespikelines'],
    'displaylogo': False,
    'displayModeBar': True
}

# Save the figure to an HTML file with custom plotly.js path
fig.write_html(file=custom_output_file, include_plotlyjs=plotly_js_path, config=config, validate=True, auto_open=True)

print(f"Custom HTML with Plotly plot saved as {custom_output_file}")
