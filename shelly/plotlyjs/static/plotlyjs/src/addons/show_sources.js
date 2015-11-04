'use strict';

/* global $:false */
/* global pullf: false */

// TODO remove jQuery dependency

var Plotly = require('../plotly');
var d3 = require('d3');
var isNumeric = require('../isnumeric');

function showSources(td) {
    if(td._context && td._context.staticPlot) return;
    // show the sources of data in the active tab
    var allsources = td.sourcelist;
    if(!allsources) {
        getSources(td);
        return;
    }
    var container = d3.select(td).select('.js-sourcelinks'),
        extsources = allsources.filter(function(v){
            return isNumeric(v.ref_fid);
        }),
        firstsource = extsources[0] || allsources[0];
    container.text('');
    td.shouldshowsources = false;
    // no sources at all? quit
    if(!firstsource) return;

    // find number of unique internal and external sources
    var extobj = {}, plotlyobj = {};
    extsources.forEach(function(v){ extobj[v.url] = 1; });
    allsources.forEach(function(v){
        if(!isNumeric(v.ref_fid)) plotlyobj[v.ref_fid] = 1;
    });

    var fidparts = String(firstsource.ref_fid).split(':'),
        isplot = Plotly.Lib.isPlotDiv(td),
        workspace = !isplot || td._context.workspace,
        mainlink,
        extraslink;

    if(isplot) { // svg version for plots
        // only sources from the same user? also quit, if we're on a plot
        var thisuser = firstsource.fid.split(':')[0];
        if(allsources.every(function(v){
                return String(v.ref_fid).split(':')[0]===thisuser;
            })) {
            return;
        }
        td.shouldshowsources = true;

        /**
         * in case someone REALLY doesn't want to show sources
         * they can hide them...
         * but you can always see them by going to the grid
         */
        if(td.layout.hidesources) return;
        container.append('tspan').text('Source: ');
        mainlink = container.append('a').attr({'xlink:xlink:href':'#'});
        if(isNumeric(firstsource.ref_fid)) {
            mainlink.attr({
                'xlink:xlink:show':'new',
                'xlink:xlink:href':firstsource.ref_url
            });
        }
        else if(!workspace){
            mainlink.attr({
                'xlink:xlink:show':'new',
                'xlink:xlink:href':'/'+fidparts[1]+'/~'+fidparts[0]
            });
        }

        if(allsources.length>1) {
            container.append('tspan').text(' - ');
            extraslink = container.append('a')
                .attr({'xlink:xlink:href':'#'});
        }
    }
    else { // html version for grids (and scripts?)
        if(!container.node()) {
            container = d3.select(td).select('.grid-container')
                .append('div')
                    .attr('class', 'grid-sourcelinks js-sourcelinks');
        }
        container.append('span').text('Source: ');
        mainlink = container.append('a').attr({
            'href':'#',
            'class': 'link--impt'
        });
        if(isNumeric(firstsource.ref_fid)) {
            mainlink.attr({
                'target':'_blank',
                'href':firstsource.ref_url
            });
        }

        if(allsources.length>1) {
            container.append('span').text(' - ');
            extraslink = container.append('a')
                .attr({href: '#'})
                .classed('link--impt', true);
        }
    }

    mainlink.text(firstsource.ref_filename);

    function pullSource(){
        pullf({fid: firstsource.ref_fid});
        return false;
    }

    function fullSourcing(){
        var sourceModal = $('#sourceModal'),
            sourceViewer = sourceModal.find('#source-viewer').empty();

        sourceViewer.data('jsontree', '')
            .jsontree(JSON.stringify(sourceObj),
                {terminators: false, collapsibleOuter: false})
            .show();
        if(workspace) {
            sourceModal.find('[data-fid]').click(function(){
                sourceModal.modal('hide');
                pullf({fid:$(this).attr('data-fid')});
                return false;
            });
        }
        else {
            sourceModal.find('[data-fid]').each(function(){
                fidparts = $(this).attr('data-fid').split(':');
                $(this).attr({href:'/~'+fidparts[0]+'/'+fidparts[1]});
            });
            if(window.self !== window.top) {
                // in an iframe: basically fill the frame
                sourceModal.css({
                    left: '10px',
                    right: '10px',
                    bottom: '10px',
                    width: 'auto',
                    height: 'auto',
                    margin: 0
                });
            }
        }
        sourceModal.modal('show');

        sourceModal.find('.close')
            .off('click')
            .on('click', function(){
                sourceModal.modal('hide');
                return false;
            });
        return false;
    }

    if(!isplot || workspace) mainlink.on('click', pullSource);

    if(extraslink) extraslink.text('Full list').on('click', fullSourcing);

    function makeSourceObj(container, refByUid) {
        if(cnt < 0) {
            console.log('infinite loop?');
            return container;
        }
        cnt--;

        allsources.forEach(function(src){
            if(src.ref_by_uid === refByUid) {
                var linkval;
                if(isNumeric(src.ref_fid)) {
                    linkval = '<a href="' + src.ref_url + '" target="_blank">' +
                        src.ref_filename + '</a>';
                }
                else {
                    var refUser = src.ref_fid.split(':')[0],
                        fn = (refUser !== window.user ? refUser + ': ' : '') +
                            src.ref_filename;
                    linkval = '<a href="#" data-fid="' + src.ref_fid + '">'+
                        fn + '</a>';
                }
                container[linkval] = makeSourceObj({}, src.uid);
            }
        });
        return container;
    }

    var cnt = allsources.length,
        sourceObj = makeSourceObj({}, null);
}

function getSources(td) {
    var extrarefs = (td.ref_fids || []).join(',');
    if(!td.fid && !extrarefs) return;
    if(!window.PLOTLYENV || !window.PLOTLYENV.DOMAIN_WEBAPP) return;

    $.get('/getsources', {fid: td.fid, extrarefs:extrarefs}, function(res) {
        td.sourcelist = JSON.parse(res);
        if(!Array.isArray(td.sourcelist)) {
            console.log('sourcelist error',td.sourcelist);
            td.sourcelist = [];
        }
        showSources(td);
    });
}

module.exports = showSources;
