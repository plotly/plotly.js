document$.subscribe(function() {
  // Highlight all the javascript code blocks
  document.querySelectorAll('pre code[class*="language-"]').forEach((block) => {
    hljs.highlightElement(block);
  });
});