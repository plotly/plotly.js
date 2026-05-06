/**
 * Candlestick trace type
 */

import type { OhlcData } from './ohlc';

export interface CandlestickData {
    type: 'candlestick';
    name: OhlcData['name'];
    visible: OhlcData['visible'];
    showlegend: OhlcData['showlegend'];
    opacity: OhlcData['opacity'];
    ids: OhlcData['ids'];
    xperiod: OhlcData['xperiod'];
    xperiod0: OhlcData['xperiod0'];
    xperiodalignment: OhlcData['xperiodalignment'];
    x: OhlcData['x'];
    open: OhlcData['open'];
    high: OhlcData['high'];
    close: OhlcData['close'];
    low: OhlcData['low'];
    text: OhlcData['text'];
    hovertext: OhlcData['hovertext'];
    hoverinfo: OhlcData['hoverinfo'];
    meta: OhlcData['meta'];
    xaxis: OhlcData['xaxis'];
    line: { width?: number | undefined };
    increasing: {
        line?:
            | {
                  color?: string | undefined;
                  width?: number | undefined;
              }
            | undefined;
    };
    decreasing: {
        line?:
            | {
                  color?: string | undefined;
                  width?: number | undefined;
              }
            | undefined;
    };
    hoverlabel: OhlcData['hoverlabel'];
    /**
     * Number between 0 and 1.
     * Selects the width of the whiskers relative to the box's width.
     * @default 0
     */
    whiskerwidth: number;
}
