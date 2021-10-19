'use strict';

module.exports = {
    attr: 'subplot',
    name: 'smith',

    axisNames: [
        'realaxis',
        'imaginaryaxis' // imaginary axis should be second here so that the `tickvals` defaults could be inherited from realaxis
    ],
    axisName2dataArray: {imaginaryaxis: 'imag', realaxis: 'real'},
};
