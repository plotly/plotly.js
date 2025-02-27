var numberFormat = require('../../../src/lib').numberFormat;

describe('number format', function() {
    'use strict';

    var float = 12345.678901;
    var ratio = 0.678901;
    var integer = 222;

    [
        //  multiply by 100, and then decimal notation with a percent sign
        { format: '.0%', number: ratio, exp: '68%'},
        { format: '.1%', number: ratio, exp: '67.9%'},
        { format: '.2%', number: ratio, exp: '67.89%'},
        { format: '.3%', number: ratio, exp: '67.890%'},
        { format: '.4%', number: ratio, exp: '67.8901%'},
        { format: '.5%', number: ratio, exp: '67.89010%'},

        // multiply by 100, round to significant digits, and then decimal notation with a percent sign
        { format: '.0p', number: ratio, exp: '70%'},
        { format: '.1p', number: ratio, exp: '70%'},
        { format: '.2p', number: ratio, exp: '68%'},
        { format: '.3p', number: ratio, exp: '67.9%'},
        { format: '.4p', number: ratio, exp: '67.89%'},
        { format: '.5p', number: ratio, exp: '67.890%'},

        // type none
        { format: '.1', number: float, exp: '1e+4'},
        { format: '.2', number: float, exp: '1.2e+4'},
        { format: '.3', number: float, exp: '1.23e+4'},
        { format: '.4', number: float, exp: '1.235e+4'},
        { format: '.5', number: float, exp: '12346'},
        { format: '.6', number: float, exp: '12345.7'},
        { format: '.7', number: float, exp: '12345.68'},

        // fixed point notation
        { format: '.0f', number: float, exp: '12346'},
        { format: '.1f', number: float, exp: '12345.7'},
        { format: '.2f', number: float, exp: '12345.68'},
        { format: '.3f', number: float, exp: '12345.679'},
        { format: '.4f', number: float, exp: '12345.6789'},
        { format: '.5f', number: float, exp: '12345.67890'},

        // handle for backward compatibility
        { format: '0.0f', number: float, exp: '12346'},
        { format: '0.1f', number: float, exp: '12345.7'},
        { format: '0.2f', number: float, exp: '12345.68'},
        { format: '0.3f', number: float, exp: '12345.679'},
        { format: '0.4f', number: float, exp: '12345.6789'},
        { format: '0.5f', number: float, exp: '12345.67890'},

        // bad formats
        { format: '0f', number: float, exp: '12345.678901'},
        { format: '1f', number: float, exp: '12345.678901'},

        // space-filled and default sign
        { format: '-13', number: float, exp: '-12345.678901'},
        { format: '-14', number: float, exp: ' -12345.678901'},
        { format: '-15', number: float, exp: '  -12345.678901'},

        // space-filled and positive sign
        { format: '+13', number: float, exp: '+12345.678901'},
        { format: '+14', number: float, exp: ' +12345.678901'},
        { format: '+15', number: float, exp: '  +12345.678901'},

        // space-filled and negatives in parentheses
        { format: '(14', number: float, exp: ' (12345.678901)'},
        { format: '(15', number: float, exp: '  (12345.678901)'},
        { format: '(16', number: float, exp: '   (12345.678901)'},

        // space-filled and negatives in parentheses with currency symbols per the locale definition
        { format: '($15', number: float, exp: ' ($12345.678901)'},
        { format: '($16', number: float, exp: '  ($12345.678901)'},
        { format: '($17', number: float, exp: '   ($12345.678901)'},

        // hexadecimal, octal, or binary notation with symbol
        { format: '#0X', number: integer, exp: '0xDE'},
        { format: '#0x', number: integer, exp: '0xde'},
        { format: '#0o', number: integer, exp: '0o336'},
        { format: '#0b', number: integer, exp: '0b11011110'},

        // hexadecimal, octal, or binary notation rounded to integer
        { format: 'X', number: integer, exp: 'DE'},
        { format: 'x', number: integer, exp: 'de'},
        { format: 'o', number: integer, exp: '336'},
        { format: 'b', number: integer, exp: '11011110'},

        // exponent notation
        { format: 'e', number: float, exp: '1.234568e+4'},

        // decimal notation, rounded to integer
        { format: 'd', number: float, exp: '12346'},

        //  decimal notation, rounded to significant digits
        { format: 'r', number: float, exp: '12345.7'},
        { format: '0.3r', number: float, exp: '12300'},
        { format: ',.3r', number: float, exp: '12,300'},
        { format: ',.2r', number: float, exp: '12,000'},
        { format: ',.1r', number: float, exp: '10,000'},

        // decimal notation with an SI prefix, rounded to significant digits
        { format: '0.3s', number: float, exp: '12.3k'},
        { format: 's', number: float, exp: '12.3457k'},
        { format: 's', number: float * 1e+6, exp: '12.3457G'},
        { format: 's', number: float * 1e+3, exp: '12.3457M'},
        { format: 's', number: float * 1e-6, exp: '12.3457m'},
        { format: 's', number: float * 1e-9, exp: '12.3457µ'},
    ].forEach(function(test) {
        var number = test.number;
        var format = test.format;
        it(format, function() {
            var exp = test.exp.replace('(', '+').replace(')', '');
            var negExp = exp < 0 ? exp : '-' + exp;
            var posExp = exp >= 0 ? exp : exp.replace('-', '');

            if(format.indexOf('(') === 0) {
                posExp = exp.replace('+', ' ');
                negExp = exp.replace('+', '(').substring(1) + ')';
            } else if(format.indexOf('+') === 0) {
                negExp = exp.replace('+', '-');
            } else if(format.indexOf('-') === 0) {
                posExp = exp.replace('-', ' ');
            }

            expect(numberFormat(format)(number)).toEqual(posExp, 'positive');
            expect(numberFormat(format)(-number)).toEqual(negExp, 'negative');
            expect(numberFormat(format)(String(number))).toEqual(posExp, 'string');
            expect(numberFormat(format)(String(-number))).toEqual(negExp, 'string negative');
        });
    });

    it('padding and alignment without formatting numbers', function() {
        expect(numberFormat('<10c')(123.456)).toEqual('123.456   ', 'left');
        expect(numberFormat('>10c')(123.456)).toEqual('   123.456', 'right');
        expect(numberFormat('^10c')(123.456)).toEqual(' 123.456  ', 'center');
    });
});
