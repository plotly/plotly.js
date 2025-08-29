(function (w, d) {
    w.hljsln = {
        initLineNumbersOnLoad: initLineNumbersOnLoad,
        addLineNumbersForCode: addLineNumbersForCode
    };

    function initLineNumbersOnLoad() {
        if (d.readyState === 'interactive' || d.readyState === 'complete') {
            documentReady();
        } else {
            w.addEventListener('DOMContentLoaded', function () {
                documentReady();
            });
        }
    }

    function addLineNumbersForCode(html) {
        var text = html.replace(/<span[^>]*>|<\/span>/g, '');
        if (/\r|\n$/.test(text)) {
            html += '<span class="ln-eof"></span>';
        }
        var num = 1;
        html = html.replace(/\r\n|\r|\n/g, function (a) {
            num++;
            var numStr = ('  ' + num).substr(-3);
            return a + '<span class="ln-num" data-num="' + numStr + '"></span>';
        });
        html = '<span class="ln-num" data-num="  1"></span>' + html;
        return html;
    }

    function documentReady() {
        var elements = d.querySelectorAll('pre code');
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].className.indexOf('hljsln') == -1) {
                var html = elements[i].innerHTML;
                html = addLineNumbersForCode(html);
                elements[i].innerHTML = html;
                elements[i].className += ' hljsln';
            }
        }
    }
}(window, document));