/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    moduleType: 'locale',
    name: 'de',
    dictionary: {
      "Autoscale":"Automatische Scalierung",                                              // components/modebar/buttons.js:139
      "Box Select":"Box Auswahl",                                            // components/modebar/buttons.js:103
      "Click to enter Colorscale title":"Klicken um den Farbskalatitel einzugeben",                       // plots/plots.js:437
      "Click to enter Component A title":"Klicken um den Titel der Komponente A einzugeben",                      // plots/ternary/ternary.js:386
      "Click to enter Component B title":"Klicken um den Titel der Komponente B einzugeben",                      // plots/ternary/ternary.js:400
      "Click to enter Component C title":"Klicken um den Titel der Komponente C einzugeben",                      // plots/ternary/ternary.js:411
      "Click to enter Plot title":"Klicken um den Titel des Graphen einzugeben",                             // plot_api/plot_api.js:579
      "Click to enter X axis title":"Klicken um den Titel der X-Achse einzugeben",                           // plots/plots.js:435
      "Click to enter Y axis title":"Klicken um den Titel der Y-Achse einzugeben",                           // plots/plots.js:436
      "Compare data on hover":"Über die Daten fahren um sie zu vergleichen",                                 // components/modebar/buttons.js:167
      "Double-click on legend to isolate one trace":"Daten isolieren durch Doppelklick in der Legende",           // components/legend/handle_click.js:90
      "Double-click to zoom back out":"Herauszomen durch Doppelklick",                         // plots/cartesian/dragbox.js:299
      "Download plot as a png":"Download als png",                                // components/modebar/buttons.js:52
      "Edit in Chart Studio":"Im Chart Studio bearbeiten",                                  // components/modebar/buttons.js:76
      "IE only supports svg.  Changing format to svg.":"IE unterstützt nur SVG-Dateien.  Format wird zu SVG gewechselt.",        // components/modebar/buttons.js:60
      "Lasso Select":"Lassoauswahl",                                          // components/modebar/buttons.js:112
      "Orbital rotation":"Orbitalrotation",                                      // components/modebar/buttons.js:279
      "Pan":"Verschieben",                                                   // components/modebar/buttons.js:94
      "Produced with Plotly":"Erstellt mit Plotly",                                  // components/modebar/modebar.js:256
      "Reset":"Zurücksetzen",                                                 // components/modebar/buttons.js:432
      "Reset axes":"Achsen zurücksetzen",                                            // components/modebar/buttons.js:148
      "Reset camera to default":"Kamera auf Standard zurücksetzen",                               // components/modebar/buttons.js:314
      "Reset camera to last save":"Kamera auf letzte Speicherung zurücksetzen",                             // components/modebar/buttons.js:322
      "Reset view":"Ansicht zurücksetzen",                                           // components/modebar/buttons.js:583
      "Reset views":"Ansichten zurücksetzen",                                           // components/modebar/buttons.js:529
      "Show closest data on hover":"Zeige nahe Daten beim überfahren",                            // components/modebar/buttons.js:157
      "Snapshot succeeded":"Snapshot erfolgreich",                                    // components/modebar/buttons.js:66
      "Sorry, there was a problem downloading your snapshot!":"Es gab ein Problem beim herunterladen des Snapshots", // components/modebar/buttons.js:69
      "Taking snapshot - this may take a few seconds":"Erstelle einen Snapshot - dies kann einige Sekunden dauern",         // components/modebar/buttons.js:57
      "Zoom":"Zoom",                                                  // components/modebar/buttons.js:85
      "Zoom in":"Hineinzoomen",                                               // components/modebar/buttons.js:121
      "Zoom out":"Herauszoomen",                                              // components/modebar/buttons.js:130
      "close:":"schließen",                                                // traces/ohlc/transform.js:139
      "trace":"Datenspur"                                                 // plots/plots.js:439
    },
    format: {
        days: [
            'Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
            'Donnerstag', 'Freitag', 'Samstag'
        ],
        shortDays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        months: [
            'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
            'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
        ],
        shortMonths: [
            'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
            'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
        ],
        date: '%d.%m.%Y'
    }
};
