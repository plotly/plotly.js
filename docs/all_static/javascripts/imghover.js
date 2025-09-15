function movingInImgOp(img, text) {
		img.style.opacity = "0.2";
		text.style.display = "";
}
function movingOutImgOp(img, text) {	
		text.style.display = "none";
		img.style.opacity = "1";
}

/* vertical position of side navigation on reference pages */
var refBar = document.getElementById('reference-side-nav');
var MAINBAR_H = 405;
update_pos = function() {
	if( refBar === undefined || refBar === null ){ 
		return;
	}
	
	if ( (document.body.scrollTop > MAINBAR_H) || (document.documentElement.scrollTop > MAINBAR_H) ){
		refBar.style.position = "fixed";
		refBar.style.top = "0";
	}
	else{
		refBar.style.position = "fixed";
		refBar.style.top = (MAINBAR_H).toString()+'px';
	}
}
document.addEventListener ("scroll", update_pos);
