/**
 * Internal layout types (not in public API)
 *
 * These are runtime-resolved versions of layout with internal state
 * properties. For public layout types, see layout.d.ts and
 * generated/schema.d.ts.
 */

import type { Locale, Selection } from 'd3';
import type { Layout } from '../generated/schema';
import type { Color } from '../lib/common';

/**
 * Fully processed layout with all defaults applied (internal use)
 */
export interface FullLayout extends Layout {
    // Core internal state
    _basePlotModules?: any[];
    _calcInverseTransform?: (gd: any) => void;
    _initialAutoSizeIsDone?: boolean;
    _invTransform?: any;
    _legends?: string[];
    _meta?: { meta?: any; layout?: { meta?: any } };
    _modules?: any[];
    _plots?: { [key: string]: any };
    _pushmargin?: { [key: string]: any };
    _size?: LayoutSize;
    _subplots?: SubplotInfo;
    _template?: any;
    _uid?: string;

    // SVG layers
    _bgLayer?: Selection<any>;
    _cartesianlayer?: Selection<any>;
    _clips?: Selection<any>;
    _container?: Selection<any>;
    _defs?: Selection<any>;
    _dragCover?: Selection<any>;
    _draggers?: Selection<any>;
    _funnelarealayer?: Selection<any>;
    _geolayer?: Selection<any>;
    _glcanvas?: Selection<any>;
    _glcontainer?: Selection<any>;
    _glimages?: Selection<any>;
    _iciclelayer?: Selection<any>;
    _imageLowerLayer?: Selection<any>;
    _imageUpperLayer?: Selection<any>;
    _indicatorlayer?: Selection<any>;
    _infolayer?: Selection<any>;
    _menulayer?: Selection<any>;
    _modebardiv?: Selection<any>;
    _paper?: Selection<any>;
    _paperdiv?: Selection<any>;
    _pielayer?: Selection<any>;
    _polarlayer?: Selection<any>;
    _selectionLayer?: Selection<any>;
    _shapeLowerLayer?: Selection<any>;
    _shapeUpperLayer?: Selection<any>;
    _smithlayer?: Selection<any>;
    _sunburstlayer?: Selection<any>;
    _ternarylayer?: Selection<any>;
    _topdefs?: Selection<any>;
    _topclips?: Selection<any>;
    _toppaper?: Selection<any>;
    _treemaplayer?: Selection<any>;
    _zoomlayer?: Selection<any>;

    // Hover state
    _hoverlayer?: Selection<any>;
    _hoverpaper?: Selection<any>;
    _hoversubplot?: string | null;
    _lasthover?: Selection<any> | null;
    _rehover?: (() => void) | null;

    // Modebar
    _modeBar?: any;

    // Cross-trace computation state
    _alignmentOpts?: Record<string, any>;
    _axisConstraintGroups?: any[];
    _axisMatchGroups?: any[];
    _colorAxes?: Record<string, any>;
    _dataTemplate?: Record<string, any>;
    _extraFormat?: Record<string, any>;
    _firstScatter?: Record<string, any>;
    _funnelareacolormap?: Record<string, Color>;
    _histogramBinOpts?: Record<string, any>;
    _iciclecolormap?: Record<string, Color>;
    _numBoxes?: number;
    _numViolins?: number;
    _piecolormap?: Record<string, Color>;
    _rangeSliderData?: any[];
    _requestRangeslider?: Record<string, boolean>;
    _roundFnOpts?: Record<string, any>;
    _scatterStackOpts?: Record<string, any>;
    _splomAxes?: { x: Record<string, any>; y: Record<string, any> };
    _splomGrid?: any;
    _splomGridDflt?: Record<string, any>;
    _splomScenes?: Record<string, any>;
    _splomSubplots?: Record<string, any>;
    _sunburstcolormap?: Record<string, Color>;
    _transformModules?: any[];
    _treemapcolormap?: Record<string, Color>;
    _violinScaleGroupStats?: Record<string, any>;
    _visibleModules?: any[];

    // Scalar flags and values
    _cartesianSpikesEnabled?: 'on' | 'off';
    _currentFrame?: string;
    _d3locale?: Locale;
    _dataLength?: number;
    _enablescrollzoom?: boolean;
    _dfltTitle?: Record<string, string>;
    _guiEditing?: boolean;
    _has?: (category: string) => boolean;
    _hasOnlyLargeSploms?: boolean;
    _insideTickLabelsUpdaterange?: Record<string, any>;
    _invScaleX?: number;
    _invScaleY?: number;
    _lastBBox?: DOMRect;
    _mapboxAccessToken?: string;
    _pushmarginIds?: Record<string, number>;
    _redrawFromAutoMarginCount?: number;
    _replotting?: boolean;
    _reservedMargin?: Record<string, number>;
    _shouldCreateBgLayer?: boolean;
    _skipDefaults?: boolean;
    _traceUids?: string[];
    _traceWord?: string;
    _zindices?: number[];

    // Interaction state
    _activeSelectionIndex?: number;
    _activeShapeIndex?: number;
    _deactivateSelection?: (gd: any) => void;
    _deactivateShape?: (gd: any) => void;
    _deselect?: any;
    _hColorbarMoveCBTitle?: number;
    _hColorbarMoveTitle?: number;
    _lastSelectedSubplot?: string;
    _noEmitSelectedAtStart?: boolean;
    _outlining?: boolean;
    _preGUI?: Record<string, any>;
    _previousSelections?: any[];
    _redrag?: (() => void) | null;
    _reselect?: (() => void) | null;
    _tracePreGUI?: Record<string, Record<string, any>>;

    [key: string]: any;
}

/**
 * Layout size information (internal)
 */
export interface LayoutSize {
    b: number;
    h: number;
    l: number;
    p: number;
    r: number;
    t: number;
    w: number;
}

/**
 * Subplot information (internal)
 */
export interface SubplotInfo {
    [key: string]: string[] | undefined;
    cartesian?: string[];
    geo?: string[];
    gl2d?: string[];
    map?: string[];
    mapbox?: string[];
    pie?: string[];
    polar?: string[];
    sankey?: string[];
    ternary?: string[];
}
