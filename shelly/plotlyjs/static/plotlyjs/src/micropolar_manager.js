var manager = module.exports = {},
    Plotly = require('./plotly');

manager.framework = function(){
    var config, previousConfigClone, plot, convertedInput, container;
    var undoManager = new Plotly.util.UndoManager();
    function exports(_inputConfig, _container){
        if(_container) container = _container;
        d3.select(d3.select(container).node().parentNode).selectAll('.svg-container>*:not(.chart-root)').remove();
        config = (!config) ? _inputConfig : Plotly.micropolar.util.deepExtend(config, _inputConfig);
        if(!plot) plot = Plotly.micropolar.Axis();
        convertedInput = Plotly.micropolar.adapter.plotly().convert(config);
        plot.config(convertedInput).render(container);
        return config;
    }
    exports.isPolar = true;
    exports.svg = function(){ return plot.svg(); };
    exports.getConfig = function(){ return config; };
    exports.getLiveConfig = function(){
        return Plotly.micropolar.adapter.plotly().convert(plot.getLiveConfig(), true);
    };
    exports.getLiveScales = function(){ return {t: plot.angularScale(), r: plot.radialScale()}; };
    exports.setUndoPoint = function(){
        var that = this;
        var configClone = Plotly.micropolar.util.cloneJson(config);
        (function(_configClone, _previousConfigClone){
            undoManager.add({
                undo: function(){
                    //console.log('undo', _previousConfigClone);
                    if(_previousConfigClone) that(_previousConfigClone);
                },
                redo: function(){
                    //console.log('redo', _configClone);
                    that(_configClone);
                }
            });
        })(configClone, previousConfigClone);
        previousConfigClone = Plotly.micropolar.util.cloneJson(configClone);
    };
    exports.undo = function(){ undoManager.undo(); }; //Tabs.get().framework.undo()
    exports.redo = function(){ undoManager.redo(); };
    return exports;
};
