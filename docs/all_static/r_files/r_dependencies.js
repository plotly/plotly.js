/**
* @preserve HTML5 Shiv 3.7.2 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
*/
// Only run this code in IE 8
if (!!window.navigator.userAgent.match("MSIE 8")) {
    !function(a,b){function c(a,b){var c=a.createElement("p"),d=a.getElementsByTagName("head")[0]||a.documentElement;return c.innerHTML="x<style>"+b+"</style>",d.insertBefore(c.lastChild,d.firstChild)}function d(){var a=t.elements;return"string"==typeof a?a.split(" "):a}function e(a,b){var c=t.elements;"string"!=typeof c&&(c=c.join(" ")),"string"!=typeof a&&(a=a.join(" ")),t.elements=c+" "+a,j(b)}function f(a){var b=s[a[q]];return b||(b={},r++,a[q]=r,s[r]=b),b}function g(a,c,d){if(c||(c=b),l)return c.createElement(a);d||(d=f(c));var e;return e=d.cache[a]?d.cache[a].cloneNode():p.test(a)?(d.cache[a]=d.createElem(a)).cloneNode():d.createElem(a),!e.canHaveChildren||o.test(a)||e.tagUrn?e:d.frag.appendChild(e)}function h(a,c){if(a||(a=b),l)return a.createDocumentFragment();c=c||f(a);for(var e=c.frag.cloneNode(),g=0,h=d(),i=h.length;i>g;g++)e.createElement(h[g]);return e}function i(a,b){b.cache||(b.cache={},b.createElem=a.createElement,b.createFrag=a.createDocumentFragment,b.frag=b.createFrag()),a.createElement=function(c){return t.shivMethods?g(c,a,b):b.createElem(c)},a.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+d().join().replace(/[\w\-:]+/g,function(a){return b.createElem(a),b.frag.createElement(a),'c("'+a+'")'})+");return n}")(t,b.frag)}function j(a){a||(a=b);var d=f(a);return!t.shivCSS||k||d.hasCSS||(d.hasCSS=!!c(a,"article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}template{display:none}")),l||i(a,d),a}var k,l,m="3.7.2",n=a.html5||{},o=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,p=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,q="_html5shiv",r=0,s={};!function(){try{var a=b.createElement("a");a.innerHTML="<xyz></xyz>",k="hidden"in a,l=1==a.childNodes.length||function(){b.createElement("a");var a=b.createDocumentFragment();return"undefined"==typeof a.cloneNode||"undefined"==typeof a.createDocumentFragment||"undefined"==typeof a.createElement}()}catch(c){k=!0,l=!0}}();var t={elements:n.elements||"abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output picture progress section summary template time video",version:m,shivCSS:n.shivCSS!==!1,supportsUnknownElements:l,shivMethods:n.shivMethods!==!1,type:"default",shivDocument:j,createElement:g,createDocumentFragment:h,addElements:e};a.html5=t,j(b)}(this,document);
    };
    /*! Respond.js v1.4.2: min/max-width media query polyfill * Copyright 2013 Scott Jehl
     * Licensed under https://github.com/scottjehl/Respond/blob/master/LICENSE-MIT
     *  */
    
    // Only run this code in IE 8
    if (!!window.navigator.userAgent.match("MSIE 8")) {
    !function(a){"use strict";a.matchMedia=a.matchMedia||function(a){var b,c=a.documentElement,d=c.firstElementChild||c.firstChild,e=a.createElement("body"),f=a.createElement("div");return f.id="mq-test-1",f.style.cssText="position:absolute;top:-100em",e.style.background="none",e.appendChild(f),function(a){return f.innerHTML='&shy;<style media="'+a+'"> #mq-test-1 { width: 42px; }</style>',c.insertBefore(e,d),b=42===f.offsetWidth,c.removeChild(e),{matches:b,media:a}}}(a.document)}(this),function(a){"use strict";function b(){u(!0)}var c={};a.respond=c,c.update=function(){};var d=[],e=function(){var b=!1;try{b=new a.XMLHttpRequest}catch(c){b=new a.ActiveXObject("Microsoft.XMLHTTP")}return function(){return b}}(),f=function(a,b){var c=e();c&&(c.open("GET",a,!0),c.onreadystatechange=function(){4!==c.readyState||200!==c.status&&304!==c.status||b(c.responseText)},4!==c.readyState&&c.send(null))};if(c.ajax=f,c.queue=d,c.regex={media:/@media[^\{]+\{([^\{\}]*\{[^\}\{]*\})+/gi,keyframes:/@(?:\-(?:o|moz|webkit)\-)?keyframes[^\{]+\{(?:[^\{\}]*\{[^\}\{]*\})+[^\}]*\}/gi,urls:/(url\()['"]?([^\/\)'"][^:\)'"]+)['"]?(\))/g,findStyles:/@media *([^\{]+)\{([\S\s]+?)$/,only:/(only\s+)?([a-zA-Z]+)\s?/,minw:/\([\s]*min\-width\s*:[\s]*([\s]*[0-9\.]+)(px|em)[\s]*\)/,maxw:/\([\s]*max\-width\s*:[\s]*([\s]*[0-9\.]+)(px|em)[\s]*\)/},c.mediaQueriesSupported=a.matchMedia&&null!==a.matchMedia("only all")&&a.matchMedia("only all").matches,!c.mediaQueriesSupported){var g,h,i,j=a.document,k=j.documentElement,l=[],m=[],n=[],o={},p=30,q=j.getElementsByTagName("head")[0]||k,r=j.getElementsByTagName("base")[0],s=q.getElementsByTagName("link"),t=function(){var a,b=j.createElement("div"),c=j.body,d=k.style.fontSize,e=c&&c.style.fontSize,f=!1;return b.style.cssText="position:absolute;font-size:1em;width:1em",c||(c=f=j.createElement("body"),c.style.background="none"),k.style.fontSize="100%",c.style.fontSize="100%",c.appendChild(b),f&&k.insertBefore(c,k.firstChild),a=b.offsetWidth,f?k.removeChild(c):c.removeChild(b),k.style.fontSize=d,e&&(c.style.fontSize=e),a=i=parseFloat(a)},u=function(b){var c="clientWidth",d=k[c],e="CSS1Compat"===j.compatMode&&d||j.body[c]||d,f={},o=s[s.length-1],r=(new Date).getTime();if(b&&g&&p>r-g)return a.clearTimeout(h),h=a.setTimeout(u,p),void 0;g=r;for(var v in l)if(l.hasOwnProperty(v)){var w=l[v],x=w.minw,y=w.maxw,z=null===x,A=null===y,B="em";x&&(x=parseFloat(x)*(x.indexOf(B)>-1?i||t():1)),y&&(y=parseFloat(y)*(y.indexOf(B)>-1?i||t():1)),w.hasquery&&(z&&A||!(z||e>=x)||!(A||y>=e))||(f[w.media]||(f[w.media]=[]),f[w.media].push(m[w.rules]))}for(var C in n)n.hasOwnProperty(C)&&n[C]&&n[C].parentNode===q&&q.removeChild(n[C]);n.length=0;for(var D in f)if(f.hasOwnProperty(D)){var E=j.createElement("style"),F=f[D].join("\n");E.type="text/css",E.media=D,q.insertBefore(E,o.nextSibling),E.styleSheet?E.styleSheet.cssText=F:E.appendChild(j.createTextNode(F)),n.push(E)}},v=function(a,b,d){var e=a.replace(c.regex.keyframes,"").match(c.regex.media),f=e&&e.length||0;b=b.substring(0,b.lastIndexOf("/"));var g=function(a){return a.replace(c.regex.urls,"$1"+b+"$2$3")},h=!f&&d;b.length&&(b+="/"),h&&(f=1);for(var i=0;f>i;i++){var j,k,n,o;h?(j=d,m.push(g(a))):(j=e[i].match(c.regex.findStyles)&&RegExp.$1,m.push(RegExp.$2&&g(RegExp.$2))),n=j.split(","),o=n.length;for(var p=0;o>p;p++)k=n[p],l.push({media:k.split("(")[0].match(c.regex.only)&&RegExp.$2||"all",rules:m.length-1,hasquery:k.indexOf("(")>-1,minw:k.match(c.regex.minw)&&parseFloat(RegExp.$1)+(RegExp.$2||""),maxw:k.match(c.regex.maxw)&&parseFloat(RegExp.$1)+(RegExp.$2||"")})}u()},w=function(){if(d.length){var b=d.shift();f(b.href,function(c){v(c,b.href,b.media),o[b.href]=!0,a.setTimeout(function(){w()},0)})}},x=function(){for(var b=0;b<s.length;b++){var c=s[b],e=c.href,f=c.media,g=c.rel&&"stylesheet"===c.rel.toLowerCase();e&&g&&!o[e]&&(c.styleSheet&&c.styleSheet.rawCssText?(v(c.styleSheet.rawCssText,e,f),o[e]=!0):(!/^([a-zA-Z:]*\/\/)/.test(e)&&!r||e.replace(RegExp.$1,"").split("/")[0]===a.location.host)&&("//"===e.substring(0,2)&&(e=a.location.protocol+e),d.push({href:e,media:f})))}w()};x(),c.update=x,c.getEmValue=t,a.addEventListener?a.addEventListener("resize",b,!1):a.attachEvent&&a.attachEvent("onresize",b)}}(this);
    };
    
    
    /**
     * jQuery Plugin: Sticky Tabs
     *
     * @author Aidan Lister <aidan@php.net>
     * adapted by Ruben Arslan to activate parent tabs too
     * http://www.aidanlister.com/2014/03/persisting-the-tab-state-in-bootstrap/
     */
    (function($) {
      "use strict";
      $.fn.rmarkdownStickyTabs = function() {
        var context = this;
        // Show the tab corresponding with the hash in the URL, or the first tab
        var showStuffFromHash = function() {
          var hash = window.location.hash;
          var selector = hash ? 'a[href="' + hash + '"]' : 'li.active > a';
          var $selector = $(selector, context);
          if($selector.data('toggle') === "tab") {
            $selector.tab('show');
            // walk up the ancestors of this element, show any hidden tabs
            $selector.parents('.section.tabset').each(function(i, elm) {
              var link = $('a[href="#' + $(elm).attr('id') + '"]');
              if(link.data('toggle') === "tab") {
                link.tab("show");
              }
            });
          }
        };
    
    
        // Set the correct tab when the page loads
        showStuffFromHash(context);
    
        // Set the correct tab when a user uses their back/forward button
        $(window).on('hashchange', function() {
          showStuffFromHash(context);
        });
    
        // Change the URL when tabs are clicked
        $('a', context).on('click', function(e) {
          history.pushState(null, null, this.href);
          showStuffFromHash(context);
        });
    
        return this;
      };
    }(jQuery));
    
    window.buildTabsets = function(tocID) {
    
      // build a tabset from a section div with the .tabset class
      function buildTabset(tabset) {
    
        // check for fade and pills options
        var fade = tabset.hasClass("tabset-fade");
        var pills = tabset.hasClass("tabset-pills");
        var navClass = pills ? "nav-pills" : "nav-tabs";
    
        // determine the heading level of the tabset and tabs
        var match = tabset.attr('class').match(/level(\d) /);
        if (match === null)
          return;
        var tabsetLevel = Number(match[1]);
        var tabLevel = tabsetLevel + 1;
    
        // find all subheadings immediately below
        var tabs = tabset.find("div.section.level" + tabLevel);
        if (!tabs.length)
          return;
    
        // create tablist and tab-content elements
        var tabList = $('<ul class="nav ' + navClass + '" role="tablist"></ul>');
        $(tabs[0]).before(tabList);
        var tabContent = $('<div class="tab-content"></div>');
        $(tabs[0]).before(tabContent);
    
        // build the tabset
        var activeTab = 0;
        tabs.each(function(i) {
    
          // get the tab div
          var tab = $(tabs[i]);
    
          // get the id then sanitize it for use with bootstrap tabs
          var id = tab.attr('id');
    
          // see if this is marked as the active tab
          if (tab.hasClass('active'))
            activeTab = i;
    
          // remove any table of contents entries associated with
          // this ID (since we'll be removing the heading element)
          $("div#" + tocID + " li a[href='#" + id + "']").parent().remove();
    
          // sanitize the id for use with bootstrap tabs
          id = id.replace(/[.\/?&!#<>]/g, '').replace(/\s/g, '_');
          tab.attr('id', id);
    
          // get the heading element within it, grab it's text, then remove it
          var heading = tab.find('h' + tabLevel + ':first');
          var headingText = heading.html();
          heading.remove();
    
          // build and append the tab list item
          var a = $('<a role="tab" data-toggle="tab">' + headingText + '</a>');
          a.attr('href', '#' + id);
          a.attr('aria-controls', id);
          var li = $('<li role="presentation"></li>');
          li.append(a);
          tabList.append(li);
    
          // set it's attributes
          tab.attr('role', 'tabpanel');
          tab.addClass('tab-pane');
          tab.addClass('tabbed-pane');
          if (fade)
            tab.addClass('fade');
    
          // move it into the tab content div
          tab.detach().appendTo(tabContent);
        });
    
        // set active tab
        $(tabList.children('li')[activeTab]).addClass('active');
        var active = $(tabContent.children('div.section')[activeTab]);
        active.addClass('active');
        if (fade)
          active.addClass('in');
    
        if (tabset.hasClass("tabset-sticky"))
          tabset.rmarkdownStickyTabs();
      }
    
      // convert section divs with the .tabset class to tabsets
      var tabsets = $("div.section.tabset");
      tabsets.each(function(i) {
        buildTabset($(tabsets[i]));
      });
    };
    
    (function() {
      // If window.HTMLWidgets is already defined, then use it; otherwise create a
      // new object. This allows preceding code to set options that affect the
      // initialization process (though none currently exist).
      window.HTMLWidgets = window.HTMLWidgets || {};
    
      // See if we're running in a viewer pane. If not, we're in a web browser.
      var viewerMode = window.HTMLWidgets.viewerMode =
          /\bviewer_pane=1\b/.test(window.location);
    
      // See if we're running in Shiny mode. If not, it's a static document.
      // Note that static widgets can appear in both Shiny and static modes, but
      // obviously, Shiny widgets can only appear in Shiny apps/documents.
      var shinyMode = window.HTMLWidgets.shinyMode =
          typeof(window.Shiny) !== "undefined" && !!window.Shiny.outputBindings;
    
      // We can't count on jQuery being available, so we implement our own
      // version if necessary.
      function querySelectorAll(scope, selector) {
        if (typeof(jQuery) !== "undefined" && scope instanceof jQuery) {
          return scope.find(selector);
        }
        if (scope.querySelectorAll) {
          return scope.querySelectorAll(selector);
        }
      }
    
      function asArray(value) {
        if (value === null)
          return [];
        if ($.isArray(value))
          return value;
        return [value];
      }
    
      // Implement jQuery's extend
      function extend(target /*, ... */) {
        if (arguments.length == 1) {
          return target;
        }
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];
          for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
              target[prop] = source[prop];
            }
          }
        }
        return target;
      }
    
      // IE8 doesn't support Array.forEach.
      function forEach(values, callback, thisArg) {
        if (values.forEach) {
          values.forEach(callback, thisArg);
        } else {
          for (var i = 0; i < values.length; i++) {
            callback.call(thisArg, values[i], i, values);
          }
        }
      }
    
      // Replaces the specified method with the return value of funcSource.
      //
      // Note that funcSource should not BE the new method, it should be a function
      // that RETURNS the new method. funcSource receives a single argument that is
      // the overridden method, it can be called from the new method. The overridden
      // method can be called like a regular function, it has the target permanently
      // bound to it so "this" will work correctly.
      function overrideMethod(target, methodName, funcSource) {
        var superFunc = target[methodName] || function() {};
        var superFuncBound = function() {
          return superFunc.apply(target, arguments);
        };
        target[methodName] = funcSource(superFuncBound);
      }
    
      // Add a method to delegator that, when invoked, calls
      // delegatee.methodName. If there is no such method on
      // the delegatee, but there was one on delegator before
      // delegateMethod was called, then the original version
      // is invoked instead.
      // For example:
      //
      // var a = {
      //   method1: function() { console.log('a1'); }
      //   method2: function() { console.log('a2'); }
      // };
      // var b = {
      //   method1: function() { console.log('b1'); }
      // };
      // delegateMethod(a, b, "method1");
      // delegateMethod(a, b, "method2");
      // a.method1();
      // a.method2();
      //
      // The output would be "b1", "a2".
      function delegateMethod(delegator, delegatee, methodName) {
        var inherited = delegator[methodName];
        delegator[methodName] = function() {
          var target = delegatee;
          var method = delegatee[methodName];
    
          // The method doesn't exist on the delegatee. Instead,
          // call the method on the delegator, if it exists.
          if (!method) {
            target = delegator;
            method = inherited;
          }
    
          if (method) {
            return method.apply(target, arguments);
          }
        };
      }
    
      // Implement a vague facsimilie of jQuery's data method
      function elementData(el, name, value) {
        if (arguments.length == 2) {
          return el["htmlwidget_data_" + name];
        } else if (arguments.length == 3) {
          el["htmlwidget_data_" + name] = value;
          return el;
        } else {
          throw new Error("Wrong number of arguments for elementData: " +
            arguments.length);
        }
      }
    
      // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
      function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      }
    
      function hasClass(el, className) {
        var re = new RegExp("\\b" + escapeRegExp(className) + "\\b");
        return re.test(el.className);
      }
    
      // elements - array (or array-like object) of HTML elements
      // className - class name to test for
      // include - if true, only return elements with given className;
      //   if false, only return elements *without* given className
      function filterByClass(elements, className, include) {
        var results = [];
        for (var i = 0; i < elements.length; i++) {
          if (hasClass(elements[i], className) == include)
            results.push(elements[i]);
        }
        return results;
      }
    
      function on(obj, eventName, func) {
        if (obj.addEventListener) {
          obj.addEventListener(eventName, func, false);
        } else if (obj.attachEvent) {
          obj.attachEvent(eventName, func);
        }
      }
    
      function off(obj, eventName, func) {
        if (obj.removeEventListener)
          obj.removeEventListener(eventName, func, false);
        else if (obj.detachEvent) {
          obj.detachEvent(eventName, func);
        }
      }
    
      // Translate array of values to top/right/bottom/left, as usual with
      // the "padding" CSS property
      // https://developer.mozilla.org/en-US/docs/Web/CSS/padding
      function unpackPadding(value) {
        if (typeof(value) === "number")
          value = [value];
        if (value.length === 1) {
          return {top: value[0], right: value[0], bottom: value[0], left: value[0]};
        }
        if (value.length === 2) {
          return {top: value[0], right: value[1], bottom: value[0], left: value[1]};
        }
        if (value.length === 3) {
          return {top: value[0], right: value[1], bottom: value[2], left: value[1]};
        }
        if (value.length === 4) {
          return {top: value[0], right: value[1], bottom: value[2], left: value[3]};
        }
      }
    
      // Convert an unpacked padding object to a CSS value
      function paddingToCss(paddingObj) {
        return paddingObj.top + "px " + paddingObj.right + "px " + paddingObj.bottom + "px " + paddingObj.left + "px";
      }
    
      // Makes a number suitable for CSS
      function px(x) {
        if (typeof(x) === "number")
          return x + "px";
        else
          return x;
      }
    
      // Retrieves runtime widget sizing information for an element.
      // The return value is either null, or an object with fill, padding,
      // defaultWidth, defaultHeight fields.
      function sizingPolicy(el) {
        var sizingEl = document.querySelector("script[data-for='" + el.id + "'][type='application/htmlwidget-sizing']");
        if (!sizingEl)
          return null;
        var sp = JSON.parse(sizingEl.textContent || sizingEl.text || "{}");
        if (viewerMode) {
          return sp.viewer;
        } else {
          return sp.browser;
        }
      }
    
      // @param tasks Array of strings (or falsy value, in which case no-op).
      //   Each element must be a valid JavaScript expression that yields a
      //   function. Or, can be an array of objects with "code" and "data"
      //   properties; in this case, the "code" property should be a string
      //   of JS that's an expr that yields a function, and "data" should be
      //   an object that will be added as an additional argument when that
      //   function is called.
      // @param target The object that will be "this" for each function
      //   execution.
      // @param args Array of arguments to be passed to the functions. (The
      //   same arguments will be passed to all functions.)
      function evalAndRun(tasks, target, args) {
        if (tasks) {
          forEach(tasks, function(task) {
            var theseArgs = args;
            if (typeof(task) === "object") {
              theseArgs = theseArgs.concat([task.data]);
              task = task.code;
            }
            var taskFunc = tryEval(task);
            if (typeof(taskFunc) !== "function") {
              throw new Error("Task must be a function! Source:\n" + task);
            }
            taskFunc.apply(target, theseArgs);
          });
        }
      }
    
      // Attempt eval() both with and without enclosing in parentheses.
      // Note that enclosing coerces a function declaration into
      // an expression that eval() can parse
      // (otherwise, a SyntaxError is thrown)
      function tryEval(code) {
        var result = null;
        try {
          result = eval(code);
        } catch(error) {
          if (!error instanceof SyntaxError) {
            throw error;
          }
          try {
            result = eval("(" + code + ")");
          } catch(e) {
            if (e instanceof SyntaxError) {
              throw error;
            } else {
              throw e;
            }
          }
        }
        return result;
      }
    
      function initSizing(el) {
        var sizing = sizingPolicy(el);
        if (!sizing)
          return;
    
        var cel = document.getElementById("htmlwidget_container");
        if (!cel)
          return;
    
        if (typeof(sizing.padding) !== "undefined") {
          document.body.style.margin = "0";
          document.body.style.padding = paddingToCss(unpackPadding(sizing.padding));
        }
    
        if (sizing.fill) {
          document.body.style.overflow = "hidden";
          document.body.style.width = "100%";
          document.body.style.height = "100%";
          document.documentElement.style.width = "100%";
          document.documentElement.style.height = "100%";
          if (cel) {
            cel.style.position = "absolute";
            var pad = unpackPadding(sizing.padding);
            cel.style.top = pad.top + "px";
            cel.style.right = pad.right + "px";
            cel.style.bottom = pad.bottom + "px";
            cel.style.left = pad.left + "px";
            el.style.width = "100%";
            el.style.height = "100%";
          }
    
          return {
            getWidth: function() { return cel.offsetWidth; },
            getHeight: function() { return cel.offsetHeight; }
          };
    
        } else {
          el.style.width = px(sizing.width);
          el.style.height = px(sizing.height);
    
          return {
            getWidth: function() { return el.offsetWidth; },
            getHeight: function() { return el.offsetHeight; }
          };
        }
      }
    
      // Default implementations for methods
      var defaults = {
        find: function(scope) {
          return querySelectorAll(scope, "." + this.name);
        },
        renderError: function(el, err) {
          var $el = $(el);
    
          this.clearError(el);
    
          // Add all these error classes, as Shiny does
          var errClass = "shiny-output-error";
          if (err.type !== null) {
            // use the classes of the error condition as CSS class names
            errClass = errClass + " " + $.map(asArray(err.type), function(type) {
              return errClass + "-" + type;
            }).join(" ");
          }
          errClass = errClass + " htmlwidgets-error";
    
          // Is el inline or block? If inline or inline-block, just display:none it
          // and add an inline error.
          var display = $el.css("display");
          $el.data("restore-display-mode", display);
    
          if (display === "inline" || display === "inline-block") {
            $el.hide();
            if (err.message !== "") {
              var errorSpan = $("<span>").addClass(errClass);
              errorSpan.text(err.message);
              $el.after(errorSpan);
            }
          } else if (display === "block") {
            // If block, add an error just after the el, set visibility:none on the
            // el, and position the error to be on top of the el.
            // Mark it with a unique ID and CSS class so we can remove it later.
            $el.css("visibility", "hidden");
            if (err.message !== "") {
              var errorDiv = $("<div>").addClass(errClass).css("position", "absolute")
                .css("top", el.offsetTop)
                .css("left", el.offsetLeft)
                // setting width can push out the page size, forcing otherwise
                // unnecessary scrollbars to appear and making it impossible for
                // the element to shrink; so use max-width instead
                .css("maxWidth", el.offsetWidth)
                .css("height", el.offsetHeight);
              errorDiv.text(err.message);
              $el.after(errorDiv);
    
              // Really dumb way to keep the size/position of the error in sync with
              // the parent element as the window is resized or whatever.
              var intId = setInterval(function() {
                if (!errorDiv[0].parentElement) {
                  clearInterval(intId);
                  return;
                }
                errorDiv
                  .css("top", el.offsetTop)
                  .css("left", el.offsetLeft)
                  .css("maxWidth", el.offsetWidth)
                  .css("height", el.offsetHeight);
              }, 500);
            }
          }
        },
        clearError: function(el) {
          var $el = $(el);
          var display = $el.data("restore-display-mode");
          $el.data("restore-display-mode", null);
    
          if (display === "inline" || display === "inline-block") {
            if (display)
              $el.css("display", display);
            $(el.nextSibling).filter(".htmlwidgets-error").remove();
          } else if (display === "block"){
            $el.css("visibility", "inherit");
            $(el.nextSibling).filter(".htmlwidgets-error").remove();
          }
        },
        sizing: {}
      };
    
      // Called by widget bindings to register a new type of widget. The definition
      // object can contain the following properties:
      // - name (required) - A string indicating the binding name, which will be
      //   used by default as the CSS classname to look for.
      // - initialize (optional) - A function(el) that will be called once per
      //   widget element; if a value is returned, it will be passed as the third
      //   value to renderValue.
      // - renderValue (required) - A function(el, data, initValue) that will be
      //   called with data. Static contexts will cause this to be called once per
      //   element; Shiny apps will cause this to be called multiple times per
      //   element, as the data changes.
      window.HTMLWidgets.widget = function(definition) {
        if (!definition.name) {
          throw new Error("Widget must have a name");
        }
        if (!definition.type) {
          throw new Error("Widget must have a type");
        }
        // Currently we only support output widgets
        if (definition.type !== "output") {
          throw new Error("Unrecognized widget type '" + definition.type + "'");
        }
        // TODO: Verify that .name is a valid CSS classname
    
        // Support new-style instance-bound definitions. Old-style class-bound
        // definitions have one widget "object" per widget per type/class of
        // widget; the renderValue and resize methods on such widget objects
        // take el and instance arguments, because the widget object can't
        // store them. New-style instance-bound definitions have one widget
        // object per widget instance; the definition that's passed in doesn't
        // provide renderValue or resize methods at all, just the single method
        //   factory(el, width, height)
        // which returns an object that has renderValue(x) and resize(w, h).
        // This enables a far more natural programming style for the widget
        // author, who can store per-instance state using either OO-style
        // instance fields or functional-style closure variables (I guess this
        // is in contrast to what can only be called C-style pseudo-OO which is
        // what we required before).
        if (definition.factory) {
          definition = createLegacyDefinitionAdapter(definition);
        }
    
        if (!definition.renderValue) {
          throw new Error("Widget must have a renderValue function");
        }
    
        // For static rendering (non-Shiny), use a simple widget registration
        // scheme. We also use this scheme for Shiny apps/documents that also
        // contain static widgets.
        window.HTMLWidgets.widgets = window.HTMLWidgets.widgets || [];
        // Merge defaults into the definition; don't mutate the original definition.
        var staticBinding = extend({}, defaults, definition);
        overrideMethod(staticBinding, "find", function(superfunc) {
          return function(scope) {
            var results = superfunc(scope);
            // Filter out Shiny outputs, we only want the static kind
            return filterByClass(results, "html-widget-output", false);
          };
        });
        window.HTMLWidgets.widgets.push(staticBinding);
    
        if (shinyMode) {
          // Shiny is running. Register the definition with an output binding.
          // The definition itself will not be the output binding, instead
          // we will make an output binding object that delegates to the
          // definition. This is because we foolishly used the same method
          // name (renderValue) for htmlwidgets definition and Shiny bindings
          // but they actually have quite different semantics (the Shiny
          // bindings receive data that includes lots of metadata that it
          // strips off before calling htmlwidgets renderValue). We can't
          // just ignore the difference because in some widgets it's helpful
          // to call this.renderValue() from inside of resize(), and if
          // we're not delegating, then that call will go to the Shiny
          // version instead of the htmlwidgets version.
    
          // Merge defaults with definition, without mutating either.
          var bindingDef = extend({}, defaults, definition);
    
          // This object will be our actual Shiny binding.
          var shinyBinding = new Shiny.OutputBinding();
    
          // With a few exceptions, we'll want to simply use the bindingDef's
          // version of methods if they are available, otherwise fall back to
          // Shiny's defaults. NOTE: If Shiny's output bindings gain additional
          // methods in the future, and we want them to be overrideable by
          // HTMLWidget binding definitions, then we'll need to add them to this
          // list.
          delegateMethod(shinyBinding, bindingDef, "getId");
          delegateMethod(shinyBinding, bindingDef, "onValueChange");
          delegateMethod(shinyBinding, bindingDef, "onValueError");
          delegateMethod(shinyBinding, bindingDef, "renderError");
          delegateMethod(shinyBinding, bindingDef, "clearError");
          delegateMethod(shinyBinding, bindingDef, "showProgress");
    
          // The find, renderValue, and resize are handled differently, because we
          // want to actually decorate the behavior of the bindingDef methods.
    
          shinyBinding.find = function(scope) {
            var results = bindingDef.find(scope);
    
            // Only return elements that are Shiny outputs, not static ones
            var dynamicResults = results.filter(".html-widget-output");
    
            // It's possible that whatever caused Shiny to think there might be
            // new dynamic outputs, also caused there to be new static outputs.
            // Since there might be lots of different htmlwidgets bindings, we
            // schedule execution for later--no need to staticRender multiple
            // times.
            if (results.length !== dynamicResults.length)
              scheduleStaticRender();
    
            return dynamicResults;
          };
    
          // Wrap renderValue to handle initialization, which unfortunately isn't
          // supported natively by Shiny at the time of this writing.
    
          shinyBinding.renderValue = function(el, data) {
            Shiny.renderDependencies(data.deps);
            // Resolve strings marked as javascript literals to objects
            if (!(data.evals instanceof Array)) data.evals = [data.evals];
            for (var i = 0; data.evals && i < data.evals.length; i++) {
              window.HTMLWidgets.evaluateStringMember(data.x, data.evals[i]);
            }
            if (!bindingDef.renderOnNullValue) {
              if (data.x === null) {
                el.style.visibility = "hidden";
                return;
              } else {
                el.style.visibility = "inherit";
              }
            }
            if (!elementData(el, "initialized")) {
              initSizing(el);
    
              elementData(el, "initialized", true);
              if (bindingDef.initialize) {
                var result = bindingDef.initialize(el, el.offsetWidth,
                  el.offsetHeight);
                elementData(el, "init_result", result);
              }
            }
            bindingDef.renderValue(el, data.x, elementData(el, "init_result"));
            evalAndRun(data.jsHooks.render, elementData(el, "init_result"), [el, data.x]);
          };
    
          // Only override resize if bindingDef implements it
          if (bindingDef.resize) {
            shinyBinding.resize = function(el, width, height) {
              // Shiny can call resize before initialize/renderValue have been
              // called, which doesn't make sense for widgets.
              if (elementData(el, "initialized")) {
                bindingDef.resize(el, width, height, elementData(el, "init_result"));
              }
            };
          }
    
          Shiny.outputBindings.register(shinyBinding, bindingDef.name);
        }
      };
    
      var scheduleStaticRenderTimerId = null;
      function scheduleStaticRender() {
        if (!scheduleStaticRenderTimerId) {
          scheduleStaticRenderTimerId = setTimeout(function() {
            scheduleStaticRenderTimerId = null;
            window.HTMLWidgets.staticRender();
          }, 1);
        }
      }
    
      // Render static widgets after the document finishes loading
      // Statically render all elements that are of this widget's class
      window.HTMLWidgets.staticRender = function() {
        var bindings = window.HTMLWidgets.widgets || [];
        forEach(bindings, function(binding) {
          var matches = binding.find(document.documentElement);
          forEach(matches, function(el) {
            var sizeObj = initSizing(el, binding);
    
            if (hasClass(el, "html-widget-static-bound"))
              return;
            el.className = el.className + " html-widget-static-bound";
    
            var initResult;
            if (binding.initialize) {
              initResult = binding.initialize(el,
                sizeObj ? sizeObj.getWidth() : el.offsetWidth,
                sizeObj ? sizeObj.getHeight() : el.offsetHeight
              );
              elementData(el, "init_result", initResult);
            }
    
            if (binding.resize) {
              var lastSize = {
                w: sizeObj ? sizeObj.getWidth() : el.offsetWidth,
                h: sizeObj ? sizeObj.getHeight() : el.offsetHeight
              };
              var resizeHandler = function(e) {
                var size = {
                  w: sizeObj ? sizeObj.getWidth() : el.offsetWidth,
                  h: sizeObj ? sizeObj.getHeight() : el.offsetHeight
                };
                if (size.w === 0 && size.h === 0)
                  return;
                if (size.w === lastSize.w && size.h === lastSize.h)
                  return;
                lastSize = size;
                binding.resize(el, size.w, size.h, initResult);
              };
    
              on(window, "resize", resizeHandler);
    
              // This is needed for cases where we're running in a Shiny
              // app, but the widget itself is not a Shiny output, but
              // rather a simple static widget. One example of this is
              // an rmarkdown document that has runtime:shiny and widget
              // that isn't in a render function. Shiny only knows to
              // call resize handlers for Shiny outputs, not for static
              // widgets, so we do it ourselves.
              if (window.jQuery) {
                window.jQuery(document).on(
                  "shown.htmlwidgets shown.bs.tab.htmlwidgets shown.bs.collapse.htmlwidgets",
                  resizeHandler
                );
                window.jQuery(document).on(
                  "hidden.htmlwidgets hidden.bs.tab.htmlwidgets hidden.bs.collapse.htmlwidgets",
                  resizeHandler
                );
              }
    
              // This is needed for the specific case of ioslides, which
              // flips slides between display:none and display:block.
              // Ideally we would not have to have ioslide-specific code
              // here, but rather have ioslides raise a generic event,
              // but the rmarkdown package just went to CRAN so the
              // window to getting that fixed may be long.
              if (window.addEventListener) {
                // It's OK to limit this to window.addEventListener
                // browsers because ioslides itself only supports
                // such browsers.
                on(document, "slideenter", resizeHandler);
                on(document, "slideleave", resizeHandler);
              }
            }
    
            var scriptData = document.querySelector("script[data-for='" + el.id + "'][type='application/json']");
            if (scriptData) {
              var data = JSON.parse(scriptData.textContent || scriptData.text);
              // Resolve strings marked as javascript literals to objects
              if (!(data.evals instanceof Array)) data.evals = [data.evals];
              for (var k = 0; data.evals && k < data.evals.length; k++) {
                window.HTMLWidgets.evaluateStringMember(data.x, data.evals[k]);
              }
              binding.renderValue(el, data.x, initResult);
              evalAndRun(data.jsHooks.render, initResult, [el, data.x]);
            }
          });
        });
    
        invokePostRenderHandlers();
      }
    
    
      function has_jQuery3() {
        if (!window.jQuery) {
          return false;
        }
        var $version = window.jQuery.fn.jquery;
        var $major_version = parseInt($version.split(".")[0]);
        return $major_version >= 3;
      }
    
      /*
      / Shiny 1.4 bumped jQuery from 1.x to 3.x which means jQuery's
      / on-ready handler (i.e., $(fn)) is now asyncronous (i.e., it now
      / really means $(setTimeout(fn)).
      / https://jquery.com/upgrade-guide/3.0/#breaking-change-document-ready-handlers-are-now-asynchronous
      /
      / Since Shiny uses $() to schedule initShiny, shiny>=1.4 calls initShiny
      / one tick later than it did before, which means staticRender() is
      / called renderValue() earlier than (advanced) widget authors might be expecting.
      / https://github.com/rstudio/shiny/issues/2630
      /
      / For a concrete example, leaflet has some methods (e.g., updateBounds)
      / which reference Shiny methods registered in initShiny (e.g., setInputValue).
      / Since leaflet is privy to this life-cycle, it knows to use setTimeout() to
      / delay execution of those methods (until Shiny methods are ready)
      / https://github.com/rstudio/leaflet/blob/18ec981/javascript/src/index.js#L266-L268
      /
      / Ideally widget authors wouldn't need to use this setTimeout() hack that
      / leaflet uses to call Shiny methods on a staticRender(). In the long run,
      / the logic initShiny should be broken up so that method registration happens
      / right away, but binding happens later.
      */
      function maybeStaticRenderLater() {
        if (shinyMode && has_jQuery3()) {
          window.jQuery(window.HTMLWidgets.staticRender);
        } else {
          window.HTMLWidgets.staticRender();
        }
      }
    
      if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", function() {
          document.removeEventListener("DOMContentLoaded", arguments.callee, false);
          maybeStaticRenderLater();
        }, false);
      } else if (document.attachEvent) {
        document.attachEvent("onreadystatechange", function() {
          if (document.readyState === "complete") {
            document.detachEvent("onreadystatechange", arguments.callee);
            maybeStaticRenderLater();
          }
        });
      }
    
    
      window.HTMLWidgets.getAttachmentUrl = function(depname, key) {
        // If no key, default to the first item
        if (typeof(key) === "undefined")
          key = 1;
    
        var link = document.getElementById(depname + "-" + key + "-attachment");
        if (!link) {
          throw new Error("Attachment " + depname + "/" + key + " not found in document");
        }
        return link.getAttribute("href");
      };
    
      window.HTMLWidgets.dataframeToD3 = function(df) {
        var names = [];
        var length;
        for (var name in df) {
            if (df.hasOwnProperty(name))
                names.push(name);
            if (typeof(df[name]) !== "object" || typeof(df[name].length) === "undefined") {
                throw new Error("All fields must be arrays");
            } else if (typeof(length) !== "undefined" && length !== df[name].length) {
                throw new Error("All fields must be arrays of the same length");
            }
            length = df[name].length;
        }
        var results = [];
        var item;
        for (var row = 0; row < length; row++) {
            item = {};
            for (var col = 0; col < names.length; col++) {
                item[names[col]] = df[names[col]][row];
            }
            results.push(item);
        }
        return results;
      };
    
      window.HTMLWidgets.transposeArray2D = function(array) {
          if (array.length === 0) return array;
          var newArray = array[0].map(function(col, i) {
              return array.map(function(row) {
                  return row[i]
              })
          });
          return newArray;
      };
      // Split value at splitChar, but allow splitChar to be escaped
      // using escapeChar. Any other characters escaped by escapeChar
      // will be included as usual (including escapeChar itself).
      function splitWithEscape(value, splitChar, escapeChar) {
        var results = [];
        var escapeMode = false;
        var currentResult = "";
        for (var pos = 0; pos < value.length; pos++) {
          if (!escapeMode) {
            if (value[pos] === splitChar) {
              results.push(currentResult);
              currentResult = "";
            } else if (value[pos] === escapeChar) {
              escapeMode = true;
            } else {
              currentResult += value[pos];
            }
          } else {
            currentResult += value[pos];
            escapeMode = false;
          }
        }
        if (currentResult !== "") {
          results.push(currentResult);
        }
        return results;
      }
      // Function authored by Yihui/JJ Allaire
      window.HTMLWidgets.evaluateStringMember = function(o, member) {
        var parts = splitWithEscape(member, '.', '\\');
        for (var i = 0, l = parts.length; i < l; i++) {
          var part = parts[i];
          // part may be a character or 'numeric' member name
          if (o !== null && typeof o === "object" && part in o) {
            if (i == (l - 1)) { // if we are at the end of the line then evalulate
              if (typeof o[part] === "string")
                o[part] = tryEval(o[part]);
            } else { // otherwise continue to next embedded object
              o = o[part];
            }
          }
        }
      };
    
      // Retrieve the HTMLWidget instance (i.e. the return value of an
      // HTMLWidget binding's initialize() or factory() function)
      // associated with an element, or null if none.
      window.HTMLWidgets.getInstance = function(el) {
        return elementData(el, "init_result");
      };
    
      // Finds the first element in the scope that matches the selector,
      // and returns the HTMLWidget instance (i.e. the return value of
      // an HTMLWidget binding's initialize() or factory() function)
      // associated with that element, if any. If no element matches the
      // selector, or the first matching element has no HTMLWidget
      // instance associated with it, then null is returned.
      //
      // The scope argument is optional, and defaults to window.document.
      window.HTMLWidgets.find = function(scope, selector) {
        if (arguments.length == 1) {
          selector = scope;
          scope = document;
        }
    
        var el = scope.querySelector(selector);
        if (el === null) {
          return null;
        } else {
          return window.HTMLWidgets.getInstance(el);
        }
      };
    
      // Finds all elements in the scope that match the selector, and
      // returns the HTMLWidget instances (i.e. the return values of
      // an HTMLWidget binding's initialize() or factory() function)
      // associated with the elements, in an array. If elements that
      // match the selector don't have an associated HTMLWidget
      // instance, the returned array will contain nulls.
      //
      // The scope argument is optional, and defaults to window.document.
      window.HTMLWidgets.findAll = function(scope, selector) {
        if (arguments.length == 1) {
          selector = scope;
          scope = document;
        }
    
        var nodes = scope.querySelectorAll(selector);
        var results = [];
        for (var i = 0; i < nodes.length; i++) {
          results.push(window.HTMLWidgets.getInstance(nodes[i]));
        }
        return results;
      };
    
      var postRenderHandlers = [];
      function invokePostRenderHandlers() {
        while (postRenderHandlers.length) {
          var handler = postRenderHandlers.shift();
          if (handler) {
            handler();
          }
        }
      }
    
      // Register the given callback function to be invoked after the
      // next time static widgets are rendered.
      window.HTMLWidgets.addPostRenderHandler = function(callback) {
        postRenderHandlers.push(callback);
      };
    
      // Takes a new-style instance-bound definition, and returns an
      // old-style class-bound definition. This saves us from having
      // to rewrite all the logic in this file to accomodate both
      // types of definitions.
      function createLegacyDefinitionAdapter(defn) {
        var result = {
          name: defn.name,
          type: defn.type,
          initialize: function(el, width, height) {
            return defn.factory(el, width, height);
          },
          renderValue: function(el, x, instance) {
            return instance.renderValue(x);
          },
          resize: function(el, width, height, instance) {
            return instance.resize(width, height);
          }
        };
    
        if (defn.find)
          result.find = defn.find;
        if (defn.renderError)
          result.renderError = defn.renderError;
        if (defn.clearError)
          result.clearError = defn.clearError;
    
        return result;
      }
    })();
    
    
    HTMLWidgets.widget({
      name: "plotly",
      type: "output",
    
      initialize: function(el, width, height) {
        return {};
      },
    
      resize: function(el, width, height, instance) {
        if (instance.autosize) {
          var width = instance.width || width;
          var height = instance.height || height;
          Plotly.relayout(el.id, {width: width, height: height});
        }
      },  
      
      renderValue: function(el, x, instance) {
        
        // Plotly.relayout() mutates the plot input object, so make sure to 
        // keep a reference to the user-supplied width/height *before*
        // we call Plotly.plot();
        var lay = x.layout || {};
        instance.width = lay.width;
        instance.height = lay.height;
        instance.autosize = lay.autosize || true;
        
        /* 
        / 'inform the world' about highlighting options this is so other
        / crosstalk libraries have a chance to respond to special settings 
        / such as persistent selection. 
        / AFAIK, leaflet is the only library with such intergration
        / https://github.com/rstudio/leaflet/pull/346/files#diff-ad0c2d51ce5fdf8c90c7395b102f4265R154
        */
        var ctConfig = crosstalk.var('plotlyCrosstalkOpts').set(x.highlight);
          
        if (typeof(window) !== "undefined") {
          // make sure plots don't get created outside the network (for on-prem)
          window.PLOTLYENV = window.PLOTLYENV || {};
          window.PLOTLYENV.BASE_URL = x.base_url;
          
          // Enable persistent selection when shift key is down
          // https://stackoverflow.com/questions/1828613/check-if-a-key-is-down
          var persistOnShift = function(e) {
            if (!e) window.event;
            if (e.shiftKey) { 
              x.highlight.persistent = true; 
              x.highlight.persistentShift = true;
            } else {
              x.highlight.persistent = false; 
              x.highlight.persistentShift = false;
            }
          };
          
          // Only relevant if we haven't forced persistent mode at command line
          if (!x.highlight.persistent) {
            window.onmousemove = persistOnShift;
          }
        }
    
        var graphDiv = document.getElementById(el.id);
        
        // TODO: move the control panel injection strategy inside here...
        HTMLWidgets.addPostRenderHandler(function() {
          
          // lower the z-index of the modebar to prevent it from highjacking hover
          // (TODO: do this via CSS?)
          // https://github.com/ropensci/plotly/issues/956
          // https://www.w3schools.com/jsref/prop_style_zindex.asp
          var modebars = document.querySelectorAll(".js-plotly-plot .plotly .modebar");
          for (var i = 0; i < modebars.length; i++) {
            modebars[i].style.zIndex = 1;
          }
        });
          
          // inject a "control panel" holding selectize/dynamic color widget(s)
        if (x.selectize || x.highlight.dynamic && !instance.plotly) {
          var flex = document.createElement("div");
          flex.class = "plotly-crosstalk-control-panel";
          flex.style = "display: flex; flex-wrap: wrap";
          
          // inject the colourpicker HTML container into the flexbox
          if (x.highlight.dynamic) {
            var pickerDiv = document.createElement("div");
            
            var pickerInput = document.createElement("input");
            pickerInput.id = el.id + "-colourpicker";
            pickerInput.placeholder = "asdasd";
            
            var pickerLabel = document.createElement("label");
            pickerLabel.for = pickerInput.id;
            pickerLabel.innerHTML = "Brush color&nbsp;&nbsp;";
            
            pickerDiv.appendChild(pickerLabel);
            pickerDiv.appendChild(pickerInput);
            flex.appendChild(pickerDiv);
          }
          
          // inject selectize HTML containers (one for every crosstalk group)
          if (x.selectize) {
            var ids = Object.keys(x.selectize);
            
            for (var i = 0; i < ids.length; i++) {
              var container = document.createElement("div");
              container.id = ids[i];
              container.style = "width: 80%; height: 10%";
              container.class = "form-group crosstalk-input-plotly-highlight";
              
              var label = document.createElement("label");
              label.for = ids[i];
              label.innerHTML = x.selectize[ids[i]].group;
              label.class = "control-label";
              
              var selectDiv = document.createElement("div");
              var select = document.createElement("select");
              select.multiple = true;
              
              selectDiv.appendChild(select);
              container.appendChild(label);
              container.appendChild(selectDiv);
              flex.appendChild(container);
            }
          }
          
          // finally, insert the flexbox inside the htmlwidget container,
          // but before the plotly graph div
          graphDiv.parentElement.insertBefore(flex, graphDiv);
          
          if (x.highlight.dynamic) {
            var picker = $("#" + pickerInput.id);
            var colors = x.highlight.color || [];
            // TODO: let users specify options?
            var opts = {
              value: colors[0],
              showColour: "both",
              palette: "limited",
              allowedCols: colors.join(" "),
              width: "20%",
              height: "10%"
            };
            picker.colourpicker({changeDelay: 0});
            picker.colourpicker("settings", opts);
            picker.colourpicker("value", opts.value);
            // inform crosstalk about a change in the current selection colour
            var grps = x.highlight.ctGroups || [];
            for (var i = 0; i < grps.length; i++) {
              crosstalk.group(grps[i]).var('plotlySelectionColour')
                .set(picker.colourpicker('value'));
            }
            picker.on("change", function() {
              for (var i = 0; i < grps.length; i++) {
                crosstalk.group(grps[i]).var('plotlySelectionColour')
                  .set(picker.colourpicker('value'));
              }
            });
          }
        }
        
        // if no plot exists yet, create one with a particular configuration
        if (!instance.plotly) {
          
          var plot = Plotly.plot(graphDiv, x);
          instance.plotly = true;
          
        } else {
          
          // this is essentially equivalent to Plotly.newPlot(), but avoids creating 
          // a new webgl context
          // https://github.com/plotly/plotly.js/blob/2b24f9def901831e61282076cf3f835598d56f0e/src/plot_api/plot_api.js#L531-L532
    
          // TODO: restore crosstalk selections?
          Plotly.purge(graphDiv);
          // TODO: why is this necessary to get crosstalk working?
          graphDiv.data = undefined;
          graphDiv.layout = undefined;
          var plot = Plotly.plot(graphDiv, x);
        }
        
        // Trigger plotly.js calls defined via `plotlyProxy()`
        plot.then(function() {
          if (HTMLWidgets.shinyMode) {
            Shiny.addCustomMessageHandler("plotly-calls", function(msg) {
              var gd = document.getElementById(msg.id);
              if (!gd) {
                throw new Error("Couldn't find plotly graph with id: " + msg.id);
              }
              // This isn't an official plotly.js method, but it's the only current way to 
              // change just the configuration of a plot 
              // https://community.plot.ly/t/update-config-function/9057
              if (msg.method == "reconfig") {
                Plotly.react(gd, gd.data, gd.layout, msg.args);
                return;
              }
              if (!Plotly[msg.method]) {
                throw new Error("Unknown method " + msg.method);
              }
              var args = [gd].concat(msg.args);
              Plotly[msg.method].apply(null, args);
            });
          }
          
          // plotly's mapbox API doesn't currently support setting bounding boxes
          // https://www.mapbox.com/mapbox-gl-js/example/fitbounds/
          // so we do this manually...
          // TODO: make sure this triggers on a redraw and relayout as well as on initial draw
          var mapboxIDs = graphDiv._fullLayout._subplots.mapbox || [];
          for (var i = 0; i < mapboxIDs.length; i++) {
            var id = mapboxIDs[i];
            var mapOpts = x.layout[id] || {};
            var args = mapOpts._fitBounds || {};
            if (!args) {
              continue;
            }
            var mapObj = graphDiv._fullLayout[id]._subplot.map;
            mapObj.fitBounds(args.bounds, args.options);
          }
          
        });
        
        // Attach attributes (e.g., "key", "z") to plotly event data
        function eventDataWithKey(eventData) {
          if (eventData === undefined || !eventData.hasOwnProperty("points")) {
            return null;
          }
          return eventData.points.map(function(pt) {
            var obj = {
              curveNumber: pt.curveNumber, 
              pointNumber: pt.pointNumber, 
              x: pt.x,
              y: pt.y
            };
            
            // If 'z' is reported with the event data, then use it!
            if (pt.hasOwnProperty("z")) {
              obj.z = pt.z;
            }
            
            if (pt.hasOwnProperty("customdata")) {
              obj.customdata = pt.customdata;
            }
            
            /* 
              TL;DR: (I think) we have to select the graph div (again) to attach keys...
              
              Why? Remember that crosstalk will dynamically add/delete traces 
              (see traceManager.prototype.updateSelection() below)
              For this reason, we can't simply grab keys from x.data (like we did previously)
              Moreover, we can't use _fullData, since that doesn't include 
              unofficial attributes. It's true that click/hover events fire with 
              pt.data, but drag events don't...
            */
            var gd = document.getElementById(el.id);
            var trace = gd.data[pt.curveNumber];
            
            if (!trace._isSimpleKey) {
              var attrsToAttach = ["key"];
            } else {
              // simple keys fire the whole key
              obj.key = trace.key;
              var attrsToAttach = [];
            }
            
            for (var i = 0; i < attrsToAttach.length; i++) {
              var attr = trace[attrsToAttach[i]];
              if (Array.isArray(attr)) {
                if (typeof pt.pointNumber === "number") {
                  obj[attrsToAttach[i]] = attr[pt.pointNumber];
                } else if (Array.isArray(pt.pointNumber)) {
                  obj[attrsToAttach[i]] = attr[pt.pointNumber[0]][pt.pointNumber[1]];
                } else if (Array.isArray(pt.pointNumbers)) {
                  obj[attrsToAttach[i]] = pt.pointNumbers.map(function(idx) { return attr[idx]; });
                }
              }
            }
            return obj;
          });
        }
        
        
        var legendEventData = function(d) {
          // if legendgroup is not relevant just return the trace
          var trace = d.data[d.curveNumber];
          if (!trace.legendgroup) return trace;
          
          // if legendgroup was specified, return all traces that match the group
          var legendgrps = d.data.map(function(trace){ return trace.legendgroup; });
          var traces = [];
          for (i = 0; i < legendgrps.length; i++) {
            if (legendgrps[i] == trace.legendgroup) {
              traces.push(d.data[i]);
            }
          }
          
          return traces;
        };
    
        
        // send user input event data to shiny
        if (HTMLWidgets.shinyMode && Shiny.setInputValue) {
          
          // Some events clear other input values
          // TODO: always register these?
          var eventClearMap = {
            plotly_deselect: ["plotly_selected", "plotly_selecting", "plotly_brushed", "plotly_brushing", "plotly_click"],
            plotly_unhover: ["plotly_hover"],
            plotly_doubleclick: ["plotly_click"]
          };
        
          Object.keys(eventClearMap).map(function(evt) {
            graphDiv.on(evt, function() {
              var inputsToClear = eventClearMap[evt];
              inputsToClear.map(function(input) {
                Shiny.setInputValue(input + "-" + x.source, null, {priority: "event"});
              });
            });
          });
          
          var eventDataFunctionMap = {
            plotly_click: eventDataWithKey,
            plotly_sunburstclick: eventDataWithKey,
            plotly_hover: eventDataWithKey,
            plotly_unhover: eventDataWithKey,
            // If 'plotly_selected' has already been fired, and you click
            // on the plot afterwards, this event fires `undefined`?!?
            // That might be considered a plotly.js bug, but it doesn't make 
            // sense for this input change to occur if `d` is falsy because,
            // even in the empty selection case, `d` is truthy (an object),
            // and the 'plotly_deselect' event will reset this input
            plotly_selected: function(d) { if (d) { return eventDataWithKey(d); } },
            plotly_selecting: function(d) { if (d) { return eventDataWithKey(d); } },
            plotly_brushed: function(d) {
              if (d) { return d.range ? d.range : d.lassoPoints; }
            },
            plotly_brushing: function(d) {
              if (d) { return d.range ? d.range : d.lassoPoints; }
            },
            plotly_legendclick: legendEventData,
            plotly_legenddoubleclick: legendEventData,
            plotly_clickannotation: function(d) { return d.fullAnnotation }
          };
          
          var registerShinyValue = function(event) {
            var eventDataPreProcessor = eventDataFunctionMap[event] || function(d) { return d ? d : el.id };
            // some events are unique to the R package
            var plotlyJSevent = (event == "plotly_brushed") ? "plotly_selected" : (event == "plotly_brushing") ? "plotly_selecting" : event;
            // register the event
            graphDiv.on(plotlyJSevent, function(d) {
              Shiny.setInputValue(
                event + "-" + x.source,
                JSON.stringify(eventDataPreProcessor(d)),
                {priority: "event"}
              );
            });
          }
        
          var shinyEvents = x.shinyEvents || [];
          shinyEvents.map(registerShinyValue);
        }
        
        // Given an array of {curveNumber: x, pointNumber: y} objects,
        // return a hash of {
        //   set1: {value: [key1, key2, ...], _isSimpleKey: false}, 
        //   set2: {value: [key3, key4, ...], _isSimpleKey: false}
        // }
        function pointsToKeys(points) {
          var keysBySet = {};
          for (var i = 0; i < points.length; i++) {
            
            var trace = graphDiv.data[points[i].curveNumber];
            if (!trace.key || !trace.set) {
              continue;
            }
            
            // set defaults for this keySet
            // note that we don't track the nested property (yet) since we always 
            // emit the union -- http://cpsievert.github.io/talks/20161212b/#21
            keysBySet[trace.set] = keysBySet[trace.set] || {
              value: [],
              _isSimpleKey: trace._isSimpleKey
            };
            
            // Use pointNumber by default, but aggregated traces should emit pointNumbers
            var ptNum = points[i].pointNumber;
            var hasPtNum = typeof ptNum === "number";
            var ptNum = hasPtNum ? ptNum : points[i].pointNumbers;
            
            // selecting a point of a "simple" trace means: select the 
            // entire key attached to this trace, which is useful for,
            // say clicking on a fitted line to select corresponding observations 
            var key = trace._isSimpleKey ? trace.key : Array.isArray(ptNum) ? ptNum.map(function(idx) { return trace.key[idx]; }) : trace.key[ptNum];
            // http://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays-in-javascript
            var keyFlat = trace._isNestedKey ? [].concat.apply([], key) : key;
            
            // TODO: better to only add new values?
            keysBySet[trace.set].value = keysBySet[trace.set].value.concat(keyFlat);
          }
          
          return keysBySet;
        }
        
        
        x.highlight.color = x.highlight.color || [];
        // make sure highlight color is an array
        if (!Array.isArray(x.highlight.color)) {
          x.highlight.color = [x.highlight.color];
        }
    
        var traceManager = new TraceManager(graphDiv, x.highlight);
    
        // Gather all *unique* sets.
        var allSets = [];
        for (var curveIdx = 0; curveIdx < x.data.length; curveIdx++) {
          var newSet = x.data[curveIdx].set;
          if (newSet) {
            if (allSets.indexOf(newSet) === -1) {
              allSets.push(newSet);
            }
          }
        }
    
        // register event listeners for all sets
        for (var i = 0; i < allSets.length; i++) {
          
          var set = allSets[i];
          var selection = new crosstalk.SelectionHandle(set);
          var filter = new crosstalk.FilterHandle(set);
          
          var filterChange = function(e) {
            removeBrush(el);
            traceManager.updateFilter(set, e.value);
          };
          filter.on("change", filterChange);
          
          
          var selectionChange = function(e) {
            
            // Workaround for 'plotly_selected' now firing previously selected
            // points (in addition to new ones) when holding shift key. In our case,
            // we just want the new keys 
            if (x.highlight.on === "plotly_selected" && x.highlight.persistentShift) {
              // https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
              Array.prototype.diff = function(a) {
                  return this.filter(function(i) {return a.indexOf(i) < 0;});
              };
              e.value = e.value.diff(e.oldValue);
            }
            
            // array of "event objects" tracking the selection history
            // this is used to avoid adding redundant selections
            var selectionHistory = crosstalk.var("plotlySelectionHistory").get() || [];
            
            // Construct an event object "defining" the current event. 
            var event = {
              receiverID: traceManager.gd.id,
              plotlySelectionColour: crosstalk.group(set).var("plotlySelectionColour").get()
            };
            event[set] = e.value;
            // TODO: is there a smarter way to check object equality?
            if (selectionHistory.length > 0) {
              var ev = JSON.stringify(event);
              for (var i = 0; i < selectionHistory.length; i++) {
                var sel = JSON.stringify(selectionHistory[i]);
                if (sel == ev) {
                  return;
                }
              }
            }
            
            // accumulate history for persistent selection
            if (!x.highlight.persistent) {
              selectionHistory = [event];
            } else {
              selectionHistory.push(event);
            }
            crosstalk.var("plotlySelectionHistory").set(selectionHistory);
            
            // do the actual updating of traces, frames, and the selectize widget
            traceManager.updateSelection(set, e.value);
            // https://github.com/selectize/selectize.js/blob/master/docs/api.md#methods_items
            if (x.selectize) {
              if (!x.highlight.persistent || e.value === null) {
                selectize.clear(true);
              }
              selectize.addItems(e.value, true);
              selectize.close();
            }
          }
          selection.on("change", selectionChange);
          
          // Set a crosstalk variable selection value, triggering an update
          var turnOn = function(e) {
            if (e) {
              var selectedKeys = pointsToKeys(e.points);
              // Keys are group names, values are array of selected keys from group.
              for (var set in selectedKeys) {
                if (selectedKeys.hasOwnProperty(set)) {
                  selection.set(selectedKeys[set].value, {sender: el});
                }
              }
            }
          };
          if (x.highlight.debounce > 0) {
            turnOn = debounce(turnOn, x.highlight.debounce);
          }
          graphDiv.on(x.highlight.on, turnOn);
          
          graphDiv.on(x.highlight.off, function turnOff(e) {
            // remove any visual clues
            removeBrush(el);
            // remove any selection history
            crosstalk.var("plotlySelectionHistory").set(null);
            // trigger the actual removal of selection traces
            selection.set(null, {sender: el});
          });
              
          // register a callback for selectize so that there is bi-directional
          // communication between the widget and direct manipulation events
          if (x.selectize) {
            var selectizeID = Object.keys(x.selectize)[i];
            var items = x.selectize[selectizeID].items;
            var first = [{value: "", label: "(All)"}];
            var opts = {
              options: first.concat(items),
              searchField: "label",
              valueField: "value",
              labelField: "label",
              maxItems: 50
            };
            var select = $("#" + selectizeID).find("select")[0];
            var selectize = $(select).selectize(opts)[0].selectize;
            // NOTE: this callback is triggered when *directly* altering 
            // dropdown items
            selectize.on("change", function() {
              var currentItems = traceManager.groupSelections[set] || [];
              if (!x.highlight.persistent) {
                removeBrush(el);
                for (var i = 0; i < currentItems.length; i++) {
                  selectize.removeItem(currentItems[i], true);
                }
              }
              var newItems = selectize.items.filter(function(idx) { 
                return currentItems.indexOf(idx) < 0;
              });
              if (newItems.length > 0) {
                traceManager.updateSelection(set, newItems);
              } else {
                // Item has been removed...
                // TODO: this logic won't work for dynamically changing palette 
                traceManager.updateSelection(set, null);
                traceManager.updateSelection(set, selectize.items);
              }
            });
          }
        } // end of selectionChange
        
      } // end of renderValue
    }); // end of widget definition
    
    /**
     * @param graphDiv The Plotly graph div
     * @param highlight An object with options for updating selection(s)
     */
    function TraceManager(graphDiv, highlight) {
      // The Plotly graph div
      this.gd = graphDiv;
    
      // Preserve the original data.
      // TODO: try using Lib.extendFlat() as done in  
      // https://github.com/plotly/plotly.js/pull/1136 
      this.origData = JSON.parse(JSON.stringify(graphDiv.data));
      
      // avoid doing this over and over
      this.origOpacity = [];
      for (var i = 0; i < this.origData.length; i++) {
        this.origOpacity[i] = this.origData[i].opacity === 0 ? 0 : (this.origData[i].opacity || 1);
      }
    
      // key: group name, value: null or array of keys representing the
      // most recently received selection for that group.
      this.groupSelections = {};
      
      // selection parameters (e.g., transient versus persistent selection)
      this.highlight = highlight;
    }
    
    TraceManager.prototype.close = function() {
      // TODO: Unhook all event handlers
    };
    
    TraceManager.prototype.updateFilter = function(group, keys) {
    
      if (typeof(keys) === "undefined" || keys === null) {
        
        this.gd.data = JSON.parse(JSON.stringify(this.origData));
        
      } else {
      
        var traces = [];
        for (var i = 0; i < this.origData.length; i++) {
          var trace = this.origData[i];
          if (!trace.key || trace.set !== group) {
            continue;
          }
          var matchFunc = getMatchFunc(trace);
          var matches = matchFunc(trace.key, keys);
          
          if (matches.length > 0) {
            if (!trace._isSimpleKey) {
              // subsetArrayAttrs doesn't mutate trace (it makes a modified clone)
              trace = subsetArrayAttrs(trace, matches);
            }
            traces.push(trace);
          }
        }
      }
      
      this.gd.data = traces;
      Plotly.redraw(this.gd);
      
      // NOTE: we purposely do _not_ restore selection(s), since on filter,
      // axis likely will update, changing the pixel -> data mapping, leading 
      // to a likely mismatch in the brush outline and highlighted marks
      
    };
    
    TraceManager.prototype.updateSelection = function(group, keys) {
      
      if (keys !== null && !Array.isArray(keys)) {
        throw new Error("Invalid keys argument; null or array expected");
      }
      
      // if selection has been cleared, or if this is transient
      // selection, delete the "selection traces"
      var nNewTraces = this.gd.data.length - this.origData.length;
      if (keys === null || !this.highlight.persistent && nNewTraces > 0) {
        var tracesToRemove = [];
        for (var i = 0; i < this.gd.data.length; i++) {
          if (this.gd.data[i]._isCrosstalkTrace) tracesToRemove.push(i);
        }
        Plotly.deleteTraces(this.gd, tracesToRemove);
        this.groupSelections[group] = keys;
      } else {
        // add to the groupSelection, rather than overwriting it
        // TODO: can this be removed?
        this.groupSelections[group] = this.groupSelections[group] || [];
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          if (this.groupSelections[group].indexOf(k) < 0) {
            this.groupSelections[group].push(k);
          }
        }
      }
      
      if (keys === null) {
        
        Plotly.restyle(this.gd, {"opacity": this.origOpacity});
        
      } else if (keys.length >= 1) {
        
        // placeholder for new "selection traces"
        var traces = [];
        // this variable is set in R/highlight.R
        var selectionColour = crosstalk.group(group).var("plotlySelectionColour").get() || 
          this.highlight.color[0];
    
        for (var i = 0; i < this.origData.length; i++) {
          // TODO: try using Lib.extendFlat() as done in  
          // https://github.com/plotly/plotly.js/pull/1136 
          var trace = JSON.parse(JSON.stringify(this.gd.data[i]));
          if (!trace.key || trace.set !== group) {
            continue;
          }
          // Get sorted array of matching indices in trace.key
          var matchFunc = getMatchFunc(trace);
          var matches = matchFunc(trace.key, keys);
          
          if (matches.length > 0) {
            // If this is a "simple" key, that means select the entire trace
            if (!trace._isSimpleKey) {
              trace = subsetArrayAttrs(trace, matches);
            }
            // reach into the full trace object so we can properly reflect the 
            // selection attributes in every view
            var d = this.gd._fullData[i];
            
            /* 
            / Recursively inherit selection attributes from various sources, 
            / in order of preference:
            /  (1) official plotly.js selected attribute
            /  (2) highlight(selected = attrs_selected(...))
            */
            // TODO: it would be neat to have a dropdown to dynamically specify these!
            $.extend(true, trace, this.highlight.selected);
            
            // if it is defined, override color with the "dynamic brush color""
            if (d.marker) {
              trace.marker = trace.marker || {};
              trace.marker.color =  selectionColour || trace.marker.color || d.marker.color;
            }
            if (d.line) {
              trace.line = trace.line || {};
              trace.line.color =  selectionColour || trace.line.color || d.line.color;
            }
            if (d.textfont) {
              trace.textfont = trace.textfont || {};
              trace.textfont.color =  selectionColour || trace.textfont.color || d.textfont.color;
            }
            if (d.fillcolor) {
              // TODO: should selectionColour inherit alpha from the existing fillcolor?
              trace.fillcolor = selectionColour || trace.fillcolor || d.fillcolor;
            }
            // attach a sensible name/legendgroup
            trace.name = trace.name || keys.join("<br />");
            trace.legendgroup = trace.legendgroup || keys.join("<br />");
            
            // keep track of mapping between this new trace and the trace it targets
            // (necessary for updating frames to reflect the selection traces)
            trace._originalIndex = i;
            trace._newIndex = this.gd._fullData.length + traces.length;
            trace._isCrosstalkTrace = true;
            traces.push(trace);
          }
        }
        
        if (traces.length > 0) {
          
          Plotly.addTraces(this.gd, traces).then(function(gd) {
            // incrementally add selection traces to frames
            // (this is heavily inspired by Plotly.Plots.modifyFrames() 
            // in src/plots/plots.js)
            var _hash = gd._transitionData._frameHash;
            var _frames = gd._transitionData._frames || [];
            
            for (var i = 0; i < _frames.length; i++) {
              
              // add to _frames[i].traces *if* this frame references selected trace(s)
              var newIndices = [];
              for (var j = 0; j < traces.length; j++) {
                var tr = traces[j];
                if (_frames[i].traces.indexOf(tr._originalIndex) > -1) {
                  newIndices.push(tr._newIndex);
                  _frames[i].traces.push(tr._newIndex);
                }
              }
              
              // nothing to do...
              if (newIndices.length === 0) {
                continue;
              }
              
              var ctr = 0;
              var nFrameTraces = _frames[i].data.length;
              
              for (var j = 0; j < nFrameTraces; j++) {
                var frameTrace = _frames[i].data[j];
                if (!frameTrace.key || frameTrace.set !== group) {
                  continue;
                }
                
                var matchFunc = getMatchFunc(frameTrace);
                var matches = matchFunc(frameTrace.key, keys);
                
                if (matches.length > 0) {
                  if (!trace._isSimpleKey) {
                    frameTrace = subsetArrayAttrs(frameTrace, matches);
                  }
                  var d = gd._fullData[newIndices[ctr]];
                  if (d.marker) {
                    frameTrace.marker = d.marker;
                  }
                  if (d.line) {
                    frameTrace.line = d.line;
                  }
                  if (d.textfont) {
                    frameTrace.textfont = d.textfont;
                  }
                  ctr = ctr + 1;
                  _frames[i].data.push(frameTrace);
                }
              }
              
              // update gd._transitionData._frameHash
              _hash[_frames[i].name] = _frames[i];
            }
          
          });
          
          // dim traces that have a set matching the set of selection sets
          var tracesToDim = [],
              opacities = [],
              sets = Object.keys(this.groupSelections),
              n = this.origData.length;
              
          for (var i = 0; i < n; i++) {
            var opacity = this.origOpacity[i] || 1;
            // have we already dimmed this trace? Or is this even worth doing?
            if (opacity !== this.gd._fullData[i].opacity || this.highlight.opacityDim === 1) {
              continue;
            }
            // is this set an element of the set of selection sets?
            var matches = findMatches(sets, [this.gd.data[i].set]);
            if (matches.length) {
              tracesToDim.push(i);
              opacities.push(opacity * this.highlight.opacityDim);
            }
          }
          
          if (tracesToDim.length > 0) {
            Plotly.restyle(this.gd, {"opacity": opacities}, tracesToDim);
            // turn off the selected/unselected API
            Plotly.restyle(this.gd, {"selectedpoints": null});
          }
          
        }
        
      }
    };
    
    /* 
    Note: in all of these match functions, we assume needleSet (i.e. the selected keys)
    is a 1D (or flat) array. The real difference is the meaning of haystack.
    findMatches() does the usual thing you'd expect for 
    linked brushing on a scatterplot matrix. findSimpleMatches() returns a match iff 
    haystack is a subset of the needleSet. findNestedMatches() returns 
    */
    
    function getMatchFunc(trace) {
      return (trace._isNestedKey) ? findNestedMatches : 
        (trace._isSimpleKey) ? findSimpleMatches : findMatches;
    }
    
    // find matches for "flat" keys
    function findMatches(haystack, needleSet) {
      var matches = [];
      haystack.forEach(function(obj, i) {
        if (obj === null || needleSet.indexOf(obj) >= 0) {
          matches.push(i);
        }
      });
      return matches;
    }
    
    // find matches for "simple" keys
    function findSimpleMatches(haystack, needleSet) {
      var match = haystack.every(function(val) {
        return val === null || needleSet.indexOf(val) >= 0;
      });
      // yes, this doesn't make much sense other than conforming 
      // to the output type of the other match functions
      return (match) ? [0] : []
    }
    
    // find matches for a "nested" haystack (2D arrays)
    function findNestedMatches(haystack, needleSet) {
      var matches = [];
      for (var i = 0; i < haystack.length; i++) {
        var hay = haystack[i];
        var match = hay.every(function(val) { 
          return val === null || needleSet.indexOf(val) >= 0; 
        });
        if (match) {
          matches.push(i);
        }
      }
      return matches;
    }
    
    function isPlainObject(obj) {
      return (
        Object.prototype.toString.call(obj) === '[object Object]' &&
        Object.getPrototypeOf(obj) === Object.prototype
      );
    }
    
    function subsetArrayAttrs(obj, indices) {
      var newObj = {};
      Object.keys(obj).forEach(function(k) {
        var val = obj[k];
    
        if (k.charAt(0) === "_") {
          newObj[k] = val;
        } else if (k === "transforms" && Array.isArray(val)) {
          newObj[k] = val.map(function(transform) {
            return subsetArrayAttrs(transform, indices);
          });
        } else if (k === "colorscale" && Array.isArray(val)) {
          newObj[k] = val;
        } else if (isPlainObject(val)) {
          newObj[k] = subsetArrayAttrs(val, indices);
        } else if (Array.isArray(val)) {
          newObj[k] = subsetArray(val, indices);
        } else {
          newObj[k] = val;
        }
      });
      return newObj;
    }
    
    function subsetArray(arr, indices) {
      var result = [];
      for (var i = 0; i < indices.length; i++) {
        result.push(arr[indices[i]]);
      }
      return result;
    }
    
    // Convenience function for removing plotly's brush 
    function removeBrush(el) {
      var outlines = el.querySelectorAll(".select-outline");
      for (var i = 0; i < outlines.length; i++) {
        outlines[i].remove();
      }
    }
    
    
    // https://davidwalsh.name/javascript-debounce-function
    
    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };
    (function(global){"use strict";var undefined=void 0;var MAX_ARRAY_LENGTH=1e5;function Type(v){switch(typeof v){case"undefined":return"undefined";case"boolean":return"boolean";case"number":return"number";case"string":return"string";default:return v===null?"null":"object"}}function Class(v){return Object.prototype.toString.call(v).replace(/^\[object *|\]$/g,"")}function IsCallable(o){return typeof o==="function"}function ToObject(v){if(v===null||v===undefined)throw TypeError();return Object(v)}function ToInt32(v){return v>>0}function ToUint32(v){return v>>>0}var LN2=Math.LN2,abs=Math.abs,floor=Math.floor,log=Math.log,max=Math.max,min=Math.min,pow=Math.pow,round=Math.round;(function(){var orig=Object.defineProperty;var dom_only=!function(){try{return Object.defineProperty({},"x",{})}catch(_){return false}}();if(!orig||dom_only){Object.defineProperty=function(o,prop,desc){if(orig)try{return orig(o,prop,desc)}catch(_){}if(o!==Object(o))throw TypeError("Object.defineProperty called on non-object");if(Object.prototype.__defineGetter__&&"get"in desc)Object.prototype.__defineGetter__.call(o,prop,desc.get);if(Object.prototype.__defineSetter__&&"set"in desc)Object.prototype.__defineSetter__.call(o,prop,desc.set);if("value"in desc)o[prop]=desc.value;return o}}})();function makeArrayAccessors(obj){if(obj.length>MAX_ARRAY_LENGTH)throw RangeError("Array too large for polyfill");function makeArrayAccessor(index){Object.defineProperty(obj,index,{get:function(){return obj._getter(index)},set:function(v){obj._setter(index,v)},enumerable:true,configurable:false})}var i;for(i=0;i<obj.length;i+=1){makeArrayAccessor(i)}}function as_signed(value,bits){var s=32-bits;return value<<s>>s}function as_unsigned(value,bits){var s=32-bits;return value<<s>>>s}function packI8(n){return[n&255]}function unpackI8(bytes){return as_signed(bytes[0],8)}function packU8(n){return[n&255]}function unpackU8(bytes){return as_unsigned(bytes[0],8)}function packU8Clamped(n){n=round(Number(n));return[n<0?0:n>255?255:n&255]}function packI16(n){return[n>>8&255,n&255]}function unpackI16(bytes){return as_signed(bytes[0]<<8|bytes[1],16)}function packU16(n){return[n>>8&255,n&255]}function unpackU16(bytes){return as_unsigned(bytes[0]<<8|bytes[1],16)}function packI32(n){return[n>>24&255,n>>16&255,n>>8&255,n&255]}function unpackI32(bytes){return as_signed(bytes[0]<<24|bytes[1]<<16|bytes[2]<<8|bytes[3],32)}function packU32(n){return[n>>24&255,n>>16&255,n>>8&255,n&255]}function unpackU32(bytes){return as_unsigned(bytes[0]<<24|bytes[1]<<16|bytes[2]<<8|bytes[3],32)}function packIEEE754(v,ebits,fbits){var bias=(1<<ebits-1)-1,s,e,f,ln,i,bits,str,bytes;function roundToEven(n){var w=floor(n),f=n-w;if(f<.5)return w;if(f>.5)return w+1;return w%2?w+1:w}if(v!==v){e=(1<<ebits)-1;f=pow(2,fbits-1);s=0}else if(v===Infinity||v===-Infinity){e=(1<<ebits)-1;f=0;s=v<0?1:0}else if(v===0){e=0;f=0;s=1/v===-Infinity?1:0}else{s=v<0;v=abs(v);if(v>=pow(2,1-bias)){e=min(floor(log(v)/LN2),1023);f=roundToEven(v/pow(2,e)*pow(2,fbits));if(f/pow(2,fbits)>=2){e=e+1;f=1}if(e>bias){e=(1<<ebits)-1;f=0}else{e=e+bias;f=f-pow(2,fbits)}}else{e=0;f=roundToEven(v/pow(2,1-bias-fbits))}}bits=[];for(i=fbits;i;i-=1){bits.push(f%2?1:0);f=floor(f/2)}for(i=ebits;i;i-=1){bits.push(e%2?1:0);e=floor(e/2)}bits.push(s?1:0);bits.reverse();str=bits.join("");bytes=[];while(str.length){bytes.push(parseInt(str.substring(0,8),2));str=str.substring(8)}return bytes}function unpackIEEE754(bytes,ebits,fbits){var bits=[],i,j,b,str,bias,s,e,f;for(i=bytes.length;i;i-=1){b=bytes[i-1];for(j=8;j;j-=1){bits.push(b%2?1:0);b=b>>1}}bits.reverse();str=bits.join("");bias=(1<<ebits-1)-1;s=parseInt(str.substring(0,1),2)?-1:1;e=parseInt(str.substring(1,1+ebits),2);f=parseInt(str.substring(1+ebits),2);if(e===(1<<ebits)-1){return f!==0?NaN:s*Infinity}else if(e>0){return s*pow(2,e-bias)*(1+f/pow(2,fbits))}else if(f!==0){return s*pow(2,-(bias-1))*(f/pow(2,fbits))}else{return s<0?-0:0}}function unpackF64(b){return unpackIEEE754(b,11,52)}function packF64(v){return packIEEE754(v,11,52)}function unpackF32(b){return unpackIEEE754(b,8,23)}function packF32(v){return packIEEE754(v,8,23)}(function(){function ArrayBuffer(length){length=ToInt32(length);if(length<0)throw RangeError("ArrayBuffer size is not a small enough positive integer.");Object.defineProperty(this,"byteLength",{value:length});Object.defineProperty(this,"_bytes",{value:Array(length)});for(var i=0;i<length;i+=1)this._bytes[i]=0}global.ArrayBuffer=global.ArrayBuffer||ArrayBuffer;function $TypedArray$(){if(!arguments.length||typeof arguments[0]!=="object"){return function(length){length=ToInt32(length);if(length<0)throw RangeError("length is not a small enough positive integer.");Object.defineProperty(this,"length",{value:length});Object.defineProperty(this,"byteLength",{value:length*this.BYTES_PER_ELEMENT});Object.defineProperty(this,"buffer",{value:new ArrayBuffer(this.byteLength)});Object.defineProperty(this,"byteOffset",{value:0})}.apply(this,arguments)}if(arguments.length>=1&&Type(arguments[0])==="object"&&arguments[0]instanceof $TypedArray$){return function(typedArray){if(this.constructor!==typedArray.constructor)throw TypeError();var byteLength=typedArray.length*this.BYTES_PER_ELEMENT;Object.defineProperty(this,"buffer",{value:new ArrayBuffer(byteLength)});Object.defineProperty(this,"byteLength",{value:byteLength});Object.defineProperty(this,"byteOffset",{value:0});Object.defineProperty(this,"length",{value:typedArray.length});for(var i=0;i<this.length;i+=1)this._setter(i,typedArray._getter(i))}.apply(this,arguments)}if(arguments.length>=1&&Type(arguments[0])==="object"&&!(arguments[0]instanceof $TypedArray$)&&!(arguments[0]instanceof ArrayBuffer||Class(arguments[0])==="ArrayBuffer")){return function(array){var byteLength=array.length*this.BYTES_PER_ELEMENT;Object.defineProperty(this,"buffer",{value:new ArrayBuffer(byteLength)});Object.defineProperty(this,"byteLength",{value:byteLength});Object.defineProperty(this,"byteOffset",{value:0});Object.defineProperty(this,"length",{value:array.length});for(var i=0;i<this.length;i+=1){var s=array[i];this._setter(i,Number(s))}}.apply(this,arguments)}if(arguments.length>=1&&Type(arguments[0])==="object"&&(arguments[0]instanceof ArrayBuffer||Class(arguments[0])==="ArrayBuffer")){return function(buffer,byteOffset,length){byteOffset=ToUint32(byteOffset);if(byteOffset>buffer.byteLength)throw RangeError("byteOffset out of range");if(byteOffset%this.BYTES_PER_ELEMENT)throw RangeError("buffer length minus the byteOffset is not a multiple of the element size.");if(length===undefined){var byteLength=buffer.byteLength-byteOffset;if(byteLength%this.BYTES_PER_ELEMENT)throw RangeError("length of buffer minus byteOffset not a multiple of the element size");length=byteLength/this.BYTES_PER_ELEMENT}else{length=ToUint32(length);byteLength=length*this.BYTES_PER_ELEMENT}if(byteOffset+byteLength>buffer.byteLength)throw RangeError("byteOffset and length reference an area beyond the end of the buffer");Object.defineProperty(this,"buffer",{value:buffer});Object.defineProperty(this,"byteLength",{value:byteLength});Object.defineProperty(this,"byteOffset",{value:byteOffset});Object.defineProperty(this,"length",{value:length})}.apply(this,arguments)}throw TypeError()}Object.defineProperty($TypedArray$,"from",{value:function(iterable){return new this(iterable)}});Object.defineProperty($TypedArray$,"of",{value:function(){return new this(arguments)}});var $TypedArrayPrototype$={};$TypedArray$.prototype=$TypedArrayPrototype$;Object.defineProperty($TypedArray$.prototype,"_getter",{value:function(index){if(arguments.length<1)throw SyntaxError("Not enough arguments");index=ToUint32(index);if(index>=this.length)return undefined;var bytes=[],i,o;for(i=0,o=this.byteOffset+index*this.BYTES_PER_ELEMENT;i<this.BYTES_PER_ELEMENT;i+=1,o+=1){bytes.push(this.buffer._bytes[o])}return this._unpack(bytes)}});Object.defineProperty($TypedArray$.prototype,"get",{value:$TypedArray$.prototype._getter});Object.defineProperty($TypedArray$.prototype,"_setter",{value:function(index,value){if(arguments.length<2)throw SyntaxError("Not enough arguments");index=ToUint32(index);if(index>=this.length)return;var bytes=this._pack(value),i,o;for(i=0,o=this.byteOffset+index*this.BYTES_PER_ELEMENT;i<this.BYTES_PER_ELEMENT;i+=1,o+=1){this.buffer._bytes[o]=bytes[i]}}});Object.defineProperty($TypedArray$.prototype,"constructor",{value:$TypedArray$});Object.defineProperty($TypedArray$.prototype,"copyWithin",{value:function(target,start){var end=arguments[2];var o=ToObject(this);var lenVal=o.length;var len=ToUint32(lenVal);len=max(len,0);var relativeTarget=ToInt32(target);var to;if(relativeTarget<0)to=max(len+relativeTarget,0);else to=min(relativeTarget,len);var relativeStart=ToInt32(start);var from;if(relativeStart<0)from=max(len+relativeStart,0);else from=min(relativeStart,len);var relativeEnd;if(end===undefined)relativeEnd=len;else relativeEnd=ToInt32(end);var final;if(relativeEnd<0)final=max(len+relativeEnd,0);else final=min(relativeEnd,len);var count=min(final-from,len-to);var direction;if(from<to&&to<from+count){direction=-1;from=from+count-1;to=to+count-1}else{direction=1}while(count>0){o._setter(to,o._getter(from));from=from+direction;to=to+direction;count=count-1}return o}});Object.defineProperty($TypedArray$.prototype,"every",{value:function(callbackfn){if(this===undefined||this===null)throw TypeError();var t=Object(this);var len=ToUint32(t.length);if(!IsCallable(callbackfn))throw TypeError();var thisArg=arguments[1];for(var i=0;i<len;i++){if(!callbackfn.call(thisArg,t._getter(i),i,t))return false}return true}});Object.defineProperty($TypedArray$.prototype,"fill",{value:function(value){var start=arguments[1],end=arguments[2];var o=ToObject(this);var lenVal=o.length;var len=ToUint32(lenVal);len=max(len,0);var relativeStart=ToInt32(start);var k;if(relativeStart<0)k=max(len+relativeStart,0);else k=min(relativeStart,len);var relativeEnd;if(end===undefined)relativeEnd=len;else relativeEnd=ToInt32(end);var final;if(relativeEnd<0)final=max(len+relativeEnd,0);else final=min(relativeEnd,len);while(k<final){o._setter(k,value);k+=1}return o}});Object.defineProperty($TypedArray$.prototype,"filter",{value:function(callbackfn){if(this===undefined||this===null)throw TypeError();var t=Object(this);var len=ToUint32(t.length);if(!IsCallable(callbackfn))throw TypeError();var res=[];var thisp=arguments[1];for(var i=0;i<len;i++){var val=t._getter(i);if(callbackfn.call(thisp,val,i,t))res.push(val)}return new this.constructor(res)}});Object.defineProperty($TypedArray$.prototype,"find",{value:function(predicate){var o=ToObject(this);var lenValue=o.length;var len=ToUint32(lenValue);if(!IsCallable(predicate))throw TypeError();var t=arguments.length>1?arguments[1]:undefined;var k=0;while(k<len){var kValue=o._getter(k);var testResult=predicate.call(t,kValue,k,o);if(Boolean(testResult))return kValue;++k}return undefined}});Object.defineProperty($TypedArray$.prototype,"findIndex",{value:function(predicate){var o=ToObject(this);var lenValue=o.length;var len=ToUint32(lenValue);if(!IsCallable(predicate))throw TypeError();var t=arguments.length>1?arguments[1]:undefined;var k=0;while(k<len){var kValue=o._getter(k);var testResult=predicate.call(t,kValue,k,o);if(Boolean(testResult))return k;++k}return-1}});Object.defineProperty($TypedArray$.prototype,"forEach",{value:function(callbackfn){if(this===undefined||this===null)throw TypeError();var t=Object(this);var len=ToUint32(t.length);if(!IsCallable(callbackfn))throw TypeError();var thisp=arguments[1];for(var i=0;i<len;i++)callbackfn.call(thisp,t._getter(i),i,t)}});Object.defineProperty($TypedArray$.prototype,"indexOf",{value:function(searchElement){if(this===undefined||this===null)throw TypeError();var t=Object(this);var len=ToUint32(t.length);if(len===0)return-1;var n=0;if(arguments.length>0){n=Number(arguments[1]);if(n!==n){n=0}else if(n!==0&&n!==1/0&&n!==-(1/0)){n=(n>0||-1)*floor(abs(n))}}if(n>=len)return-1;var k=n>=0?n:max(len-abs(n),0);for(;k<len;k++){if(t._getter(k)===searchElement){return k}}return-1}});Object.defineProperty($TypedArray$.prototype,"join",{value:function(separator){if(this===undefined||this===null)throw TypeError();var t=Object(this);var len=ToUint32(t.length);var tmp=Array(len);for(var i=0;i<len;++i)tmp[i]=t._getter(i);return tmp.join(separator===undefined?",":separator)}});Object.defineProperty($TypedArray$.prototype,"lastIndexOf",{value:function(searchElement){if(this===undefined||this===null)throw TypeError();var t=Object(this);var len=ToUint32(t.length);if(len===0)return-1;var n=len;if(arguments.length>1){n=Number(arguments[1]);if(n!==n){n=0}else if(n!==0&&n!==1/0&&n!==-(1/0)){n=(n>0||-1)*floor(abs(n))}}var k=n>=0?min(n,len-1):len-abs(n);for(;k>=0;k--){if(t._getter(k)===searchElement)return k}return-1}});Object.defineProperty($TypedArray$.prototype,"map",{value:function(callbackfn){if(this===undefined||this===null)throw TypeError();var t=Object(this);var len=ToUint32(t.length);if(!IsCallable(callbackfn))throw TypeError();var res=[];res.length=len;var thisp=arguments[1];for(var i=0;i<len;i++)res[i]=callbackfn.call(thisp,t._getter(i),i,t);return new this.constructor(res)}});Object.defineProperty($TypedArray$.prototype,"reduce",{value:function(callbackfn){if(this===undefined||this===null)throw TypeError();var t=Object(this);var len=ToUint32(t.length);if(!IsCallable(callbackfn))throw TypeError();if(len===0&&arguments.length===1)throw TypeError();var k=0;var accumulator;if(arguments.length>=2){accumulator=arguments[1]}else{accumulator=t._getter(k++)}while(k<len){accumulator=callbackfn.call(undefined,accumulator,t._getter(k),k,t);k++}return accumulator}});Object.defineProperty($TypedArray$.prototype,"reduceRight",{value:function(callbackfn){if(this===undefined||this===null)throw TypeError();var t=Object(this);var len=ToUint32(t.length);if(!IsCallable(callbackfn))throw TypeError();if(len===0&&arguments.length===1)throw TypeError();var k=len-1;var accumulator;if(arguments.length>=2){accumulator=arguments[1]}else{accumulator=t._getter(k--)}while(k>=0){accumulator=callbackfn.call(undefined,accumulator,t._getter(k),k,t);k--}return accumulator}});Object.defineProperty($TypedArray$.prototype,"reverse",{value:function(){if(this===undefined||this===null)throw TypeError();var t=Object(this);var len=ToUint32(t.length);var half=floor(len/2);for(var i=0,j=len-1;i<half;++i,--j){var tmp=t._getter(i);t._setter(i,t._getter(j));t._setter(j,tmp)}return t}});Object.defineProperty($TypedArray$.prototype,"set",{value:function(index,value){if(arguments.length<1)throw SyntaxError("Not enough arguments");var array,sequence,offset,len,i,s,d,byteOffset,byteLength,tmp;if(typeof arguments[0]==="object"&&arguments[0].constructor===this.constructor){array=arguments[0];offset=ToUint32(arguments[1]);if(offset+array.length>this.length){throw RangeError("Offset plus length of array is out of range")}byteOffset=this.byteOffset+offset*this.BYTES_PER_ELEMENT;byteLength=array.length*this.BYTES_PER_ELEMENT;if(array.buffer===this.buffer){tmp=[];for(i=0,s=array.byteOffset;i<byteLength;i+=1,s+=1){tmp[i]=array.buffer._bytes[s]}for(i=0,d=byteOffset;i<byteLength;i+=1,d+=1){this.buffer._bytes[d]=tmp[i]}}else{for(i=0,s=array.byteOffset,d=byteOffset;i<byteLength;i+=1,s+=1,d+=1){this.buffer._bytes[d]=array.buffer._bytes[s]}}}else if(typeof arguments[0]==="object"&&typeof arguments[0].length!=="undefined"){sequence=arguments[0];len=ToUint32(sequence.length);offset=ToUint32(arguments[1]);if(offset+len>this.length){throw RangeError("Offset plus length of array is out of range")}for(i=0;i<len;i+=1){s=sequence[i];this._setter(offset+i,Number(s))}}else{throw TypeError("Unexpected argument type(s)")}}});Object.defineProperty($TypedArray$.prototype,"slice",{value:function(start,end){var o=ToObject(this);var lenVal=o.length;var len=ToUint32(lenVal);var relativeStart=ToInt32(start);var k=relativeStart<0?max(len+relativeStart,0):min(relativeStart,len);var relativeEnd=end===undefined?len:ToInt32(end);var final=relativeEnd<0?max(len+relativeEnd,0):min(relativeEnd,len);var count=final-k;var c=o.constructor;var a=new c(count);var n=0;while(k<final){var kValue=o._getter(k);a._setter(n,kValue);++k;++n}return a}});Object.defineProperty($TypedArray$.prototype,"some",{value:function(callbackfn){if(this===undefined||this===null)throw TypeError();var t=Object(this);var len=ToUint32(t.length);if(!IsCallable(callbackfn))throw TypeError();var thisp=arguments[1];for(var i=0;i<len;i++){if(callbackfn.call(thisp,t._getter(i),i,t)){return true}}return false}});Object.defineProperty($TypedArray$.prototype,"sort",{value:function(comparefn){if(this===undefined||this===null)throw TypeError();var t=Object(this);var len=ToUint32(t.length);var tmp=Array(len);for(var i=0;i<len;++i)tmp[i]=t._getter(i);if(comparefn)tmp.sort(comparefn);else tmp.sort();for(i=0;i<len;++i)t._setter(i,tmp[i]);return t}});Object.defineProperty($TypedArray$.prototype,"subarray",{value:function(start,end){function clamp(v,min,max){return v<min?min:v>max?max:v}start=ToInt32(start);end=ToInt32(end);if(arguments.length<1){start=0}if(arguments.length<2){end=this.length}if(start<0){start=this.length+start}if(end<0){end=this.length+end}start=clamp(start,0,this.length);end=clamp(end,0,this.length);var len=end-start;if(len<0){len=0}return new this.constructor(this.buffer,this.byteOffset+start*this.BYTES_PER_ELEMENT,len)}});function makeTypedArray(elementSize,pack,unpack){var TypedArray=function(){Object.defineProperty(this,"constructor",{value:TypedArray});$TypedArray$.apply(this,arguments);makeArrayAccessors(this)};if("__proto__"in TypedArray){TypedArray.__proto__=$TypedArray$}else{TypedArray.from=$TypedArray$.from;TypedArray.of=$TypedArray$.of}TypedArray.BYTES_PER_ELEMENT=elementSize;var TypedArrayPrototype=function(){};TypedArrayPrototype.prototype=$TypedArrayPrototype$;TypedArray.prototype=new TypedArrayPrototype;Object.defineProperty(TypedArray.prototype,"BYTES_PER_ELEMENT",{value:elementSize});Object.defineProperty(TypedArray.prototype,"_pack",{value:pack});Object.defineProperty(TypedArray.prototype,"_unpack",{value:unpack});return TypedArray}var Int8Array=makeTypedArray(1,packI8,unpackI8);var Uint8Array=makeTypedArray(1,packU8,unpackU8);var Uint8ClampedArray=makeTypedArray(1,packU8Clamped,unpackU8);var Int16Array=makeTypedArray(2,packI16,unpackI16);var Uint16Array=makeTypedArray(2,packU16,unpackU16);var Int32Array=makeTypedArray(4,packI32,unpackI32);var Uint32Array=makeTypedArray(4,packU32,unpackU32);var Float32Array=makeTypedArray(4,packF32,unpackF32);var Float64Array=makeTypedArray(8,packF64,unpackF64);global.Int8Array=global.Int8Array||Int8Array;global.Uint8Array=global.Uint8Array||Uint8Array;global.Uint8ClampedArray=global.Uint8ClampedArray||Uint8ClampedArray;global.Int16Array=global.Int16Array||Int16Array;global.Uint16Array=global.Uint16Array||Uint16Array;global.Int32Array=global.Int32Array||Int32Array;global.Uint32Array=global.Uint32Array||Uint32Array;global.Float32Array=global.Float32Array||Float32Array;global.Float64Array=global.Float64Array||Float64Array})();(function(){function r(array,index){return IsCallable(array.get)?array.get(index):array[index]}var IS_BIG_ENDIAN=function(){var u16array=new Uint16Array([4660]),u8array=new Uint8Array(u16array.buffer);return r(u8array,0)===18}();function DataView(buffer,byteOffset,byteLength){if(!(buffer instanceof ArrayBuffer||Class(buffer)==="ArrayBuffer"))throw TypeError();byteOffset=ToUint32(byteOffset);if(byteOffset>buffer.byteLength)throw RangeError("byteOffset out of range");if(byteLength===undefined)byteLength=buffer.byteLength-byteOffset;else byteLength=ToUint32(byteLength);if(byteOffset+byteLength>buffer.byteLength)throw RangeError("byteOffset and length reference an area beyond the end of the buffer");Object.defineProperty(this,"buffer",{value:buffer});Object.defineProperty(this,"byteLength",{value:byteLength});Object.defineProperty(this,"byteOffset",{value:byteOffset})}function makeGetter(arrayType){return function GetViewValue(byteOffset,littleEndian){byteOffset=ToUint32(byteOffset);if(byteOffset+arrayType.BYTES_PER_ELEMENT>this.byteLength)throw RangeError("Array index out of range");byteOffset+=this.byteOffset;var uint8Array=new Uint8Array(this.buffer,byteOffset,arrayType.BYTES_PER_ELEMENT),bytes=[];for(var i=0;i<arrayType.BYTES_PER_ELEMENT;i+=1)bytes.push(r(uint8Array,i));if(Boolean(littleEndian)===Boolean(IS_BIG_ENDIAN))bytes.reverse();return r(new arrayType(new Uint8Array(bytes).buffer),0)}}Object.defineProperty(DataView.prototype,"getUint8",{value:makeGetter(Uint8Array)});Object.defineProperty(DataView.prototype,"getInt8",{value:makeGetter(Int8Array)});Object.defineProperty(DataView.prototype,"getUint16",{value:makeGetter(Uint16Array)});Object.defineProperty(DataView.prototype,"getInt16",{value:makeGetter(Int16Array)});Object.defineProperty(DataView.prototype,"getUint32",{value:makeGetter(Uint32Array)});Object.defineProperty(DataView.prototype,"getInt32",{value:makeGetter(Int32Array)});Object.defineProperty(DataView.prototype,"getFloat32",{value:makeGetter(Float32Array)});Object.defineProperty(DataView.prototype,"getFloat64",{value:makeGetter(Float64Array)});function makeSetter(arrayType){return function SetViewValue(byteOffset,value,littleEndian){byteOffset=ToUint32(byteOffset);if(byteOffset+arrayType.BYTES_PER_ELEMENT>this.byteLength)throw RangeError("Array index out of range");var typeArray=new arrayType([value]),byteArray=new Uint8Array(typeArray.buffer),bytes=[],i,byteView;for(i=0;i<arrayType.BYTES_PER_ELEMENT;i+=1)bytes.push(r(byteArray,i));if(Boolean(littleEndian)===Boolean(IS_BIG_ENDIAN))bytes.reverse();byteView=new Uint8Array(this.buffer,byteOffset,arrayType.BYTES_PER_ELEMENT);byteView.set(bytes)}}Object.defineProperty(DataView.prototype,"setUint8",{value:makeSetter(Uint8Array)});Object.defineProperty(DataView.prototype,"setInt8",{value:makeSetter(Int8Array)});Object.defineProperty(DataView.prototype,"setUint16",{value:makeSetter(Uint16Array)});Object.defineProperty(DataView.prototype,"setInt16",{value:makeSetter(Int16Array)});Object.defineProperty(DataView.prototype,"setUint32",{value:makeSetter(Uint32Array)});Object.defineProperty(DataView.prototype,"setInt32",{value:makeSetter(Int32Array)});Object.defineProperty(DataView.prototype,"setFloat32",{value:makeSetter(Float32Array)});Object.defineProperty(DataView.prototype,"setFloat64",{value:makeSetter(Float64Array)});global.DataView=global.DataView||DataView})()})(this);!function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};b[g][0].call(k.exports,function(a){var c=b[g][1][a];return e(c?c:a)},k,k.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b,c){"use strict";function d(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(c,"__esModule",{value:!0});var e=function(){function a(a,b){for(var c=0;c<b.length;c++){var d=b[c];d.enumerable=d.enumerable||!1,d.configurable=!0,"value"in d&&(d.writable=!0),Object.defineProperty(a,d.key,d)}}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}(),f=function(){function a(){d(this,a),this._types={},this._seq=0}return e(a,[{key:"on",value:function(a,b){var c=this._types[a];c||(c=this._types[a]={});var d="sub"+this._seq++;return c[d]=b,d}},{key:"off",value:function(a,b){var c=this._types[a];if("function"==typeof b){for(var d in c)if(c.hasOwnProperty(d)&&c[d]===b)return delete c[d],d;return!1}if("string"==typeof b)return!(!c||!c[b])&&(delete c[b],b);throw new Error("Unexpected type for listener")}},{key:"trigger",value:function(a,b,c){var d=this._types[a];for(var e in d)d.hasOwnProperty(e)&&d[e].call(c,b)}}]),a}();c.default=f},{}],2:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b.default=a,b}function e(a){return a&&a.__esModule?a:{default:a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a){var b=a.var("filterset"),c=b.get();return c||(c=new m.default,b.set(c)),c}function h(){return r++}Object.defineProperty(c,"__esModule",{value:!0}),c.FilterHandle=void 0;var i=function(){function a(a,b){for(var c=0;c<b.length;c++){var d=b[c];d.enumerable=d.enumerable||!1,d.configurable=!0,"value"in d&&(d.writable=!0),Object.defineProperty(a,d.key,d)}}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}(),j=a("./events"),k=e(j),l=a("./filterset"),m=e(l),n=a("./group"),o=e(n),p=a("./util"),q=d(p),r=1;c.FilterHandle=function(){function a(b,c){f(this,a),this._eventRelay=new k.default,this._emitter=new q.SubscriptionTracker(this._eventRelay),this._group=null,this._filterSet=null,this._filterVar=null,this._varOnChangeSub=null,this._extraInfo=q.extend({sender:this},c),this._id="filter"+h(),this.setGroup(b)}return i(a,[{key:"setGroup",value:function(a){var b=this;if(this._group!==a&&(this._group||a)&&(this._filterVar&&(this._filterVar.off("change",this._varOnChangeSub),this.clear(),this._varOnChangeSub=null,this._filterVar=null,this._filterSet=null),this._group=a,a)){a=(0,o.default)(a),this._filterSet=g(a),this._filterVar=(0,o.default)(a).var("filter");var c=this._filterVar.on("change",function(a){b._eventRelay.trigger("change",a,b)});this._varOnChangeSub=c}}},{key:"_mergeExtraInfo",value:function(a){return q.extend({},this._extraInfo?this._extraInfo:null,a?a:null)}},{key:"close",value:function(){this._emitter.removeAllListeners(),this.clear(),this.setGroup(null)}},{key:"clear",value:function(a){this._filterSet&&(this._filterSet.clear(this._id),this._onChange(a))}},{key:"set",value:function(a,b){this._filterSet&&(this._filterSet.update(this._id,a),this._onChange(b))}},{key:"on",value:function(a,b){return this._emitter.on(a,b)}},{key:"off",value:function(a,b){return this._emitter.off(a,b)}},{key:"_onChange",value:function(a){this._filterSet&&this._filterVar.set(this._filterSet.value,this._mergeExtraInfo(a))}},{key:"filteredKeys",get:function(){return this._filterSet?this._filterSet.value:null}}]),a}()},{"./events":1,"./filterset":3,"./group":4,"./util":11}],3:[function(a,b,c){"use strict";function d(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function e(a,b){return a===b?0:a<b?-1:a>b?1:void 0}Object.defineProperty(c,"__esModule",{value:!0});var f=function(){function a(a,b){for(var c=0;c<b.length;c++){var d=b[c];d.enumerable=d.enumerable||!1,d.configurable=!0,"value"in d&&(d.writable=!0),Object.defineProperty(a,d.key,d)}}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}(),g=a("./util"),h=function(){function a(){d(this,a),this.reset()}return f(a,[{key:"reset",value:function(){this._handles={},this._keys={},this._value=null,this._activeHandles=0}},{key:"update",value:function(a,b){null!==b&&(b=b.slice(0),b.sort(e));var c=(0,g.diffSortedLists)(this._handles[a],b),d=c.added,f=c.removed;this._handles[a]=b;for(var h=0;h<d.length;h++)this._keys[d[h]]=(this._keys[d[h]]||0)+1;for(var i=0;i<f.length;i++)this._keys[f[i]]--;this._updateValue(b)}},{key:"_updateValue",value:function(){var a=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this._allKeys,b=Object.keys(this._handles).length;if(0===b)this._value=null;else{this._value=[];for(var c=0;c<a.length;c++){var d=this._keys[a[c]];d===b&&this._value.push(a[c])}}}},{key:"clear",value:function(a){if("undefined"!=typeof this._handles[a]){var b=this._handles[a];b||(b=[]);for(var c=0;c<b.length;c++)this._keys[b[c]]--;delete this._handles[a],this._updateValue()}}},{key:"value",get:function(){return this._value}},{key:"_allKeys",get:function(){var a=Object.keys(this._keys);return a.sort(e),a}}]),a}();c.default=h},{"./util":11}],4:[function(a,b,c){(function(b){"use strict";function d(a){return a&&a.__esModule?a:{default:a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a){if(a&&"string"==typeof a)return k.hasOwnProperty(a)||(k[a]=new l(a)),k[a];if("object"===("undefined"==typeof a?"undefined":h(a))&&a._vars&&a.var)return a;if(Array.isArray(a)&&1==a.length&&"string"==typeof a[0])return f(a[0]);throw new Error("Invalid groupName argument")}Object.defineProperty(c,"__esModule",{value:!0});var g=function(){function a(a,b){for(var c=0;c<b.length;c++){var d=b[c];d.enumerable=d.enumerable||!1,d.configurable=!0,"value"in d&&(d.writable=!0),Object.defineProperty(a,d.key,d)}}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}(),h="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&"function"==typeof Symbol&&a.constructor===Symbol&&a!==Symbol.prototype?"symbol":typeof a};c.default=f;var i=a("./var"),j=d(i);b.__crosstalk_groups=b.__crosstalk_groups||{};var k=b.__crosstalk_groups,l=function(){function a(b){e(this,a),this.name=b,this._vars={}}return g(a,[{key:"var",value:function(a){if(!a||"string"!=typeof a)throw new Error("Invalid var name");return this._vars.hasOwnProperty(a)||(this._vars[a]=new j.default(this,a)),this._vars[a]}},{key:"has",value:function(a){if(!a||"string"!=typeof a)throw new Error("Invalid var name");return this._vars.hasOwnProperty(a)}}]),a}()}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./var":12}],5:[function(a,b,c){(function(b){"use strict";function d(a){return a&&a.__esModule?a:{default:a}}function e(a){return k.var(a)}function f(a){return k.has(a)}Object.defineProperty(c,"__esModule",{value:!0});var g=a("./group"),h=d(g),i=a("./selection"),j=a("./filter");a("./input"),a("./input_selectize"),a("./input_checkboxgroup"),a("./input_slider");var k=(0,h.default)("default");b.Shiny&&b.Shiny.addCustomMessageHandler("update-client-value",function(a){"string"==typeof a.group?(0,h.default)(a.group).var(a.name).set(a.value):e(a.name).set(a.value)});var l={group:h.default,var:e,has:f,SelectionHandle:i.SelectionHandle,FilterHandle:j.FilterHandle};c.default=l,b.crosstalk=l}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./filter":2,"./group":4,"./input":6,"./input_checkboxgroup":7,"./input_selectize":8,"./input_slider":9,"./selection":10}],6:[function(a,b,c){(function(a){"use strict";function b(b){i[b.className]=b,a.document&&"complete"!==a.document.readyState?h(function(){d()}):a.document&&setTimeout(d,100)}function d(){Object.keys(i).forEach(function(a){var b=i[a];h("."+b.className).not(".crosstalk-input-bound").each(function(a,c){g(b,c)})})}function e(a){return a.replace(/([!"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~])/g,"\\$1")}function f(a){var b=h(a);Object.keys(i).forEach(function(c){if(b.hasClass(c)&&!b.hasClass("crosstalk-input-bound")){var d=i[c];g(d,a)}})}function g(a,b){var c=h(b).find("script[type='application/json'][data-for='"+e(b.id)+"']"),d=JSON.parse(c[0].innerText),f=a.factory(b,d);h(b).data("crosstalk-instance",f),h(b).addClass("crosstalk-input-bound")}Object.defineProperty(c,"__esModule",{value:!0}),c.register=b;var h=a.jQuery,i={};a.Shiny&&!function(){var b=new a.Shiny.InputBinding,c=a.jQuery;c.extend(b,{find:function(a){return c(a).find(".crosstalk-input")},initialize:function(a){c(a).hasClass("crosstalk-input-bound")||f(a)},getId:function(a){return a.id},getValue:function(a){},setValue:function(a,b){},receiveMessage:function(a,b){},subscribe:function(a,b){c(a).data("crosstalk-instance").resume()},unsubscribe:function(a){c(a).data("crosstalk-instance").suspend()}}),a.Shiny.inputBindings.register(b,"crosstalk.inputBinding")}()}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],7:[function(a,b,c){(function(b){"use strict";function c(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b.default=a,b}var d=a("./input"),e=c(d),f=a("./filter"),g=b.jQuery;e.register({className:"crosstalk-input-checkboxgroup",factory:function(a,b){var c=new f.FilterHandle(b.group),d=void 0,e=g(a);return e.on("change","input[type='checkbox']",function(){var a=e.find("input[type='checkbox']:checked");0===a.length?(d=null,c.clear()):!function(){var e={};a.each(function(){b.map[this.value].forEach(function(a){e[a]=!0})});var f=Object.keys(e);f.sort(),d=f,c.set(f)}()}),{suspend:function(){c.clear()},resume:function(){d&&c.set(d)}}}})}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./filter":2,"./input":6}],8:[function(a,b,c){(function(b){"use strict";function c(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b.default=a,b}var d=a("./input"),e=c(d),f=a("./util"),g=c(f),h=a("./filter"),i=b.jQuery;e.register({className:"crosstalk-input-select",factory:function(a,b){var c=[{value:"",label:"(All)"}],d=g.dataframeToD3(b.items),e={options:c.concat(d),valueField:"value",labelField:"label",searchField:"label"},f=i(a).find("select")[0],j=i(f).selectize(e)[0].selectize,k=new h.FilterHandle(b.group),l=void 0;return j.on("change",function(){0===j.items.length?(l=null,k.clear()):!function(){var a={};j.items.forEach(function(c){b.map[c].forEach(function(b){a[b]=!0})});var c=Object.keys(a);c.sort(),l=c,k.set(c)}()}),{suspend:function(){k.clear()},resume:function(){l&&k.set(l)}}}})}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./filter":2,"./input":6,"./util":11}],9:[function(a,b,c){(function(b){"use strict";function c(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b.default=a,b}function d(a,b){for(var c=a.toString();c.length<b;)c="0"+c;return c}function e(a){return a instanceof Date?a.getUTCFullYear()+"-"+d(a.getUTCMonth()+1,2)+"-"+d(a.getUTCDate(),2):null}var f=function(){function a(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done)&&(c.push(g.value),!b||c.length!==b);d=!0);}catch(a){e=!0,f=a}finally{try{!d&&h.return&&h.return()}finally{if(e)throw f}}return c}return function(b,c){if(Array.isArray(b))return b;if(Symbol.iterator in Object(b))return a(b,c);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),g=a("./input"),h=c(g),i=a("./filter"),j=b.jQuery,k=b.strftime;h.register({className:"crosstalk-input-slider",factory:function(a,b){function c(){var a=h.data("ionRangeSlider").result,b=void 0,c=h.data("data-type");return b="date"===c?function(a){return e(new Date(+a))}:"datetime"===c?function(a){return+a/1e3}:function(a){return+a},"double"===h.data("ionRangeSlider").options.type?[b(a.from),b(a.to)]:b(a.from)}var d=new i.FilterHandle(b.group),g={},h=j(a).find("input"),l=h.data("data-type"),m=h.data("time-format"),n=void 0;if("date"===l)n=k.utc(),g.prettify=function(a){return n(m,new Date(a))};else if("datetime"===l){var o=h.data("timezone");n=o?k.timezone(o):k,g.prettify=function(a){return n(m,new Date(a))}}h.ionRangeSlider(g);var p=null;return h.on("change.crosstalkSliderInput",function(a){if(!h.data("updating")&&!h.data("animating")){for(var e=c(),g=f(e,2),i=g[0],j=g[1],k=[],l=0;l<b.values.length;l++){var m=b.values[l];m>=i&&m<=j&&k.push(b.keys[l])}k.sort(),d.set(k),p=k}}),{suspend:function(){d.clear()},resume:function(){p&&d.set(p)}}}})}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./filter":2,"./input":6}],10:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b.default=a,b}function e(a){return a&&a.__esModule?a:{default:a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(c,"__esModule",{value:!0}),c.SelectionHandle=void 0;var g=function(){function a(a,b){for(var c=0;c<b.length;c++){var d=b[c];d.enumerable=d.enumerable||!1,d.configurable=!0,"value"in d&&(d.writable=!0),Object.defineProperty(a,d.key,d)}}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}(),h=a("./events"),i=e(h),j=a("./group"),k=e(j),l=a("./util"),m=d(l);c.SelectionHandle=function(){function a(){var b=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,c=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;f(this,a),this._eventRelay=new i.default,this._emitter=new m.SubscriptionTracker(this._eventRelay),this._group=null,this._var=null,this._varOnChangeSub=null,this._extraInfo=m.extend({sender:this},c),this.setGroup(b)}return g(a,[{key:"setGroup",value:function(a){var b=this;if(this._group!==a&&(this._group||a)&&(this._var&&(this._var.off("change",this._varOnChangeSub),this._var=null,this._varOnChangeSub=null),this._group=a,a)){this._var=(0,k.default)(a).var("selection");var c=this._var.on("change",function(a){b._eventRelay.trigger("change",a,b)});this._varOnChangeSub=c}}},{key:"_mergeExtraInfo",value:function(a){return m.extend({},this._extraInfo?this._extraInfo:null,a?a:null)}},{key:"set",value:function(a,b){this._var&&this._var.set(a,this._mergeExtraInfo(b))}},{key:"clear",value:function(a){this._var&&this.set(void 0,this._mergeExtraInfo(a))}},{key:"on",value:function(a,b){return this._emitter.on(a,b)}},{key:"off",value:function(a,b){return this._emitter.off(a,b)}},{key:"close",value:function(){this._emitter.removeAllListeners(),this.setGroup(null)}},{key:"value",get:function(){return this._var?this._var.get():null}}]),a}()},{"./events":1,"./group":4,"./util":11}],11:[function(a,b,c){"use strict";function d(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function e(a){for(var b=arguments.length,c=Array(b>1?b-1:0),d=1;d<b;d++)c[d-1]=arguments[d];for(var e=0;e<c.length;e++){var f=c[e];if("undefined"!=typeof f&&null!==f)for(var g in f)f.hasOwnProperty(g)&&(a[g]=f[g])}return a}function f(a){for(var b=1;b<a.length;b++)if(a[b]<=a[b-1])throw new Error("List is not sorted or contains duplicate")}function g(a,b){var c=0,d=0;a||(a=[]),b||(b=[]);var e=[],g=[];for(f(a),f(b);c<a.length&&d<b.length;)a[c]===b[d]?(c++,d++):a[c]<b[d]?e.push(a[c++]):g.push(b[d++]);return c<a.length&&(e=e.concat(a.slice(c))),d<b.length&&(g=g.concat(b.slice(d))),{removed:e,added:g}}function h(a){var b=[],c=void 0;for(var d in a){if(a.hasOwnProperty(d)&&b.push(d),"object"!==j(a[d])||"undefined"==typeof a[d].length)throw new Error("All fields must be arrays");if("undefined"!=typeof c&&c!==a[d].length)throw new Error("All fields must be arrays of the same length");c=a[d].length}for(var e=[],f=void 0,g=0;g<c;g++){f={};for(var h=0;h<b.length;h++)f[b[h]]=a[b[h]][g];e.push(f)}return e}Object.defineProperty(c,"__esModule",{value:!0});var i=function(){function a(a,b){for(var c=0;c<b.length;c++){var d=b[c];d.enumerable=d.enumerable||!1,d.configurable=!0,"value"in d&&(d.writable=!0),Object.defineProperty(a,d.key,d)}}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}(),j="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&"function"==typeof Symbol&&a.constructor===Symbol&&a!==Symbol.prototype?"symbol":typeof a};c.extend=e,c.checkSorted=f,c.diffSortedLists=g,c.dataframeToD3=h;c.SubscriptionTracker=function(){function a(b){d(this,a),this._emitter=b,this._subs={}}return i(a,[{key:"on",value:function(a,b){var c=this._emitter.on(a,b);return this._subs[c]=a,c}},{key:"off",value:function(a,b){var c=this._emitter.off(a,b);return c&&delete this._subs[c],c}},{key:"removeAllListeners",value:function(){var a=this,b=this._subs;this._subs={},Object.keys(b).forEach(function(c){a._emitter.off(b[c],c)})}}]),a}()},{}],12:[function(a,b,c){(function(b){"use strict";function d(a){return a&&a.__esModule?a:{default:a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(c,"__esModule",{value:!0});var f="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&"function"==typeof Symbol&&a.constructor===Symbol&&a!==Symbol.prototype?"symbol":typeof a},g=function(){function a(a,b){for(var c=0;c<b.length;c++){var d=b[c];d.enumerable=d.enumerable||!1,d.configurable=!0,"value"in d&&(d.writable=!0),Object.defineProperty(a,d.key,d)}}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}(),h=a("./events"),i=d(h),j=function(){function a(b,c,d){e(this,a),this._group=b,this._name=c,this._value=d,this._events=new i.default}return g(a,[{key:"get",value:function(){return this._value}},{key:"set",value:function(a,c){if(this._value!==a){var d=this._value;this._value=a;var e={};if(c&&"object"===("undefined"==typeof c?"undefined":f(c)))for(var g in c)c.hasOwnProperty(g)&&(e[g]=c[g]);e.oldValue=d,e.value=a,this._events.trigger("change",e,this),b.Shiny&&b.Shiny.onInputChange&&b.Shiny.onInputChange(".clientValue-"+(null!==this._group.name?this._group.name+"-":"")+this._name,"undefined"==typeof a?null:a)}}},{key:"on",value:function(a,b){return this._events.on(a,b)}},{key:"off",value:function(a,b){return this._events.off(a,b)}}]),a}();c.default=j}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./events":1}]},{},[5]);
    //# sourceMappingURL=crosstalk.min.js.map