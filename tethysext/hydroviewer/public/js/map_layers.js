var base_layer = new ol.layer.Tile({
    source: new ol.source.BingMaps({
        key: 'eLVu8tDRPeQqmBlKAjcw~82nOqZJe2EpKmqd-kQrSmg~AocUZ43djJ-hMBHQdYDyMbT-Enfsk0mtUIGws1WeDuOvjY4EXCH-9OK3edNLDgkc',
        imagerySet: 'Road'
        // imagerySet: 'AerialWithLabels'
    })
});

var AccRainEGE_layer = new ol.layer.Tile({
    source: new ol.source.TileWMS({
        url: glofasURL,
        params: { LAYERS: 'AccRainEGE', TILED: true },
        serverType: 'mapserver'
        // crossOrigin: 'Anonymous'
    }),
    visible: false
});
var EGE_probRgt50_layer = new ol.layer.Tile({
    source: new ol.source.TileWMS({
        url: glofasURL,
        params: { LAYERS: 'EGE_probRgt50', TILED: true },
        serverType: 'mapserver'
        // crossOrigin: 'Anonymous'
    }),
    visible: false
});
var EGE_probRgt150_layer=new ol.layer.Tile({
    source: new ol.source.TileWMS({
        url: glofasURL,
        params: { LAYERS: 'EGE_probRgt150', TILED: true },
        serverType: 'mapserver'
        // crossOrigin: 'Anonymous'
    }),
    visible: false
});
var EGE_probRgt300_layer = new ol.layer.Tile({
    source: new ol.source.TileWMS({
        url: glofasURL,
        params: { LAYERS: 'EGE_probRgt300', TILED: true },
        serverType: 'mapserver'
        // crossOrigin: 'Anonymous'
    }),
    visible: false
});


featureOverlay = new ol.layer.Vector({
    source: new ol.source.Vector()
});

two_year_warning = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: two_year_warning_style
});

five_year_warning = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: five_year_warning_style
});

ten_year_warning = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: ten_year_warning_style
});

twenty_five_year_warning = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: twenty_five_year_warning_style
});

fifty_year_warning = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: fifty_year_warning_style
});

hundred_year_warning = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: hundred_year_warning_style
});

var stations_wms = new ol.layer.Image({
    source: new ol.source.ImageWMS({
        url: geoserver_endpoint.replace(/\/$/, "")+'/wms'+ '?service=WMS&version=1.1.1&request=GetCapabilities&',
        params: {'LAYERS':stations_layer},
        serverType: 'geoserver',
        crossOrigin: 'Anonymous'
    }),
    opacity: 0.7
});

// console.log($('#geoserver_endpoint').val())
// var workspace = geoserver_workspace;
// var model = $('#model option:selected').text();
// var watershed = $('#watershedSelect option:selected').text().split(' (')[0].replace(' ', '_').toLowerCase();
// var subbasin = $('#watershedSelect option:selected').text().split(' (')[1].replace(')', '').toLowerCase();

// var layerName = workspace + ':' + watershed + '-' + subbasin + '-geoglows-drainage_line';
var layerName = geoserver_workspace + ':' + streams_layer_name;
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

var streams_wms = new ol.layer.Image({
    source: new ol.source.ImageWMS({
        url: geoserver_endpoint.replace(/\/$/, "") + '/wms'+ '?service=WMS&version=1.1.1&request=GetCapabilities&',
        // url: 'https://tethys2.byu.edu/geoserver/peru_hydroviewer/wms'+ '?service=WMS&version=1.1.1&request=GetCapabilities&',
        // params: { 'LAYERS': layerName, 'SLD_BODY': sld_string },
        params: { 'LAYERS': layerName },
        serverType: 'geoserver',
        crossOrigin: 'Anonymous'
    }),
    opacity: 0.4
});
// wmsLayer.getSource().updateParams({'STYLES': undefined, 'SLD_BODY': sld_string});
