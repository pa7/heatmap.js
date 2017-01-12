/*
* chartie-gmaps-heatmap.js gmaps overlay
*
* Copyright (c) 2015, Holsys società cooperativa (http://www.holsys.com)
* Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
* and the Beerware (http://en.wikipedia.org/wiki/Beerware) license. 
* 
*/

HeatmapOverlay.prototype.addChartieData = function (data) {
    this.max = 8;
    this.min = 0;

    var latField = this.cfg.latField || 'lat';
    var lngField = this.cfg.lngField || 'lng';

    // transform data to latlngs        
    var lat=eval("data."+latField);
    var lng=eval("data."+lngField);
    var latlng = new google.maps.LatLng(lat, lng);

    // check if data field is an array of at least 10 values
    if ((data.signal.length >= 10)) {
        // asynchronous call to Chartie service
        this.chartie(data.signal, lat, lng, latlng);
    } else {
        console.log("you must specify numerical arrays of at least 10 values to use Chartie service");
    }    
    
};

HeatmapOverlay.prototype.setChartieData = function (data) {
    this.max = 8;
    this.min = 0;

    var latField = this.cfg.latField || 'lat';
    var lngField = this.cfg.lngField || 'lng';

    // transform data to latlngs
    var data = data.data;
    var len = data.length;    

    while (len--) {
        var entry = data[len];
        var latlng = new google.maps.LatLng(entry[latField], entry[lngField]);

        // check if data field is an array of at least 10 values
        if ((entry['signal'].length >= 10)) {
            // asynchronous call to Chartie service
            this.chartie(entry['signal'], entry[latField], entry[lngField], latlng);
        } else {
            console.log("you must specify numerical arrays of at least 10 values to use Chartie service");
        }
    }
};

HeatmapOverlay.prototype.setChartieKey = function (key){    
    heatmap.cfg.key=key;
}

HeatmapOverlay.prototype.chartie = function (signalData, lat, lon, latlng) {
    $.ajax({
        type: "POST", async: true, url: "http://api.chartie.io?key=" + heatmap.cfg.key + "&mode=zoom",
        data: JSON.stringify(signalData),
        dataType: "json",
        success:
                function (data) {
                    //OK
                    if (data.msgNo === "0") {
                        //Convert trend into integer, i.e. "very strong rise"->8, "balanced"->4, "very strong fall"->0, etc..
                        var trendInt = trendToInt(data);                        
                        var dataObj = {lat: lat, lng: lon};
                        eval('dataObj.'+heatmap.cfg.valueField+'='+trendInt);
                        dataObj.latlng = latlng;

                        heatmap.data.push(dataObj);
                        heatmap.update();

                    } else {
                        console.log("Chartie error number " + data.msgNo);
                        console.log("Read docs at http://www.chartie.io/docs.php");
                    }
                },
        error:
                function (data) {
                    console.log("An error occurred while calling Chartie service");
                }
    });
};


// this function reads Chartie Json output and assigns
// a number to each possible output trend
function trendToInt(data) {
    var i = 0;
    if (data.trend === "rise") {
        i = 1;
    } else if (data.trend === "fall") {
        i = -1;
    } else {
        i = 0;
    }
    if (data.strength === "slight") {
        i = i *1;
    } else if (data.strength === "moderate") {
        i = i *2;
    } else if (data.strength === "strong") {
        i = i *3;
    } else if (data.strength === "very strong") {
        i = i *4;
    }
    i=i+4;
    return i;
}

