// Made with Plotly's postMessage API
// https://github.com/plotly/postMessage-API	

var d3_numeric = function(x) {
 	return !isNaN(x);
}

var d3sum = function(array, f) {
  var s = 0,
      n = array.length,
      a,
      i = -1;
  if (arguments.length === 1) {
	 // zero and null are equivalent
    while (++i < n) if (d3_numeric(a = +array[i])) s += a; 
  } else {
    while (++i < n) if (d3_numeric(a = +f.call(array, array[i], i))) s += a;
  }
  return s;
};

var movingWindowAvg = function (arr, step) {  
    return arr.map(function (_, idx) { 
        var wnd = arr.slice(idx - step, idx + step + 1); 
        var result = d3sum(wnd) / wnd.length; if (isNaN(result)) { result = _; }
        return result; 
    });
};

var average = false;
var X, Y, vis, plot1;

function applyAvg(){
	// get current x, y data	
	
	plot1 = document.getElementById('plot1').contentWindow;

	plot1.postMessage({
		 task: 'getAttributes',
		 attributes: [ 'data[1].x', 'data[1].y' ] },
		 'https://plotly.com/');   
}

window.addEventListener('message', function(e) {
		
	var message = e.data;

	if( 'data[2].visible' in message.response ){
		var vis = message.response['data[2].visible'];
		console.log('Average visible', vis);
		if( vis === undefined ){
				plot1.postMessage({
		 			task: 'getAttributes',
		 			attributes: [ 'data[1].x', 'data[1].y' ] },
		 			'https://plotly.com/');
		}
		else if( vis == true ){
			vis = false;	
		}
		else{
			vis = true;
		}
		
		plot1.postMessage({
			task: 'restyle',
			update: { 'visible':vis },
			indices: [2]
		}, 'https://plotly.com'); 
	}
	else{
		var window = document.getElementById('myRange').value;
		document.getElementById('window').innerHTML = window;
		X = message.response['data[1].x'];
		Y = message.response['data[1].y'];	
		if( average ){
			var arr = movingWindowAvg( Y, Number(window) );		
			console.log('Recalculated average');
			plot1.postMessage({
				task: 'restyle',
				update: { y: [arr], x: [X], yaxis:"y2", mode:'lines', 
					visible:true, name:'Moving average', line:{shape:'spline'}},
				indices: [2]
			}, 'https://plotly.com');  
		}
		else{		
			avg = { y: [arr], x: [X], visible:true, 
					 mode:'line', marker:{color:'#444'} };
			console.log( 'Adding moving average', avg );
			plot1.postMessage({
				task: 'addTraces',
				traces: [ avg ],
				newIndices: [2]
			}, 'https://plotly.com'); 	
			applyAvg();
			average = true;
		}
	}

	document.getElementById('toggleAverage').disabled = false;

});

function toggleAvg(){
	// get current x, y data
	plot1.postMessage({
		 task: 'getAttributes',
		 attributes: [ 'data[2].visible' ] },
		 'https://plotly.com/');
}

/***************************/
/*** Change type buttons ***/
/***************************/

var showError = false;

function changeType(type){
    var plot2 = document.getElementById('plot2').contentWindow;

    update = {};

    if( type == 'error' ){
    	if( showError == false ){
    		showError = true;
    	}
    	else{
    		showError = false;
    	}
    	update = {'error_y':{visible:showError,type:"percent",width:0,color:"rgb(102, 102, 102)"} };
    }
    else if( type == 'scatter' ){
    	update = {type:type};
    }
    else if( type == 'bar' ){
    	update = {type:type, opacity:0.8};
    }

    plot2.postMessage( {
    'task': 'restyle',
        'update': update,
    },
    'https://plotly.com');
}


