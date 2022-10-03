var Map = function(){
    var layersObject = new Layers();
    var current_layer = layersObject.get_streams_wms();
    var geoglows_model = new GeoGlows();
    this.add_base_layers_map = function (map) {
        const glofasURL = `http://globalfloods-ows.ecmwf.int/glofas-ows`    
        var wmsLayers = [
            layersObject.create_glofas_layer(glofasURL,'AccRainEGE'),
            layersObject.create_glofas_layer(glofasURL,'EGE_probRgt50'),
            layersObject.create_glofas_layer(glofasURL,'EGE_probRgt150'),
            layersObject.create_glofas_layer(glofasURL,'EGE_probRgt300')
            // EGE_probRgt50_layer,
            // EGE_probRgt150_layer,
            // EGE_probRgt300_layer
        ];
        var return_periods_layers = layersObject.get_return_period_layers();
        var mylayers = return_periods_layers.concat(wmsLayers)
        // layers = [two_year_warning, five_year_warning, ten_year_warning, twenty_five_year_warning, fifty_year_warning, hundred_year_warning].concat(wms_layers)
    
        map.getLayers().extend(mylayers);
        // default_extent = map.getView().calculateExtent(map.getSize());
    
    }

        //Add the wms layers for stations and streams
    this.add_streams_and_stations = function(map,geoserver_endpoint,streams_layer,stations_layer){
        // var layersObject = new Layers();
        console.log(layersObject);
        layersObject.set_streams_wms(geoserver_endpoint,streams_layer);
        var streams_wms = layersObject.get_streams_wms()
        layersObject.set_stations_wms(geoserver_endpoint,stations_layer);
        var stations_wms = layersObject.get_stations_wms()
        // wmsLayer = streams_wms;
        // wmsLayer2 = stations_wms;
        // feature_layer = wmsLayer;
        // feature_layer2 = wmsLayer2;
        // map.addLayer(wmsLayer);
        // map.addLayer(wmsLayer2);
        map.addLayer(streams_wms);
        map.addLayer(stations_wms);
    }

    this.fit_view_streams_wms = function(map,geoserver_endpoint,workspace,streams_layer_name){
        var ajax_url = geoserver_endpoint.replace(/\/$/, "") + '/' + workspace + '/' + streams_layer_name +'/wfs?request=GetCapabilities';
        var capabilities = $.ajax(ajax_url, {
            type: 'GET',
            data: {
                service: 'WFS',
                version: '1.0.0',
                request: 'GetCapabilities',
                outputFormat: 'text/javascript'
            },
            success: function() {
                // console.log(capabilities.responseText)
                var x = capabilities.responseText
                    .split('<FeatureTypeList>')[1]
                    .split(workspace + ':' + streams_layer_name)[1]
                    .split('LatLongBoundingBox ')[1]
                    .split('/></FeatureType>')[0];
    
                var minx = Number(x.split('"')[1]);
                var miny = Number(x.split('"')[3]);
                var maxx = Number(x.split('"')[5]);
                var maxy = Number(x.split('"')[7]);
                var extent = ol.proj.transform([minx, miny], 'EPSG:4326', 'EPSG:3857').concat(ol.proj.transform([maxx, maxy], 'EPSG:4326', 'EPSG:3857'));
    
                map.getView().fit(extent, map.getSize())
            }
        });
    }
    this.getLayersObject = function(){
        return layersObject;
    }

    this.generate_events_map = function(){
        $('#stp-stream-toggle').on('change', function() {
            layersObject.toggle_visibility_streams($('#stp-stream-toggle').prop('checked'))
        })
        $('#stp-stations-toggle').on('change', function() {
            layersObject.toggle_visibility_stations($('#stp-stations-toggle').prop('checked'))
        })
        $('#stp-100-toggle').on('change', function() {
            layersObject.toggle_visibility_hundred_year_warning($('#stp-100-toggle').prop('checked'))
        })
        $('#stp-50-toggle').on('change', function() {
            layersObject.toggle_visibility_fifty_year_warning($('#stp-50-toggle').prop('checked'))
        })
        $('#stp-25-toggle').on('change', function() {
            layersObject.toggle_visibility_twenty_five_year_warning($('#stp-25-toggle').prop('checked'))
        })
        $('#stp-10-toggle').on('change', function() {
            layersObject.toggle_visibility_ten_year_warning($('#stp-10-toggle').prop('checked'))
        })
        $('#stp-5-toggle').on('change', function() {
            layersObject.toggle_visibility_five_year_warning($('#stp-5-toggle').prop('checked'))
        })
        $('#stp-2-toggle').on('change', function() {
            layersObject.toggle_visibility_two_year_warning($('#stp-2-toggle').prop('checked'))
        })
    }
    this.get_warning_points = function(map,result) {
        // var watershed = default_watershed_name.split(' (')[0].replace(' ', '_').toLowerCase();
        // $.ajax({
            // type: 'GET',
            // url: 'get-warning-points/',
            // dataType: 'json',
            // data: {
            //     'model': model,
            //     // 'watershed': watershed,
            //     // 'subbasin': subbasin
            // },
            // error: function(error) {
            //     console.log(error);
            // },
            // success: function(result) {
    
                map.getLayers().item(1).getSource().clear();
                map.getLayers().item(2).getSource().clear();
                map.getLayers().item(3).getSource().clear();
                map.getLayers().item(4).getSource().clear();
                map.getLayers().item(5).getSource().clear();
                map.getLayers().item(6).getSource().clear();
    
                if (result.warning2 != 'undefined') {
    
                    var warLen2 = result.warning2.length;
                    for (var i = 0; i < warLen2; ++i) {
                        var geometry = new ol.geom.Point(ol.proj.transform([result.warning2[i][1],
                                result.warning2[i][0]
                            ],
                            'EPSG:4326', 'EPSG:3857'));
                        var feature = new ol.Feature({
                            geometry: geometry,
                            point_size: 40
                        });
                        map.getLayers().item(1).getSource().addFeature(feature);
                    }
                    map.getLayers().item(1).setVisible(false);
                }
                if (result.warning5 != 'undefined') {
                    var warLen5 = result.warning5.length;
                    for (var i = 0; i < warLen5; ++i) {
                        var geometry = new ol.geom.Point(ol.proj.transform([result.warning5[i][1],
                                result.warning5[i][0]
                            ],
                            'EPSG:4326', 'EPSG:3857'));
                        var feature = new ol.Feature({
                            geometry: geometry,
                            point_size: 40
                        });
                        map.getLayers().item(2).getSource().addFeature(feature);
                    }
                    map.getLayers().item(2).setVisible(false);
                }
                if (result.warning10 != 'undefined') {
                    var warLen10 = result.warning10.length;
                    for (var i = 0; i < warLen10; ++i) {
                        var geometry = new ol.geom.Point(ol.proj.transform([result.warning10[i][1],
                                result.warning10[i][0]
                            ],
                            'EPSG:4326', 'EPSG:3857'));
                        var feature = new ol.Feature({
                            geometry: geometry,
                            point_size: 40
                        });
                        map.getLayers().item(3).getSource().addFeature(feature);
                    }
                    map.getLayers().item(3).setVisible(false);
                }
                if (result.warning25 != 'undefined') {
                    var warLen25 = result.warning25.length;
                    for (var i = 0; i < warLen25; ++i) {
                        var geometry = new ol.geom.Point(ol.proj.transform([result.warning25[i][1],
                                result.warning25[i][0]
                            ],
                            'EPSG:4326', 'EPSG:3857'));
                        var feature = new ol.Feature({
                            geometry: geometry,
                            point_size: 40
                        });
                        map.getLayers().item(4).getSource().addFeature(feature);
                    }
                    map.getLayers().item(4).setVisible(false);
                }
                if (result.warning50 != 'undefined') {
                    var warLen50 = result.warning50.length;
                    for (var i = 0; i < warLen50; ++i) {
                        var geometry = new ol.geom.Point(ol.proj.transform([result.warning50[i][1],
                                result.warning50[i][0]
                            ],
                            'EPSG:4326', 'EPSG:3857'));
                        var feature = new ol.Feature({
                            geometry: geometry,
                            point_size: 40
                        });
                        map.getLayers().item(5).getSource().addFeature(feature);
                    }
                    map.getLayers().item(5).setVisible(false);
                }
                if (result.warning100 != 'undefined') {
                    var warLen100 = result.warning100.length;
                    for (var i = 0; i < warLen100; ++i) {
                        var geometry = new ol.geom.Point(ol.proj.transform([result.warning100[i][1],
                                result.warning100[i][0]
                            ],
                            'EPSG:4326', 'EPSG:3857'));
                        var feature = new ol.Feature({
                            geometry: geometry,
                            point_size: 40
                        });
                        map.getLayers().item(6).getSource().addFeature(feature);
                    }
                    map.getLayers().item(6).setVisible(false);
                }
            // }
        // });
    }
                            // get_available_dates(model, watershed, subbasin, comid);
                        // get_time_series(model, watershed, subbasin, comid, startdate);
                        // get_historic_data(model, watershed, subbasin, comid, startdate);
                        // get_flow_duration_curve(model, watershed, subbasin, comid, startdate);
                        // get_daily_seasonal_streamflow(model, watershed, subbasin, comid, startdate);
                        // get_monthly_seasonal_streamflow(model, watershed, subbasin, comid, startdate);
                        // get_forecast_percent(watershed, subbasin, comid, startdate);
    this.create_wms_events = function(map,wms_layers,forecast_url, historic_data_url, flow_duration_curve_url,daily_seasonal_streamflow_url,monthly_seasonal_streamflow_url, forecast_percent_url ){
        // console.log("wms_ewvbents")
        map.on('pointermove', function(evt) {
            if (evt.dragging) {
                return;
            }
            // var model = $('#model option:selected').text();
            var pixel = map.getEventPixel(evt.originalEvent);
            var hit = map.forEachLayerAtPixel(pixel, function(layer) {
                if (wms_layers.filter((wms_layer)=> layer== wms_layer )) {
                    current_layer = layer;
                    return true;
                }
            });
            map.getTargetElement().style.cursor = hit ? 'pointer' : '';

        })
        map.on("singleclick", function(evt) {
            // var model = $('#model option:selected').text();
    
            if (map.getTargetElement().style.cursor == "pointer") {
    
                var view = map.getView();
                var viewResolution = view.getResolution();
    
                var wms_url = current_layer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(), { 'INFO_FORMAT': 'application/json' }); //Get the wms url for the clicked point
                
                $("#graph").modal('show');
                $("#tbody").empty()
                $('#long-term-chart').addClass('hidden');
                // $('#historical-chart').addClass('hidden');
                // $('#fdc-chart').addClass('hidden');
                // $('#seasonal_d-chart').addClass('hidden');
                // $('#seasonal_m-chart').addClass('hidden');
                // $('#download_forecast').addClass('hidden');
                // $('#download_era_5').addClass('hidden');
    
                $loading.removeClass('hidden');
                //Retrieving the details for clicked point via the url
                $('#dates').addClass('hidden');
                //$('#plot').addClass('hidden');
                $.ajax({
                    type: "GET",
                    url: wms_url,
                    dataType: 'json',
                    success: function(result) {
                        // var model = $('#model option:selected').text();
                        comid = result["features"][0]["properties"]["COMID"];
                        try{
                            console.log(result)
                            var startdate = '';
                            if ("derived_fr" in (result["features"][0]["properties"])) {
                                var watershed = (result["features"][0]["properties"]["derived_fr"]).toLowerCase().split('-')[0];
                                var subbasin = (result["features"][0]["properties"]["derived_fr"]).toLowerCase().split('-')[1];
                            } else if (geoserver_region) {
                                var watershed = geoserver_region.split('-')[0]
                                var subbasin = geoserver_region.split('-')[1];
                            } else {
                                var watershed = (result["features"][0]["properties"]["watershed"]).toLowerCase();
                                var subbasin = (result["features"][0]["properties"]["subbasin"]).toLowerCase();
                            }
                            if (forecast_url !== undefined) {
                                geoglows_model.get_time_series(forecast_url,watershed, subbasin, comid, startdate);
                            }
                        }
                        catch(err){
                            console.log("errir")
                        }

                        // get_available_dates(model, watershed, subbasin, comid);
                        // get_time_series(model, watershed, subbasin, comid, startdate);
                        // get_historic_data(model, watershed, subbasin, comid, startdate);
                        // get_flow_duration_curve(model, watershed, subbasin, comid, startdate);
                        // get_daily_seasonal_streamflow(model, watershed, subbasin, comid, startdate);
                        // get_monthly_seasonal_streamflow(model, watershed, subbasin, comid, startdate);
                        // get_forecast_percent(watershed, subbasin, comid, startdate);

                        // if (model === 'ECMWF-RAPID') {
                            // get_forecast_percent(watershed, subbasin, comid, startdate);
                        // };
    
                        var workspace = geoserver_workspace;
    
                        $('#info').addClass('hidden');
                        // add_feature(model, workspace, comid);
    
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        console.log(Error);
                    }
                });           
            };
        });        
    }

    function map_events(wms_layers) {

    

    
    }

}


// function init_map() {


function popup_information_initializer(watershed_display_name,subbasin_display_name){
    $("#watershed-info").empty();

    var watershed_display_name =  default_watershed_name.split(' (')[0];
    var subbasin_display_name = default_watershed_name.split(' (')[1].replace(')', '');
    $("#watershed-info").append('<h3>Current Watershed: ' + watershed_display_name + '</h3><h5>Subbasin Name: ' + subbasin_display_name);
    
}





function view_watershed(map) {


    $('#dates').addClass('hidden');

    // var workspace = JSON.parse($('#geoserver_endpoint').val())[1];
    var workspace = geoserver_workspace
    var model = 'ECMWF-RAPID';
    var subbasin = default_watershed_name.split(' (')[1].replace(')', '').toLowerCase();
    var watershed_display_name =  default_watershed_name.split(' (')[0];
    var subbasin_display_name = default_watershed_name.split(' (')[1].replace(')', '');
    $("#watershed-info").append('<h3>Current Watershed: ' + watershed_display_name + '</h3><h5>Subbasin Name: ' + subbasin_display_name);

    // var layerName = workspace + ':' + watershed + '-' + subbasin + '-geoglows-drainage_line';
    
    
    // var sld_string = create_style(layerName,properties);
    // console.log(sld_string)
    wmsLayer = streams_wms;
    feature_layer = wmsLayer;


    get_warning_points(model, watershed, subbasin);

    wmsLayer2 = stations_wms;
    // wmsLayer2 = streams_wms;

    feature_layer2 = wmsLayer2;

    map.addLayer(wmsLayer);
    map.addLayer(wmsLayer2);
    $loading.addClass('hidden');
    // var ajax_url = geoserver_endpoint.replace(/\/$/, "") + '/' + workspace + '/' + watershed + '-' + subbasin + '-drainage_line/wfs?request=GetCapabilities';
    var ajax_url = geoserver_endpoint.replace(/\/$/, "") + '/' + workspace + '/' + streams_layer_name +'/wfs?request=GetCapabilities';
    // var ajax_url = 'https://geoserver.hydroshare.org/geoserver/wfs?request=GetCapabilities';

    var capabilities = $.ajax(ajax_url, {
        type: 'GET',
        data: {
            service: 'WFS',
            version: '1.0.0',
            request: 'GetCapabilities',
            outputFormat: 'text/javascript'
        },
        success: function() {
            var x = capabilities.responseText
                .split('<FeatureTypeList>')[1]
                .split(workspace + ':' + streams_layer_name)[1]

                // .split(workspace + ':' + watershed + '-' + subbasin)[1]
                // .split('HS-9b6a7f2197ec403895bacebdca4d0074:south_america-peru-geoglows-drainage_line')[1]
                .split('LatLongBoundingBox ')[1]
                .split('/></FeatureType>')[0];

            var minx = Number(x.split('"')[1]);
            var miny = Number(x.split('"')[3]);
            var maxx = Number(x.split('"')[5]);
            var maxy = Number(x.split('"')[7]);
            var extent = ol.proj.transform([minx, miny], 'EPSG:4326', 'EPSG:3857').concat(ol.proj.transform([maxx, maxy], 'EPSG:4326', 'EPSG:3857'));

            map.getView().fit(extent, map.getSize())
        }
    });

}





function getRegionGeoJsons() {
    
    let geojsons = region_index[$("#regions").val()]['geojsons'];
    for (let i in geojsons) {
        var regionsSource = new ol.source.Vector({
           url: staticGeoJSON + geojsons[i],
           format: new ol.format.GeoJSON()
        });

        var regionStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'red',
                width: 3
            })
        });

        var regionsLayer = new ol.layer.Vector({
            name: 'myRegion',
            source: regionsSource,
            style: regionStyle
        });

        map.getLayers().forEach(function(regionsLayer) {
        if (regionsLayer.get('name')=='myRegion')
            map.removeLayer(regionsLayer);
        });
        map.addLayer(regionsLayer)

        setTimeout(function() {
            var myExtent = regionsLayer.getSource().getExtent();
            map.getView().fit(myExtent, map.getSize());
        }, 500);
    }
}