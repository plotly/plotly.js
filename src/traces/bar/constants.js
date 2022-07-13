'use strict';

module.exports = {
    // padding in pixels around text
    TEXTPAD: 3,
    // 'value' and 'label' are not really necessary for bar traces,
    // but they were made available to `texttemplate` (maybe by accident)
    // via tokens `%{value}` and `%{label}` starting in 1.50.0,
    // so let's include them in the event data also.
    eventDataKeys: ['value', 'label']
};
