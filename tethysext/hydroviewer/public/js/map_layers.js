


// featureOverlay = new ol.layer.Vector({
//     source: new ol.source.Vector()
// });





// console.log($('#geoserver_endpoint').val())
// var workspace = geoserver_workspace;
// var model = $('#model option:selected').text();
// var watershed = $('#watershedSelect option:selected').text().split(' (')[0].replace(' ', '_').toLowerCase();
// var subbasin = $('#watershedSelect option:selected').text().split(' (')[1].replace(')', '').toLowerCase();

// var layerName = workspace + ':' + watershed + '-' + subbasin + '-geoglows-drainage_line';
// var layerName = geoserver_workspace + ':' + streams_layer_name;
// console.log(layerName)
// console.log(workspace,watershed,subbasin)

        

// var properties = [
//     {
//         'names': 'region',
//         'val': 'Amazon_River',
//         'stroke_color': '#009933',
//         'stroke_width': '2'
//     },
//     {
//         'names': 'region',
//         'val': 'Northwest_Coast',
//         'stroke_color': '#0055CC',
//         'stroke_width': '2'
//     },
//     {
//         'names': 'region',
//         'val': 'Dulce_River_Altiplano',
//         'stroke_color': '#FF0000',
//         'stroke_width': '2'
//     }
    
// ]

// var sld_string = create_style(layerName,properties);
// console.log(sld_string)
// wmsLayer.getSource().updateParams({'STYLES': undefined, 'SLD_BODY': sld_string});





// constructor function
var Layers = function(){
    // "use strict" // And enable strict mode for this library
    //private members//
    this.styles = new StylesLayers()
    console.log(this.styles);

    var streams_wms = new ol.layer.Image({
        source: new ol.source.ImageWMS(),
        opacity: 0.4
    });
    var stations_wms = new ol.layer.Image({
        source: new ol.source.ImageWMS(),
        opacity: 0.7
    });





    var two_year_warning = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: this.styles.get_two_year_warning_style()
    });
    
    var five_year_warning = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: this.styles.five_year_warning_style
    });
    
    var ten_year_warning = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: this.styles.ten_year_warning_style
    });
    
    var twenty_five_year_warning = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: this.styles.twenty_five_year_warning_style
    });
    
    var fifty_year_warning = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: this.styles.fifty_year_warning_style
    });
    
    var hundred_year_warning = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: this.styles.hundred_year_warning_style
    });
    
    this.set_streams_wms = function(geoserver_endpoint,streams_layer) {   
            var new_source = new ol.source.ImageWMS({
                url: geoserver_endpoint.replace(/\/$/, "") + '/wms'+ '?service=WMS&version=1.1.1&request=GetCapabilities&',
                // url: 'https://tethys2.byu.edu/geoserver/peru_hydroviewer/wms'+ '?service=WMS&version=1.1.1&request=GetCapabilities&',
                // params: { 'LAYERS': layerName, 'SLD_BODY': sld_string },
                params: { 'LAYERS': streams_layer },
                serverType: 'geoserver',
                crossOrigin: 'Anonymous'
            })
            streams_wms.setSource(new_source)
    }

    this.get_streams_wms = function(){
        return streams_wms
    }

    this.set_stations_wms = function(geoserver_endpoint,stations_layer) {   
        var new_source = new ol.source.ImageWMS({
            url: geoserver_endpoint.replace(/\/$/, "") + '/wms'+ '?service=WMS&version=1.1.1&request=GetCapabilities&',
            // url: 'https://tethys2.byu.edu/geoserver/peru_hydroviewer/wms'+ '?service=WMS&version=1.1.1&request=GetCapabilities&',
            // params: { 'LAYERS': layerName, 'SLD_BODY': sld_string },
            params: { 'LAYERS': stations_layer },
            serverType: 'geoserver',
            crossOrigin: 'Anonymous'
        })
        stations_wms.setSource(new_source)
    }

    this.get_stations_wms = function(){
        return stations_wms
    }


    this.create_glofas_layer = function(glofasURL,layername) {   

        return new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: glofasURL,
                params: { LAYERS: layername, TILED: true },
                serverType: 'mapserver'
                // crossOrigin: 'Anonymous'
            }),
            visible: false
        });
    }

    
    this.get_streams_and_stations = function(){
        return[
            streams_wms,
            stations_wms
        ]
    }
    

    this.get_return_period_layers = function(){
        return[
            two_year_warning,
            five_year_warning,
            ten_year_warning,
            twenty_five_year_warning,
            fifty_year_warning,
            hundred_year_warning
        ]
    }

    


};

