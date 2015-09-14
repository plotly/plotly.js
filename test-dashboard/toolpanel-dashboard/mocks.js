'use strict';

var Tabs = {
    get: function() {
        return document.getElementById('yo').children[0];
    },
    fresh: function() {
        var anchor = document.getElementById('embedded-graph'),
            plotDiv = Tabs.get();
        if(plotDiv) anchor.removeChild(plotDiv);
        plotDiv = document.createElement('div');
        anchor.appendChild(plotDiv);
        return plotDiv;
    },
    initMinimal: function(container) {
        var $container = $(container),
            $tabMenu = $container.find('.js-minimal-tabs-menu');

        $container.find('.js-minimal-tabs-content').not(':first-child').hide();
        $tabMenu.find('li:first-child').addClass('current');

        var $fitRunBtn = $container.find('.js-run-fit-btn');

        $tabMenu.find('a').on('click', function() {
            $(this).parent().addClass('current');
            $(this).parent().siblings().removeClass('current');

            var tab = $(this).attr('href'),
                $tab = $container.find(tab),
                $otherTabs = $('.js-minimal-tabs-content').not(tab);

            $otherTabs.find('.js-has-error-tooltip').each(function() {
                // $(this).tipsy('hide');
            });
            $otherTabs.hide();
            // $fitRunBtn.tipsy('hide');

            $tab.show();
            $tab.find('.js-has-error-tooltip').each(function() {
                // $(this).tipsy('show');
            });
            // $fitRunBtn.tipsy('show');

            return false;
        });
    }
};

var Themes = {
    reTileLock: null,
    init: function () {}
};
