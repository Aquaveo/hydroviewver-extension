/* Global Variables */
var default_extent,
    current_layer,
    current_feature,
    feature_layer,
    stream_geom,
    layers,
    wmsLayer,
    wmsLayer2,
    vectorLayer,
    feature,
    featureOverlay,
    forecastFolder,
    select_interaction,
    two_year_warning,
    five_year_warning,
    ten_year_warning,
    twenty_five_year_warning,
    fifty_year_warning,
    hundred_year_warning,
    map,
    feature_layer2,
    wms_layers;

var $loading = $('#view-file-loading');
var m_downloaded_historical_streamflow = false;
var m_downloaded_flow_duration = false;

const glofasURL = `http://globalfloods-ows.ecmwf.int/glofas-ows`
// http://globalfloods-ows.ecmwf.int/glofas-ows/?service=WMS&request=GetCapabilities