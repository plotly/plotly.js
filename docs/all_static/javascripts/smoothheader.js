(function () {
    'use strict';
    var t = $('#herobanner').offset().top + 40;

    $('[data-scroll-to]').click(function (e) {
        var target = '#' + e.target.getAttribute('data-scroll-to');
        $('html, body').animate({
            scrollTop: $(target).offset().top - 30
        }, 0);
    });

    /*$(document).scroll(function(){
        var headerbar = $('.headerbar'),
            ghost = $('.headerbar-nav-item');

        if ($(this).scrollTop() >= t) {
            ghost.removeClass('transbar-link');
            headerbar.addClass('is-fixed');
        } else {
            ghost.addClass('transbar-link');
            headerbar.removeClass('is-fixed');
        }
    });*/
})();