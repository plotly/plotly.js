'use strict';

const NO_MODIFIERS = { shiftKey: false, ctrlKey: false, altKey: false };

const isEditable = (el) =>
    !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

exports.update = function(gd, { shiftKey, ctrlKey, altKey }) {
    if(!gd._fullLayout) return;

    const prev = gd._modifierKeys || NO_MODIFIERS;
    if(prev.shiftKey === !!shiftKey && prev.ctrlKey === !!ctrlKey && prev.altKey === !!altKey) return;
    gd._modifierKeys = { shiftKey: !!shiftKey, ctrlKey: !!ctrlKey, altKey: !!altKey };

    const modules = gd._fullLayout._basePlotModules;
    for(let i = 0; i < modules.length; i++) {
        if(modules[i].updateCursor) modules[i].updateCursor(gd);
    }
};

exports.track = function(gd) {
    if(gd._untrackModifierKeys) return;

    const onKey = (e) => {
        if(!isEditable(e.target)) exports.update(gd, e);
    };
    const onBlur = () => exports.update(gd, NO_MODIFIERS);

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('blur', onBlur);

    gd._untrackModifierKeys = function() {
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('keyup', onKey);
        window.removeEventListener('blur', onBlur);
        delete gd._untrackModifierKeys;
        delete gd._modifierKeys;
    };
};

exports.untrack = function(gd) {
    if(gd._untrackModifierKeys) gd._untrackModifierKeys();
};
