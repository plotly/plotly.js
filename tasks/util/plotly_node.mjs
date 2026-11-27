import fs from 'fs';
import { JSDOM } from 'jsdom';

// When plotly loads, some of its WebGL text dependencies call `canvas.getContext('2d')`.
// jsdom has no canvas backend without the optional `@napi-rs/canvas` package, so `getContext` returns null.
// For each call, jsdom then prints "Not implemented: HTMLCanvasElement's getContext() method".
// These scripts never draw, so the message is harmless.
var window = new JSDOM('', {
    runScripts: 'dangerously'
}).window;

// Mock things that jsdom doesn't support out-of-the-box
window.URL.createObjectURL = function() {};

export default function plotlyNode(plotlyPath) {
    // Execute source code by inserting a <script> tag containing it
    var scriptEl = window.document.createElement('script');
    scriptEl.textContent = fs.readFileSync(plotlyPath, { encoding: 'utf-8' });
    window.document.body.appendChild(scriptEl);

    return window.Plotly;
};
