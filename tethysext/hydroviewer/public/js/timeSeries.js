function get_time_series(model, watershed, subbasin, comid, startdate) {
    $loading.removeClass('d-none');
    $('#long-term-chart').addClass('d-none');
    $('#dates').addClass('d-none');
    $.ajax({
        type: 'GET',
        url: 'get-time-series/',
        data: {
            'model': model,
            'watershed': watershed,
            'subbasin': subbasin,
            'comid': comid,
            'startdate': startdate
        },
        error: function() {
            $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the forecast</strong></p>');
            $('#info').removeClass('d-none');
            $loading.addClass('d-none');

            setTimeout(function() {
                $('#info').addClass('d-none')
            }, 5000);
        },
        success: function(data) {
            if (!data.error) {
                $('#dates').removeClass('d-none');
                $loading.addClass('d-none');
                $('#long-term-chart').removeClass('d-none');
                $('#long-term-chart').html(data);

                //resize main graph
                Plotly.Plots.resize($("#long-term-chart .js-plotly-plot")[0]);

                var params = {
                    watershed_name: watershed,
                    subbasin_name: subbasin,
                    reach_id: comid,
                    startdate: startdate,
                };

                $('#submit-download-forecast').attr({
                    target: '_blank',
                    href: 'get-forecast-data-csv?' + jQuery.param(params)
                });

                $('#download_forecast').removeClass('d-none');

            } else if (data.error) {
                $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the forecast</strong></p>');
                $('#info').removeClass('d-none');

                setTimeout(function() {
                    $('#info').addClass('d-none')
                }, 5000);
            } else {
                $('#info').html('<p><strong>An unexplainable error occurred.</strong></p>').removeClass('d-none');
            }
        }
    });
}

function get_historic_data(model, watershed, subbasin, comid, startdate) {
    $('#his-view-file-loading').removeClass('d-none');
    m_downloaded_historical_streamflow = true;
    $.ajax({
        type: 'GET',
        url: 'get-historic-data',
        data: {
            'model': model,
            'watershed': watershed,
            'subbasin': subbasin,
            'comid': comid,
            'startdate': startdate
        },
        success: function(data) {
            if (!data.error) {
                $('#his-view-file-loading').addClass('d-none');
                $('#historical-chart').removeClass('d-none');
                $('#historical-chart').html(data);

                // var params = {
                //     watershed_name: watershed,
                //     subbasin_name: subbasin,
                //     reach_id: comid,
                //     daily: false
                // };

                // $('#submit-download-5-csv').attr({
                //     target: '_blank',
                //     href: 'get-historic-data-csv?' + jQuery.param(params)
                // });

                // $('#download_era_5').removeClass('d-none');

            } else if (data.error) {
                $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the historic data</strong></p>');
                $('#info').removeClass('d-none');
                $('#his-view-file-loading').addClass('d-none');

                setTimeout(function() {
                    $('#info').addClass('d-none')
                }, 5000);
            } else {
                $('#info').html('<p><strong>An unexplainable error occurred.</strong></p>').removeClass('d-none');
            }
        }
    });
};

function get_flow_duration_curve(model, watershed, subbasin, comid, startdate) {
    $('#fdc-view-file-loading').removeClass('d-none');
    m_downloaded_flow_duration = true;
    $.ajax({
        type: 'GET',
        url: 'get-flow-duration-curve',
        data: {
            'model': model,
            'watershed': watershed,
            'subbasin': subbasin,
            'comid': comid,
            'startdate': startdate
        },
        success: function(data) {
            if (!data.error) {
                $('#fdc-view-file-loading').addClass('d-none');
                $('#fdc-chart').removeClass('d-none');
                $('#fdc-chart').html(data);
            } else if (data.error) {
                $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the historic data</strong></p>');
                $('#info').removeClass('d-none');
                $('#fdc-view-file-loading').addClass('d-none');

                setTimeout(function() {
                    $('#info').addClass('d-none')
                }, 5000);
            } else {
                $('#info').html('<p><strong>An unexplainable error occurred.</strong></p>').removeClass('d-none');
            }
        }
    });
};

function get_daily_seasonal_streamflow(model, watershed, subbasin, comid, startdate) {
    $('#seasonal_d-view-file-loading').removeClass('d-none');
    m_downloaded_flow_duration = true;
    $.ajax({
        type: 'GET',
        url: 'get-daily-seasonal-streamflow',
        data: {
            'model': model,
            'watershed': watershed,
            'subbasin': subbasin,
            'comid': comid,
            'startdate': startdate
        },
        success: function(data) {
            if (!data.error) {
                $('#seasonal_d-view-file-loading').addClass('d-none');
                $('#seasonal_d-chart').removeClass('d-none');
                $('#seasonal_d-chart').html(data);
            } else if (data.error) {
                $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the historic data</strong></p>');
                $('#info').removeClass('d-none');
                $('#seasonal_d-view-file-loading').addClass('d-none');

                setTimeout(function() {
                    $('#info').addClass('d-none')
                }, 5000);
            } else {
                $('#info').html('<p><strong>An unexplainable error occurred.</strong></p>').removeClass('d-none');
            }
        }
    });
};

function get_monthly_seasonal_streamflow(model, watershed, subbasin, comid, startdate) {
    $('#seasonal_m-view-file-loading').removeClass('d-none');
    m_downloaded_flow_duration = true;
    $.ajax({
        type: 'GET',
        url: 'get-monthly-seasonal-streamflow',
        data: {
            'model': model,
            'watershed': watershed,
            'subbasin': subbasin,
            'comid': comid,
            'startdate': startdate
        },
        success: function(data) {
            if (!data.error) {
                $('#seasonal_m-view-file-loading').addClass('d-none');
                $('#seasonal_m-chart').removeClass('d-none');
                $('#seasonal_m-chart').html(data);
            } else if (data.error) {
                $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the historic data</strong></p>');
                $('#info').removeClass('d-none');
                $('#seasonal_m-view-file-loading').addClass('d-none');

                setTimeout(function() {
                    $('#info').addClass('d-none')
                }, 5000);
            } else {
                $('#info').html('<p><strong>An unexplainable error occurred.</strong></p>').removeClass('d-none');
            }
        }
    });
};



function get_forecast_percent(watershed, subbasin, comid, startdate) {
    //$loading.removeClass('d-none');
    // $("#forecast-table").addClass('d-none');
    $.ajax({
        url: 'forecastpercent/',
        type: 'GET',
        data: {
            'comid': comid,
            'watershed': watershed,
            'subbasin': subbasin,
            'startdate': startdate
        },
        error: function(xhr, errmsg, err) {
            $('#table').html("<div class='alert-box alert radius' data-alert>Oops! We have encountered an error: "+errmsg+".</div>"); // add the error to the dom
			console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
			$("#forecast-table").addClass('d-none');
        },
        success: function(resp) {
        	// console.log(resp)
        	$('#forecast-table').html(resp);

        	$("#forecast-table").removeClass('d-none');

            $("#forecast-table").show();
            // $('#table').html(resp);
        }
    });
}

function get_waterlevel_info (stationcode, stationname, oldcode, stationtype, stationcat, stationstatus, stream) {
    $('#observed-loading-WL').removeClass('d-none');
    $.ajax({
        url: 'get-waterlevel-data',
        type: 'GET',
        data: {
        	'stationcode' : stationcode,
        	'stationname' : stationname,
        	'oldcode': oldcode,
        	'stationtype' : stationtype,
        	'stationcat': stationcat,
        	'stationstatus': stationstatus,
        	'stream' : stream
        	},
        error: function () {
            $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the Water Level Data</strong></p>');
            $('#info').removeClass('d-none');
            $('#observed-loading-WL').addClass('d-none');

            setTimeout(function () {
                $('#info').addClass('d-none')
            }, 5000);
        },
        success: function (data) {
            if (!data.error) {
                $('#observed-loading-WL').addClass('d-none');
                $('#dates').removeClass('d-none');
//                $('#obsdates').removeClass('d-none');
                $loading.addClass('d-none');
                $('#observed-chart-WL').removeClass('d-none');
                $('#observed-chart-WL').html(data);

                //resize main graph
                Plotly.Plots.resize($("#observed-chart-WL .js-plotly-plot")[0]);

                var params = {
                    stationcode: stationcode,
                    stationname: stationname,
                    oldcode: oldcode,
                    stationtype: stationtype,
                    stationcat: stationcat,
                    stationstatus: stationstatus,
                    stream: stream,
                };

                $('#submit-download-observed-waterlevel').attr({
                    target: '_blank',
                    href: 'get-observed-waterlevel-csv?' + jQuery.param(params)
                });

                $('#download_observed_waterlevel').removeClass('d-none');

                } else if (data.error) {
                	$('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the Discharge Data</strong></p>');
                	$('#info').removeClass('d-none');

                	setTimeout(function() {
                    	$('#info').addClass('d-none')
                	}, 5000);
            	} else {
                	$('#info').html('<p><strong>An unexplainable error occurred.</strong></p>').removeClass('d-none');
            	}
        }
    })
}