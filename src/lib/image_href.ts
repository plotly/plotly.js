'use strict';

import { xlink } from '../constants/xmlns_namespaces';
import helpers from '../snapshot/helpers';
import type { GraphDiv } from '../types/core/graph-div.internal';

interface ImageNode extends SVGImageElement {
    _blobUrl?: string;
    _dataUrl?: string;
}

function releaseBlobUrl(node: ImageNode) {
    if (!node._blobUrl) return;
    helpers.revokeObjectURL(node._blobUrl);
    delete node._blobUrl;
    delete node._dataUrl;
}

/**
 * Set `xlink:href` on each selected `<image>` and revoke any blob URL previously assigned by this helper.
 *
 * Canvas sources use PNG blob URLs, with a stored data URL for SVG export.
 * Export plots and empty canvases keep the canvas data URL.
 * String sources use the supplied URL unchanged.
 * The graph div tracks image nodes that need blob URL cleanup.
 * Call `releaseImageHrefs` when images leave the plot or the plot is purged.
 *
 * @param gd - the graph div that owns the images
 * @param image - a d3 selection of `<image>` elements
 * @param source - a canvas to encode as a PNG, or a URL to use as is
 */
export function setImageHref(gd: GraphDiv, image: any, source: HTMLCanvasElement | string) {
    const href = typeof source === 'string' ? source : source.toDataURL('image/png');
    const useBlob = typeof source !== 'string' && !gd._context?._exportedPlot && helpers.IMAGE_URL_PREFIX.test(href);
    const blob = useBlob ? helpers.createBlob(href.replace(helpers.IMAGE_URL_PREFIX, ''), 'png') : null;
    const nodes: ImageNode[] = gd._imageBlobNodes || (gd._imageBlobNodes = []);

    image.each(function (this: ImageNode) {
        const previous = this._blobUrl;
        if (blob) {
            this._blobUrl = helpers.createObjectURL(blob);
            this._dataUrl = href;
            if (nodes.indexOf(this) === -1) nodes.push(this);
        } else {
            delete this._blobUrl;
            delete this._dataUrl;
        }

        this.setAttributeNS(xlink, 'href', this._blobUrl || href);
        if (previous) helpers.revokeObjectURL(previous);
    });
}

/**
 * Revoke tracked image blob URLs for the graph div.
 * Clear the stored URLs and remove the released nodes from the graph div's tracking list.
 *
 * @param gd - the graph div that owns the images
 * @param removedOnly - true to revoke only URLs for images no longer inside `gd`. Defaults to false (revoke all).
 */
export function releaseImageHrefs(gd: GraphDiv, removedOnly?: boolean) {
    const nodes: ImageNode[] | undefined = gd._imageBlobNodes;
    if (!nodes) return;

    const kept = nodes.filter((node) => {
        if (removedOnly && node._blobUrl && gd.contains(node)) return true;
        releaseBlobUrl(node);
        return false;
    });

    if (kept.length) gd._imageBlobNodes = kept;
    else delete gd._imageBlobNodes;
}

/**
 * Replace image blob URLs in serialized SVG with their stored PNG data URLs.
 * The source SVG must retain the image nodes and their URL metadata from `setImageHref`.
 *
 * @param svgNode - the source SVG element
 * @param svgString - the serialized SVG to update
 * @returns the updated SVG string. Leaves the SVG DOM unchanged.
 */
export function restoreImageDataUrls(svgNode: SVGElement, svgString: string): string {
    const images = svgNode.querySelectorAll('image') as NodeListOf<ImageNode>;
    for (let i = 0; i < images.length; i++) {
        const { _blobUrl, _dataUrl } = images[i];
        if (_blobUrl && _dataUrl) svgString = svgString.replace(_blobUrl, () => _dataUrl);
    }
    return svgString;
}
