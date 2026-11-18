// Sort control for the catalog. A custom, on-theme "Sort" control in the toolbar (an ARIA
// select-only combobox: a button-like trigger plus a listbox popup) chooses the order of the
// whole catalog: picking an option navigates to the catalog with a `sort` query parameter
// (back to page 1), and the server sorts before paging. The choice is persisted to
// localStorage; when the catalog is opened without `sort`, the stored choice is restored by
// replacing the URL, so it sticks across reloads and visits.
(function () {
    const STORAGE_KEY = 'aw.catalog.sort.v1';
    const DEFAULT_SORT = 'name-asc';
    const OPTIONS = [
        { value: 'name-asc', label: 'Name: A to Z' },
        { value: 'name-desc', label: 'Name: Z to A' },
        { value: 'price-asc', label: 'Price: Low to High' },
        { value: 'price-desc', label: 'Price: High to Low' },
    ];
    const VALID = new Set(OPTIONS.map(o => o.value));
    const LABELS = new Map(OPTIONS.map(o => [o.value, o.label]));

    // -- preference + navigation --------------------------------------------------

    function readPref() {
        try {
            const value = localStorage.getItem(STORAGE_KEY);
            return VALID.has(value) ? value : DEFAULT_SORT;
        } catch {
            return DEFAULT_SORT;
        }
    }

    function writePref(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch {
            /* private mode / storage disabled: the sort still applies through the URL */
        }
    }

    // The catalog URL for a sort: the default order carries no parameter, and a new order
    // starts again at page 1. Filters stay as they are.
    function sortedUrl(value) {
        const url = new URL(window.location.href);
        url.searchParams.delete('page');
        if (value === DEFAULT_SORT) url.searchParams.delete('sort');
        else url.searchParams.set('sort', value);
        return url.toString();
    }

    // The sort the catalog is showing: the URL's, or the default when it has none or an unknown one.
    function currentSort() {
        const value = new URLSearchParams(window.location.search).get('sort');
        return VALID.has(value) ? value : DEFAULT_SORT;
    }

    // Enhanced navigation keeps the page shell; before Blazor has started (the first load) a
    // plain location change is used instead.
    function navigate(url, replace, enhanced) {
        if (url === window.location.href) return;
        if (enhanced && window.Blazor && typeof window.Blazor.navigateTo === 'function') {
            window.Blazor.navigateTo(url, { replaceHistoryEntry: replace });
        } else if (replace) {
            window.location.replace(url);
        } else {
            window.location.assign(url);
        }
    }

    // -- custom combobox control --------------------------------------------------

    const root = () => document.querySelector('[data-catalog-sort]');
    const triggerOf = r => r.querySelector('[data-catalog-sort-trigger]');
    const listboxOf = r => r.querySelector('[data-catalog-sort-listbox]');
    const optionsOf = r => Array.from(r.querySelectorAll('[role="option"]'));
    const isOpen = r => triggerOf(r).getAttribute('aria-expanded') === 'true';

    function reflect(r, value) {
        const valueEl = r.querySelector('[data-catalog-sort-value]');
        if (valueEl) valueEl.textContent = LABELS.get(value) || LABELS.get(DEFAULT_SORT);
        for (const opt of optionsOf(r)) {
            opt.setAttribute('aria-selected', opt.dataset.value === value ? 'true' : 'false');
        }
    }

    function setActive(r, opt) {
        if (!opt) return;
        for (const o of optionsOf(r)) o.classList.toggle('is-active', o === opt);
        triggerOf(r).setAttribute('aria-activedescendant', opt.id);
        opt.scrollIntoView({ block: 'nearest' });
    }

    function activeOption(r) {
        return optionsOf(r).find(o => o.classList.contains('is-active')) || null;
    }

    function open(r) {
        listboxOf(r).hidden = false;
        triggerOf(r).setAttribute('aria-expanded', 'true');
        r.classList.add('is-open');
        const selected = optionsOf(r).find(o => o.getAttribute('aria-selected') === 'true');
        setActive(r, selected || optionsOf(r)[0]);
        triggerOf(r).focus({ preventScroll: true });
    }

    function close(r, focusTrigger) {
        const tr = triggerOf(r);
        listboxOf(r).hidden = true;
        tr.setAttribute('aria-expanded', 'false');
        tr.removeAttribute('aria-activedescendant');
        r.classList.remove('is-open');
        for (const o of optionsOf(r)) o.classList.remove('is-active');
        if (focusTrigger) tr.focus({ preventScroll: true });
    }

    function selectValue(r, value) {
        if (!VALID.has(value)) value = DEFAULT_SORT;
        writePref(value);
        reflect(r, value);
        if (value !== currentSort()) navigate(sortedUrl(value), false, true);
    }

    function move(r, delta) {
        const opts = optionsOf(r);
        const cur = activeOption(r);
        let idx = cur ? opts.indexOf(cur) : -1;
        idx = Math.max(0, Math.min(opts.length - 1, idx + delta));
        setActive(r, opts[idx]);
    }

    let typeBuffer = '';
    let typeTimer = null;
    function typeAhead(r, ch) {
        clearTimeout(typeTimer);
        typeBuffer += ch.toLowerCase();
        typeTimer = setTimeout(() => { typeBuffer = ''; }, 500);
        const match = optionsOf(r).find(o => o.textContent.trim().toLowerCase().startsWith(typeBuffer));
        if (!match) return;
        if (isOpen(r)) setActive(r, match);
        else selectValue(r, match.dataset.value);
    }

    document.addEventListener('click', function (event) {
        const r = root();
        if (!r) return;
        const target = event.target;

        const opt = target.closest && target.closest('[role="option"]');
        if (opt && r.contains(opt)) {
            selectValue(r, opt.dataset.value);
            close(r, true);
            return;
        }

        const trg = target.closest && target.closest('[data-catalog-sort-trigger]');
        if (trg && r.contains(trg)) {
            if (isOpen(r)) close(r, true); else open(r);
            return;
        }

        if (isOpen(r) && !r.contains(target)) close(r, false);
    });

    document.addEventListener('keydown', function (event) {
        const r = root();
        if (!r || !r.contains(document.activeElement)) return;

        const opened = isOpen(r);
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!opened) open(r); else move(r, 1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (!opened) open(r); else move(r, -1);
                break;
            case 'Home':
                if (opened) { event.preventDefault(); setActive(r, optionsOf(r)[0]); }
                break;
            case 'End':
                if (opened) { event.preventDefault(); const o = optionsOf(r); setActive(r, o[o.length - 1]); }
                break;
            case 'Enter':
            case ' ':
            case 'Spacebar':
                event.preventDefault();
                if (!opened) { open(r); }
                else { const a = activeOption(r); if (a) selectValue(r, a.dataset.value); close(r, true); }
                break;
            case 'Escape':
                if (opened) { event.preventDefault(); close(r, true); }
                break;
            case 'Tab':
                if (opened) {
                    const a = activeOption(r);
                    if (a) selectValue(r, a.dataset.value);
                    close(r, false);
                }
                break;
            default:
                if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
                    event.preventDefault();
                    typeAhead(r, event.key);
                }
                break;
        }
    });

    // -- restore the stored choice -------------------------------------------------

    // Runs on the first load and after every enhanced navigation. On the catalog, a valid
    // `sort` in the URL is the current choice and becomes the stored one; without `sort`
    // the stored choice (when it is not the default) is restored by replacing the URL.
    function sync(enhanced) {
        if (!document.querySelector('.catalog')) return;
        const params = new URLSearchParams(window.location.search);
        if (params.has('sort')) {
            const value = params.get('sort');
            if (VALID.has(value)) writePref(value);
            return;
        }
        const pref = readPref();
        if (pref !== DEFAULT_SORT) navigate(sortedUrl(pref), true, enhanced);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => sync(false));
    } else {
        sync(false);
    }

    (function hookEnhancedNav() {
        if (window.Blazor && typeof window.Blazor.addEventListener === 'function') {
            window.Blazor.addEventListener('enhancedload', () => sync(true));
        } else {
            setTimeout(hookEnhancedNav, 150);
        }
    })();
})();
