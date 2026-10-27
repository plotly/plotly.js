export const CLICK_TRANSITION_TIME = 750;
export const CLICK_TRANSITION_EASING = 'linear';

export const eventDataKeys = [
    // String
    'currentPath',
    'root',
    'entry',
    // No need to add 'parent' here

    // Percentages i.e. ratios
    'percentRoot',
    'percentEntry',
    'percentParent'
] as const;
