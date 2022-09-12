function init_map() {

    wms_layers = [
        AccRainEGE_layer,
        EGE_probRgt50_layer,
        EGE_probRgt150_layer,
        EGE_probRgt300_layer
    ];


    var wmsLayer = new ol.layer.Image({
        source: new ol.source.ImageWMS({
            url: geoserver_endpoint.replace(/\/$/, "") + '/wms',
            params: { 'LAYERS': 'province_boundaries' },
            serverType: 'geoserver',
            crossOrigin: 'Anonymous'
        })
    });

    layers = [base_layer, two_year_warning, five_year_warning, ten_year_warning, twenty_five_year_warning, fifty_year_warning, hundred_year_warning].concat(wms_layers).concat([wmsLayer, featureOverlay])

    // if ($('#model option:selected').text() === 'ECMWF-RAPID') {
    //     var wmsLayer = new ol.layer.Image({
    //         source: new ol.source.ImageWMS({
    //             url: geoserver_endpoint.replace(/\/$/, "") + '/wms',
    //             params: { 'LAYERS': 'province_boundaries' },
    //             serverType: 'geoserver',
    //             crossOrigin: 'Anonymous'
    //         })
    //     });

    //     layers = [base_layer, two_year_warning, five_year_warning, ten_year_warning, twenty_five_year_warning, fifty_year_warning, hundred_year_warning].concat(wms_layers).concat([wmsLayer, featureOverlay])
    // } 
    // else {
    //     layers = [base_layer, two_year_warning, five_year_warning, ten_year_warning, twenty_five_year_warning, fifty_year_warning, hundred_year_warning].concat(wms_layers).concat([featureOverlay])
    // }

    // var lon = Number(JSON.parse($('#zoom_info').val()).split(',')[0]);
    // var lat = Number(JSON.parse($('#zoom_info').val()).split(',')[1]);
    // var zoomLevel = Number(JSON.parse($('#zoom_info').val()).split(',')[2]);
    map = new ol.Map({
        target: 'map',
        view: new ol.View({
            // center: ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857'),
            // zoom: zoomLevel,
            center: ol.proj.fromLonLat([37.41, 8.82]),
            zoom: 4,
            minZoom: 2,
            maxZoom: 18,
        }),
        layers: layers
    });

    default_extent = map.getView().calculateExtent(map.getSize());

}


function view_watershed() {
    map.removeInteraction(select_interaction);
    map.removeLayer(wmsLayer);
    $("#get-started").modal('hide');
    // console.log($('#model option:selected').text());
    // if ($('#model option:selected').text() === 'ECMWF-RAPID' ) {
        console.log("nodel ecmwf")
        $("#watershed-info").empty();

        $('#dates').addClass('hidden');

        // var workspace = JSON.parse($('#geoserver_endpoint').val())[1];
        var workspace = geoserver_workspace
        var model = $('#model option:selected').text();
        var watershed = default_watershed_name.split(' (')[0].replace(' ', '_').toLowerCase();
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
        console.log(ajax_url)
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

    // } 
    // else if ($('#model option:selected').text() === 'LIS-RAPID' && $('#watershedSelect option:selected').val() !== "") {
    //     $("#watershed-info").empty();

    //     $('#dates').addClass('hidden');

    //     var model = $('#model option:selected').text();
    //     var watershed = $('#watershedSelect option:selected').text().split(' (')[0].replace(' ', '_').toLowerCase();
    //     var subbasin = $('#watershedSelect option:selected').text().split(' (')[1].replace(')', '').toLowerCase();
    //     var watershed_display_name = $('#watershedSelect option:selected').text().split(' (')[0];
    //     var subbasin_display_name = $('#watershedSelect option:selected').text().split(' (')[1].replace(')', '');
    //     $("#watershed-info").append('<h3>Current Watershed: ' + watershed_display_name + '</h3><h5>Subbasin Name: ' + subbasin_display_name);

    //     var layerName = workspace + ':' + watershed + '-' + subbasin + '-drainage_line';
    //     $.ajax({
    //         type: 'GET',
    //         url: 'get-lis-shp/',
    //         dataType: 'json',
    //         data: {
    //             'model': model,
    //             'watershed': watershed,
    //             'subbasin': subbasin
    //         },
    //         beforeSend: function () {
    //             $('#featureLoader').show();
    //         },
    //         success: function(result) {
    //             wmsLayer = new ol.layer.Vector({
    //                 renderMode: 'image',
    //                 source: new ol.source.Vector({
    //                     features: (new ol.format.GeoJSON()).readFeatures(result.options)
    //                 }),
    //                 style: new ol.style.Style({
    //                     stroke: new ol.style.Stroke({
    //                         color: 'blue',
    //                         width: 1
    //                     })
    //                 })
    //             });

    //             wmsLayer2 = stations_wms;

    //             feature_layer2 = wmsLayer2;

    //             map.addLayer(wmsLayer);
    //             map.addLayer(wmsLayer2);

    //             feature_layer = wmsLayer;

    //             map.getView().fit(result.legend_extent, map.getSize())
    //         },
    //         complete: function(){
    //             $('#featureLoader').hide();
    //         }
    //     });

    // } 
    // else if ($('#model option:selected').text() === 'HIWAT-RAPID' && $('#watershedSelect option:selected').val() !== "") {
    //     $("#watershed-info").empty();

    //     $('#dates').addClass('hidden');

    //     var model = $('#model option:selected').text();
    //     var watershed = $('#watershedSelect option:selected').text().split(' (')[0].replace(' ', '_').toLowerCase();
    //     var subbasin = $('#watershedSelect option:selected').text().split(' (')[1].replace(')', '').toLowerCase();
    //     var watershed_display_name = $('#watershedSelect option:selected').text().split(' (')[0];
    //     var subbasin_display_name = $('#watershedSelect option:selected').text().split(' (')[1].replace(')', '');
    //     $("#watershed-info").append('<h3>Current Watershed: ' + watershed_display_name + '</h3><h5>Subbasin Name: ' + subbasin_display_name);

    //     var layerName = workspace + ':' + watershed + '-' + subbasin + '-drainage_line';
    //     $.ajax({
    //         type: 'GET',
    //         url: 'get-hiwat-shp/',
    //         dataType: 'json',
    //         data: {
    //             'model': model,
    //             'watershed': watershed,
    //             'subbasin': subbasin
    //         },
    //         beforeSend: function () {
    //             $('#featureLoader').show();
    //         },
    //         success: function(result) {
    //             wmsLayer = new ol.layer.Vector({
    //                 renderMode: 'image',
    //                 source: new ol.source.Vector({
    //                     features: (new ol.format.GeoJSON()).readFeatures(result.options)
    //                 }),
    //                 style: new ol.style.Style({
    //                     stroke: new ol.style.Stroke({
    //                         color: 'blue',
    //                         width: 1
    //                     })
    //                 })
    //             });

    //             wmsLayer2 = stations_wms;


    //             feature_layer2 = wmsLayer2;

    //             map.addLayer(wmsLayer);
    //             map.addLayer(wmsLayer2);

    //             feature_layer = wmsLayer;

    //             map.getView().fit(result.legend_extent, map.getSize())
    //         },
    //         complete: function(){
    //             $('#featureLoader').hide();
    //         }
    //     });

    // } else {

    //     map.updateSize();
    //     //map.removeInteraction(select_interaction);
    //     map.removeLayer(wmsLayer);
    //     map.getView().fit(default_extent, map.getSize());
    // }
}

function get_warning_points(model, watershed, subbasin) {
    $.ajax({
        type: 'GET',
        url: 'get-warning-points/',
        dataType: 'json',
        data: {
            'model': model,
            'watershed': watershed,
            'subbasin': subbasin
        },
        error: function(error) {
            console.log(error);
        },
        success: function(result) {

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
        }
    });
}


function map_events() {
    map.on('pointermove', function(evt) {
        if (evt.dragging) {
            return;
        }
        var model = $('#model option:selected').text();
        var pixel = map.getEventPixel(evt.originalEvent);
        if (model === 'ECMWF-RAPID') {
            var hit = map.forEachLayerAtPixel(pixel, function(layer) {
                if (layer == feature_layer || layer == feature_layer2) {
                    current_layer = layer;
                    return true;
                }
            });
        } else if (model === 'LIS-RAPID') {
            var hit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                if (layer == feature_layer || layer == feature_layer2) {
                    current_feature = feature;
                    return true;
                }
            });
        } else if (model === 'HIWAT-RAPID') {
            var hit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                if (layer == feature_layer || layer == feature_layer2) {
                    current_feature = feature;
                    return true;
                }
            });
        }

        map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    map.on("singleclick", function(evt) {
        var model = $('#model option:selected').text();

        if (map.getTargetElement().style.cursor == "pointer") {

            var view = map.getView();
            var viewResolution = view.getResolution();

            if (model === 'ECMWF-RAPID') {
                var wms_url = current_layer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(), { 'INFO_FORMAT': 'application/json' }); //Get the wms url for the clicked point

                if (current_layer["H"]["source"]["i"]["LAYERS"] == "SENAMHI_Stations_RT_v3") {

                        $("#obsgraph").modal('show');
                        $('#observed-chart-WL').addClass('hidden');
                        $('#observed-chart-WL').empty();
                        $("#station-info").empty();
                        $("#pdf-url").empty();
                        $('#download_observed_waterlevel').addClass('hidden');

                        $.ajax({
                            type: "GET",
                            url: wms_url,
                            dataType: 'json',
                            success: function (result) {
                                stationcode = result["features"][0]["properties"]["code"];
                                oldcode = result["features"][0]["properties"]["old_code"];
                                stationname = result["features"][0]["properties"]["nombre"];
                                stationtype = result["features"][0]["properties"]["icono"];
                                stationcat = result["features"][0]["properties"]["categoria"];
                                stationstatus = result["features"][0]["properties"]["estado"];
                                stream = result["features"][0]["properties"]["Rio"];
                                $('#obsdates').removeClass('hidden');
                                var startdateobs = $('#startdateobs').val();
                                var enddateobs = $('#enddateobs').val();
                                $("#station-info").append('<h3 id="Station-Name-Tab">Current Station: '+ stationname
                        			+ '</h3><h5 id="Station-Code-Tab">Station Code: ' + stationcode
                        			+ '</h5><h5 id="Station-Old-Code-Tab">Station Old Code: ' + oldcode
                        			+ '</h5><h5 id="Station-Status-Tab">Station Status: ' + stationstatus
                        			+ '</h5><h5>Stream: '+ stream + '</h5>');

                        		url = 'https://www.senamhi.gob.pe/mapas/mapa-estaciones-2/map_red_graf.php?cod=' + stationcode + '&estado=' + stationstatus + '&tipo_esta=' + stationtype + '&cate=' + stationcat + '&cod_old=' + oldcode;
                        		console.log(url)

                        		get_waterlevel_info (stationcode, stationname, oldcode, stationtype, stationcat, stationstatus, stream)

                            }
                        });

                }

                //if (wms_url) {
                else {

                    $("#graph").modal('show');
                    $("#tbody").empty()
                    $('#long-term-chart').addClass('hidden');
                    $('#historical-chart').addClass('hidden');
                    $('#fdc-chart').addClass('hidden');
                    $('#seasonal_d-chart').addClass('hidden');
                    $('#seasonal_m-chart').addClass('hidden');
                    $('#download_forecast').addClass('hidden');
                    $('#download_era_5').addClass('hidden');

                    $loading.removeClass('hidden');
                    //Retrieving the details for clicked point via the url
                    $('#dates').addClass('hidden');
                    //$('#plot').addClass('hidden');
                    $.ajax({
                        type: "GET",
                        url: wms_url,
                        dataType: 'json',
                        success: function(result) {
                            var model = $('#model option:selected').text();
                            comid = result["features"][0]["properties"]["COMID"];

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

                            get_available_dates(model, watershed, subbasin, comid);
                            get_time_series(model, watershed, subbasin, comid, startdate);
                            get_historic_data(model, watershed, subbasin, comid, startdate);
                            get_flow_duration_curve(model, watershed, subbasin, comid, startdate);
                            get_daily_seasonal_streamflow(model, watershed, subbasin, comid, startdate);
                            get_monthly_seasonal_streamflow(model, watershed, subbasin, comid, startdate);
                            if (model === 'ECMWF-RAPID') {
                                get_forecast_percent(watershed, subbasin, comid, startdate);
                            };

                            var workspace = geoserver_workspace;

                            $('#info').addClass('hidden');
                            add_feature(model, workspace, comid);

                        },
                        error: function(XMLHttpRequest, textStatus, errorThrown) {
                            console.log(Error);
                        }
                    });
                }
            }
        };
    });

}

function add_feature(model, workspace, comid) {
    map.removeLayer(featureOverlay);

    var watershed = $('#watershedSelect option:selected').text().split(' (')[0].replace(' ', '_').toLowerCase();
    var subbasin = $('#watershedSelect option:selected').text().split(' (')[1].replace(')', '').toLowerCase();

    if (model === 'ECMWF-RAPID') {
        var vectorSource = new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            url: function(extent) {
                return geoserver_endpoint.replace(/\/$/, "") + '/' + 'ows?service=wfs&' +
                    'version=2.0.0&request=getfeature&typename=' + workspace + ':' + watershed + '-' + subbasin + '-drainage_line' + '&CQL_FILTER=COMID=' + comid + '&outputFormat=application/json&srsname=EPSG:3857&' + ',EPSG:3857';
            },
            strategy: ol.loadingstrategy.bbox
        });

        featureOverlay = new ol.layer.Vector({
            source: vectorSource,
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#00BFFF',
                    width: 8
                })
            })
        });
        map.addLayer(featureOverlay);
        map.getLayers().item(5);

    } else if (model === 'LIS-RAPID') {
        var vectorSource;
        $.ajax({
            type: 'GET',
            url: 'get-lis-shp/',
            dataType: 'json',
            data: {
                'model': model,
                'watershed': workspace[0],
                'subbasin': workspace[1]
            },
            success: function(result) {
                JSON.parse(result.options).features.forEach(function(elm) {
                    if (elm.properties.COMID === parseInt(comid)) {
                        var filtered_json = {
                            "type": "FeatureCollection",
                            "features": [elm]
                        };
                        vectorSource = new ol.source.Vector({
                            features: (new ol.format.GeoJSON()).readFeatures(filtered_json)
                        });
                    }
                });

                featureOverlay = new ol.layer.Vector({
                    source: vectorSource,
                    style: new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#00BFFF',
                            width: 8
                        })
                    })
                });
                map.addLayer(featureOverlay);
                map.getLayers().item(5);
            }
        });

    } else if (model === 'HIWAT-RAPID') {
        var vectorSource;
        $.ajax({
            type: 'GET',
            url: 'get-hiwat-shp/',
            dataType: 'json',
            data: {
                'model': model,
                'watershed': workspace[0],
                'subbasin': workspace[1]
            },
            success: function(result) {
                JSON.parse(result.options).features.forEach(function(elm) {
                    if (elm.properties.COMID === parseInt(comid)) {
                        var filtered_json = {
                            "type": "FeatureCollection",
                            "features": [elm]
                        };
                        vectorSource = new ol.source.Vector({
                            features: (new ol.format.GeoJSON()).readFeatures(filtered_json)
                        });
                    }
                });

                featureOverlay = new ol.layer.Vector({
                    source: vectorSource,
                    style: new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#00BFFF',
                            width: 8
                        })
                    })
                });
                map.addLayer(featureOverlay);
                map.getLayers().item(5);
            }
        });
    }
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