const markers = {
    circle: '●',
    'circle-open': '○',
    square: '■',
    'square-open': '□',
    diamond: '◆',
    'diamond-open': '◇',
    cross: '+',
    x: '❌'
} as const satisfies Record<string, string>;

export default markers;
