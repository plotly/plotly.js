var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var click = require('../assets/click');
var delay = require('../assets/delay');

var CALLBACK_DELAY = 500;

// Testing constants
// =================
var basic_mock = Lib.extendDeep({}, require('@mocks/parcats_basic.json'));
var margin = basic_mock.layout.margin;
var domain = basic_mock.data[0].domain;

var categoryLabelPad = 40,
    dimWidth = 16,
    catSpacing = 8,
    dimDx = (256 - 2 * categoryLabelPad - dimWidth) / 2;

// Validation helpers
// ==================
function checkDimensionCalc(gd, dimInd, dimProps) {
    /** @type {ParcatsModel} */
    var calcdata = gd.calcdata[0][0];
    var dimension = calcdata.dimensions[dimInd];
    for(var dimProp in dimProps) {
        if(dimProps.hasOwnProperty(dimProp)) {
            expect(dimension[dimProp]).toEqual(dimProps[dimProp]);
        }
    }
}

function checkCategoryCalc(gd, dimInd, catInd, catProps) {
    /** @type {ParcatsModel} */
    var calcdata = gd.calcdata[0][0];
    var dimension = calcdata.dimensions[dimInd];
    var category = dimension.categories[catInd];
    for(var catProp in catProps) {
        if(catProps.hasOwnProperty(catProp)) {
            expect(category[catProp]).toEqual(catProps[catProp]);
        }
    }
}

function checkParcatsModelView(gd) {
    var fullLayout = gd._fullLayout;
    var size = fullLayout._size;

    // Make sure we have a 512x512 area for traces
    expect(size.h).toEqual(512);
    expect(size.w).toEqual(512);

    /** @type {ParcatsViewModel} */
    var parcatsViewModel = d3.select('g.trace.parcats').datum();

    // Check location/size of this trace inside overall traces area
    expect(parcatsViewModel.x).toEqual(64 + margin.r);
    expect(parcatsViewModel.y).toEqual(128 + margin.t);
    expect(parcatsViewModel.width).toEqual(256);
    expect(parcatsViewModel.height).toEqual(256);

    // Check location of dimensions
    expect(parcatsViewModel.dimensions[0].x).toEqual(categoryLabelPad);
    expect(parcatsViewModel.dimensions[0].y).toEqual(0);

    expect(parcatsViewModel.dimensions[1].x).toEqual(categoryLabelPad + dimDx);
    expect(parcatsViewModel.dimensions[1].y).toEqual(0);

    expect(parcatsViewModel.dimensions[2].x).toEqual(categoryLabelPad + 2 * dimDx);
    expect(parcatsViewModel.dimensions[2].y).toEqual(0);

    // Check location of categories
    /** @param {Array.<CategoryViewModel>} categories */
    function checkCategoryPositions(categories) {
        var nextY = (3 - categories.length) * catSpacing / 2;
        for(var c = 0; c < categories.length; c++) {
            expect(categories[c].y).toEqual(nextY);
            nextY += categories[c].height + catSpacing;
        }
    }

    checkCategoryPositions(parcatsViewModel.dimensions[0].categories);
    checkCategoryPositions(parcatsViewModel.dimensions[1].categories);
    checkCategoryPositions(parcatsViewModel.dimensions[2].categories);
}

function checkParcatsSvg(gd) {
    var fullLayout = gd._fullLayout;
    var size = fullLayout._size;

    // Make sure we have a 512x512 area for traces
    expect(size.h).toEqual(512);
    expect(size.w).toEqual(512);

    // Check trace transform
    var parcatsTraceSelection = d3.select('g.trace.parcats');

    expect(parcatsTraceSelection.attr('transform')).toEqual(
        makeTranslate(
            size.w * domain.x[0] + margin.r,
            size.h * domain.y[0] + margin.t));

    // Check dimension transforms
    var dimensionSelection = parcatsTraceSelection
        .selectAll('g.dimensions')
        .selectAll('g.dimension');

    dimensionSelection.each(function(dimension, dimInd) {
        var expectedX = categoryLabelPad + dimInd * dimDx,
            expectedY = 0,
            expectedTransform = makeTranslate(expectedX, expectedY);
        expect(d3.select(this).attr('transform')).toEqual(expectedTransform);
    });

    // Check category transforms
    dimensionSelection.each(function(dimension, dimDisplayInd) {

        var categorySelection = d3.select(this).selectAll('g.category');
        var nextY = (3 - categorySelection.size()) * catSpacing / 2;

        categorySelection.each(function(category) {
            var catSel = d3.select(this),
                catWidth = catSel.datum().width,
                catHeight = catSel.datum().height;

            var expectedTransform = 'translate(0, ' + nextY + ')';
            expect(catSel.attr('transform')).toEqual(expectedTransform);
            nextY += category.height + catSpacing;

            // Check category label position
            var isRightDim = dimDisplayInd === 2,
                catLabel = catSel.select('text.catlabel');

            // Compute expected text properties based on
            // whether this is the right-most dimension
            var expectedTextAnchor = isRightDim ? 'start' : 'end',
                expectedX = isRightDim ? catWidth + 5 : -5,
                expectedY = catHeight / 2;

            expect(catLabel.attr('text-anchor')).toEqual(expectedTextAnchor);
            expect(catLabel.attr('x')).toEqual(expectedX.toString());
            expect(catLabel.attr('y')).toEqual(expectedY.toString());
        });
    });
}

function makeTranslate(x, y) {
    return 'translate(' + x + ', ' + y + ')';
}


// Test cases
// ==========
describe('Basic parcats trace', function() {

    // Variable declarations
    // ---------------------
    // ### Trace level ###
    var gd,
        mock;

    // Fixtures
    // --------
    beforeEach(function() {
        gd = createGraphDiv();
        mock = Lib.extendDeep({}, require('@mocks/parcats_basic.json'));
    });

    afterEach(destroyGraphDiv);

    // Tests
    // -----
    it('should create trace properly', function(done) {
        Plotly.newPlot(gd, basic_mock)
            .then(function() {
                // Check trace properties
                var trace = gd.data[0];

                expect(trace.type).toEqual('parcats');
                expect(trace.dimensions.length).toEqual(3);
            })
            .catch(failTest)
            .then(done);
    });

    it('should compute initial model properly', function(done) {
        Plotly.newPlot(gd, basic_mock)
            .then(function() {

                // Var check calc data
                /** @type {ParcatsModel} */
                var calcdata = gd.calcdata[0][0];

                // Check cross dimension values
                // ----------------------------
                expect(calcdata.dimensions.length).toEqual(3);
                expect(calcdata.maxCats).toEqual(3);

                // Check dimension 0
                // -----------------
                checkDimensionCalc(gd, 0,
                    {dimensionInd: 0, displayInd: 0, dragX: null, dimensionLabel: 'One', count: 9});

                checkCategoryCalc(gd, 0, 0, {
                    categoryLabel: 1,
                    dimensionInd: 0,
                    categoryInd: 0,
                    displayInd: 0,
                    count: 6,
                    valueInds: [0, 1, 3, 5, 6, 8]});

                checkCategoryCalc(gd, 0, 1, {
                    categoryLabel: 2,
                    dimensionInd: 0,
                    categoryInd: 1,
                    displayInd: 1,
                    count: 3,
                    valueInds: [2, 4, 7]});

                // Check dimension 1
                // -----------------
                checkDimensionCalc(gd, 1,
                    {dimensionInd: 1, displayInd: 1, dragX: null, dimensionLabel: 'Two', count: 9});

                checkCategoryCalc(gd, 1, 0, {
                    categoryLabel: 'A',
                    dimensionInd: 1,
                    categoryInd: 0,
                    displayInd: 0,
                    count: 3,
                    valueInds: [0, 2, 6]});

                checkCategoryCalc(gd, 1, 1, {
                    categoryLabel: 'B',
                    dimensionInd: 1,
                    categoryInd: 1,
                    displayInd: 1,
                    count: 3,
                    valueInds: [1, 3, 7]});

                checkCategoryCalc(gd, 1, 2, {
                    categoryLabel: 'C',
                    dimensionInd: 1,
                    categoryInd: 2,
                    displayInd: 2,
                    count: 3,
                    valueInds: [4, 5, 8]});

                // Check dimension 2
                // -----------------
                checkDimensionCalc(gd, 2,
                    {dimensionInd: 2, displayInd: 2, dragX: null, dimensionLabel: 'Three', count: 9});

                checkCategoryCalc(gd, 2, 0, {
                    categoryLabel: 11,
                    dimensionInd: 2,
                    categoryInd: 0,
                    displayInd: 0,
                    count: 9,
                    valueInds: [0, 1, 2, 3, 4, 5, 6, 7, 8]});
            })
            .catch(failTest)
            .then(done);
    });

    it('should compute initial data properly', function(done) {
        Plotly.newPlot(gd, mock)
            .then(function() {

                // Var check calc data
                var gd_traceData = gd.data[0];

                // Check that trace data matches input
                expect(gd_traceData).toEqual(mock.data[0]);
            })
            .catch(failTest)
            .then(done);
    });

    it('should compute initial fullData properly', function(done) {
        Plotly.newPlot(gd, basic_mock)
            .then(function() {
                // Check that some of the defaults are computed properly
                var fullTrace = gd._fullData[0];
                expect(fullTrace.arrangement).toBe('perpendicular');
                expect(fullTrace.bundlecolors).toBe(true);
                expect(fullTrace.dimensions[1].visible).toBe(true);
            })
            .catch(failTest)
            .then(done);
    });

    it('should compute initial model views properly', function(done) {

        Plotly.newPlot(gd, basic_mock)
            .then(function() {
                checkParcatsModelView(gd);
            })

            .catch(failTest)
            .then(done);
    });

    it('should compute initial svg properly', function(done) {
        Plotly.newPlot(gd, basic_mock)
            .then(function() {
                checkParcatsSvg(gd);
            })
            .catch(failTest)
            .then(done);
    });
});

describe('Dimension reordered parcats trace', function() {

    // Variable declarations
    // ---------------------
    // ### Trace level ###
    var gd,
        mock;

    // Fixtures
    // --------
    beforeEach(function() {
        gd = createGraphDiv();
        mock = Lib.extendDeep({}, require('@mocks/parcats_reordered.json'));
    });

    afterEach(destroyGraphDiv);

    // Tests
    // -----
    it('should compute initial model properly', function(done) {
        Plotly.newPlot(gd, mock)
            .then(function() {

                // Var check calc data
                /** @type {ParcatsModel} */
                var calcdata = gd.calcdata[0][0];

                // Check cross dimension values
                // ----------------------------
                expect(calcdata.dimensions.length).toEqual(3);
                expect(calcdata.maxCats).toEqual(3);

                // Check dimension display order
                // -----------------------------

                // ### Dimension 0 ###
                checkDimensionCalc(gd, 0,
                    {dimensionInd: 0, displayInd: 0, dimensionLabel: 'One'});

                checkCategoryCalc(gd, 0, 0, {
                    categoryLabel: 'One',
                    dimensionInd: 0,
                    categoryInd: 0,
                    displayInd: 0});

                checkCategoryCalc(gd, 0, 1, {
                    categoryLabel: 'Two',
                    dimensionInd: 0,
                    categoryInd: 1,
                    displayInd: 1});

                // ### Dimension 1 ###
                checkDimensionCalc(gd, 1,
                    {dimensionInd: 1, displayInd: 2, dimensionLabel: 'Two'});

                checkCategoryCalc(gd, 1, 0, {
                    categoryLabel: 'B',
                    dimensionInd: 1,
                    categoryInd: 0,
                    displayInd: 0});

                checkCategoryCalc(gd, 1, 1, {
                    categoryLabel: 'A',
                    dimensionInd: 1,
                    categoryInd: 1,
                    displayInd: 1});

                checkCategoryCalc(gd, 1, 2, {
                    categoryLabel: 'C',
                    dimensionInd: 1,
                    categoryInd: 2,
                    displayInd: 2});

                // ### Dimension 2 ###
                checkDimensionCalc(gd, 2,
                    {dimensionInd: 2, displayInd: 1, dimensionLabel: 'Three'});

                checkCategoryCalc(gd, 2, 0, {
                    categoryLabel: 11,
                    dimensionInd: 2,
                    categoryInd: 0,
                    displayInd: 0});
            })
            .catch(failTest)
            .then(done);
    });

    it('should recover from bad display order specification', function(done) {

        // Define bad display indexes [0, 2, 0]
        mock.data[0].dimensions[2].displayindex = 0;

        Plotly.newPlot(gd, mock)
            .then(function() {

                // Var check calc data
                /** @type {ParcatsModel} */
                var calcdata = gd.calcdata[0][0];

                // Check cross dimension values
                // ----------------------------
                expect(calcdata.dimensions.length).toEqual(3);
                expect(calcdata.maxCats).toEqual(3);

                // Check dimension display order
                // -----------------------------
                // Display indexes should equal dimension indexes

                // ### Dimension 0 ###
                checkDimensionCalc(gd, 0,
                    {dimensionInd: 0, displayInd: 0, dimensionLabel: 'One'});

                checkCategoryCalc(gd, 0, 0, {
                    categoryLabel: 'One',
                    categoryInd: 0,
                    displayInd: 0});

                checkCategoryCalc(gd, 0, 1, {
                    categoryLabel: 'Two',
                    categoryInd: 1,
                    displayInd: 1});

                // ### Dimension 1 ###
                checkDimensionCalc(gd, 1,
                    {dimensionInd: 1, displayInd: 1, dimensionLabel: 'Two'});

                checkCategoryCalc(gd, 1, 0, {
                    categoryLabel: 'B',
                    categoryInd: 0,
                    displayInd: 0});

                checkCategoryCalc(gd, 1, 1, {
                    categoryLabel: 'A',
                    categoryInd: 1,
                    displayInd: 1});

                checkCategoryCalc(gd, 1, 2, {
                    categoryLabel: 'C',
                    categoryInd: 2,
                    displayInd: 2});

                // ### Dimension 2 ###
                checkDimensionCalc(gd, 2,
                    {dimensionInd: 2, displayInd: 2, dimensionLabel: 'Three'});

                checkCategoryCalc(gd, 2, 0, {
                    categoryLabel: 11,
                    categoryInd: 0,
                    displayInd: 0});
            })
            .catch(failTest)
            .then(done);
    });

    it('should compute initial model views properly', function(done) {

        Plotly.newPlot(gd, mock)
            .then(function() {
                checkParcatsModelView(gd);
            })

            .catch(failTest)
            .then(done);
    });

    it('should compute initial svg properly', function(done) {
        Plotly.newPlot(gd, mock)
            .then(function() {
                checkParcatsSvg(gd);
            })
            .catch(failTest)
            .then(done);
    });
});

describe('Drag to reordered dimensions', function() {

    // Variable declarations
    // ---------------------
    // ### Trace level ###
    var gd,
        restyleCallback,
        mock;

    // Fixtures
    // --------
    beforeEach(function() {
        gd = createGraphDiv();
        mock = Lib.extendDeep({}, require('@mocks/parcats_basic_freeform.json'));
    });

    afterEach(destroyGraphDiv);

    function getMousePositions(parcatsViewModel) {
    // Compute Mouse positions
        // -----------------------
        // Start mouse in the middle of the dimension label on the
        // second dimensions (dimension display index 1)
        var dragDimStartX = parcatsViewModel.dimensions[1].x;
        var mouseStartY = parcatsViewModel.y - 5,
            mouseStartX = parcatsViewModel.x + dragDimStartX + dimWidth / 2;

        // Pause mouse half-way between the original location of
        // the first and second dimensions. Also move mosue
        // downward a bit to make sure drag 'sticks'
        var mouseMidY = parcatsViewModel.y + 50,
            mouseMidX = mouseStartX + dimDx / 2;

        // End mouse drag in the middle of the original
        // position of the dimension label of the third dimension
        // (dimension display index 2)
        var mouseEndY = parcatsViewModel.y + 100,
            mouseEndX = parcatsViewModel.x + parcatsViewModel.dimensions[2].x + dimWidth / 2;
        return {
            mouseStartY: mouseStartY,
            mouseStartX: mouseStartX,
            mouseMidY: mouseMidY,
            mouseMidX: mouseMidX,
            mouseEndY: mouseEndY,
            mouseEndX: mouseEndX
        };
    }

    function checkInitialDimensions() {
        checkDimensionCalc(gd, 0,
            {dimensionInd: 0, displayInd: 0, dragX: null, dimensionLabel: 'One', count: 9});
        checkDimensionCalc(gd, 1,
            {dimensionInd: 1, displayInd: 1, dragX: null, dimensionLabel: 'Two', count: 9});
        checkDimensionCalc(gd, 2,
            {dimensionInd: 2, displayInd: 2, dragX: null, dimensionLabel: 'Three', count: 9});
    }

    function checkReorderedDimensions() {
        checkDimensionCalc(gd, 0,
            {dimensionInd: 0, displayInd: 0, dragX: null, dimensionLabel: 'One', count: 9});
        checkDimensionCalc(gd, 1,
            {dimensionInd: 1, displayInd: 2, dragX: null, dimensionLabel: 'Two', count: 9});
        checkDimensionCalc(gd, 2,
            {dimensionInd: 2, displayInd: 1, dragX: null, dimensionLabel: 'Three', count: 9});
    }

    function checkMidDragDimensions(dragDimStartX) {
        checkDimensionCalc(gd, 0,
            {dimensionInd: 0, displayInd: 0, dragX: null, dimensionLabel: 'One', count: 9});
        checkDimensionCalc(gd, 1,
            {dimensionInd: 1, displayInd: 1, dragX: dragDimStartX + dimDx / 2, dimensionLabel: 'Two', count: 9});
        checkDimensionCalc(gd, 2,
            {dimensionInd: 2, displayInd: 2, dragX: null, dimensionLabel: 'Three', count: 9});
    }

    it('should support dragging dimension label to reorder dimensions in freeform arrangement', function(done) {

        // Set arrangement
        mock.data[0].arrangement = 'freeform';

        Plotly.newPlot(gd, mock)
            .then(function() {
                restyleCallback = jasmine.createSpy('restyleCallback');
                gd.on('plotly_restyle', restyleCallback);

                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                var dragDimStartX = parcatsViewModel.dimensions[1].x;
                var pos = getMousePositions(parcatsViewModel);

                // Check initial dimension order
                // -----------------------------
                checkInitialDimensions();

                // Position mouse for start of drag
                // --------------------------------
                mouseEvent('mousemove', pos.mouseStartX, pos.mouseStartY);

                // Perform drag
                // ------------
                mouseEvent('mousedown', pos.mouseStartX, pos.mouseStartY);

                // ### Pause at drag mid-point
                mouseEvent('mousemove', pos.mouseMidX, pos.mouseMidY
                    // {buttons: 1}  // Left click
                    );

                // Make sure we're dragging the middle dimension
                expect(parcatsViewModel.dragDimension.model.dimensionLabel).toEqual('Two');

                // Make sure dimensions haven't changed order yet, but that
                // we do have a drag in progress on the middle dimension
                checkMidDragDimensions(dragDimStartX);

                // ### Move to drag end-point
                mouseEvent('mousemove', pos.mouseEndX, pos.mouseEndY);

                // Make sure we're still dragging the middle dimension
                expect(parcatsViewModel.dragDimension.model.dimensionLabel).toEqual('Two');

                // End drag
                // --------
                mouseEvent('mouseup', pos.mouseEndX, pos.mouseEndY);

                // Make sure we've cleared drag dimension
                expect(parcatsViewModel.dragDimension).toEqual(null);

                // Check final dimension order
                // -----------------------------
                checkReorderedDimensions();
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that proper restyle event was emitted
                // -------------------------------------------
                expect(restyleCallback).toHaveBeenCalledTimes(1);
                expect(restyleCallback).toHaveBeenCalledWith([
                    {
                        'dimensions[0].displayindex': 0,
                        'dimensions[1].displayindex': 2,
                        'dimensions[2].displayindex': 1
                    },
                [0]]);
                restyleCallback.calls.reset();
            })
            .catch(failTest)
            .then(done);
    });

    it('should support dragging dimension label to reorder dimensions in perpendicular arrangement', function(done) {

        // Set arrangement
        mock.data[0].arrangement = 'perpendicular';

        Plotly.newPlot(gd, mock)
            .then(function() {
                restyleCallback = jasmine.createSpy('restyleCallback');
                gd.on('plotly_restyle', restyleCallback);

                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                var dragDimStartX = parcatsViewModel.dimensions[1].x;
                var pos = getMousePositions(parcatsViewModel);

                // Check initial dimension order
                // -----------------------------
                checkInitialDimensions();

                // Position mouse for start of drag
                // --------------------------------
                mouseEvent('mousemove', pos.mouseStartX, pos.mouseStartY);

                // Perform drag
                // ------------
                mouseEvent('mousedown', pos.mouseStartX, pos.mouseStartY);

                // ### Pause at drag mid-point
                mouseEvent('mousemove', pos.mouseMidX, pos.mouseMidY
                    // {buttons: 1}  // Left click
                    );

                // Make sure we're dragging the middle dimension
                expect(parcatsViewModel.dragDimension.model.dimensionLabel).toEqual('Two');

                // Make sure dimensions haven't changed order yet, but that
                // we do have a drag in progress on the middle dimension
                checkMidDragDimensions(dragDimStartX);

                // ### Move to drag end-point
                mouseEvent('mousemove', pos.mouseEndX, pos.mouseEndY);

                // Make sure we're still dragging the middle dimension
                expect(parcatsViewModel.dragDimension.model.dimensionLabel).toEqual('Two');

                // End drag
                // --------
                mouseEvent('mouseup', pos.mouseEndX, pos.mouseEndY);

                // Make sure we've cleared drag dimension
                expect(parcatsViewModel.dragDimension).toEqual(null);

                // Check final dimension order
                // -----------------------------
                checkReorderedDimensions();
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that proper restyle event was emitted
                // -------------------------------------------
                expect(restyleCallback).toHaveBeenCalledTimes(1);
                expect(restyleCallback).toHaveBeenCalledWith([
                    {
                        'dimensions[0].displayindex': 0,
                        'dimensions[1].displayindex': 2,
                        'dimensions[2].displayindex': 1
                    },
                [0]]);

                restyleCallback.calls.reset();
            })
            .catch(failTest)
            .then(done);
    });

    it('should NOT support dragging dimension label to reorder dimensions in fixed arrangement', function(done) {

        // Set arrangement
        mock.data[0].arrangement = 'fixed';

        Plotly.newPlot(gd, mock)
            .then(function() {
                console.log(gd.data);
                restyleCallback = jasmine.createSpy('restyleCallback');
                gd.on('plotly_restyle', restyleCallback);

                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();
                var pos = getMousePositions(parcatsViewModel);

                // Check initial dimension order
                // -----------------------------
                checkInitialDimensions();

                // Position mouse for start of drag
                // --------------------------------
                mouseEvent('mousemove', pos.mouseStartX, pos.mouseStartY);

                // Perform drag
                // ------------
                mouseEvent('mousedown', pos.mouseStartX, pos.mouseStartY);

                // ### Pause at drag mid-point
                mouseEvent('mousemove', pos.mouseMidX, pos.mouseMidY
                    // {buttons: 1}  // Left click
                    );

                // Make sure we're not dragging any dimension
                expect(parcatsViewModel.dragDimension).toEqual(null);

                // Make sure dimensions haven't changed order yet
                checkInitialDimensions();

                // ### Move to drag end-point
                mouseEvent('mousemove', pos.mouseEndX, pos.mouseEndY);

                // Make sure we're still not dragging a dimension
                expect(parcatsViewModel.dragDimension).toEqual(null);

                // End drag
                // --------
                mouseEvent('mouseup', pos.mouseEndX, pos.mouseEndY);

                // Make sure dimensions haven't changed
                // ------------------------------------
                checkInitialDimensions();
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that no restyle event was emitted
                // ---------------------------------------
                expect(restyleCallback).toHaveBeenCalledTimes(0);
                restyleCallback.calls.reset();
            })
            .catch(failTest)
            .then(done);
    });
});

describe('Drag to reordered categories', function() {

    // Variable declarations
    // ---------------------
    // ### Trace level ###
    var gd,
        restyleCallback,
        mock;

    // Fixtures
    // --------
    beforeEach(function() {
        gd = createGraphDiv();
        mock = Lib.extendDeep({}, require('@mocks/parcats_basic_freeform.json'));
    });

    afterEach(destroyGraphDiv);

    function getDragPositions(parcatsViewModel) {
        var dragDimStartX = parcatsViewModel.dimensions[1].x;

        var mouseStartY = parcatsViewModel.y + parcatsViewModel.dimensions[1].categories[2].y + 10,
            mouseStartX = parcatsViewModel.x + dragDimStartX + dimWidth / 2;

        // Pause mouse half-way between the original location of
        // the first and second dimensions. Also move mouse
        // upward enough to swap position with middle category
        var mouseMidY = parcatsViewModel.y + parcatsViewModel.dimensions[1].categories[1].y,
            mouseMidX = mouseStartX + dimDx / 2;

        // End mouse drag in the middle of the original
        // position of the dimension label of the third dimension
        // (dimension display index 2), and at the height of the original top category
        var mouseEndY = parcatsViewModel.y,
            mouseEndX = parcatsViewModel.x + parcatsViewModel.dimensions[2].x + dimWidth / 2;
        return {
            dragDimStartX: dragDimStartX,
            mouseStartY: mouseStartY,
            mouseStartX: mouseStartX,
            mouseMidY: mouseMidY,
            mouseMidX: mouseMidX,
            mouseEndY: mouseEndY,
            mouseEndX: mouseEndX
        };
    }

    function checkInitialDimensions() {
        checkDimensionCalc(gd, 0,
            {dimensionInd: 0, displayInd: 0, dragX: null, dimensionLabel: 'One', count: 9});
        checkDimensionCalc(gd, 1,
            {dimensionInd: 1, displayInd: 1, dragX: null, dimensionLabel: 'Two', count: 9});
        checkDimensionCalc(gd, 2,
            {dimensionInd: 2, displayInd: 2, dragX: null, dimensionLabel: 'Three', count: 9});
    }

    function checkMidDragDimensions(dragDimStartX) {
        checkDimensionCalc(gd, 0,
            {dimensionInd: 0, displayInd: 0, dragX: null, dimensionLabel: 'One', count: 9});
        checkDimensionCalc(gd, 1,
            {dimensionInd: 1, displayInd: 1, dragX: dragDimStartX + dimDx / 2, dimensionLabel: 'Two', count: 9});
        checkDimensionCalc(gd, 2,
            {dimensionInd: 2, displayInd: 2, dragX: null, dimensionLabel: 'Three', count: 9});
    }

    function checkInitialCategories() {
        checkCategoryCalc(gd, 1, 0, {
            categoryLabel: 'A',
            categoryInd: 0,
            displayInd: 0
        });

        checkCategoryCalc(gd, 1, 1, {
            categoryLabel: 'B',
            categoryInd: 1,
            displayInd: 1
        });

        checkCategoryCalc(gd, 1, 2, {
            categoryLabel: 'C',
            categoryInd: 2,
            displayInd: 2
        });
    }

    function checkMidDragCategories() {
        checkCategoryCalc(gd, 1, 0, {
            categoryLabel: 'A',
            categoryInd: 0,
            displayInd: 0
        });

        checkCategoryCalc(gd, 1, 1, {
            categoryLabel: 'B',
            categoryInd: 1,
            displayInd: 2
        });

        checkCategoryCalc(gd, 1, 2, {
            categoryLabel: 'C',
            categoryInd: 2,
            displayInd: 1
        });
    }

    function checkFinalDimensions() {
        checkDimensionCalc(gd, 0,
            {dimensionInd: 0, displayInd: 0, dragX: null, dimensionLabel: 'One', count: 9});
        checkDimensionCalc(gd, 1,
            {dimensionInd: 1, displayInd: 2, dragX: null, dimensionLabel: 'Two', count: 9});
        checkDimensionCalc(gd, 2,
            {dimensionInd: 2, displayInd: 1, dragX: null, dimensionLabel: 'Three', count: 9});
    }

    function checkFinalCategories() {
        checkCategoryCalc(gd, 1, 0, {
            categoryLabel: 'A',
            categoryInd: 0,
            displayInd: 1
        });

        checkCategoryCalc(gd, 1, 1, {
            categoryLabel: 'B',
            categoryInd: 1,
            displayInd: 2
        });

        checkCategoryCalc(gd, 1, 2, {
            categoryLabel: 'C',
            categoryInd: 2,
            displayInd: 0
        });
    }

    it('should support dragging category to reorder categories and dimensions in freeform arrangement', function(done) {

        // Set arrangement
        mock.data[0].arrangement = 'freeform';

        Plotly.newPlot(gd, mock)
            .then(function() {

                restyleCallback = jasmine.createSpy('restyleCallback');
                gd.on('plotly_restyle', restyleCallback);

                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                // Compute Mouse positions
                // -----------------------
                // Start mouse in the middle of the lowest category
                // second dimensions (dimension display index 1)
                var pos = getDragPositions(parcatsViewModel);

                // Check initial dimension order
                // -----------------------------
                checkInitialDimensions();

                // Check initial categories
                // ------------------------
                checkInitialCategories();

                // Position mouse for start of drag
                // --------------------------------
                mouseEvent('mousemove', pos.mouseStartX, pos.mouseStartY);

                // Perform drag
                // ------------
                mouseEvent('mousedown', pos.mouseStartX, pos.mouseStartY);

                // ### Pause at drag mid-point
                mouseEvent('mousemove', pos.mouseMidX, pos.mouseMidY);

                // Make sure we're dragging the middle dimension
                expect(parcatsViewModel.dragDimension.model.dimensionLabel).toEqual('Two');

                // Make sure dimensions haven't changed order yet, but that
                // we do have a drag in progress on the middle dimension
                checkMidDragDimensions(pos.dragDimStartX);

                // Make sure categories in dimension 1 have changed already
                checkMidDragCategories();

                // ### Move to drag end-point
                mouseEvent('mousemove', pos.mouseEndX, pos.mouseEndY);

                // Make sure we're still dragging the middle dimension
                expect(parcatsViewModel.dragDimension.model.dimensionLabel).toEqual('Two');

                // End drag
                // --------
                mouseEvent('mouseup', pos.mouseEndX, pos.mouseEndY);

                // Make sure we've cleared drag dimension
                expect(parcatsViewModel.dragDimension).toEqual(null);

                // Check final dimension order
                // -----------------------------
                checkFinalDimensions();

                // Make sure categories in dimension 1 have changed already
                checkFinalCategories();

            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that proper restyle event was emitted
                // -------------------------------------------
                expect(restyleCallback).toHaveBeenCalledTimes(1);
                expect(restyleCallback).toHaveBeenCalledWith([
                    {'dimensions[0].displayindex': 0,
                        'dimensions[1].displayindex': 2,
                        'dimensions[2].displayindex': 1,
                        'dimensions[1].categoryorder': 'array',
                        'dimensions[1].categoryarray': [['C', 'A', 'B' ]],
                        'dimensions[1].ticktext': [['C', 'A', 'B' ]]},
                    [0]]);

                restyleCallback.calls.reset();
            })
            .catch(failTest)
            .then(done);
    });

    it('should support dragging category to reorder categories only in perpendicular arrangement', function(done) {

        // Set arrangement
        mock.data[0].arrangement = 'perpendicular';

        Plotly.newPlot(gd, mock)
            .then(function() {

                restyleCallback = jasmine.createSpy('restyleCallback');
                gd.on('plotly_restyle', restyleCallback);

                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                // Compute Mouse positions
                // -----------------------
                var pos = getDragPositions(parcatsViewModel);

                // Check initial dimension order
                // -----------------------------
                checkInitialDimensions();

                // Check initial categories
                // ------------------------
                checkInitialCategories();

                // Position mouse for start of drag
                // --------------------------------
                mouseEvent('mousemove', pos.mouseStartX, pos.mouseStartY);

                // Perform drag
                // ------------
                mouseEvent('mousedown', pos.mouseStartX, pos.mouseStartY);

                // ### Pause at drag mid-point
                mouseEvent('mousemove', pos.mouseMidX, pos.mouseMidY);

                // Make sure we're dragging the middle dimension
                expect(parcatsViewModel.dragDimension.model.dimensionLabel).toEqual('Two');

                // Make sure dimensions haven't changed order or position
                checkInitialDimensions();

                // Make sure categories in dimension 1 have changed already
                checkMidDragCategories();

                // ### Move to drag end-point
                mouseEvent('mousemove', pos.mouseEndX, pos.mouseEndY);

                // Make sure we're still dragging the middle dimension
                expect(parcatsViewModel.dragDimension.model.dimensionLabel).toEqual('Two');

                // End drag
                // --------
                mouseEvent('mouseup', pos.mouseEndX, pos.mouseEndY);

                // Make sure we've cleared drag dimension
                expect(parcatsViewModel.dragDimension).toEqual(null);

                // Check final dimension order
                // ---------------------------
                // Dimension order should not have changed
                checkInitialDimensions();

                // Make sure categories in dimension 1 have changed already
                checkFinalCategories();
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that proper restyle event was emitted
                // -------------------------------------------
                expect(restyleCallback).toHaveBeenCalledTimes(1);
                expect(restyleCallback).toHaveBeenCalledWith([
                    {
                        'dimensions[1].categoryorder': 'array',
                        'dimensions[1].categoryarray': [['C', 'A', 'B' ]],
                        'dimensions[1].ticktext': [['C', 'A', 'B' ]]},
                    [0]]);

                restyleCallback.calls.reset();
            })
            .catch(failTest)
            .then(done);
    });

    it('should NOT support dragging category to reorder categories or dimensions in fixed arrangement', function(done) {

        // Set arrangement
        mock.data[0].arrangement = 'fixed';

        Plotly.newPlot(gd, mock)
            .then(function() {

                restyleCallback = jasmine.createSpy('restyleCallback');
                gd.on('plotly_restyle', restyleCallback);

                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                // Compute Mouse positions
                // -----------------------
                var pos = getDragPositions(parcatsViewModel);

                // Check initial dimension order
                // -----------------------------
                checkInitialDimensions();

                // Check initial categories
                // ------------------------
                checkInitialCategories();

                // Position mouse for start of drag
                // --------------------------------
                mouseEvent('mousemove', pos.mouseStartX, pos.mouseStartY);

                // Perform drag
                // ------------
                mouseEvent('mousedown', pos.mouseStartX, pos.mouseStartY);

                // ### Pause at drag mid-point
                mouseEvent('mousemove', pos.mouseMidX, pos.mouseMidY);

                // Make sure we're not dragging a dimension
                expect(parcatsViewModel.dragDimension).toEqual(null);

                // Make sure dimensions and categories haven't changed order
                checkInitialDimensions();
                checkInitialCategories();

                // ### Move to drag end-point
                mouseEvent('mousemove', pos.mouseEndX, pos.mouseEndY);

                // Make sure we're still not dragging a dimension
                expect(parcatsViewModel.dragDimension).toEqual(null);

                // End drag
                // --------
                mouseEvent('mouseup', pos.mouseEndX, pos.mouseEndY);

                // Check final dimension order
                // ---------------------------
                // Dimension and category order should not have changed
                checkInitialDimensions();
                checkInitialCategories();
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that no restyle event was emitted
                // ---------------------------------------
                expect(restyleCallback).toHaveBeenCalledTimes(0);
                restyleCallback.calls.reset();
            })
            .catch(failTest)
            .then(done);
    });
});


describe('Click events', function() {

    // Variable declarations
    // ---------------------
    // ### Trace level ###
    var gd,
        mock;

    // Fixtures
    // --------
    beforeEach(function() {
        gd = createGraphDiv();
        mock = Lib.extendDeep({}, require('@mocks/parcats_basic_freeform.json'));
    });

    afterEach(destroyGraphDiv);

    it('should fire on category click', function(done) {

        var clickData;
        Plotly.newPlot(gd, mock)
            .then(function() {
                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                gd.on('plotly_click', function(data) {
                    clickData = data;
                });

                // Click on the lowest category in the middle dimension (category "C")
                var dimStartX = parcatsViewModel.dimensions[1].x;
                var mouseY = parcatsViewModel.y + parcatsViewModel.dimensions[1].categories[2].y + 10,
                    mouseX = parcatsViewModel.x + dimStartX + dimWidth / 2;

                // Position mouse for start of drag
                // --------------------------------
                click(mouseX, mouseY);
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that click callback was called
                expect(clickData).toBeDefined();

                // Check that the right points were reported
                var pts = clickData.points.sort(function(a, b) {
                    return a.pointNumber - b.pointNumber;
                });

                // Check points
                expect(pts).toEqual([
                    {curveNumber: 0, pointNumber: 4},
                    {curveNumber: 0, pointNumber: 5},
                    {curveNumber: 0, pointNumber: 8}]);
            })
            .catch(failTest)
            .then(done);
    });

    it('should NOT fire on category click if hoverinfo is skip', function(done) {

        var clickData;
        mock.data[0].hoverinfo = 'skip';

        Plotly.newPlot(gd, mock)
            .then(function() {
                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                console.log(gd.data[0]);
                console.log(parcatsViewModel.hoverinfoItems);

                gd.on('plotly_click', function(data) {
                    clickData = data;
                });

                // Click on the lowest category in the middle dimension (category "C")
                var dimStartX = parcatsViewModel.dimensions[1].x;
                var mouseY = parcatsViewModel.y + parcatsViewModel.dimensions[1].categories[2].y + 10,
                    mouseX = parcatsViewModel.x + dimStartX + dimWidth / 2;

                // Position mouse for start of drag
                // --------------------------------
                click(mouseX, mouseY);
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that click callback was called
                expect(clickData).toBeUndefined();
            })
            .catch(failTest)
            .then(done);
    });

    it('should fire on path click', function(done) {

        var clickData;

        Plotly.newPlot(gd, mock)
            .then(function() {
                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                gd.on('plotly_click', function(data) {
                    clickData = data;
                });

                // Click on the top path to the right of the lowest category in the middle dimension (category "C")
                var dimStartX = parcatsViewModel.dimensions[1].x;
                var mouseY = parcatsViewModel.y + parcatsViewModel.dimensions[1].categories[2].y + 10,
                    mouseX = parcatsViewModel.x + dimStartX + dimWidth + 10;

                // Position mouse for start of drag
                // --------------------------------
                click(mouseX, mouseY);
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that click callback was called
                expect(clickData).toBeDefined();

                // Check that the right points were reported
                var pts = clickData.points.sort(function(a, b) {
                    return a.pointNumber - b.pointNumber;
                });

                // Check points
                expect(pts).toEqual([
                    {curveNumber: 0, pointNumber: 5},
                    {curveNumber: 0, pointNumber: 8}]);
            })
            .catch(failTest)
            .then(done);
    });

    it('should NOT fire on path click if hoverinfo is skip', function(done) {

        var clickData;
        mock.data[0].hoverinfo = 'skip';

        Plotly.newPlot(gd, mock)
            .then(function() {
                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                gd.on('plotly_click', function(data) {
                    clickData = data;
                });

                // Click on the top path to the right of the lowest category in the middle dimension (category "C")
                var dimStartX = parcatsViewModel.dimensions[1].x;
                var mouseY = parcatsViewModel.y + parcatsViewModel.dimensions[1].categories[2].y + 10,
                    mouseX = parcatsViewModel.x + dimStartX + dimWidth + 10;

                // Position mouse for start of drag
                // --------------------------------
                click(mouseX, mouseY);
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that click callback was called
                expect(clickData).toBeUndefined();
            })
            .catch(failTest)
            .then(done);
    });
});

describe('Click events with hovermode color', function() {

    // Variable declarations
    // ---------------------
    // ### Trace level ###
    var gd,
        mock;

    // Fixtures
    // --------
    beforeEach(function() {
        gd = createGraphDiv();
        mock = Lib.extendDeep({}, require('@mocks/parcats_hovermode_color.json'));
    });

    afterEach(destroyGraphDiv);

    it('should fire on category click', function(done) {

        var clickData;
        Plotly.newPlot(gd, mock)
            .then(function() {
                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                gd.on('plotly_click', function(data) {
                    clickData = data;
                });

                // Click on the top of the lowest category in the middle dimension (category "C")
                var dimStartX = parcatsViewModel.dimensions[1].x;
                var mouseY = parcatsViewModel.y + parcatsViewModel.dimensions[1].categories[2].y + 10,
                    mouseX = parcatsViewModel.x + dimStartX + dimWidth / 2;

                // Position mouse for start of drag
                // --------------------------------
                click(mouseX, mouseY);
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that click callback was called
                expect(clickData).toBeDefined();

                // Check that the right points were reported
                var pts = clickData.points.sort(function(a, b) {
                    return a.pointNumber - b.pointNumber;
                });

                // Check points
                expect(pts).toEqual([
                    {curveNumber: 0, pointNumber: 5}]);
            })
            .catch(failTest)
            .then(done);
    });


    it('should fire on path click', function(done) {

        var clickData;

        Plotly.newPlot(gd, mock)
            .then(function() {
                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                gd.on('plotly_click', function(data) {
                    clickData = data;
                });

                // Click on the top path to the right of the lowest category in the middle dimension (category "C")
                var dimStartX = parcatsViewModel.dimensions[1].x;
                var mouseY = parcatsViewModel.y + parcatsViewModel.dimensions[1].categories[2].y + 10,
                    mouseX = parcatsViewModel.x + dimStartX + dimWidth + 10;

                // Position mouse for start of drag
                // --------------------------------
                click(mouseX, mouseY);
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that click callback was called
                expect(clickData).toBeDefined();

                // Check that the right points were reported
                var pts = clickData.points.sort(function(a, b) {
                    return a.pointNumber - b.pointNumber;
                });

                // Check points
                expect(pts).toEqual([
                    {curveNumber: 0, pointNumber: 5}]);
            })
            .catch(failTest)
            .then(done);
    });
});

describe('Hover events', function() {

    // Variable declarations
    // ---------------------
    // ### Trace level ###
    var gd,
        mock;

    // Fixtures
    // --------
    beforeEach(function() {
        gd = createGraphDiv();
        mock = Lib.extendDeep({}, require('@mocks/parcats_basic_freeform.json'));
    });

    afterEach(destroyGraphDiv);

    it('hover and unhover should fire on category', function(done) {

        var hoverData,
            unhoverData,
            mouseY0,
            mouseX0;

        Plotly.newPlot(gd, mock)
            .then(function() {
                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                gd.on('plotly_hover', function(data) {
                    hoverData = data;
                });

                gd.on('plotly_unhover', function(data) {
                    unhoverData = data;
                });

                // Hover over top of bottom category of middle dimension (category "C")
                var dimStartX = parcatsViewModel.dimensions[1].x;

                mouseY0 = parcatsViewModel.y + parcatsViewModel.dimensions[1].categories[2].y + 10;
                mouseX0 = parcatsViewModel.x + dimStartX + dimWidth / 2;

                // Position mouse for start of drag
                // --------------------------------
                mouseEvent('mousemove', mouseX0, mouseY0);
                mouseEvent('mouseover', mouseX0, mouseY0);
                Lib.clearThrottle();
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that hover callback was called
                expect(hoverData).toBeDefined();

                // Check that the right points were reported
                var pts = hoverData.points.sort(function(a, b) {
                    return a.pointNumber - b.pointNumber;
                });
                expect(pts).toEqual([
                    {curveNumber: 0, pointNumber: 4},
                    {curveNumber: 0, pointNumber: 5},
                    {curveNumber: 0, pointNumber: 8}]);

                // Check that unhover is still undefined
                expect(unhoverData).toBeUndefined();
            })
            .then(function() {
                // Unhover
                mouseEvent('mouseout', mouseX0, mouseY0);
                Lib.clearThrottle();
            })
            .then(function() {
                // Check that unhover callback was called
                expect(unhoverData).toBeDefined();

                // Check that the right points were reported
                var pts = unhoverData.points.sort(function(a, b) {
                    return a.pointNumber - b.pointNumber;
                });
                expect(pts).toEqual([
                    {curveNumber: 0, pointNumber: 4},
                    {curveNumber: 0, pointNumber: 5},
                    {curveNumber: 0, pointNumber: 8}]);
            })
            .catch(failTest)
            .then(done);
    });

    it('hover and unhover should fire on path', function(done) {

        var hoverData,
            unhoverData,
            mouseY0,
            mouseX0;

        Plotly.newPlot(gd, mock)
            .then(function() {
                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                gd.on('plotly_hover', function(data) {
                    hoverData = data;
                });

                gd.on('plotly_unhover', function(data) {
                    unhoverData = data;
                });


                var dimStartX = parcatsViewModel.dimensions[1].x;
                mouseY0 = parcatsViewModel.y + parcatsViewModel.dimensions[1].categories[2].y + 10;
                mouseX0 = parcatsViewModel.x + dimStartX + dimWidth + 10;

                // Position mouse for start of drag
                // --------------------------------
                mouseEvent('mousemove', mouseX0, mouseY0);
                mouseEvent('mouseover', mouseX0, mouseY0);
                Lib.clearThrottle();
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that hover callback was called
                expect(hoverData).toBeDefined();

                // Check that the right points were reported
                var pts = hoverData.points.sort(function(a, b) {
                    return a.pointNumber - b.pointNumber;
                });
                expect(pts).toEqual([
                    {curveNumber: 0, pointNumber: 5},
                    {curveNumber: 0, pointNumber: 8}]);

                // Check that unhover is still undefined
                expect(unhoverData).toBeUndefined();
            })
            .then(function() {
                // Unhover
                mouseEvent('mouseout', mouseX0, mouseY0);
                Lib.clearThrottle();
            })
            .then(function() {
                // Check that unhover callback was called
                expect(unhoverData).toBeDefined();

                // Check that the right points were reported
                var pts = unhoverData.points.sort(function(a, b) {
                    return a.pointNumber - b.pointNumber;
                });
                expect(pts).toEqual([
                    {curveNumber: 0, pointNumber: 5},
                    {curveNumber: 0, pointNumber: 8}]);
            })
            .catch(failTest)
            .then(done);
    });
});

describe('Hover events with hovermode color', function() {

    // Variable declarations
    // ---------------------
    // ### Trace level ###
    var gd,
        mock;

    // Fixtures
    // --------
    beforeEach(function() {
        gd = createGraphDiv();
        mock = Lib.extendDeep({}, require('@mocks/parcats_hovermode_color.json'));
    });

    afterEach(destroyGraphDiv);

    it('hover and unhover should fire on category hovermode color', function(done) {

        var hoverData,
            unhoverData,
            mouseY0,
            mouseX0;

        Plotly.newPlot(gd, mock)
            .then(function() {
                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                gd.on('plotly_hover', function(data) {
                    hoverData = data;
                });

                gd.on('plotly_unhover', function(data) {
                    unhoverData = data;
                });

                // Hover over top of bottom category of middle dimension (category "C")
                var dimStartX = parcatsViewModel.dimensions[1].x;

                mouseY0 = parcatsViewModel.y + parcatsViewModel.dimensions[1].categories[2].y + 10;
                mouseX0 = parcatsViewModel.x + dimStartX + dimWidth / 2;

                // Position mouse for start of drag
                // --------------------------------
                mouseEvent('mousemove', mouseX0, mouseY0);
                mouseEvent('mouseover', mouseX0, mouseY0);
                Lib.clearThrottle();
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that hover callback was called
                expect(hoverData).toBeDefined();

                // Check that the right points were reported
                var pts = hoverData.points.sort(function(a, b) {
                    return a.pointNumber - b.pointNumber;
                });
                expect(pts).toEqual([
                    {curveNumber: 0, pointNumber: 5}]);

                // Check that unhover is still undefined
                expect(unhoverData).toBeUndefined();
            })
            .then(function() {
                // Unhover
                mouseEvent('mouseout', mouseX0, mouseY0);
                Lib.clearThrottle();
            })
            .then(function() {
                // Check that unhover callback was called
                expect(unhoverData).toBeDefined();

                // Check that the right points were reported
                var pts = unhoverData.points.sort(function(a, b) {
                    return a.pointNumber - b.pointNumber;
                });
                expect(pts).toEqual([
                    {curveNumber: 0, pointNumber: 5}]);
            })
            .catch(failTest)
            .then(done);
    });

    it('hover and unhover should fire on path hovermode color', function(done) {

        var hoverData,
            unhoverData,
            mouseY0,
            mouseX0;

        Plotly.newPlot(gd, mock)
            .then(function() {
                /** @type {ParcatsViewModel} */
                var parcatsViewModel = d3.select('g.trace.parcats').datum();

                gd.on('plotly_hover', function(data) {
                    hoverData = data;
                });

                gd.on('plotly_unhover', function(data) {
                    unhoverData = data;
                });


                var dimStartX = parcatsViewModel.dimensions[1].x;
                mouseY0 = parcatsViewModel.y + parcatsViewModel.dimensions[1].categories[2].y + 10;
                mouseX0 = parcatsViewModel.x + dimStartX + dimWidth + 10;

                // Position mouse for start of drag
                // --------------------------------
                mouseEvent('mousemove', mouseX0, mouseY0);
                mouseEvent('mouseover', mouseX0, mouseY0);
                Lib.clearThrottle();
            })
            .then(delay(CALLBACK_DELAY))
            .then(function() {
                // Check that hover callback was called
                expect(hoverData).toBeDefined();

                // Check that the right points were reported
                var pts = hoverData.points.sort(function(a, b) {
                    return a.pointNumber - b.pointNumber;
                });
                expect(pts).toEqual([
                    {curveNumber: 0, pointNumber: 5}]);

                // Check that unhover is still undefined
                expect(unhoverData).toBeUndefined();
            })
            .then(function() {
                // Unhover
                mouseEvent('mouseout', mouseX0, mouseY0);
                Lib.clearThrottle();
            })
            .then(function() {
                // Check that unhover callback was called
                expect(unhoverData).toBeDefined();

                // Check that the right points were reported
                var pts = unhoverData.points.sort(function(a, b) {
                    return a.pointNumber - b.pointNumber;
                });
                expect(pts).toEqual([
                    {curveNumber: 0, pointNumber: 5}]);
            })
            .catch(failTest)
            .then(done);
    });
});
