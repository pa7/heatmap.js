/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Renderer.js
 */

/**
 * Class: OpenLayers.Renderer.Heatmap 
 * A renderer based on https://github.com/pa7/heatmap.js
 * 
 * Inherits:
 *  - <OpenLayers.Renderer>
 */
OpenLayers.Renderer.Heatmap = OpenLayers.Class(OpenLayers.Renderer, {

    /**
     * APIProperty: heatmapConfig
     * {Object} See documentation at 
     *      https://github.com/pa7/heatmap.js/blob/master/README.md.
     *
     *      Note that the following heatmap.js options are ignored: element,
     *      visible, width, height.
     */
    heatmapConfig: null,

    /**
     * Property: heatmap
     * {Canvas} The heatmap.j object.
     */
    heatmap: null, 
    
    /**
     * Property: features
     * {Object} Internal object of feature/style pairs for use in redrawing the layer.
     */
    features: null,
    
    /**
     * Property: pendingRedraw
     * {Boolean} The renderer needs a redraw call to render features added while
     *     the renderer was locked.
     */
    pendingRedraw: false,
    
    /**
     * Constructor: OpenLayers.Renderer.Heatmap
     *
     * Parameters:
     * containerID - {<String>}
     * options - {Object} Optional properties to be set on the renderer.
     */
    initialize: function(containerID, options) {
        OpenLayers.Renderer.prototype.initialize.apply(this, arguments);

        var heatmapConfig = OpenLayers.Util.applyDefaults({
                visible: true,
                element: this.container
            }, 
            this.heatmapConfig || {}
        );
        var hm = h337.create(heatmapConfig);
        this.heatmap = hm;
        this.root = hm.get("canvas");
        
        this.features = {};
    },
    
    /**
     * Method: setExtent
     * Set the visible part of the layer.
     *
     * Parameters:
     * extent - {<OpenLayers.Bounds>}
     * resolutionChanged - {Boolean}
     *
     * Returns:
     * {Boolean} true to notify the layer that the new extent does not exceed
     *     the coordinate range, and the features will not need to be redrawn.
     *     False otherwise.
     */
    setExtent: function() {
        OpenLayers.Renderer.prototype.setExtent.apply(this, arguments);
        // always redraw features
        return false;
    },
    
    /** 
     * Method: eraseGeometry
     * Erase a geometry from the renderer. Because the Canvas renderer has
     *     'memory' of the features that it has drawn, we have to remove the
     *     feature so it doesn't redraw.   
     * 
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * featureId - {String}
     */
    eraseGeometry: function(geometry, featureId) {
        this.eraseFeatures(this.features[featureId][0]);
    },

    /**
     * APIMethod: supported
     * 
     * Returns:
     * {Boolean} Whether or not the browser supports the renderer class
     */
    supported: function() {
        return !!window.h337 && OpenLayers.CANVAS_SUPPORTED;
    },    
    
    /**
     * Method: setSize
     * Sets the size of the drawing surface.
     *
     * Once the size is updated, redraw the canvas.
     *
     * Parameters:
     * size - {<OpenLayers.Size>} 
     */
    setSize: function(size) {
        this.size = size.clone();
        var root = this.root;
        root.style.width = size.w + "px";
        root.style.height = size.h + "px";
        root.width = size.w;
        root.height = size.h;
        this.resolution = null;
    },
    
    /**
     * Method: drawFeature
     * Draw the feature. Stores the feature in the features list,
     * then redraws the layer. 
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     * style - {<Object>} 
     *
     * Returns:
     * {Boolean} The feature has been drawn completely.  If the feature has no
     *     geometry, undefined will be returned.  If the feature is not rendered
     *     for other reasons, false will be returned.
     */
    drawFeature: function(feature, style) {
        var rendered;
        if (feature.geometry) {
            style = this.applyDefaultSymbolizer(style || feature.style);
            // don't render if display none or feature outside extent
            var bounds = feature.geometry.getBounds();

            var worldBounds;
            if (this.map.baseLayer && this.map.baseLayer.wrapDateLine) {
                worldBounds = this.map.getMaxExtent();
            }

            var intersects = bounds && bounds.intersectsBounds(this.extent, {worldBounds: worldBounds});

            rendered = (style.display !== "none") && !!bounds && intersects;
            if (rendered) {
                // keep track of what we have rendered for redraw
                this.features[feature.id] = [feature, style];
            }
            else {
                // remove from features tracked for redraw
                delete(this.features[feature.id]);
            }
            this.pendingRedraw = true;
        }
        if (this.pendingRedraw && !this.locked) {
            this.redraw();
            this.pendingRedraw = false;
        }
        return rendered;
    },

    /**
     * Method: getLocalXY
     * transform geographic xy into pixel xy
     *
     * Parameters: 
     * point - {<OpenLayers.Geometry.Point>}
     */
    getLocalXY: function(point) {
        var resolution = this.getResolution();
        var extent = this.extent;
        var x = ((point.lon - this.featureDx) / resolution + (-extent.left / resolution));
        var y = ((extent.top / resolution) - point.lat / resolution);
        return [x, y];
    },

    /**
     * Method: clear
     * Clear all vectors from the renderer.
     */    
    clear: function() {
        var hm = this.heatmap;
        hm.set("height", this.root.height);
        hm.set("width", this.root.width);
        hm.clear();
        this.features = {};
    },

    /**
     * Method: getFeatureIdFromEvent
     * Returns a feature id from an event on the renderer.  
     * 
     * Parameters:
     * evt - {<OpenLayers.Event>} 
     *
     * Returns:
     * {<OpenLayers.Feature.Vector} A feature or undefined.  This method returns
     *     a feature instead of a feature id to avoid an unnecessary lookup on
     *     the layer.
     */
    getFeatureIdFromEvent: function(evt) {
        // TODO: select?
        var featureId, feature;
        return feature; 
    },
    
    /**
     * Method: eraseFeatures 
     * This is called by the layer to erase features; removes the feature from
     *     the list, then redraws the layer.
     * 
     * Parameters:
     * features - {Array(<OpenLayers.Feature.Vector>)} 
     */
    eraseFeatures: function(features) {
        if(!(OpenLayers.Util.isArray(features))) {
            features = [features];
        }
        for(var i=0; i<features.length; ++i) {
            delete this.features[features[i].id];
        }
        this.redraw();
    },

    /**
     * Method: redraw
     * The real 'meat' of the function: any time things have changed,
     *     redraw() can be called to loop over all the data and (you guessed
     *     it) redraw it.  Unlike Elements-based Renderers, we can't interact
     *     with things once they're drawn, to remove them, for example, so
     *     instead we have to just clear everything and draw from scratch.
     */
    redraw: function() {
        if (!this.locked) {
            var height = this.root.height;
            var width = this.root.width;

            var hm = this.heatmap;
            hm.set("height", height);
            hm.set("width", width);
            hm.resize();
            
            var labelMap = [];
            var feature, bounds, style;
            var worldBounds = (this.map.baseLayer &&
                                             this.map.baseLayer.wrapDateLine) && 
                              this.map.getMaxExtent();
            var data = [],
                max = 0,
                features = [];
            
            // What is the layer?, 
            //      we need to use all features although not in the map window.
            for (var id in this.features) {
                if (!this.features.hasOwnProperty(id)) { continue; }
                feature = this.features[id][0];
                features = feature.layer.features;
            } 
            for (var i = 0, len = features.length; i < len; i++) {
                feature = features[i];
                bounds = feature.geometry.getBounds();
                this.calculateFeatureDx(bounds, worldBounds);
                var pt = this.getLocalXY(bounds.getCenterLonLat());
                var p0 = pt[0];
                var p1 = pt[1];
                if(!isNaN(p0) && !isNaN(p1)) {
                    var count = feature.attributes.count || 0;
                    data.push({x: p0, y: p1, count: count});
                }
                max = count > max ? count : max;
            }
            this.heatmap.store.setDataSet({
                data: data,
                max: max
            });
        }    
    },

    CLASS_NAME: "OpenLayers.Renderer.Heatmap"
});
