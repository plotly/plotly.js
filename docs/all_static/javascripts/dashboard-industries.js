/*****************************************/
/* Toggles trace shown in choropleth map */ 
/*****************************************/

var lastMapValue = -1;
function changeMapQuarter(){
	var plot = document.getElementById('usaSalesPlot').contentWindow;
	var selection = document.getElementById('selectQuarter').value;
	var showScale = false;
	if( selection.toString() == "0" ) showScale = true;	
	plot.postMessage({
            task: 'restyle',
            update: {visible: true, showscale: showScale},
				indices: [selection]
        },
        'https://plotly.com');
	plot.postMessage({
            task: 'restyle',
            update: {visible: false, showscale: showScale},
				indices: [lastMapValue]
        },
        'https://plotly.com');
	lastMapValue = selection;
}

// Sample from a normal distribution with mean 0, stddev 1.
function normal() {
  var x = 0, y = 0, rds, c;
  do {
    x = Math.random() * 2 - 1;
    y = Math.random() * 2 - 1;
    rds = x * x + y * y;
  } while (rds == 0 || rds > 1);
  c = Math.sqrt(-2 * Math.log(rds) / rds); // Box-Muller transform
  return x * c; // throw away extra sample y * c
}

(function(){var qs,js,q,s,d=document,gi=d.getElementById,ce=d.createElement,gt=d.getElementsByTagName,id='typef_orm',b='https://s3-eu-west-1.amazonaws.com/share.typeform.com/';if(!gi.call(d,id)){js=ce.call(d,'script');js.id=id;js.src=b+'share.js';q=gt.call(d,'script')[0];q.parentNode.insertBefore(js,q)}id=id+'_';if(!gi.call(d,id)){qs=ce.call(d,'link');qs.rel='stylesheet';qs.id=id;qs.href=b+'share-button.css';s=gt.call(d,'head')[0];s.appendChild(qs,s)}})()
