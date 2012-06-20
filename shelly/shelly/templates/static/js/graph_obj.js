function scatter_plot(divid, data, layout) {
	var gd=document.getElementById(divid);

	// data should be a list of dicts, either:
	// {xy:[[x0,y0],[x1,y1],..], name:'<name>', color:'<color>'}
	// or:
	// {y:[y0,y1,..], x0:<#>, dx:<#>, name:'<name>', color:'<color>'}
	gd.data=data;

	// make the graph container and axes, if they don't already exist
	if(gd.layout===undefined) {new_plot(divid, layout);}

	var gl=gd.layout;
	var vb=gd.plot.viewbox;
	var xa=gl.xaxis;
	var ya=gl.yaxis;
	var x,xy,y,mx,bx;

	for(curve in gd.data) { 
	if('xy' in gd.data[curve]) {
		xy=gd.data[curve].xy;
		gd.plot.setStart();
		for(x in xy) {if(x>0){gd.plot.path(Raphael.format('M{0},{1}L{2},{3}',
			xa.b+xa.m*xy[x-1][0]+vb.x,ya.b+ya.m*xy[x-1][1]+vb.y,
			xa.b+xa.m*xy[x][0]+vb.x,ya.b+ya.m*xy[x][1]+vb.y))}}
		gd.data[curve].lines=gd.plot.setFinish();
		gd.plot.setStart();
		for(x in xy) {gd.plot.circle(xa.b+xa.m*xy[x][0]+vb.x,ya.b+ya.m*xy[x][1]+vb.y,3)}
		gd.data[curve].points=gd.plot.setFinish();
	}
	else {
		y=gd.data[curve].y;
		mx=xa.m*gd.data[curve].dx;
		bx=xa.m*gd.data[curve].x0+xa.b;
		gd.plot.setStart();
		for(x in y) {if(x>0){gd.plot.path(Raphael.format('M{0},{1}L{2},{3}',
			bx+mx*(x-1),ya.b+ya.m*y[x-1],
			bx+mx*x,ya.b+ya.m*y[x]))}}
		gd.data[curve].lines=gd.plot.setFinish();
		gd.plot.setStart();
		for(x in y) {gd.plot.circle(bx+mx*x,ya.b+ya.m*y[x],3)}
		gd.data[curve].points=gd.plot.setFinish();
	}
	gd.data[curve].lines.attr({'stroke':gd.data[curve].color});
	gd.data[curve].points.attr({'fill':gd.data[curve].color,'stroke-width':0});
	}
	return('*ta-da*')
}

function new_plot(divid, layout) {
	// Get the container div: we will store all variables as properties of this div
	// (for extension to multiple graphs per page)
	var gd=document.getElementById(divid);

	// Get the layout info (hard code this for now)
	gd.layout={title:'Glass Washer',
		xaxis:{range:[-10,12],tick0:0,dtick:2,ticklen:5,
			title:'Time',unit:'hours'},
		yaxis:{range:[-3.5,5.5],tick0:0,dtick:1,ticklen:5,
			title:'pH',unit:''},
		width:400,
		height:300,
		margin:{l:50,r:10,t:30,b:40,pad:2},
		paper_bgcolor:'#fff',
		plot_bgcolor:'#fff' };
		// TODO: add font size controls, and label positioning
		// TODO: add marker and linewidth controls
		// TODO: add legend
		// TODO: use this hard coded one for defaults, take any new properties from input param

	// Make the graph containers
	// We use a hack to get two nested Raphael objects (Raphael 2.0.1)
	// First one (paper) is for the axes
	var gl=gd.layout;
	gd.paper=Raphael(divid,gl.width,gl.height);
	gd.plotwidth=gl.width-gl.margin.l-gl.margin.r;
	gd.plotheight=gl.height-gl.margin.t-gl.margin.b;
	gd.ax=gd.paper.rect(gl.margin.l-gl.margin.pad,
		gl.margin.t-gl.margin.pad,
		gd.plotwidth+2*gl.margin.pad,
		gd.plotheight+2*gl.margin.pad);
	gd.paperDOM=gd.firstChild;
	gd.paperDOM.style['background-color']=gl.paper_bgcolor;

	// Second one (plot) is for the data
	gd.plot=Raphael(gd.paperDOM,gd.plotwidth,gd.plotheight);
	gd.plotDOM=gd.paperDOM.childNodes[0];
	gd.plotDOM.style.position='';
	gd.plotDOM.setAttribute('x',gl.margin.l);
	gd.plotDOM.setAttribute('y',gl.margin.t);
	gd.plot.viewbox={x:0,y:0,w:gd.plotwidth,h:gd.plotheight,dx:0,dy:0};
	gd.plotbg=gd.plot.rect(-screen.width,-screen.height,
		gd.plotwidth+2*screen.width,gd.plotheight+2*screen.height);
	gd.plotbg.attr({'fill':gl.plot_bgcolor,'stroke-width':0});

	// plotted area dragging - the 'gd's at the end become 'this' in the fcns
	gd.plotbg.drag(plotdrag,plotdragstart,plotdragend,gd,gd,gd);

	// make the ticks, grids, and titles
	doXTicks(gd);doYTicks(gd);doXGrid(gd);doYGrid(gd);
	gl.xaxis.r0=gl.xaxis.range[0];
	gl.yaxis.r0=gl.yaxis.range[0];

	gd.xtitle=gd.paper.text((gl.width+gl.margin.l-gl.margin.r)/2,gl.height-10,
		axtitle(gl.xaxis)).attr({'font-size':14});
	gd.ytitle=gd.paper.text(20,(gl.height+gl.margin.t-gl.margin.b)/2,
		axtitle(gl.yaxis)).rotate(-90).attr({'font-size':14});
	gd.title=gd.paper.text(gl.width/2,gl.margin.t/2,gl.title).attr({'font-size':16});
}

function plotdragstart(x,y) {
	var gl=this.layout;
	this.plotbg.node.style.cursor='move';
	gl.xaxis.r0=[gl.xaxis.range[0],gl.xaxis.range[1]];
	gl.yaxis.r0=[gl.yaxis.range[0],gl.yaxis.range[1]];
}

function plotdrag(dx,dy) {
	var gl=this.layout;
	var vb=this.plot.viewbox;
	vb.dx=dx;
	vb.dy=dy;
	this.plot.setViewBox(vb.x-vb.dx,vb.y-vb.dy,vb.w,vb.h,false);
	gl.xaxis.range[0]=gl.xaxis.r0[0]-dx/gl.xaxis.m;
	gl.xaxis.range[1]=gl.xaxis.r0[1]-dx/gl.xaxis.m;
	gl.yaxis.range[0]=gl.yaxis.r0[0]-dy/gl.yaxis.m;
	gl.yaxis.range[1]=gl.yaxis.r0[1]-dy/gl.yaxis.m;
	doXTicks(this);doYTicks(this);
}

function plotdragend() {
	var vb=this.plot.viewbox;
	vb.x-=vb.dx;
	vb.y-=vb.dy;
	vb.dx=0;
	vb.dy=0;
	this.plotbg.node.style.cursor='';
	doXGrid(this);doYGrid(this);
}

function doXTicks(gd) {
	if(typeof gd.xticks != 'undefined') {gd.xticks.remove();gd.xlabels.remove();}
	var gl=gd.layout;
	var a=gl.xaxis;
	gd.paper.setStart();
	a.m=gd.plotwidth/(a.range[1]-a.range[0]);
	a.b=-a.m*a.range[0];
	a.tmin=Math.ceil((a.range[0]-a.tick0)/a.dtick)*a.dtick+a.tick0;
	for(var x=a.tmin;x<=a.range[1];x+=a.dtick){
		gd.paper.path(Raphael.format('M{0},{1}v{2}',
			gl.margin.l+a.m*x+a.b,
			gl.height-gl.margin.b+gl.margin.pad,
			a.ticklen))}
	gd.xticks=gd.paper.setFinish();
	gd.paper.setStart();
	for(x=a.tmin;x<=a.range[1];x+=a.dtick){
		gd.paper.text(gl.margin.l+a.m*x+a.b,
			gl.height-gl.margin.b+gl.margin.pad+a.ticklen,
			Raphael.format('\n{0}',x))}
	gd.xlabels=gd.paper.setFinish();
	gd.xlabels.attr({'font-size':12});
}

function doXGrid(gd) {
	if(typeof gd.xgrid != 'undefined') {gd.xgrid.remove();}
	var a=gd.layout.xaxis;
	gd.plot.setStart();
	for(var x=a.tmin;x<=a.range[1];x+=a.dtick){
		gd.plot.path(Raphael.format('M{0},{1}v{2}',a.m*x+a.b+gd.plot.viewbox.x,
			gd.plot.viewbox.y-screen.height,gd.plotheight+2*screen.height))}
	gd.xgrid=gd.plot.setFinish();
	gd.xgrid.attr({'stroke':'#ccc'}).toBack().drag(plotdrag,plotdragstart,plotdragend,gd,gd,gd);
	gd.plotbg.toBack();
}

function doYTicks(gd) {
	if(typeof gd.yticks != 'undefined') {gd.yticks.remove();gd.ylabels.remove();}
	var gl=gd.layout;
	var a=gl.yaxis;
	gd.paper.setStart();
	a.m=gd.plotheight/(a.range[0]-a.range[1]);
	a.b=-a.m*a.range[1];
	a.tmin=Math.ceil((a.range[0]-a.tick0)/a.dtick)*a.dtick+a.tick0;
	for(var x=a.tmin;x<=a.range[1];x+=a.dtick){
		gd.paper.path(Raphael.format('M{0},{1}h{2}',
			gl.margin.l-gl.margin.pad,
			gl.margin.t+a.m*x+a.b,
			-a.ticklen))}
	gd.yticks=gd.paper.setFinish();
	gd.paper.setStart();
	for(x=a.tmin;x<=a.range[1];x+=a.dtick){
		gd.paper.text(gl.margin.l-gl.margin.pad-a.ticklen,
			gl.margin.t+a.m*x+a.b,
			Raphael.format('{0}',x))}
	gd.ylabels=gd.paper.setFinish();
	gd.ylabels.attr({'font-size':12,'text-anchor':'end'});
}

function doYGrid(gd) { // assumes doYticks has been called recently
	if(typeof gd.ygrid != 'undefined') {gd.ygrid.remove();}
	var a=gd.layout.yaxis;
	gd.plot.setStart();
	for(var x=a.tmin;x<=a.range[1];x+=a.dtick){
		gd.plot.path(Raphael.format('M{0},{1}h{2}',gd.plot.viewbox.x-screen.width,
			a.m*x+a.b+gd.plot.viewbox.y,gd.plotwidth+2*screen.width))}
	gd.ygrid=gd.plot.setFinish();
	gd.ygrid.attr({'stroke':'#ccc'}).toBack().drag(plotdrag,plotdragstart,plotdragend,gd,gd,gd);
	gd.plotbg.toBack();
}

function axtitle(axis) {
	if((axis.unit=='')||(axis.unit==undefined)) return axis.title;
	else return axis.title+' ('+axis.unit+')';
}

