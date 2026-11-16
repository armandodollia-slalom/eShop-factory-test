// Submit-once forms: a form marked data-submit-once ignores further submits while its post
// is in flight, and its submit button is shown disabled and busy. Blazor's enhanced form
// post re-renders the form afterwards, which drops the marker and re-enables the button.
//
// Listens in the capture phase so a repeat submit is stopped before Blazor's own listener
// sends it. The button is disabled on the next task, after the submitter's name/value has
// been read into the post. Delegated from document and safe to load once.
(function () {
    'use strict';

    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!(form instanceof HTMLFormElement) || !form.hasAttribute('data-submit-once')) {
            return;
        }

        if (form.hasAttribute('data-submitting')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }

        form.setAttribute('data-submitting', '');
        var submitter = e.submitter || form.querySelector('[type="submit"]');
        if (submitter) {
            setTimeout(function () {
                submitter.disabled = true;
                submitter.setAttribute('aria-busy', 'true');
            }, 0);
        }
    }, true);
})();
