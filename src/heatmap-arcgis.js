/* global heatmapFactory */

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dijit/_WidgetBase",
    "dojo/dom",
    "dojo/query",
    "dojo/dom-style",
    "dojo/on",
    "esri/layers/DynamicMapServiceLayer",
    "esri/geometry/screenUtils",
    "esri/geometry/Point"
], function(
    declare, lang,
    _WidgetBase,
    dom,
    query,
    domStyle,
    on, 
    DynamicMapServiceLayer,
    screenUtils,
    Point
) {
    return declare("modules.HeatmapLayer", [_WidgetBase, DynamicMapServiceLayer], {
        options: {
            useLocalMaximum: false,
            map: null,
            config:{
                radius: 40,
                debug: false,
                visible: true,
                gradient: {
                    0.45: "rgb(000,000,255)",
                    0.55: "rgb(000,255,255)",
                    0.65: "rgb(000,255,000)",
                    0.95: "rgb(255,255,000)",
                    1.00: "rgb(255,000,000)"
                }
            }
        },
        // constructor
        constructor: function(options, srcNode) {
            // last data storage
            this.set("data", []);
            // map node
            this.domNode = dom.byId(srcNode);
            // defaults
            var defaults = lang.mixin({}, this.options, options);
            // map var
            this.set("map", defaults.map);
            this.set("useLocalMaximum", defaults.useLocalMaximum);
            defaults.config.height = this.get("map").height;
            defaults.config.width = this.get("map").width;
            defaults.config.element = this.domNode;
            this.set("config", defaults.config);
            // create heatmap
            this.heatMap = heatmapFactory.create(this.get("config"));
            // global maximum value
            this.set("globalMax", 0);
            // connect on resize
            this._listeners = [];
            var mapResize = on(this.get("map"), "resize", lang.hitch(this, function(evt) {
                this.resizeHeatmap(evt.width, evt.height);
            }));
            this._listeners.push(mapResize);
            // heatlayer div styling
            domStyle.set(this.domNode, {
                position: "absolute",
                display: "none" 
            });
            // loaded
            this.set("loaded",true);
            this.onLoad(this);
        },
        // connections/subscriptions will be cleaned up during the destroy() lifecycle phase
        destroy: function() {
            if (this._listeners.length) {
                for (var i = 0; i < this._listeners.length; i++) {
                    this._listeners[i].remove();
                }
            }
            this.inherited(arguments);
        },
        resizeHeatmap: function(width, height) {
            // set heatmap data size
            this.heatMap.set("width", width);
            this.heatMap.set("height", height);
            // set width and height of container
            domStyle.set(this.domNode, {
                "width": width + 'px',
                "height": height + 'px'
            });
            // set width and height of canvas element inside of container
            var child = query(':first-child', this.domNode);
            if (child) {
                child.attr('width', width);
                child.attr('height', height);
            }
            // set atx canvas width and height fix
            var actx = this.heatMap.get("actx");
            actx.canvas.height = height;
            actx.canvas.width = width;
            this.heatMap.set("actx", actx);
            // refresh image and heat map size
            this.refresh();
        },
        // stores heatmap converted data into the plugin which renders it
        storeHeatmapData: function(heatPluginData) {
            // set heatmap data
            this.heatMap.store.setDataSet(heatPluginData);
        },
        // converts parsed data into heatmap format
        convertHeatmapData: function(parsedData) {
            // variables
            var xParsed, yParsed, heatPluginData, screenGeometry;
            // set heat plugin data object
            heatPluginData = {
                max: parsedData.max,
                data: [] // empty data
            };
            // if data
            if (parsedData.data) {
                // for all x values
                for (xParsed in parsedData.data) {
                    // if data[x]
                    if (parsedData.data.hasOwnProperty(xParsed)) {
                        // for all y values and count
                        for (yParsed in parsedData.data[xParsed]) {
                            if (parsedData.data[xParsed].hasOwnProperty(yParsed)) {
                                // convert data point into screen geometry
                                screenGeometry = screenUtils.toScreenGeometry(this.get("map").extent, this.get("map").width, this.get("map").height, parsedData.data[xParsed][yParsed].dataPoint);
                                // push to heatmap plugin data array
                                heatPluginData.data.push({
                                    x: screenGeometry.x,
                                    y: screenGeometry.y,
                                    count: parsedData.data[xParsed][yParsed].count // count value of x,y
                                });
                            }
                        }
                    }
                }
            }
            // store in heatmap plugin which will render it
            this.storeHeatmapData(heatPluginData);
        },
        // runs through data and calulates weights and max
        parseHeatmapData: function(features) {
            // variables
            var i, parsedData, dataPoint, attributes;
            // if data points exist
            if (features) {
                // create parsed data object
                parsedData = {
                    max: 0,
                    data: []
                };
                if (!this.get("useLocalMaximum")) {
                    parsedData.max = this.get("globalMax");
                }
                // for each data point
                for (i = 0; i < features.length; i++) {
                    // create geometry point
                    dataPoint = Point(features[i].geometry.x, features[i].geometry.y, this.get("map").spatialReference);
                    // check point
                    var validPoint = false;
                    // if not using local max, point is valid
                    if (!this.get("useLocalMaximum")) {
                        validPoint = true;
                    }
                    // using local max, make sure point is within extent
                    else if (this.get("map").extent.contains(dataPoint)) {
                        validPoint = true;
                    }
                    if (validPoint) {
                        // attributes
                        attributes = features[i].attributes;
                        // if array value is undefined
                        if (!parsedData.data[dataPoint.x]) {
                            // create empty array value
                            parsedData.data[dataPoint.x] = [];
                        }
                        // array value array is undefined
                        if (!parsedData.data[dataPoint.x][dataPoint.y]) {
                            // create object in array
                            parsedData.data[dataPoint.x][dataPoint.y] = {};
                            // if count is defined in datapoint
                            if (attributes && attributes.hasOwnProperty('count')) {
                                // create array value with count of count set in datapoint
                                parsedData.data[dataPoint.x][dataPoint.y].count = attributes.count;
                            } else {
                                // create array value with count of 0
                                parsedData.data[dataPoint.x][dataPoint.y].count = 0;
                            }
                        }
                        // add 1 to the count
                        parsedData.data[dataPoint.x][dataPoint.y].count += 1;
                        // store dataPoint var
                        parsedData.data[dataPoint.x][dataPoint.y].dataPoint = dataPoint;
                        // if count is greater than current max
                        if (parsedData.max < parsedData.data[dataPoint.x][dataPoint.y].count) {
                            // set max to this count
                            parsedData.max = parsedData.data[dataPoint.x][dataPoint.y].count;
                            if (!this.get("useLocalMaximum")) {
                                this.set("globalMax", parsedData.data[dataPoint.x][dataPoint.y].count);
                            }
                        }
                    }
                }
                // convert parsed data into heatmap plugin formatted data
                this.convertHeatmapData(parsedData);
            }
        },
        // set data function call
        setData: function(features) {
            // set width/height
            this.resizeHeatmap(this.get("map").width, this.get("map").height);
            // store points
            this.set("data", features);
            // create data and then store it
            this.parseHeatmapData(features);
            // redraws the heatmap
            this.refresh();
        },
        // add one feature to the heatmap
        addDataPoint: function(feature) {
            if (feature) {
                // push to data
                var data = this.get("data");
                data.push(feature);
                // set data
                this.setData(data);
            }
        },
        // return data set of features
        exportDataSet: function() {
            return this.get("data");
        },
        // clear data function
        clearData: function() {
            // empty heat map
            this.heatMap.clear();
            // empty array
            var empty = [];
            // set data to empty array
            this.setData(empty);
        },
        // get image
        getImageUrl: function(extent, width, height, callback) {
            // create heatmap data using last data
            this.parseHeatmapData(this.get("data"));
            // image data
            var imageUrl = this.heatMap.get("canvas").toDataURL("image/png");
            // callback
            callback(imageUrl);
        }
    });
});