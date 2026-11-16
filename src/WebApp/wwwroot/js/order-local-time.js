// Shows order dates in the browser's own time zone. The server renders each date as
// <time datetime="...Z" data-local-time> with the UTC text as a fallback; this rewrites the
// text as MM/dd/yyyy HH:mm:ss in local time. The text is always derived from the datetime
// attribute and only written when it differs, so a value is never converted twice and the
// mutation our own write triggers ends in a no-op pass.
//
// Runs on load, after every Blazor enhanced navigation, and whenever streaming render or a
// refresh inserts or replaces rows (MutationObserver on the document body).
(function () {
    'use strict';

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function format(d) {
        return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear() + ' ' +
            pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function convertAll() {
        var nodes = document.querySelectorAll('time[data-local-time][datetime]');
        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            var d = new Date(el.getAttribute('datetime'));
            if (isNaN(d.getTime())) {
                continue;
            }
            var text = format(d);
            if (el.textContent !== text) {
                el.textContent = text;
            }
        }
    }

    var scheduled = false;
    function schedule() {
        if (scheduled) {
            return;
        }
        scheduled = true;
        requestAnimationFrame(function () {
            scheduled = false;
            convertAll();
        });
    }

    function start() {
        convertAll();
        new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    (function hookEnhancedNav() {
        if (window.Blazor && typeof window.Blazor.addEventListener === 'function') {
            window.Blazor.addEventListener('enhancedload', convertAll);
        } else {
            setTimeout(hookEnhancedNav, 150);
        }
    })();
})();
