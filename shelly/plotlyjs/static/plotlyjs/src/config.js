
/**
 * Check and configure MathJax
 */
if (typeof MathJax !== 'undefined'){
    exports.MathJax = true;

    MathJax.Hub.Config({
        messageStyle: 'none',
        skipStartupTypeset: true,
        displayAlign: "left",
        tex2jax: {
            inlineMath: [["$","$"],["\\(","\\)"]]
        }
    });

    MathJax.Hub.Configured();
} else {
    exports.MathJax = false;
}
