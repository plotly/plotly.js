// Demo figures for the vectortilemap trace. Each builder returns {data, layout, frames?}.
// Tiles come from server_og.py (DuckDB ST_AsMVT). Everything here is plain plotly.js figure JSON,
// the same JSON that plotly.py or Dash would send.
(function () {
    const T = (name) => `${location.origin}/og/${name}.json`;
    const FONT = 'Inter, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif';
    const INK = '#e6e9ef';
    const MUTED = '#9aa3b2';
    const PANEL = 'rgba(12, 17, 29, 0.86)';

    // Industry-style well symbology, tuned for a dark basemap
    const WELL_STYLES = [
        // [source layer, legend name, color, rank (higher draws on top)]
        ['wells_plugged', 'Plugged & abandoned', '#5b6474'],
        ['wells_dry', 'Dry hole', '#8a8172'],
        ['wells_other', 'Other', '#9b7bd4'],
        ['wells_permitted', 'Permitted', '#f2f4f7'],
        ['wells_injection', 'Injection & disposal', '#3b9cff'],
        ['wells_gas', 'Gas', '#ff4d4d'],
        ['wells_oilgas', 'Oil & gas', '#ffb020'],
        ['wells_oil', 'Oil', '#2ee88a']
    ];

    const dot = (color, label) => `<span style="color:${color}">●</span> <span style="color:${color}">${label}</span>`;
    const wellHover = (color, label) =>
        `${dot(color, label)}<br>` +
        '<b>%{properties.name}</b><br>' +
        '<span style="color:#9aa3b2">%{properties.operator}</span><br>' +
        'API %{properties.api} · %{properties.field}<br>' +
        'Spud %{properties.spud_year} · TD %{properties.depth_ft:,.0f} ft<br>' +
        '%{properties.status}' +
        '<extra></extra>';

    const titleBox = (title, subtitle, opts = {}) => ({
        xref: 'paper',
        yref: 'paper',
        x: opts.x ?? 0.012,
        y: opts.y ?? 0.985,
        xanchor: 'left',
        yanchor: 'top',
        align: 'left',
        showarrow: false,
        bgcolor: PANEL,
        bordercolor: 'rgba(255,255,255,0.08)',
        borderwidth: 1,
        borderpad: 12,
        font: { family: FONT, color: INK, size: 13 },
        text:
            `<span style="font-size:22px;font-weight:700;letter-spacing:-0.2px">${title}</span><br>` +
            `<span style="color:${MUTED}">${subtitle}</span>`
    });

    const baseLayout = (view, extra = {}) => ({
        paper_bgcolor: '#0b1020',
        font: { family: FONT, color: INK },
        margin: { l: 0, r: 0, t: 0, b: 0 },
        hoverlabel: {
            bgcolor: 'rgba(12,17,29,0.95)',
            bordercolor: 'rgba(255,255,255,0.25)',
            font: { family: FONT, color: INK, size: 13 },
            align: 'left'
        },
        legend: {
            x: 0.012,
            y: 0.80,
            xanchor: 'left',
            yanchor: 'top',
            bgcolor: PANEL,
            bordercolor: 'rgba(255,255,255,0.08)',
            borderwidth: 1,
            font: { size: 13, color: INK },
            itemsizing: 'constant',
            tracegroupgap: 10
        },
        map: Object.assign({ style: 'carto-darkmatter' }, view),
        ...extra
    });

    const colorbar = (title, opts = {}) =>
        Object.assign(
            {
                title: { text: title, side: 'top', font: { size: 12, color: MUTED } },
                orientation: 'h',
                x: 0.988,
                xanchor: 'right',
                y: 0.035,
                yanchor: 'bottom',
                len: 0.26,
                thickness: 10,
                bgcolor: PANEL,
                bordercolor: 'rgba(255,255,255,0.08)',
                borderwidth: 1,
                xpad: 14,
                ypad: 12,
                tickfont: { size: 11, color: INK },
                outlinewidth: 0
            },
            opts
        );

    // ---------------------------------------------------------------------------------------------
    // 1. Onshore wells: Kansas + Colorado, 644k wells, with midstream and shale plays underneath
    function wells({ view = 'overview' } = {}) {
        const close = view !== 'overview';
        const views = {
            overview: { center: { lon: -101.2, lat: 38.55 }, zoom: 5.95 },
            wattenberg: { center: { lon: -104.78, lat: 40.21 }, zoom: 11.6 },
            hugoton: { center: { lon: -101.33, lat: 37.37 }, zoom: 10.4 }
        };
        const size = close ? 6.5 : 2;
        const data = [
            {
                type: 'vectortilemap',
                name: 'Shale & tight plays (EIA)',
                legendgroup: 'context',
                legendgrouptitle: { text: 'Context', font: { color: MUTED, size: 12 } },
                source: T('midstream'),
                sourcelayer: 'plays',
                layertype: 'fill',
                marker: { color: '#7c5cff', opacity: 0.16, line: { width: 1, color: 'rgba(160,140,255,0.55)' } },
                hovertemplate: `${dot('#a78bfa', 'Shale / tight play')}<br><b>%{properties.play}</b><br>%{properties.basin} basin · %{properties.age}<extra></extra>`
            },
            {
                type: 'vectortilemap',
                name: 'Gas pipelines (EIA)',
                legendgroup: 'context',
                source: T('midstream'),
                sourcelayer: 'gas_interstate',
                layertype: 'line',
                line: { color: '#22d3ee', width: close ? 2.5 : 0.9 },
                marker: { opacity: close ? 0.75 : 0.4 },
                hovertemplate: `${dot('#22d3ee', 'Interstate gas pipeline')}<br><b>%{properties.operator}</b><extra></extra>`
            },
            {
                type: 'vectortilemap',
                name: 'Intrastate gas',
                legendgroup: 'context',
                showlegend: false,
                source: T('midstream'),
                sourcelayer: 'gas_intrastate',
                layertype: 'line',
                line: { color: '#22d3ee', width: close ? 1.5 : 0.5 },
                marker: { opacity: close ? 0.45 : 0.2 },
                hovertemplate: `${dot('#22d3ee', 'Intrastate gas pipeline')}<br><b>%{properties.operator}</b><extra></extra>`
            }
        ];
        for (const [layer, name, color] of WELL_STYLES) {
            data.push({
                type: 'vectortilemap',
                name,
                legendgroup: 'wells',
                legendgrouptitle: layer === 'wells_plugged' ? { text: 'Well status', font: { color: MUTED, size: 12 } } : undefined,
                source: T('wells'),
                sourcelayer: layer,
                layertype: 'circle',
                marker: {
                    color,
                    size,
                    opacity: close ? 0.95 : 0.9,
                    line: close ? { width: 0.8, color: 'rgba(10,14,25,0.9)' } : { width: 0 }
                },
                hovertemplate: wellHover(color, name),
                hovertemplatefallback: '—'
            });
        }
        // legend order: wells first, then context
        data.forEach((t) => (t.legendrank = t.legendgroup === 'wells' ? 1 : 2));

        const titles = {
            overview: ['Kansas & Colorado wells', '644,104 wells (KGS, ECMC) · EIA pipelines and shale plays · vector tiles from DuckDB'],
            wattenberg: ['Wattenberg field, Weld County CO', 'Every well at full detail · hover shows operator, API, spud date and depth'],
            hugoton: ['Hugoton gas field, SW Kansas', 'One of the largest gas fields in North America']
        };
        return {
            data,
            layout: baseLayout(views[view], {
                annotations: [titleBox(...titles[view])],
                legend: Object.assign(baseLayout({}).legend, { y: 0.875 })
            })
        };
    }

    // ---------------------------------------------------------------------------------------------
    // 2. Gulf of Mexico offshore (BOEM): blocks, leases, pipelines, platforms, wells, well paths
    function offshore({ view = 'gulf' } = {}) {
        const deep = view !== 'gulf';
        const views = {
            gulf: { center: { lon: -91.1, lat: 27.55 }, zoom: 6.25 },
            deepwater: { center: { lon: -89.05, lat: 28.21 }, zoom: 10.3 }
        };
        const src = T('offshore');
        const data = [
            {
                type: 'vectortilemap',
                name: 'Lease blocks',
                source: src,
                sourcelayer: 'blocks',
                layertype: 'line',
                line: { color: '#c9d4ff', width: 0.5 },
                marker: { opacity: deep ? 0.3 : 0.14 },
                hovertemplate: 'Block %{properties.block}<br>%{properties.planning_area} planning area<extra></extra>',
                legendrank: 3
            },
            {
                type: 'vectortilemap',
                name: 'Active leases',
                source: src,
                sourcelayer: 'leases',
                layertype: 'fill',
                zkey: 'effective_year',
                zmin: 1950,
                zmax: 2025,
                colorscale: [
                    [0, '#1d2b53'],
                    [0.5, '#2a5c8a'],
                    [1, '#5fb3c9']
                ],
                marker: { opacity: 0.42, line: { width: 0.6, color: 'rgba(150,200,230,0.5)' } },
                showscale: false,
                hovertemplate:
                    '<b>Lease %{properties.lease}</b> · %{properties.block}<br>%{properties.status}<br>' +
                    'Effective %{properties.effective_year} · royalty %{properties.royalty_pct}%<extra></extra>',
                legendrank: 3
            },
            {
                type: 'vectortilemap',
                name: 'Pipelines, out of service',
                source: src,
                sourcelayer: 'pipelines_inactive',
                layertype: 'line',
                line: { color: '#6b7280', width: deep ? 1 : 0.5 },
                marker: { opacity: 0.45 },
                hovertemplate:
                    `${dot('#9ca3af', 'Pipeline, %{properties.status}')}<br><b>%{properties.product}</b> · %{properties.size_in}"<br>%{properties.operator}<br>Segment %{properties.segment}<extra></extra>`,
                legendrank: 2
            },
            {
                type: 'vectortilemap',
                name: 'Pipelines, active (by diameter)',
                source: src,
                sourcelayer: 'pipelines_active',
                layertype: 'line',
                zkey: 'size_in',
                zmin: 2,
                zmax: 30,
                colorscale: [
                    [0, '#ffd166'],
                    [0.45, '#ff8c42'],
                    [1, '#ff3d6e']
                ],
                line: { width: deep ? 2.4 : 1.3 },
                marker: { opacity: 0.95 },
                colorbar: colorbar('Active pipeline diameter (in)'),
                hovertemplate:
                    `${dot('#ff8c42', 'Active pipeline')}<br><b>%{properties.product}</b> · %{properties.size_in}" diameter<br>%{properties.operator}<br>Segment %{properties.segment} · %{properties.length_ft:,.0f} ft<extra></extra>`,
                legendrank: 2
            }
        ];
        if (deep) {
            data.push({
                type: 'vectortilemap',
                name: 'Well paths (surface → bottom hole)',
                source: src,
                sourcelayer: 'well_paths',
                layertype: 'line',
                zkey: 'tvd_ft',
                zmin: 5000,
                zmax: 30000,
                colorscale: [
                    [0, '#a7f3d0'],
                    [0.5, '#34d399'],
                    [1, '#0e7490']
                ],
                line: { width: 1.6 },
                marker: { opacity: 0.9 },
                colorbar: colorbar('Well true vertical depth (ft)', { x: 0.7 }),
                hovertemplate:
                    `${dot('#34d399', 'Well path')}<br>` +
                    '<b>%{properties.name}</b> · %{properties.operator}<br>API %{properties.api} · %{properties.well_type}<br>' +
                    'TVD %{properties.tvd_ft:,.0f} ft · MD %{properties.md_ft:,.0f} ft<br>Water depth %{properties.water_depth_ft:,.0f} ft<br>%{properties.status}<extra></extra>',
                legendrank: 1
            });
        }
        data.push(
            {
                type: 'vectortilemap',
                name: 'Wells (surface location)',
                source: src,
                sourcelayer: 'wells',
                layertype: 'circle',
                zkey: 'water_depth_ft',
                zmin: 0,
                zmax: 7000,
                colorscale: [
                    [0, '#d9f99d'],
                    [0.08, '#67e8f9'],
                    [0.4, '#818cf8'],
                    [1, '#e879f9']
                ],
                colorbar: colorbar('Well water depth (ft)', { x: deep ? 0.41 : 0.7 }),
                marker: {
                    size: deep ? 4 : 2.4,
                    opacity: deep ? 0.95 : 0.75,
                    line: { width: 0 }
                },
                hovertemplate:
                    `${dot('#67e8f9', 'Offshore well')}<br>` +
                    '<b>%{properties.name}</b> · %{properties.operator}<br>API %{properties.api} · block %{properties.block}<br>' +
                    '%{properties.well_type} · spud %{properties.spud_year}<br>Water depth %{properties.water_depth_ft:,.0f} ft · %{properties.status}<extra></extra>',
                legendrank: 1
            },
            {
                type: 'vectortilemap',
                name: 'Platforms',
                source: src,
                sourcelayer: 'platforms',
                layertype: 'circle',
                marker: { color: '#ffffff', size: deep ? 11 : 3.2, opacity: 1, line: { width: deep ? 2.5 : 0.8, color: '#ff3d6e' } },
                hovertemplate: `${dot('#ff3d6e', 'Platform')}<br><b>Structure %{properties.structure}</b><br>Complex %{properties.complex_id} · installed %{properties.install_year}<extra></extra>`,
                legendrank: 1
            }
        );
        const titles = {
            gulf: ['Gulf of Mexico offshore infrastructure', 'BOEM: 29k lease blocks · 15.6k pipeline segments · 7.3k platforms · 55k wells'],
            deepwater: ['Deepwater Mississippi Canyon', 'Directional well paths from surface location to bottom hole, colored by vertical depth']
        };
        return { data, layout: baseLayout(views[view], { annotations: [titleBox(...titles[view])] }) };
    }

    // ---------------------------------------------------------------------------------------------
    // 3. Drilling through the decades: 40k H3 hexagons, z per decade sent as feature state
    async function decades({ decade = 1980 } = {}) {
        const hex = await (await fetch('/demos/hex_decades.json')).json();
        const scale = [
            [0, '#1b0c41'],
            [0.2, '#4a0c6b'],
            [0.4, '#a52c60'],
            [0.6, '#ed6925'],
            [0.8, '#fbb61a'],
            [1, '#fcffa4']
        ];
        const frameTitle = (d) =>
            titleBox(
                `Drilling through the decades · ${d}s`,
                `${hex.wells[d].toLocaleString()} wells spudded in Kansas & Colorado · 40,479 H3 cells, colors sent as feature state`
            );
        const trace = (d) => ({
            type: 'vectortilemap',
            name: 'Wells spudded',
            source: T('hex'),
            sourcelayer: 'hexes',
            featureidkey: 'hex_id',
            layertype: 'fill',
            locations: hex.ids,
            z: hex.z[d],
            zmin: 0,
            zmax: 2.5,
            colorscale: scale,
            marker: { opacity: 0.88, line: { width: 0 } },
            colorbar: colorbar('Wells spudded per 5 km² cell', {
                tickvals: [0, 1, 2, Math.log10(300)],
                ticktext: ['1', '10', '100', '300']
            }),
            hovertemplate: 'H3 %{properties.h3}<br><b>%{customdata:,}</b> wells spudded<br>%{properties.wells:,} wells all time<extra></extra>',
            customdata: hex.z[d].map((v) => (v === null ? null : Math.round(10 ** v)))
        });
        const steps = hex.decades.map((d) => ({ label: `${d}s`, method: 'animate', args: [[String(d)], { mode: 'immediate', frame: { duration: 0, redraw: true }, transition: { duration: 0 } }] }));
        return {
            data: [trace(decade)],
            layout: baseLayout(
                { center: { lon: -101.0, lat: 38.45 }, zoom: 6.0, style: 'carto-darkmatter' },
                {
                    annotations: [frameTitle(decade)],
                    shapes: [
                        {
                            type: 'rect', xref: 'paper', yref: 'paper', x0: 0.006, x1: 0.645, y0: 0.012, y1: 0.105,
                            fillcolor: PANEL, line: { color: 'rgba(255,255,255,0.08)', width: 1 }, layer: 'above'
                        }
                    ],
                    sliders: [
                        {
                            active: hex.decades.indexOf(decade),
                            steps,
                            x: 0.016,
                            len: 0.62,
                            y: 0.024,
                            yanchor: 'bottom',
                            bgcolor: '#1f2937',
                            bordercolor: '#374151',
                            activebgcolor: '#fbb61a',
                            font: { color: INK, size: 12 },
                            currentvalue: { visible: false },
                            pad: { t: 10, b: 10 }
                        }
                    ]
                }
            ),
            frames: hex.decades.map((d) => ({
                name: String(d),
                data: [{ z: hex.z[d], customdata: trace(d).customdata }],
                traces: [0],
                layout: { annotations: [frameTitle(d)] }
            }))
        };
    }

    // ---------------------------------------------------------------------------------------------
    // 4. Midstream: U.S. gas and crude pipelines with shale plays
    function midstream() {
        const src = T('midstream');
        return {
            data: [
                {
                    type: 'vectortilemap',
                    name: 'Shale & tight plays',
                    source: src,
                    sourcelayer: 'plays',
                    layertype: 'fill',
                    marker: { color: '#7c5cff', opacity: 0.22, line: { width: 1, color: 'rgba(170,150,255,0.7)' } },
                    hovertemplate: '<b>%{properties.play}</b><br>%{properties.basin} basin · %{properties.lithology}<br>%{properties.area_sq_mi:,.0f} sq mi · %{properties.age}<extra></extra>'
                },
                {
                    type: 'vectortilemap',
                    name: 'Intrastate gas',
                    source: src,
                    sourcelayer: 'gas_intrastate',
                    layertype: 'line',
                    line: { color: '#0ea5b7', width: 0.7 },
                    marker: { opacity: 0.6 },
                    hovertemplate: '<b>%{properties.operator}</b><br>Intrastate gas · %{properties.status}<extra></extra>'
                },
                {
                    type: 'vectortilemap',
                    name: 'Interstate gas',
                    source: src,
                    sourcelayer: 'gas_interstate',
                    layertype: 'line',
                    line: { color: '#5eead4', width: 1.4 },
                    marker: { opacity: 0.9 },
                    hovertemplate: '<b>%{properties.operator}</b><br>Interstate gas · %{properties.status}<extra></extra>'
                },
                {
                    type: 'vectortilemap',
                    name: 'Crude oil trunklines',
                    source: src,
                    sourcelayer: 'crude_pipelines',
                    layertype: 'line',
                    line: { color: '#ffb020', width: 2 },
                    marker: { opacity: 0.95 },
                    hovertemplate: `${dot('#ffb020', 'Crude oil trunkline')}<br><b>%{properties.pipeline}</b><br>%{properties.operator}<extra></extra>`
                }
            ],
            layout: baseLayout(
                { center: { lon: -96.5, lat: 38.3 }, zoom: 3.85 },
                {
                    annotations: [titleBox('U.S. natural gas & crude oil pipelines', 'EIA: 32,921 gas pipeline segments · 236 crude trunklines · 50 shale and tight plays')],
                    legend: Object.assign(baseLayout({}).legend, { y: 0.875 })
                }
            )
        };
    }

    window.DEMOS = { wells, offshore, decades, midstream };
})();
