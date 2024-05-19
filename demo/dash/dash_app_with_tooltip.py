"""
This Dash application is intended to be run with a custom version of plotly.js that includes tooltip functionality.
The custom plotly.js file should be placed in the assets folder of the Dash project.
"""
import dash
from dash import dcc, html
import plotly.graph_objs as go
import datetime
import numpy as np

# Initialize the Dash app
app = dash.Dash(__name__)

# Generate date and time values
def generate_date_time(start, count):
    dates = []
    current = datetime.datetime.fromisoformat(start)
    for _ in range(count):
        dates.append(current)
        current += datetime.timedelta(hours=7)
    return dates

# Generate random y-values
def generate_random_y_values(count):
    return np.random.random(count) * 20

# Generate data points
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
    {
        **base_trace,
        'name': f'Trace {i+1}',
        'x': generate_date_time(f'2025-04-0{i+1}T12:00:00', 5),
        'y': generate_random_y_values(5)
    }
    for i in range(3)
]

# Layout definition
layout = go.Layout(
    title='Custom Tooltip Example',
    hovermode='closest'
)

# App layout
app.layout = html.Div([
    html.H1("Plotly Tooltip Button Test"),
    dcc.Graph(
        id='plot',
        figure={
            'data': [*traces],
            'layout': layout
        },
        config={
            'editable': True,
            'modeBarButtonsToAdd': ['tooltip', 'hoverclosest', 'hovercompare', 'togglespikelines'],
            'displaylogo': False,
        }
    )
])

if __name__ == '__main__':
    app.run_server(debug=True)
