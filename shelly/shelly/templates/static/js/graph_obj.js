// ps is a single plotting session
ps={}
ps.randdata=[];
for(var i=0;i<1000;i++) {ps.randdata.push(Math.random()*5-2);}
ps.data=[
{xy:[[-5,0],[-4,0],[-3,1],[-2,4],[-1,-2],[0,0],[1,5],[3,3],[3.5,1],[4,2],[6,3],[10,5]],
	name:'Fred',color:'#00f'},
{y:[4,2,6,1,0,-3,-1,0,1,1,0,0.1,0.2,0.1,0,0],x0:-6,dx:1.1,
	name:'Ethel',color:'#f00'},
{y:ps.randdata,x0:-100,dx:0.2,name:'Bertha',color:'#0f0'}];

ps.layout={title:'Glass Washer',
	xaxis:{range:[-10,12],tick0:0,dtick:2,ticklen:5,
		title:'Time',unit:'hours'},
	yaxis:{range:[-3.5,5.5],tick0:0,dtick:1,ticklen:5,
		title:'pH',unit:''},
	width:576,
	height:432,
	//width:640,
	//height:480,
	margin:{l:50,r:10,t:30,b:40,pad:2} };
// TODO: add font size controls, and label positioning
// TODO: add marker and linewidth controls
// TODO: add legend

ps.paper=Raphael('graph',ps.layout.width,ps.layout.height);
ps.x;

ps.plotwidth=ps.layout.width-ps.layout.margin.l-ps.layout.margin.r;
ps.plotheight=ps.layout.height-ps.layout.margin.t-ps.layout.margin.b;
ax=ps.paper.rect(ps.layout.margin.l-ps.layout.margin.pad,
	ps.layout.margin.t-ps.layout.margin.pad,
	ps.plotwidth+2*ps.layout.margin.pad,
	ps.plotheight+2*ps.layout.margin.pad);
ps.paperDOM=document.getElementById('graph').firstChild;
ps.paperDOM.style['background-color']='#fff';
ps.plot=Raphael(ps.paperDOM,ps.plotwidth,ps.plotheight);
ps.plotDOM=ps.paperDOM.childNodes[0];
ps.plotDOM.style.position='';
ps.plotDOM.setAttribute('x',ps.layout.margin.l);
ps.plotDOM.setAttribute('y',ps.layout.margin.t);
ps.plot.viewbox={x:0,y:0,w:ps.plotwidth,h:ps.plotheight,dx:0,dy:0};
ps.plotbg=ps.plot.rect(-screen.width,-screen.height,
	ps.plotwidth+2*screen.width,ps.plotheight+2*screen.height);
ps.plotbg.attr({'fill':'#fff','stroke-width':0});
ps.plotbg.drag(ps.plotdrag,ps.plotdragstart,ps.plotdragend);

ps.plotdragstart=function(x,y) {
	ps.plotbg.node.style.cursor='move';
	ps.layout.xaxis.r0=[ps.layout.xaxis.range[0],ps.layout.xaxis.range[1]];
	ps.layout.yaxis.r0=[ps.layout.yaxis.range[0],ps.layout.yaxis.range[1]];
}

ps.plotdrag=function(dx,dy) {
	var vb=ps.plot.viewbox;
	vb.dx=dx;
	vb.dy=dy;
	ps.plot.setViewbox(vb.x-vb.dx,vb.y-vb.dy,vb.w,vb.h,false);
	ps.layout.xaxis.range[0]=ps.layout.xaxis.r0[0]-dx/ps.layout.xaxis.m;
	ps.layout.xaxis.range[1]=ps.layout.xaxis.r0[1]-dx/ps.layout.xaxis.m;
	ps.layout.yaxis.range[0]=ps.layout.yaxis.r0[0]-dy/ps.layout.yaxis.m;
	ps.layout.yaxis.range[1]=ps.layout.yaxis.r0[1]-dy/ps.layout.yaxis.m;
	ps.doXTicks();ps.doYTicks();
}

ps.plotdragend=function() {
	var vb=ps.plot.viewbox;
	vb.x-=vb.dx;
	vb.y-=vb.dy;
	vb.dx=0;
	vb.dy=0;
	ps.plotbg.node.style.cursor='';
	ps.doXGrid();ps.doYGrid();
};

ps.doXTicks=function() {
	if(typeof xticks != 'undefined') {xticks.remove();xlabels.remove();}
	a=ps.layout.xaxis;
	ps.paper.setStart();
	a.m=ps.plotwidth/(a.range[1]-a.range[0]);
	a.b=-a.m*a.range[0];
	a.tmin=Math.ceil((a.range[0]-a.tick0)/a.dtick)*a.dtick+a.tick0;
	for(x=a.tmin;x<=a.range[1];x+=a.dtick){
		ps.paper.path(Raphael.format('M{0},{1}v{2}',
			ps.layout.margin.l+a.m*x+a.b,
			ps.layout.height-ps.layout.margin.b+ps.layout.margin.pad,
			a.ticklen))}
	xticks=ps.paper.setFinish();
	ps.paper.setStart();
	for(x=a.tmin;x<=a.range[1];x+=a.dtick){
		ps.paper.text(ps.layout.margin.l+a.m*x+a.b,
			ps.layout.height-ps.layout.margin.b+ps.layout.margin.pad+a.ticklen,
			Raphael.format('\n{0}',x))}
	xlabels=ps.paper.setFinish();
	xlabels.attr({'font-size':12});
};

ps.doXGrid=function() {
	if(typeof xgrid != 'undefined') {xgrid.remove();}
	a=ps.layout.xaxis;
	ps.plot.setStart();
	for(x=a.tmin;x<=a.range[1];x+=a.dtick){
		ps.plot.path(Raphael.format('M{0},{1}v{2}',a.m*x+a.b+ps.plot.viewbox.x,
			ps.plot.viewbox.y-screen.height,ps.plotheight+2*screen.height))}
	xgrid=ps.plot.setFinish();
	xgrid.attr({'stroke':'#ccc'}).toBack().drag(ps.plotdrag,ps.plotdragstart,ps.plotdragend);
	ps.plotbg.toBack();
};

ps.doYTicks=function() {
	if(typeof yticks != 'undefined') {yticks.remove();ylabels.remove();}
	a=ps.layout.yaxis;
	ps.paper.setStart();
	a.m=ps.plotheight/(a.range[0]-a.range[1]);
	a.b=-a.m*a.range[1];
	a.tmin=Math.ceil((a.range[0]-a.tick0)/a.dtick)*a.dtick+a.tick0;
	for(x=a.tmin;x<=a.range[1];x+=a.dtick){
		ps.paper.path(Raphael.format('M{0},{1}h{2}',
			ps.layout.margin.l-ps.layout.margin.pad,
			ps.layout.margin.t+a.m*x+a.b,
			-a.ticklen))}
	ps.yticks=ps.paper.setFinish();
	ps.paper.setStart();
	for(x=a.tmin;x<=a.range[1];x+=a.dtick){
		ps.paper.text(ps.layout.margin.l-ps.layout.margin.pad-a.ticklen,
			ps.layout.margin.t+a.m*x+a.b,
			Raphael.format('{0}',x))}
	ylabels=ps.paper.setFinish();
	ylabels.attr({'font-size':12,'text-anchor':'end'});
};

ps.doYGrid=function() { // assumes doYticks has been called recently
	if(typeof ygrid != 'undefined') {ygrid.remove();}
	a=ps.layout.yaxis;
	ps.plot.setStart();
	for(x=a.tmin;x<=a.range[1];x+=a.dtick){
		ps.plot.path(Raphael.format('M{0},{1}h{2}',ps.plot.viewbox.x-screen.width,
			a.m*x+a.b+ps.plot.viewbox.y,ps.plotwidth+2*screen.width))}
	ygrid=ps.plot.setFinish();
	ygrid.attr({'stroke':'#ccc'}).toBack().drag(ps.plotdrag,ps.plotdragstart,ps.plotdragend);
	ps.plotbg.toBack();
}

ps.doXTicks();ps.doYTicks();ps.doXGrid();ps.doYGrid();
ps.layout.xaxis.r0=ps.layout.xaxis.range[0];
ps.layout.yaxis.r0=ps.layout.yaxis.range[0];

ps.axtitle=function(axis) {
	if(axis.unit=='') return axis.title;
	else return axis.title+' ('+axis.unit+')';
};

ps.lnplt=function(res) {
    //var ps.paper=Raphael('graph',ps.layout.width,ps.layout.height);
    xtitle=ps.paper.text((ps.layout.width+ps.layout.margin.l-ps.layout.margin.r)/2,ps.layout.height-10,
	ps.axtitle(ps.layout.xaxis)).attr({'font-size':14});
    ytitle=ps.paper.text(20,(ps.layout.height+ps.layout.margin.t-ps.layout.margin.b)/2,
	ps.axtitle(ps.layout.yaxis)).rotate(-90).attr({'font-size':14});
    title=ps.paper.text(ps.layout.width/2,ps.layout.margin.t/2,ps.layout.title).attr({'font-size':16});

    //ps.data=[
    //{xy:[[-5,0],[-4,0],[-3,1],[-2,4],[-1,-2],[0,0],[1,5],[3,3],[3.5,1],[4,2],[6,3],[10,5]],
    // name:'Fred',color:'#00f'},
    //{y:[4,2,6,1,0,-3,-1,0,1,1,0,0.1,0.2,0.1,0,0],x0:-6,dx:1.1,
    // name:'Ethel',color:'#f00'},
    //{y:ps.randdata,x0:-100,dx:0.2,name:'Bertha',color:'#0f0'}];

    // x, y strings
    x=res.x.replace(/^\s+|\s+$/g, '').replace('[','').replace(']','').split(',');
    y=res.y.replace(/^\s+|\s+$/g, '').replace('[','').replace(']','').split(',');
    ps.data=[]
    dictdata={}
    arraydata=[]
    dictdata['name']='Fred'
    dictdata['color']='#00f'
    for(var i=0;i<x.length;i++){
	var pt=[];
	pt[0]=x[i];
	pt[1]=y[i];
	arraydata[i]=pt;
    }
    dictdata['xy']=arraydata;
    ps.data[0]=dictdata;
 
    var xa=ps.layout.xaxis;
    var ya=ps.layout.yaxis;
    var xy,y,mx,bx;
    for(curve in ps.data) { 
	if('xy' in ps.data[curve]) {
	    xy=ps.data[curve].xy;
	    ps.plot.setStart();
	    for(x in xy) {if(x>0){ps.plot.path(Raphael.format('M{0},{1}L{2},{3}',
		xa.b+xa.m*xy[x-1][0],ya.b+ya.m*xy[x-1][1],
		xa.b+xa.m*xy[x][0],ya.b+ya.m*xy[x][1]))}}
	    ps.data[curve].lines=ps.plot.setFinish();
	    ps.plot.setStart();
	    for(x in xy) {ps.plot.circle(xa.b+xa.m*xy[x][0],ya.b+ya.m*xy[x][1],3)}
	    ps.data[curve].points=ps.plot.setFinish();
	}
	else {
	    y=ps.data[curve].y;
	    mx=xa.m*ps.data[curve].dx;
	    bx=xa.m*ps.data[curve].x0+xa.b;
	    ps.plot.setStart();
	    for(x in y) {if(x>0){ps.plot.path(Raphael.format('M{0},{1}L{2},{3}',
		bx+mx*(x-1),ya.b+ya.m*y[x-1],
		bx+mx*x,ya.b+ya.m*y[x]))}}
	    ps.data[curve].lines=ps.plot.setFinish();
	    ps.plot.setStart();
	    for(x in y) {ps.plot.circle(bx+mx*x,ya.b+ya.m*y[x],3)}
	    ps.data[curve].points=ps.plot.setFinish();
	}
	ps.data[curve].lines.attr({'stroke':ps.data[curve].color});
	ps.data[curve].points.attr({'fill':ps.data[curve].color,'stroke-width':0});
    }
    return('*ta-da*')
};
