/**
 * OHLC trace type
 */

import type { Calendar, Dash } from '../lib/common';

export type OhlcHoverInfo =
    | 'x'
    | 'y'
    | 'z'
    | 'text'
    | 'name'
    | 'x+y'
    | 'x+z'
    | 'x+text'
    | 'x+name'
    | 'y+z'
    | 'y+text'
    | 'y+name'
    | 'z+text'
    | 'z+name'
    | 'x+y+z'
    | 'x+y+text'
    | 'x+y+name'
    | 'y+z+text'
    | 'y+z+name'
    | 'z+text+name'
    | 'all'
    | 'none'
    | 'skip';

export interface OhlcData {
    type: 'ohlc';
    name: string;
    visible: boolean | 'legendonly';
    showlegend: boolean;
    legendgroup: string;
    opacity: number;
    ids: string[];
    x: string[];
    close: number[];
    open: number[];
    high: number[];
    low: number[];
    text: string | string[];
    hovertext: string | string[];
    hoverinfo: OhlcHoverInfo;
    meta: any;
    customdata: any[];
    xaxis: string;
    yaxis: string;
    xperiod: any;
    xperiodalignment: 'start' | 'middle' | 'end';
    xperiod0: any;
    line: {
        width: number;
        dash: Dash;
    };
    selectedpoints: any;
    increasing: {
        line?:
            | {
                  color?: string | undefined;
                  width?: number | undefined;
                  dash?: Dash | undefined;
              }
            | undefined;
    };
    decreasing: {
        line?:
            | {
                  color?: string | undefined;
                  width?: number | undefined;
                  dash?: Dash | undefined;
              }
            | undefined;
    };
    hoverlabel: {
        bgcolor?: string | string[] | undefined;
        bordercolor?: string | string[] | undefined;
        font?:
            | {
                  family?: string | string[] | undefined;
                  size?: number | undefined;
                  color?: string | string[] | undefined;
              }
            | undefined;
        align?: 'left' | 'right' | 'auto' | undefined;
        namelength?: number | number[] | undefined;
        split?: boolean | undefined;
    };
    tickwidth: number;
    xcalendar: Calendar;
    uirevision: any;
}
