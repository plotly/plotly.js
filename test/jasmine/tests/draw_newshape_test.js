var parseSvgPath = require('parse-svg-path');

var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var selectButton = require('../assets/modebar_button');
var mouseEvent = require('../assets/mouse_event');
var touchEvent = require('../assets/touch_event');
var click = require('../assets/click');

function drag(path, options) {
    var len = path.length;

    if(!options) options = { type: 'mouse' };

    if(options.type === 'touch') {
        touchEvent('touchstart', path[0][0], path[0][1], options);

        path.slice(1, len).forEach(function(pt) {
            touchEvent('touchmove', pt[0], pt[1], options);
        });

        touchEvent('touchend', path[len - 1][0], path[len - 1][1], options);
        return;
    }

    mouseEvent('mousemove', path[0][0], path[0][1], options);
    mouseEvent('mousedown', path[0][0], path[0][1], options);

    path.slice(1, len).forEach(function(pt) {
        mouseEvent('mousemove', pt[0], pt[1], options);
    });

    mouseEvent('mouseup', path[len - 1][0], path[len - 1][1], options);
}

function print(obj) {
    // console.log(JSON.stringify(obj, null, 4).replace(/"/g, '\''));
    return obj;
}

function assertPos(actual, expected, tolerance) {
    if(tolerance === undefined) tolerance = 2;

    expect(typeof actual).toEqual(typeof expected);

    if(typeof actual === 'string') {
        if(expected.indexOf('_') !== -1) {
            actual = fixDates(actual);
            expected = fixDates(expected);
        }

        var cmd1 = parseSvgPath(actual);
        var cmd2 = parseSvgPath(expected);

        expect(cmd1.length).toEqual(cmd2.length);
        for(var i = 0; i < cmd1.length; i++) {
            var A = cmd1[i];
            var B = cmd2[i];
            expect(A.length).toEqual(B.length); // svg letters should be identical
            expect(A[0]).toEqual(B[0]);
            for(var k = 1; k < A.length; k++) {
                expect(A[k]).toBeCloseTo(B[k], tolerance);
            }
        }
    } else {
        var o1 = Object.keys(actual);
        var o2 = Object.keys(expected);
        expect(o1.length === o2.length);
        for(var j = 0; j < o1.length; j++) {
            var key = o1[j];

            var posA = actual[key];
            var posB = expected[key];

            if(typeof posA === 'string') {
                posA = fixDates(posA);
                posB = fixDates(posB);
            }

            expect(posA).toBeCloseTo(posB, tolerance);
        }
    }
}

function fixDates(str) {
    // hack to conver date axes to some numbers to parse with parse-svg-path
    return str.replace(/[ _\-:]/g, '');
}

describe('Draw new shapes to layout', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    var allMocks = [
        {
            name: 'heatmap',
            json: require('../../image/mocks/13'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M3.603343465045593,16.95098039215686L5.123100303951368,18.91176470588235L6.034954407294833,18.91176470588235L3.603343465045593,16.95098039215686'
                    );
                },
                function(pos) {
                    return assertPos(pos,
                        'M1.3237082066869301,17.931372549019606L4.363221884498481,17.931372549019606L4.363221884498481,14.009803921568627L1.3237082066869301,14.009803921568627Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 3.603343465045593,
                        y0: 14.990196078431373,
                        x1: 6.642857142857143,
                        y1: 11.068627450980392
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 2.0835866261398177,
                        y0: 16.95098039215686,
                        x1: 0.5638297872340426,
                        y1: 18.91176470588235
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: -0.06567410694999332,
                        y0: 12.21722830907236,
                        x1: 4.232847359229629,
                        y1: 17.763163847790384
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 3.6033434650455933,
                        y0: 13.029411764705882,
                        x1: 0.5638297872340421,
                        y1: 16.950980392156865
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 0.5638297872340419,
                        y0: 16.950980392156865,
                        x1: 3.6033434650455938,
                        y1: 13.029411764705882
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 3.1582169926847232,
                        y0: 5.284808885674838,
                        x1: 1.0089562595949124,
                        y1: 24.695583271187907
                    });
                }
            ]
        },
        {
            name: 'log axis',
            json: require('../../image/mocks/12'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M7315.010246711367,81.03588258089053L11872.300299303395,86.01381805862732L14606.674330858614,86.01381805862732L7315.010246711367,81.03588258089053'
                    );
                },
                function(pos) {
                    return assertPos(pos,
                        'M479.0751678233218,83.52485031975893L9593.655273007382,83.52485031975893L9593.655273007382,73.56897936428534L479.0751678233218,73.56897936428534Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 7315.010246711367,
                        y0: 76.05794710315374,
                        x1: 16429.590351895426,
                        y1: 66.10207614768017
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 2757.7201941193366,
                        y0: 81.03588258089053,
                        x1: -1799.5698584726929,
                        y1: 86.01381805862732
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: -3687.2612059243093,
                        y0: 69.01808323792017,
                        x1: 9202.701594162983,
                        y1: 83.09781096838731
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 7315.0102467113675,
                        y0: 71.08001162541694,
                        x1: -1799.5698584726952,
                        y1: 81.03588258089053
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: -1799.5698584726942,
                        y0: 81.03588258089053,
                        x1: 7315.010246711368,
                        y1: 71.08001162541694
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 5980.210894141159,
                        y0: 51.41842357483628,
                        x1: -464.77050590248655,
                        y1: 100.69747063147119
                    });
                }
            ]
        },
        {
            name: 'date axis',
            json: require('../../image/mocks/29'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M2014-04-13_03:31:06.4962,105.53339869281045L2014-04-13_08:01:18.9023,111.99745098039214L2014-04-13_10:43:26.3459,111.99745098039214L2014-04-13_03:31:06.4962,105.53339869281045'
                    );
                },
                function(pos) {
                    return assertPos(pos,
                        'M2014-04-12_20:45:47.8872,108.7654248366013L2014-04-13_05:46:12.6992,108.7654248366013L2014-04-13_05:46:12.6992,95.8373202614379L2014-04-12_20:45:47.8872,95.8373202614379Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2014-04-13 03:31:06.4962',
                        y0: 99.06934640522876,
                        x1: '2014-04-13 12:31:31.3083',
                        y1: 86.14124183006535
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2014-04-12 23:00:54.0902',
                        y0: 105.53339869281045,
                        x1: '2014-04-12 18:30:41.6842',
                        y1: 111.99745098039214
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2014-04-12 16:38:46.5056',
                        y0: 89.9277959922419,
                        x1: '2014-04-13 05:23:01.6748',
                        y1: 108.21089681821562
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2014-04-13 03:31:06.4962',
                        y0: 92.60529411764705,
                        x1: '2014-04-12 18:30:41.6842',
                        y1: 105.53339869281047
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2014-04-12 18:30:41.6842',
                        y0: 105.53339869281047,
                        x1: '2014-04-13 03:31:06.4962',
                        y1: 92.60529411764705
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2014-04-13 02:11:59.5038',
                        y0: 67.07391995977471,
                        x1: '2014-04-12 19:49:48.6767',
                        y1: 131.0647728506828
                    });
                }
            ]
        },
        {
            name: 'date and log axes together',
            json: require('../../image/mocks/cliponaxis_false-dates-log'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M5290.268558951965,2017-11-19_16:54:39.7153L5608.318049490538,2017-11-20_09:59:34.3772L5799.147743813683,2017-11-20_09:59:34.3772L5290.268558951965,2017-11-19_16:54:39.7153'
                    );
                },
                function(pos) {
                    return assertPos(pos,
                        'M4813.194323144105,2017-11-20_01:27:07.0463L5449.293304221252,2017-11-20_01:27:07.0463L5449.293304221252,2017-11-18_15:17:17.7224L4813.194323144105,2017-11-18_15:17:17.7224Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 5290.268558951965,
                        y0: '2017-11-18 23:49:45.0534',
                        x1: 5926.367540029112,
                        y1: '2017-11-17 13:39:55.7295'
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 4972.219068413392,
                        y0: '2017-11-19 16:54:39.7153',
                        x1: 4654.169577874818,
                        y1: '2017-11-20 09:59:34.3772'
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 4522.429165387887,
                        y0: '2017-11-17 23:40:19.3025',
                        x1: 5422.008971438897,
                        y1: '2017-11-19 23:59:10.8043'
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 5290.268558951966,
                        y0: '2017-11-18 06:44:50.3915',
                        x1: 4654.169577874818,
                        y1: '2017-11-19 16:54:39.7153'
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 4654.169577874818,
                        y0: '2017-11-19 16:54:39.7153',
                        x1: 5290.268558951966,
                        y1: '2017-11-18 06:44:50.3915'
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 5197.114019926144,
                        y0: '2017-11-15 11:16:38.7758',
                        x1: 4747.324116900641,
                        y1: '2017-11-22 12:22:51.331'
                    });
                }
            ]
        },
        {
            name: 'axes with rangebreaks',
            json: require('../../image/mocks/axes_breaks-gridlines'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M2015-06-01_11:36:29.5216,132.73855280509412L2015-07-26_21:54:15.5809,137.67764538538205L2015-08-29_04:04:55.2164,137.67764538538205L2015-06-01_11:36:29.5216,132.73855280509412'
                    );
                },
                function(pos) {
                    return assertPos(pos,
                        'M2015-03-10_08:09:50.4328,135.20809909523808L2015-06-29_04:45:22.5512,135.20809909523808L2015-06-29_04:45:22.5512,125.32991393466223L2015-03-10_08:09:50.4328,125.32991393466223Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2015-06-01 11:36:29.5216',
                        y0: 127.7994602248062,
                        x1: '2015-09-20 08:12:01.6401',
                        y1: 117.92127506423034
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2015-04-07 01:18:43.4624',
                        y0: 132.73855280509412,
                        x1: '2015-02-10 15:00:57.4032',
                        y1: 137.67764538538205
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2015-01-18 16:00:26.2414',
                        y0: 120.81452851194669,
                        x1: '2015-06-24 10:37:00.6834',
                        y1: 134.7843919376657
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2015-06-01 11:36:29.5216',
                        y0: 122.86036764451828,
                        x1: '2015-02-10 15:00:57.4032',
                        y1: 132.73855280509412
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2015-02-10 15:00:57.4032',
                        y0: 132.73855280509412,
                        x1: '2015-06-01 11:36:29.5216',
                        y1: 122.86036764451825
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2015-05-16 06:05:50.9795',
                        y0: 103.35219922979789,
                        x1: '2015-02-26 20:31:35.9453',
                        y1: 152.2467212198145
                    });
                }
            ]
        },
        {
            name: 'subplot',
            json: require('../../image/mocks/18'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M4.933775889537972,7.614950166112958L5.2524163568773234,8.013621262458473L5.443600637280936,8.013621262458473L4.933775889537972,7.614950166112958'
                    );
                },
                function(pos) {
                    return assertPos(pos,
                        'M4.455815188528943,7.814285714285716L5.093096123207648,7.814285714285716L5.093096123207648,7.016943521594685L4.455815188528943,7.016943521594685Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 4.933775889537972,
                        y0: 7.216279069767443,
                        x1: 5.571056824216676,
                        y1: 6.418936877076413
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 4.61513542219862,
                        y0: 7.614950166112958,
                        x1: 4.296494954859267,
                        y1: 8.013621262458473
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 4.164509751766406,
                        y0: 6.652472998389465,
                        x1: 5.065761092630833,
                        y1: 7.78008514114542
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 4.933775889537972,
                        y0: 6.817607973421927,
                        x1: 4.296494954859267,
                        y1: 7.614950166112958
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 4.296494954859267,
                        y0: 7.614950166112958,
                        x1: 4.933775889537972,
                        y1: 6.817607973421927
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 4.840448257414727,
                        y0: 5.24295781994452,
                        x1: 4.389822586982512,
                        y1: 9.189600319590365
                    });
                }
            ]
        },
        {
            name: 'scattergl',
            json: require('../../image/mocks/gl2d_scatter2d-multiple-colors'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M-678.5714285714287,875.5760368663595L-500.00000000000006,1105.9907834101382L-392.8571428571429,1105.9907834101382L-678.5714285714287,875.5760368663595'
                    );
                },
                function(pos) {
                    return assertPos(pos,
                        'M-946.4285714285716,990.7834101382489L-589.2857142857143,990.7834101382489L-589.2857142857143,529.9539170506913L-946.4285714285716,529.9539170506913Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: -678.5714285714287,
                        y0: 645.1612903225806,
                        x1: -321.42857142857144,
                        y1: 184.33179723502303
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: -857.1428571428572,
                        y0: 875.5760368663595,
                        x1: -1035.7142857142858,
                        y1: 1105.9907834101382
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: -1109.68099328091,
                        y0: 319.3056307896095,
                        x1: -604.6047210048046,
                        y1: 971.0169498555517
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: -678.5714285714286,
                        y0: 414.74654377880177,
                        x1: -1035.7142857142858,
                        y1: 875.5760368663595
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: -1035.7142857142858,
                        y0: 875.5760368663595,
                        x1: -678.5714285714286,
                        y1: 414.74654377880177
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: -730.8737890738308,
                        y0: -495.3335180428189,
                        x1: -983.4119252118836,
                        y1: 1785.65609868798
                    });
                }
            ]
        },
        {
            name: 'cheater',
            json: require('../../image/mocks/cheater'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M0.08104371867979952,10.021132897603486L0.19336443753240018,10.84248366013072L0.26075686884396054,10.84248366013072L0.08104371867979952,10.021132897603486'
                    );
                },
                function(pos) {
                    return assertPos(pos,
                        'M-0.08743735959910146,10.431808278867104L0.13720407810609983,10.431808278867104L0.13720407810609983,8.789106753812636L-0.08743735959910146,8.789106753812636Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 0.08104371867979952,
                        y0: 9.199782135076253,
                        x1: 0.3056851563850008,
                        y1: 7.557080610021787
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: -0.03127700017280113,
                        y0: 10.021132897603486,
                        x1: -0.14359771902540178,
                        y1: 10.84248366013072
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: -0.19012248410964433,
                        y0: 8.038216747244757,
                        x1: 0.12756848376404212,
                        y1: 10.36134752290775
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 0.08104371867979954,
                        y0: 8.378431372549018,
                        x1: -0.14359771902540183,
                        y1: 10.021132897603488
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: -0.1435977190254018,
                        y0: 10.021132897603488,
                        x1: 0.08104371867979956,
                        y1: 8.378431372549018
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 0.0481457417956205,
                        y0: 5.134303277666014,
                        x1: -0.11069974214122275,
                        y1: 13.265260992486493
                    });
                }
            ]
        },
        {
            name: 'box plot',
            json: require('../../image/mocks/1'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M492.4445277361319,7.3824607089211325L509.46101949025484,8.652380340970662L519.6709145427286,8.652380340970662L492.4445277361319,7.3824607089211325'
                    );
                },
                function(pos) {
                    return assertPos(pos,
                        'M466.9197901049475,8.017420524945898L500.95277361319336,8.017420524945898L500.95277361319336,5.477581260846837L466.9197901049475,5.477581260846837Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 492.4445277361319,
                        y0: 6.112541076871603,
                        x1: 526.4775112443778,
                        y1: 3.572701812772542
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 475.42803598200896,
                        y0: 7.3824607089211325,
                        x1: 458.411544227886,
                        y1: 8.652380340970662
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 451.3630825593184,
                        y0: 4.316603510103307,
                        x1: 499.49298940469953,
                        y1: 7.908478643639898
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 492.4445277361319,
                        y0: 4.842621444822074,
                        x1: 458.41154422788605,
                        y1: 7.382460708921132
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 458.41154422788605,
                        y0: 7.382460708921133,
                        x1: 492.4445277361319,
                        y1: 4.842621444822072
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 487.4605126933543,
                        y0: -0.1732404068174329,
                        x1: 463.3955592706636,
                        y1: 12.398322560560638
                    });
                }
            ]
        },
        {
            name: 'map',
            json: require('../../image/mocks/map_angles'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M0.2076923076923077,0.8725490196078431L0.2846153846153846,0.9705882352941176L0.33076923076923076,0.9705882352941176L0.2076923076923077,0.8725490196078431'
                    );
                },
                function(pos) {
                    return assertPos(pos,
                        'M0.09230769230769231,0.9215686274509804L0.24615384615384617,0.9215686274509804L0.24615384615384617,0.7254901960784313L0.09230769230769231,0.7254901960784313Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 0.2076923076923077,
                        y0: 0.7745098039215687,
                        x1: 0.36153846153846153,
                        y1: 0.5784313725490196
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 0.13076923076923078,
                        y0: 0.8725490196078431,
                        x1: 0.05384615384615385,
                        y1: 0.9705882352941176
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 0.021983572125146553,
                        y0: 0.6358614154536182,
                        x1: 0.23955488941331504,
                        y1: 0.9131581923895189
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 0.2076923076923077,
                        y0: 0.6764705882352943,
                        x1: 0.053846153846153794,
                        y1: 0.872549019607843
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 0.053846153846153835,
                        y0: 0.872549019607843,
                        x1: 0.2076923076923078,
                        y1: 0.6764705882352943
                    });
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 0.1851620600912729,
                        y0: 0.3862943162113073,
                        x1: 0.07637640144718866,
                        y1: 1.1627252916318298
                    });
                }
            ]
        }
    ];

    allMocks.forEach(function(mockItem) {
        ['mouse', 'touch'].forEach(function(device) {
            var _drag = function(path) {
                return drag(path, {type: device});
            };

            it('@flaky draw various shape types over mock ' + mockItem.name + ' using ' + device, function(done) {
                var fig = Lib.extendDeep({}, mockItem.json);
                fig.layout = {
                    width: 800,
                    height: 600,
                    margin: {
                        t: 60,
                        l: 40,
                        r: 20,
                        b: 30
                    }
                };

                var n;
                Plotly.newPlot(gd, {
                    data: fig.data,
                    layout: fig.layout,
                    config: {
                        mapboxAccessToken: require('../../../build/credentials.json').MAPBOX_ACCESS_TOKEN
                    }
                })
                    .then(function() {
                        n = gd._fullLayout.shapes.length; // initial number of shapes on _fullLayout
                    })

                    .then(function() {
                        var newFig = Lib.extendFlat({}, fig);

                        newFig.layout.dragmode = 'drawopenpath';

                        return Plotly.react(gd, newFig);
                    })
                    .then(function() {
                        return _drag([[175, 125], [225, 75], [255, 75], [175, 125]]);
                    })
                    .then(function() {
                        var shapes = gd._fullLayout.shapes;
                        expect(shapes.length).toEqual(++n);
                        var obj = shapes[n - 1]._input;
                        expect(obj.type).toEqual('path');
                        print(obj);
                        mockItem.testPos[n - 1](obj.path);
                    })

                    .then(function() {
                        var newFig = Lib.extendFlat({}, fig);

                        newFig.layout.dragmode = 'drawclosedpath';

                        return Plotly.react(gd, newFig);
                    })
                    .then(function() {
                        return _drag([[100, 100], [200, 100], [200, 200], [100, 200]]);
                    })
                    .then(function() {
                        var shapes = gd._fullLayout.shapes;
                        expect(shapes.length).toEqual(++n);
                        var obj = shapes[n - 1]._input;
                        expect(obj.type).toEqual('path');
                        print(obj);
                        mockItem.testPos[n - 1](obj.path);
                    })

                    .then(function() {
                        var newFig = Lib.extendFlat({}, fig);

                        newFig.layout.dragmode = 'drawrect';

                        return Plotly.react(gd, newFig);
                    })
                    .then(function() {
                        return _drag([[175, 175], [275, 275]]);
                    })
                    .then(function() {
                        var shapes = gd._fullLayout.shapes;
                        expect(shapes.length).toEqual(++n);
                        var obj = shapes[n - 1]._input;
                        print(obj);
                        mockItem.testPos[n - 1]({
                            x0: obj.x0,
                            y0: obj.y0,
                            x1: obj.x1,
                            y1: obj.y1
                        });
                    })

                    .then(function() {
                        var newFig = Lib.extendFlat({}, fig);

                        newFig.layout.dragmode = 'drawline';
                        newFig.layout.newshape = { label: { text: 'Shape label' } };

                        return Plotly.react(gd, newFig);
                    })
                    .then(function() {
                        return _drag([[125, 125], [75, 75]]);
                    })
                    .then(function() {
                        var shapes = gd._fullLayout.shapes;
                        expect(shapes.length).toEqual(++n);
                        var obj = shapes[n - 1]._input;
                        expect(obj.type).toEqual('line');
                        expect(
                            d3Select('.shape-group[data-index="' + (n - 1) + '"]')
                                .select('text')
                                .text()
                        ).toEqual('Shape label');
                        print(obj);
                        mockItem.testPos[n - 1]({
                            x0: obj.x0,
                            y0: obj.y0,
                            x1: obj.x1,
                            y1: obj.y1
                        });
                    })

                    .then(function() {
                        var newFig = Lib.extendFlat({}, fig);

                        newFig.layout.dragmode = 'drawcircle';

                        return Plotly.react(gd, newFig);
                    })
                    .then(function() {
                        return _drag([[125, 175], [75, 225]]);
                    })
                    .then(function() {
                        var shapes = gd._fullLayout.shapes;
                        expect(shapes.length).toEqual(++n);
                        var obj = shapes[n - 1]._input;
                        expect(obj.type).toEqual('circle');
                        print(obj);
                        mockItem.testPos[n - 1]({
                            x0: obj.x0,
                            y0: obj.y0,
                            x1: obj.x1,
                            y1: obj.y1
                        });
                    })

                    .then(function() {
                        var newFig = Lib.extendFlat({}, fig);

                        newFig.layout.dragmode = 'drawcircle';

                        return Plotly.react(gd, newFig);
                    })
                    .then(function() {
                        return _drag([[125, 175], [126, 225]]); // dx close to 0 should draw a circle not an ellipse
                    })
                    .then(function() {
                        var shapes = gd._fullLayout.shapes;
                        expect(shapes.length).toEqual(++n);
                        var obj = shapes[n - 1]._input;
                        expect(obj.type).toEqual('circle');
                        print(obj);
                        mockItem.testPos[n - 1]({
                            x0: obj.x0,
                            y0: obj.y0,
                            x1: obj.x1,
                            y1: obj.y1
                        });
                    })
                    .then(function() {
                        return _drag([[125, 175], [75, 176]]); // dy close to 0 should draw a circle not an ellipse
                    })
                    .then(function() {
                        var shapes = gd._fullLayout.shapes;
                        expect(shapes.length).toEqual(++n);
                        var obj = shapes[n - 1]._input;
                        expect(obj.type).toEqual('circle');
                        print(obj);
                        mockItem.testPos[n - 1]({
                            x0: obj.x0,
                            y0: obj.y0,
                            x1: obj.x1,
                            y1: obj.y1
                        });
                    })
                    .then(function() {
                        return _drag([[125, 175], [150, 350]]); // ellipse
                    })
                    .then(function() {
                        var shapes = gd._fullLayout.shapes;
                        expect(shapes.length).toEqual(++n);
                        var obj = shapes[n - 1]._input;
                        expect(obj.type).toEqual('circle');
                        print(obj);
                        mockItem.testPos[n - 1]({
                            x0: obj.x0,
                            y0: obj.y0,
                            x1: obj.x1,
                            y1: obj.y1
                        });
                    })

                    .then(done, done.fail);
            });
        });
    });
});

describe('Activate and edit editable shapes', function() {
    var fig = {
        data: [
            {
                x: [
                    0,
                    50
                ],
                y: [
                    0,
                    50
                ]
            }
        ],
        layout: {
            width: 800,
            height: 600,
            margin: {
                t: 100,
                b: 50,
                l: 100,
                r: 50
            },
            yaxis: {
                autorange: 'reversed'
            },
            template: {
                layout: {
                    shapes: [
                        {
                            name: 'myPath',
                            editable: true,
                            layer: 'below',
                            line: {
                                width: 0
                            },
                            fillcolor: 'gray',
                            opacity: 0.5,
                            xref: 'paper',
                            yref: 'paper',
                            path: 'M0.5,0.3C0.5,0.9 0.9,0.9 0.9,0.3C0.9,0.1 0.5,0.1 0.5,0.3ZM0.6,0.4C0.6,0.5 0.66,0.5 0.66,0.4ZM0.74,0.4C0.74,0.5 0.8,0.5 0.8,0.4ZM0.6,0.3C0.63,0.2 0.77,0.2 0.8,0.3Z'
                        }
                    ]
                }
            },
            shapes: [
                {
                    editable: true,
                    layer: 'below',
                    type: 'rect',
                    line: {
                        width: 5
                    },
                    fillcolor: 'red',
                    opacity: 0.5,
                    xref: 'xaxis',
                    yref: 'yaxis',
                    x0: 25,
                    y0: 25,
                    x1: 75,
                    y1: 75
                },
                {
                    editable: true,
                    layer: 'top',
                    type: 'circle',
                    line: {
                        width: 5
                    },
                    fillcolor: 'green',
                    opacity: 0.5,
                    xref: 'xaxis',
                    yref: 'yaxis',
                    x0: 125,
                    y0: 25,
                    x1: 175,
                    y1: 75
                },
                {
                    editable: true,
                    line: {
                        width: 5
                    },
                    fillcolor: 'blue',
                    path: 'M250,25L225,75L275,75Z'
                },
                {
                    editable: true,
                    line: {
                        width: 15
                    },
                    path: 'M250,225L225,275L275,275'
                },
                {
                    editable: true,
                    layer: 'below',
                    path: 'M320,100C390,180 290,180 360,100Z',
                    fillcolor: 'rgba(0,127,127,0.5)',
                    line: {
                        width: 5
                    }
                },
                {
                    editable: true,
                    line: {
                        width: 5,
                        color: 'orange'
                    },
                    fillcolor: 'rgba(127,255,127,0.5)',
                    path: 'M0,100V200H50L0,300Q100,300 100,200T150,200C100,300 200,300 200,200S150,200 150,100Z'
                },
                {
                    editable: true,
                    line: {
                        width: 2
                    },
                    fillcolor: 'yellow',
                    path: 'M300,70C300,10 380,10 380,70C380,90 300,90 300,70ZM320,60C320,50 332,50 332,60ZM348,60C348,50 360,50 360,60ZM320,70C326,80 354,80 360,70Z'
                }
            ]
        },
        config: {
            editable: false,
            modeBarButtonsToAdd: [
                'drawline',
                'drawopenpath',
                'drawclosedpath',
                'drawcircle',
                'drawrect',
                'eraseshape'
            ]
        }
    };

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    ['mouse'].forEach(function(device) {
        it('reactangle using ' + device, function(done) {
            var i = 0; // shape index

            Plotly.newPlot(gd, {
                data: fig.data,
                layout: fig.layout,
                config: fig.config
            })

            // shape between 175, 160 and 255, 230
            .then(function() { click(200, 160); }) // activate shape
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'activate shape by clicking border');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: 25,
                    y0: 25,
                    x1: 75,
                    y1: 75
                });
            })
            .then(function() { drag([[255, 230], [300, 200]]); }) // move vertex
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: 24.998449612403103,
                    y0: 24.997032640949552,
                    x1: 102.90852713178295,
                    y1: 53.63323442136499
                });
            })
            .then(function() { drag([[300, 200], [255, 230]]); }) // move vertex back
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: 25,
                    y0: 25,
                    x1: 75,
                    y1: 75
                });
            })
            .then(function() { drag([[215, 195], [300, 200]]); }) // move shape
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: 77.71162790697674,
                    y0: 24.997032640949552,
                    x1: 127.71472868217053,
                    y1: 74.99821958456974
                });
            })
            .then(function() { drag([[300, 200], [215, 195]]); }) // move shape back
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: 25,
                    y0: 25,
                    x1: 75,
                    y1: 75
                });
            })
            .then(function() { click(100, 100); })
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(undefined, 'deactivate shape by clicking outside');
            })
            .then(function() { click(255, 230); })
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'activate shape by clicking on corner');
            })
            .then(function() { click(215, 195); })
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(undefined, 'deactivate shape by clicking inside');
            })

            .then(done, done.fail);
        });

        it('circle using ' + device, function(done) {
            var i = 1; // shape index

            Plotly.newPlot(gd, {
                data: fig.data,
                layout: fig.layout,
                config: fig.config
            })

            // next shape
            .then(function() { click(355, 225); }) // activate shape
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'activate shape by clicking border');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('circle');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: 125,
                    x1: 175,
                    y0: 25,
                    y1: 75
                });
            })
            .then(function() { drag([[338, 196], [300, 175]]); }) // move vertex
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('circle');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: 186.78449612403102,
                    y0: 74.99821958456971,
                    x1: 113.21550387596898,
                    y1: 10.04154302670623
                });
            })

            .then(done, done.fail);
        });

        it('closed-path using ' + device, function(done) {
            var i = 2; // shape index

            Plotly.newPlot(gd, {
                data: fig.data,
                layout: fig.layout,
                config: fig.config
            })

            // next shape
            .then(function() { click(500, 225); }) // activate shape
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'activate shape by clicking border');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                print(obj);
                assertPos(obj.path, 'M250,25L225,75L275,75Z');
            })
            .then(function() { drag([[540, 160], [500, 120]]); }) // move vertex
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                print(obj);
                assertPos(obj.path, 'M225.1968992248062,-3.4896142433234463L225,75L275,75Z');
            })
            .then(function() { drag([[500, 120], [540, 160]]); }) // move vertex back
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                print(obj);
                assertPos(obj.path, 'M250,25L225,75L275,75Z');
            })

            .then(done, done.fail);
        });

        it('bezier curves using ' + device, function(done) {
            var i = 5; // shape index

            Plotly.newPlot(gd, {
                data: fig.data,
                layout: fig.layout,
                config: fig.config
            })

            // next shape
            .then(function() { click(300, 266); }) // activate shape
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'activate shape by clicking border');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                print(obj);
                assertPos(obj.path, 'M0,100V200H50L0,300Q100,300 100,200T150,200C100,300 200,300 200,200S150,200 150,100Z');
            })
            .then(function() { drag([[297, 407], [200, 300]]); }) // move vertex
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                print(obj);
                assertPos(obj.path, 'M0,100.00237388724034L0,199.99762611275966L50.00310077519379,199.99762611275966L0,300Q100,300,39.84496124031008,123.79584569732937T150.0031007751938,199.99762611275966C100,300,200,300,200,199.99762611275966S150.0031007751938,199.99762611275966,150.0031007751938,100.00237388724034Z');
            })
            .then(function() { drag([[200, 300], [297, 407]]); }) // move vertex back
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                print(obj);
                assertPos(obj.path, 'M0,100.00237388724034L0,199.99762611275966L50.00310077519379,199.99762611275966L0,300Q100,300,100,199.9976261127597T150.0031007751938,199.99762611275966C100,300,200,300,200,199.99762611275966S150.0031007751938,199.99762611275966,150.0031007751938,100.00237388724034Z');
            })

            .then(done, done.fail);
        });

        it('multi-cell path using ' + device, function(done) {
            var i = 6; // shape index

            Plotly.newPlot(gd, {
                data: fig.data,
                layout: fig.layout,
                config: fig.config
            })

            .then(function() { click(627, 193); }) // activate shape
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'activate shape by clicking border');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                print(obj);
                assertPos(obj.path, 'M300,70C300,10 380,10 380,70C380,90 300,90 300,70ZM320,60C320,50 332,50 332,60ZM348,60C348,50 360,50 360,60ZM320,70C326,80 354,80 360,70Z');
            })
            .then(function() { drag([[717, 225], [700, 250]]); }) // move vertex
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                print(obj);
                assertPos(obj.path, 'M300,69.99881305637984C300,9.998813056379817,380,9.998813056379817,380,69.99881305637984C380,90.00356083086054,300,90.00356083086054,300,69.99881305637984ZM320,60.00000000000001C320,50.00118694362017,332,50.00118694362017,332,60.00000000000001ZM348,60.00000000000001C348,50.00118694362017,360,50.00118694362017,360,60.00000000000001ZM320,69.99881305637984C326.0031007751938,79.99762611275966,354.0031007751938,79.99762611275966,349.4573643410853,87.80296735905047Z');
            })
            .then(function() { drag([[700, 250], [717, 225]]); }) // move vertex back
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                print(obj);
                assertPos(obj.path, 'M300,70C300,10 380,10 380,70C380,90 300,90 300,70ZM320,60C320,50 332,50 332,60ZM348,60C348,50 360,50 360,60ZM320,70C326,80 354,80 360,70Z');
            })

            // erase shape
            .then(function() {
                expect(gd._fullLayout.shapes.length).toEqual(8);
                selectButton(gd._fullLayout._modeBar, 'eraseshape').click();
            })
            .then(function() {
                expect(gd._fullLayout.shapes.length).toEqual(7);
                expect(gd._fullLayout._activeShapeIndex).toEqual(undefined, 'clear active shape index');
            })

            .then(done, done.fail);
        });
    });
});


describe('Activate and edit editable shapes', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should not set pointer-events for non-editable shapes i.e. to allow pan/zoom/hover work inside shapes', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                mode: 'markers',
                x: [1, 3, 3],
                y: [2, 1, 3]
            }],
            layout: {
                shapes: [
                    {
                        editable: false,
                        x0: 1.5,
                        x1: 2,
                        y0: 1.5,
                        y1: 2,
                        opacity: 0.5,
                        fillcolor: 'blue',
                        line: {
                            width: 0,
                            dash: 'dash',
                            color: 'black'
                        }
                    }, {
                        editable: false,
                        x0: 2,
                        x1: 2.5,
                        y0: 1.5,
                        y1: 2,
                        opacity: 0.7,
                        fillcolor: 'rgba(255,0,0,0.7)', // N.B. 0.7 * 0.7 = 0.49 <= 0.5 is quite transparent
                        line: {
                            width: 0,
                            dash: 'dash',
                            color: 'black'
                        }
                    }, {
                        editable: false,
                        x0: 1.5,
                        x1: 2,
                        y0: 2,
                        y1: 2.5,
                        fillcolor: 'red',
                        line: {
                            width: 3,
                            dash: 'dash',
                            color: 'green'
                        }
                    }, {
                        editable: false,
                        path: 'M2,2H2.5,V2.5', // open path
                        fillcolor: 'rgba(0,0,0,0)',
                        line: {
                            width: 3,
                            dash: 'dash',
                            color: 'green'
                        }
                    }
                ]
            }
        })

        .then(function() {
            var el = d3SelectAll('.shapelayer path')[0][0];
            expect(el.style['pointer-events']).toBe('');
            expect(el.style.stroke).toBe('rgb(0, 0, 0)'); // no color
            expect(el.style['stroke-opacity']).toBe('0'); // invisible
            expect(el.style['stroke-width']).toBe('0px'); // no pixel

            el = d3SelectAll('.shapelayer path')[0][1];
            expect(el.style['pointer-events']).toBe('');
            expect(el.style.stroke).toBe('rgb(0, 0, 0)'); // no color
            expect(el.style['stroke-opacity']).toBe('0'); // invisible
            expect(el.style['stroke-width']).toBe('0px'); // no pixel

            el = d3SelectAll('.shapelayer path')[0][2];
            expect(el.style['pointer-events']).toBe('');
            expect(el.style.stroke).toBe('rgb(0, 128, 0)'); // custom color
            expect(el.style['stroke-opacity']).toBe('1'); // visible
            expect(el.style['stroke-width']).toBe('3px'); // custom pixel

            el = d3SelectAll('.shapelayer path')[0][3];
            expect(el.style['pointer-events']).toBe('');
            expect(el.style.stroke).toBe('rgb(0, 128, 0)'); // custom color
            expect(el.style['stroke-opacity']).toBe('1'); // visible
            expect(el.style['stroke-width']).toBe('3px'); // custom pixel
        })

        .then(done, done.fail);
    });

    it('should provide invisible border & set pointer-events (depending on fill transparency) for editable shapes i.e. to allow shape activation', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                mode: 'markers',
                x: [1, 3, 3],
                y: [2, 1, 3]
            }],
            layout: {
                shapes: [
                    {
                        editable: true,
                        x0: 1.5,
                        x1: 2,
                        y0: 1.5,
                        y1: 2,
                        opacity: 0.5,
                        fillcolor: 'blue',
                        line: {
                            width: 0,
                            dash: 'dash',
                            color: 'black'
                        }
                    }, {
                        editable: true,
                        x0: 2,
                        x1: 2.5,
                        y0: 1.5,
                        y1: 2,
                        opacity: 0.7,
                        fillcolor: 'rgba(255,0,0,0.7)', // N.B. 0.7 * 0.7 = 0.49 <= 0.5 is quite transparent
                        line: {
                            width: 0,
                            dash: 'dash',
                            color: 'black'
                        }
                    }, {
                        editable: true,
                        x0: 1.5,
                        x1: 2,
                        y0: 2,
                        y1: 2.5,
                        fillcolor: 'red',
                        line: {
                            width: 3,
                            dash: 'dash',
                            color: 'green'
                        }
                    }, {
                        editable: true,
                        path: 'M2,2H2.5,V2.5', // open path
                        fillcolor: 'rgba(0,0,0,0)',
                        line: {
                            width: 3,
                            dash: 'dash',
                            color: 'green'
                        }
                    }
                ]
            }
        })

        .then(function() {
            var el = d3SelectAll('.shapelayer path')[0][0];
            expect(el.style['pointer-events']).toBe('stroke');
            expect(el.style.stroke).toBe('rgb(0, 0, 0)'); // no color
            expect(el.style['stroke-opacity']).toBe('0'); // invisible
            expect(el.style['stroke-width']).toBe('5px'); // some pixels to activate shape

            el = d3SelectAll('.shapelayer path')[0][1];
            expect(el.style['pointer-events']).toBe('stroke');
            expect(el.style.stroke).toBe('rgb(0, 0, 0)'); // no color
            expect(el.style['stroke-opacity']).toBe('0'); // invisible
            expect(el.style['stroke-width']).toBe('5px'); // some pixels to activate shape

            el = d3SelectAll('.shapelayer path')[0][2];
            expect(el.style['pointer-events']).toBe('all');
            expect(el.style.stroke).toBe('rgb(0, 128, 0)'); // custom color
            expect(el.style['stroke-opacity']).toBe('1'); // visible
            expect(el.style['stroke-width']).toBe('3px'); // custom pixel

            el = d3SelectAll('.shapelayer path')[0][3];
            expect(el.style['pointer-events']).toBe('stroke');
            expect(el.style.stroke).toBe('rgb(0, 128, 0)'); // custom color
            expect(el.style['stroke-opacity']).toBe('1'); // visible
            expect(el.style['stroke-width']).toBe('3px'); // custom pixel
        })

        .then(done, done.fail);
    });

    it('should not provide invisible border & set pointer-events to "stroke" for shapes made editable via config', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                mode: 'markers',
                x: [1, 3, 3],
                y: [2, 1, 3]
            }],
            layout: {
                shapes: [
                    {
                        x0: 1.5,
                        x1: 2.5,
                        y0: 1.5,
                        y1: 2.5,
                        fillcolor: 'blue',
                        line: {
                            width: 0,
                            dash: 'dash',
                            color: 'black'
                        }
                    }
                ]
            },
            config: {
                editable: true
            }
        })

        .then(function() {
            var el = d3SelectAll('.shapelayer path')[0][0];
            expect(el.style['pointer-events']).toBe('all');
            expect(el.style.stroke).toBe('rgb(0, 0, 0)'); // no color
            expect(el.style['stroke-opacity']).toBe('0'); // invisible
            expect(el.style['stroke-width']).toBe('0px'); // no extra pixels
        })

        .then(done, done.fail);
    });
});

describe('Activate and edit editable shapes - date axes', function() {
    var fig = {
        data: [
            {
                x: [
                    0,
                    50
                ],
                y: [
                    0,
                    50
                ]
            }
        ],
        layout: {
            width: 800,
            height: 600,
            margin: {
                t: 100,
                b: 50,
                l: 100,
                r: 50
            },
            xaxis: {
                type: 'date',
                range: ["1975-07-01", "2380-07-01"]
            },
            yaxis: {
                range: [301.78041543026706, -18.694362017804156]
            },
            shapes: [
                {
                    editable: true,
                    layer: 'below',
                    type: 'rect',
                    line: {
                        width: 5
                    },
                    fillcolor: 'red',
                    opacity: 0.5,
                    xref: 'xaxis',
                    yref: 'yaxis',
                    x0: '2025-01-01',
                    y0: 25,
                    x1: '2075-01-01',
                    y1: 75
                },
                {
                    editable: true,
                    layer: 'top',
                    type: 'circle',
                    line: {
                        width: 5
                    },
                    fillcolor: 'green',
                    opacity: 0.5,
                    xref: 'xaxis',
                    yref: 'yaxis',
                    x0: '2125-01-01',
                    y0: 25,
                    x1: '2175-01-01',
                    y1: 75
                }
            ]
        },
        config: {
            editable: false,
            modeBarButtonsToAdd: [
                'drawline',
                'drawopenpath',
                'drawclosedpath',
                'drawcircle',
                'drawrect',
                'eraseshape'
            ]
        }
    };

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    ['mouse'].forEach(function(device) {
        it('reactangle using ' + device, function(done) {
            var i = 0; // shape index

            Plotly.newPlot(gd, {
                data: fig.data,
                layout: fig.layout,
                config: fig.config
            })

            // shape between 175, 160 and 255, 230
            .then(function() { click(200, 160); }) // activate shape
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'activate shape by clicking border');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: '2025-01-01',
                    y0: 25,
                    x1: '2075-01-01',
                    y1: 75
                });
            })
            .then(function() { drag([[255, 230], [300, 200]]); }) // move vertex
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: '2024-12-30 20:44:36.1846',
                    y0: 24.997032640949552,
                    x1: '2103-01-15 16:20:58.3385',
                    y1: 53.63323442136499
                });
            })
            .then(function() { drag([[300, 200], [255, 230]]); }) // move vertex back
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: '2024-12-30 20:44:36.1846',
                    y0: 25,
                    x1: '2074-12-31 18:56:02.9538',
                    y1: 75
                });
            })
            .then(function() { drag([[215, 195], [300, 200]]); }) // move shape
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: '2077-12-16 18:31:40.8',
                    y0: 24.997032640949552,
                    x1: '2127-12-18 16:43:07.5692',
                    y1: 74.99821958456974
                });
            })
            .then(function() { drag([[300, 200], [215, 195]]); }) // move shape back
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: '2024-12-30 20:44:36.1846',
                    y0: 25,
                    x1: '2074-12-31 18:56:02.9538',
                    y1: 75
                });
            })
            .then(function() { click(100, 100); })
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(undefined, 'deactivate shape by clicking outside');
            })
            .then(function() { click(255, 230); })
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'activate shape by clicking on corner');
            })
            .then(function() { click(215, 195); })
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(undefined, 'deactivate shape by clicking inside');
            })

            .then(done, done.fail);
        });

        it('circle using ' + device, function(done) {
            var i = 1; // shape index

            Plotly.newPlot(gd, {
                data: fig.data,
                layout: fig.layout,
                config: fig.config
            })

            // next shape
            .then(function() { click(355, 225); }) // activate shape
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'activate shape by clicking border');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('circle');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: '2125-01-01',
                    x1: '2175-01-01',
                    y0: 25,
                    y1: 75
                });
            })
            .then(function() { drag([[338, 196], [300, 175]]); }) // move vertex
            .then(function() {
                var id = gd._fullLayout._activeShapeIndex;
                expect(id).toEqual(i, 'keep shape active after drag corner');

                var shapes = gd._fullLayout.shapes;
                var obj = shapes[id]._input;
                expect(obj.type).toEqual('circle');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: '2186-11-02 07:04:22.7446',
                    y0: 74.99821958456971,
                    x1: '2113-03-01 18:44:58.3385',
                    y1: 10.04154302670623
                });
            })

            .then(done, done.fail);
        });
    });
});
