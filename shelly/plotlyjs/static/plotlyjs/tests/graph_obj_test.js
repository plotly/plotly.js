describe('Test graph_obj', function () {
    'use strict';

    /* global Plotly */

    describe('Plotly.deleteTraces should', function () {
        var gd;

        beforeEach(function () {
            gd = {
                data: [
                    {'name': 'a'},
                    {'name': 'b'},
                    {'name': 'c'},
                    {'name': 'd'}
                ]
            };
            spyOn(Plotly, 'redraw');
        });

        it('throw an error when indices are omitted', function () {

            expect(function () {
                Plotly.deleteTraces(gd);
            }).toThrow(new Error('indices must be an integer or array of integers.'));

        });

        it('throw an error when indices are out of bounds', function () {

            expect(function () {
                Plotly.deleteTraces(gd, 10);
            }).toThrow(new Error('indices must be valid indices for gd.data.'));

        });

        it('throw an error when indices are repeated', function () {

            expect(function () {
                Plotly.deleteTraces(gd, [0, 0]);
            }).toThrow(new Error('each index in indices must be unique.'));

        });

        it('work when indices are negative', function () {
            var expected = {
                data: [
                    {'name': 'a'},
                    {'name': 'b'},
                    {'name': 'c'}
                ]
            };

            Plotly.deleteTraces(gd, -1);
            expect(gd).toEqual(expected);
            expect(Plotly.redraw).toHaveBeenCalled();

        });

        it('work when multiple traces are deleted', function () {
            var expected = {
                data: [
                    {'name': 'b'},
                    {'name': 'c'}
                ]
            };

            Plotly.deleteTraces(gd, [0, 3]);
            expect(gd).toEqual(expected);
            expect(Plotly.redraw).toHaveBeenCalled();

        });

        it('work when indices are not sorted', function () {
            var expected = {
                data: [
                    {'name': 'b'},
                    {'name': 'c'}
                ]
            };

            Plotly.deleteTraces(gd, [3, 0]);
            expect(gd).toEqual(expected);
            expect(Plotly.redraw).toHaveBeenCalled();

        });

    });

    describe('Plotly.addTraces should', function () {
        var gd;

        beforeEach(function () {
            gd = {
                data: [
                    {'name': 'a'},
                    {'name': 'b'}
                ]
            };
            spyOn(Plotly, 'redraw');
            spyOn(Plotly, 'moveTraces');
        });

        it('throw an error when traces is not an object or an array of objects', function () {
            var expected = JSON.parse(JSON.stringify(gd));
            expect(function () {
                Plotly.addTraces(gd, 1, 2);
            }).toThrow(new Error('all values in traces array must be non-array objects'));

            expect(function () {
                Plotly.addTraces(gd, [{}, 4], 2);
            }).toThrow(new Error('all values in traces array must be non-array objects'));

            expect(function () {
                Plotly.addTraces(gd, [{}, []], 2);
            }).toThrow(new Error('all values in traces array must be non-array objects'));

            // make sure we didn't muck with gd.data if things failed!
            expect(gd).toEqual(expected);

        });

        it('throw an error when traces and newIndices arrays are unequal', function () {

            expect(function () {
                Plotly.addTraces(gd, [{}, {}], 2);
            }).toThrow(new Error('if indices is specified, traces.length must equal indices.length'));

        });

        it('throw an error when newIndices are out of bounds', function () {
            var expected = JSON.parse(JSON.stringify(gd));

            expect(function () {
                Plotly.addTraces(gd, [{}, {}], [0, 10]);
            }).toThrow(new Error('newIndices must be valid indices for gd.data.'));

            // make sure we didn't muck with gd.data if things failed!
            expect(gd).toEqual(expected);
        });

        it('work when newIndices is undefined', function () {
            var expected = {
                data: [
                    {'name': 'a'},
                    {'name': 'b'},
                    {'name': 'c'},
                    {'name': 'd'}
                ]
            };

            Plotly.addTraces(gd, [{'name': 'c'}, {'name': 'd'}]);
            expect(gd).toEqual(expected);
            expect(Plotly.redraw).toHaveBeenCalled();
            expect(Plotly.moveTraces).not.toHaveBeenCalled();

        });

        it('work when newIndices is defined', function () {
            var expected = {
                data: [
                    {'name': 'a'},
                    {'name': 'b'},
                    {'name': 'c'},
                    {'name': 'd'}
                ]
            };
            Plotly.addTraces(gd, [{'name': 'c'}, {'name': 'd'}], [1, 3]);
            expect(gd).toEqual(expected);
            expect(Plotly.redraw).not.toHaveBeenCalled();
            expect(Plotly.moveTraces).toHaveBeenCalledWith(gd, [-2, -1], [1, 3]);

        });

        it('work when newIndices has negative indices', function () {
            var expected = {
                data: [
                    {'name': 'a'},
                    {'name': 'b'},
                    {'name': 'c'},
                    {'name': 'd'}
                ]
            };
            Plotly.addTraces(gd, [{'name': 'c'}, {'name': 'd'}], [-3, -1]);
            expect(gd).toEqual(expected);
            expect(Plotly.redraw).not.toHaveBeenCalled();
            expect(Plotly.moveTraces).toHaveBeenCalledWith(gd, [-2, -1], [-3, -1]);

        });

        it('work when newIndices is an integer', function () {
            var expected = {
                data: [
                    {'name': 'a'},
                    {'name': 'b'},
                    {'name': 'c'}
                ]
            };
            Plotly.addTraces(gd, {'name': 'c'}, 0);
            expect(gd).toEqual(expected);
            expect(Plotly.redraw).not.toHaveBeenCalled();
            expect(Plotly.moveTraces).toHaveBeenCalledWith(gd, [-1], [0]);

        });
    });

    describe('Plotly.moveTraces should', function() {
        var gd;
        beforeEach(function () {
            gd = {
                data: [
                    {'name': 'a'},
                    {'name': 'b'},
                    {'name': 'c'},
                    {'name': 'd'}
                ]
            };
            spyOn(Plotly, 'redraw');
        });

        it('throw an error when index arrays are unequal', function () {
            expect(function () {
                Plotly.moveTraces(gd, [1], [2, 1]);
            }).toThrow(new Error('current and new indices must be of equal length.'));
        });

        it('throw an error when gd.data isn\'t an array.', function () {
            expect(function () {
                Plotly.moveTraces({}, [0], [0]);
            }).toThrow(new Error('gd.data must be an array.'));
            expect(function () {
                Plotly.moveTraces({data: 'meow'}, [0], [0]);
            }).toThrow(new Error('gd.data must be an array.'));
        });

        it('thow an error when a current index is out of bounds', function () {
            expect(function () {
                Plotly.moveTraces(gd, [-gd.data.length - 1], [0]);
            }).toThrow(new Error('currentIndices must be valid indices for gd.data.'));
            expect(function () {
                Plotly.moveTraces(gd, [gd.data.length], [0]);
            }).toThrow(new Error('currentIndices must be valid indices for gd.data.'));
        });

        it('thow an error when a new index is out of bounds', function () {
            expect(function () {
                Plotly.moveTraces(gd, [0], [-gd.data.length - 1]);
            }).toThrow(new Error('newIndices must be valid indices for gd.data.'));
            expect(function () {
                Plotly.moveTraces(gd, [0], [gd.data.length]);
            }).toThrow(new Error('newIndices must be valid indices for gd.data.'));
        });

        it('thow an error when current indices are repeated', function () {
            expect(function () {
                Plotly.moveTraces(gd, [0, 0], [0, 1]);
            }).toThrow(new Error('each index in currentIndices must be unique.'));

            // note that both positive and negative indices are accepted!
            expect(function () {
                Plotly.moveTraces(gd, [0, -gd.data.length], [0, 1]);
            }).toThrow(new Error('each index in currentIndices must be unique.'));
        });

        it('thow an error when new indices are repeated', function () {
            expect(function () {
                Plotly.moveTraces(gd, [0, 1], [0, 0]);
            }).toThrow(new Error('each index in newIndices must be unique.'));

            // note that both positive and negative indices are accepted!
            expect(function () {
                Plotly.moveTraces(gd, [0, 1], [-gd.data.length, 0]);
            }).toThrow(new Error('each index in newIndices must be unique.'));
        });

        it('accept integers in place of arrays', function () {
            var expected = {
                data: [
                    {'name': 'b'},
                    {'name': 'a'},
                    {'name': 'c'},
                    {'name': 'd'}
                ]
            };
            Plotly.moveTraces(gd, 0, 1);
            expect(gd).toEqual(expected);
            expect(Plotly.redraw).toHaveBeenCalled();

        });

        it('handle unsorted currentIndices', function () {
            var expected = {
                data: [
                    {'name': 'd'},
                    {'name': 'a'},
                    {'name': 'c'},
                    {'name': 'b'}
                ]
            };
            Plotly.moveTraces(gd, [3, 1], [0, 3]);
            expect(gd).toEqual(expected);
            expect(Plotly.redraw).toHaveBeenCalled();

        });

        it('work when newIndices are undefined.', function () {
            var expected = {
                data: [
                    {'name': 'b'},
                    {'name': 'c'},
                    {'name': 'd'},
                    {'name': 'a'}
                ]
            };
            Plotly.moveTraces(gd, [3, 0]);
            expect(gd).toEqual(expected);
            expect(Plotly.redraw).toHaveBeenCalled();

        });

        it('accept negative indices.', function () {
            var expected = {
                data: [
                    {'name': 'a'},
                    {'name': 'c'},
                    {'name': 'b'},
                    {'name': 'd'}
                ]
            };
            Plotly.moveTraces(gd, 1, -2);
            expect(gd).toEqual(expected);
            expect(Plotly.redraw).toHaveBeenCalled();

        });
    });
});
