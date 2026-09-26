// Padding in pixels around text
export const TEXTPAD = 3;

// 'value' and 'label' are not really necessary for bar traces,
// but they were made available to `texttemplate` (maybe by accident)
// via tokens `%{value}` and `%{label}` starting in 1.50.0,
// so let's include them in the event data also.
export const eventDataKeys = ['value', 'label'] as const;
