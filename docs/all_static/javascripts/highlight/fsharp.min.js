/*! `fsharp` grammar compiled for Highlight.js 11.3.1 */
(()=>{var e=(()=>{"use strict";function e(e){
return e?"string"==typeof e?e:e.source:null}function n(e){return t("(?=",e,")")}
function t(...n){return n.map((n=>e(n))).join("")}function i(...n){const t=(e=>{
const n=e[e.length-1]
;return"object"==typeof n&&n.constructor===Object?(e.splice(e.length-1,1),n):{}
})(n);return"("+(t.capture?"":"?:")+n.map((n=>e(n))).join("|")+")"}return e=>{
const a={scope:"keyword",match:/\b(yield|return|let|do|match|use)!/},s={
type:["bool","byte","sbyte","int8","int16","int32","uint8","uint16","uint32","int","uint","int64","uint64","nativeint","unativeint","decimal","float","double","float32","single","char","string","unit","bigint","option","voption","list","array","seq","byref","exn","inref","nativeptr","obj","outref","voidptr"],
keyword:["abstract","and","as","assert","base","begin","class","default","delegate","do","done","downcast","downto","elif","else","end","exception","extern","finally","fixed","for","fun","function","global","if","in","inherit","inline","interface","internal","lazy","let","match","member","module","mutable","namespace","new","of","open","or","override","private","public","rec","return","static","struct","then","to","try","type","upcast","use","val","void","when","while","with","yield"],
literal:["true","false","null","Some","None","Ok","Error","infinity","infinityf","nan","nanf"],
built_in:["not","ref","raise","reraise","dict","readOnlyDict","set","enum","sizeof","typeof","typedefof","nameof","nullArg","invalidArg","invalidOp","id","fst","snd","ignore","lock","using","box","unbox","tryUnbox","printf","printfn","sprintf","eprintf","eprintfn","fprintf","fprintfn","failwith","failwithf"],
"variable.constant":["__LINE__","__SOURCE_DIRECTORY__","__SOURCE_FILE__"]},r={
variants:[e.COMMENT(/\(\*(?!\))/,/\*\)/,{contains:["self"]
}),e.C_LINE_COMMENT_MODE]},o={match:t(/('|\^)/,e.UNDERSCORE_IDENT_RE),
scope:"symbol",relevance:0},c={scope:"computation-expression",
match:/\b[_a-z]\w*(?=\s*\{)/},l={
begin:[/^\s*/,t(/#/,i("if","else","endif","line","nowarn","light","r","i","I","load","time","help","quit")),/\b/],
beginScope:{2:"meta"},end:n(/\s|$/)},f={
variants:[e.BINARY_NUMBER_MODE,e.C_NUMBER_MODE]},u={scope:"string",begin:/"/,
end:/"/,contains:[e.BACKSLASH_ESCAPE]},p={scope:"string",begin:/@"/,end:/"/,
contains:[{match:/""/},e.BACKSLASH_ESCAPE]},d={scope:"subst",begin:/\{/,
end:/\}/,keywords:s},g={scope:"string",begin:/\$"/,end:/"/,contains:[{
match:/\{\{/},{match:/\}\}/},e.BACKSLASH_ESCAPE,d]},b={scope:"string",
begin:/(\$@|@\$)"/,end:/"/,contains:[{match:/\{\{/},{match:/\}\}/},{match:/""/
},e.BACKSLASH_ESCAPE,d]},m={scope:"string",begin:/\$"""/,end:/"""/,contains:[{
match:/\{\{/},{match:/\}\}/},d],relevance:2},_={scope:"string",
match:t(/'/,i(/[^\\']/,/\\(?:.|\d{3}|x[a-fA-F\d]{2}|u[a-fA-F\d]{4}|U[a-fA-F\d]{8})/),/'/)
};return d.contains=[b,g,p,u,_,a,r,c,l,f,o],{name:"F#",aliases:["fs","f#"],
keywords:s,illegal:/\/\*/,classNameAliases:{"computation-expression":"keyword"},
contains:[a,{variants:[m,b,g,{scope:"string",begin:/"""/,end:/"""/,relevance:2
},p,u,_]},r,{begin:[/type/,/\s+/,e.UNDERSCORE_IDENT_RE],beginScope:{1:"keyword",
3:"title.class"},end:n(/\(|=|$/),contains:[o]},{scope:"meta",begin:/^\s*\[</,
excludeBegin:!0,end:n(/>\]/),relevance:2,contains:[{scope:"string",begin:/"/,
end:/"/},f]},c,l,f,o]}}})();hljs.registerLanguage("fsharp",e)})();