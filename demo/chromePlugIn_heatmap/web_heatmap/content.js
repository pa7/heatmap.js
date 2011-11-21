function $$(id){
	return document.getElementById(id);
}


/**
 * handler
 */
function operate(request, sender, sendResponse){					
		for( i in request) {
			var key = i;
		}		
		if(key == 'drawHeatMap'){
			drawHeatMap(sendResponse);
		}else if(key == 'startRecord') {
			isStart = 1;
		}else if(key == 'hideCanvas') {		
			hideCanvas();
		}		
}
chrome.extension.onRequest.addListener(operate);

var space = {"x":[],"y":[]}; //store the mousemove point

var heatmapCanvas ={
	ele:null,
	scrollTop:0,
	scrollLeft:0,
	resizeScroll:function() {
		heatmapCanvas.scrollTop = document.body.scrollTop;
		heatmapCanvas.scrollLeft = document.body.scrollLeft;		
	}
};
heatmapCanvas.resizeScroll();

/**
 * record the position where the mouse moved
 */
document.documentElement.onmousemove = function(e) {	
	space.x.push(heatmapCanvas.scrollLeft + e.clientX);
	space.y.push(heatmapCanvas.scrollTop + e.clientY);	
	/*
		realtime to do
	*/
}


/*resize the browser*/
window.onload = function() {
	heatmapCanvas.resizeScroll();
}
window.onresize = function() {
	heatmapCanvas.resizeScroll();
}
window.onscroll = function() {
	heatmapCanvas.resizeScroll();
}


/**
 * hide canvas
 */
function hideCanvas() {		
	if( $$("heatmapCanvas") != null) {
		$$("heatmapCanvas").style.display = 'none';
	}	
}

function drawHeatMap(sendResponse) {		
		//carete the heat-map canvas
		if( $$("heatmapCanvas") == null) {
		
			//create outerDiv 
			var ele = document.createElement("div");		
			var w = document.body.scrollWidth, h = document.body.scrollHeight;
			ele.id  = 'heatmapCanvas';
			ele.style.width = w + "px";
			ele.style.position = "absolute";
			ele.style.top = "0px";
			ele.style.left = "0px";
			ele.id = 'heatmapCanvas';
			ele.style.height = h + "px";
			
			// config heatMap parameter
			var config = {
				radius : 10,
				visible : true,
				width : w,
				height : h,
				element : ele,		
				opacity : 50							  
			};							
			heatmap = h337.create(config);
			heatmapCanvas.ele = ele;
			document.body.appendChild(ele);					
		}			
		heatmapCanvas.ele.style.display = 'block';
		heatmap.clear();

		//draw heatmap
		for(var i = 0 , len = space.x.length; i < len; i++) {
			var x = parseInt(space.x[i]);
			var y = parseInt(space.y[i]);
			heatmap.store.addDataPoint(x,y);					
		}	
}
