// Submit once: a form marked [data-submit-once] (checkout) sends its first submit only.
// A double-click on its submit button would otherwise start a second enhanced form
// post before the page moves on. The first submit goes through untouched, so Blazor's
// enhanced form post still reads the form data; later submits are cancelled in the
// capture phase, before Blazor's own document listener sees them. The submit buttons
// are disabled on the next tick, after Blazor has read the form.
//
// When the post re-renders the same page (a validation error), the enhanced load
// releases the form so it can be submitted again.
//
// Delegated from document and safe to load once.
(function () {
    'use strict';

    var pending = new WeakSet();

    function buttons(form) {
        return form.querySelectorAll('button[type="submit"], input[type="submit"]');
    }

    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!form || !form.matches || !form.matches('form[data-submit-once]')) {
            return;
        }

        if (pending.has(form)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }

        pending.add(form);
        setTimeout(function () {
            buttons(form).forEach(function (button) {
                button.disabled = true;
            });
        }, 0);
    }, true);

    function release() {
        document.querySelectorAll('form[data-submit-once]').forEach(function (form) {
            pending.delete(form);
            buttons(form).forEach(function (button) {
                button.disabled = false;
            });
        });
    }

    (function hookEnhancedNav() {
        if (window.Blazor && typeof window.Blazor.addEventListener === 'function') {
            window.Blazor.addEventListener('enhancedload', release);
        } else {
            setTimeout(hookEnhancedNav, 150);
        }
    })();
})();
