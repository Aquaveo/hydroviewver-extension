var GeoGlows = function(){

    this.get_time_series = function (url,watershed, subbasin, comid, startdate) {
        $('#forecast-good').addClass('d-none');
        $('#forecast-bad').addClass('d-none');
        $('#forecast-loading').removeClass('d-none');
        
        $('#view-file-loading').removeClass('d-none');
        $('#long-term-chart').addClass('d-none');
        $('#dates').addClass('d-none');
        $('#long-term-chart').empty();


        $.ajax({
            type: 'GET',
            url: url,
            data: {
                'watershed': watershed,
                'subbasin': subbasin,
                'comid': comid,
                'startdate': startdate
            },
            error: function() {
                $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the forecast</strong></p>');
                $('#info').removeClass('d-none');
                // $loading.addClass('d-none');
                $('#view-file-loading').addClass('d-none');
                $('#forecast-bad').removeClass('d-none');
                $('#forecast-loading').addClass('d-none');

                setTimeout(function() {
                    $('#info').addClass('d-none')
                }, 5000);
            },
            success: function(data) {
                if (!data.error) {
                    $('#dates').removeClass('d-none');
                    // $loading.addClass('d-none');
                    $('#view-file-loading').addClass('d-none');

                    $('#long-term-chart').removeClass('d-none');
                    // log(data)
                    $('#long-term-chart').html(data);
                    $('#forecast-good').removeClass('d-none');
                    $('#forecast-loading').addClass('d-none');
    
                    //resize main graph
                    Plotly.Plots.resize($("#long-term-chart .js-plotly-plot")[0]);
    
                    // var params = {
                    //     watershed_name: watershed,
                    //     subbasin_name: subbasin,
                    //     reach_id: comid,
                    //     startdate: startdate,
                    // };
    
                    // $('#submit-download-forecast').attr({
                    //     target: '_blank',
                    //     href: 'get-forecast-data-csv?' + jQuery.param(params)
                    // });
    
                    // $('#download_forecast').removeClass('d-none');
    
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
    this.get_historical_data = function(url,watershed, subbasin, comid){
        $('#historical-simulation-good').addClass('d-none');
        $('#historical-simulation-bad').addClass('d-none');
        $('#historical-simulation-loading').removeClass('d-none');

        $('#his-view-file-loading').removeClass('d-none');
        $('#historical-chart').addClass('d-none');
        $('#historical-chart').empty();
        console.log(comid)
        m_downloaded_historical_streamflow = true;
        $.ajax({
            type: 'GET',
            url: url,
            data: {
                'watershed': watershed,
                'subbasin': subbasin,
                'comid': comid,
            },
            success: function(data) {
                if (!data.error) {
                    $("#historical_tab_link_li").removeClass("d-none");
                    $("#historical").removeClass("d-none");

                    $('#his-view-file-loading').addClass('d-none');
                    $('#historical-chart').html(data);
                    $('#historical-chart').removeClass('d-none');
                    Plotly.Plots.resize($("#historical-chart .js-plotly-plot")[0]);
                    
                    $('#historical-simulation-good').removeClass('d-none');
                    $('#historical-simulation-loading').addClass('d-none');
    
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
                    $('#historical-simulation-bad').removeClass('d-none');
                    $('#historical-simulation-loading').addClass('d-none');

                    setTimeout(function() {
                        $('#info').addClass('d-none')
                    }, 5000);
                } else {
                    $('#info').html('<p><strong>An unexplainable error occurred.</strong></p>').removeClass('d-none');
                }
            }
        });
    }

    this.get_flow_duration_curve = function (url, watershed, subbasin, comid) {
        $('#flow-duration-curve-good').addClass('d-none');
        $('#flow-duration-curve-bad').addClass('d-none');
        $('#flow-duration-curve-loading').removeClass('d-none');
        
        $('#fdc-view-file-loading').removeClass('d-none');
        m_downloaded_flow_duration = true;
        $.ajax({
            type: 'GET',
            url: url,

            data: {
                'watershed': watershed,
                'subbasin': subbasin,
                'comid': comid,
            },
            success: function(data) {
                if (!data.error) {
                    $('#fdc-view-file-loading').addClass('d-none');
                    $('#fdc-chart').removeClass('d-none');
                    $('#fdc-chart').html(data);
                    Plotly.Plots.resize($("#fdc-chart .js-plotly-plot")[0]);

                    $('#flow-duration-curve-good').removeClass('d-none');
                    $('#flow-duration-curve-loading').addClass('d-none');
                
                } else if (data.error) {
                    $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the historic data</strong></p>');
                    $('#info').removeClass('d-none');
                    $('#fdc-view-file-loading').addClass('d-none');

                    $('#flow-duration-curve-bad').removeClass('d-none');
                    $('#flow-duration-curve-loading').addClass('d-none');

                    setTimeout(function() {
                        $('#info').addClass('d-none')
                    }, 5000);
                } else {
                    $('#info').html('<p><strong>An unexplainable error occurred.</strong></p>').removeClass('d-none');
                }
            }
        });
    };
    this.get_daily_seasonal_streamflow = function (url, watershed, subbasin, comid) {

        $('#daily-seasonal-streamflow-good').addClass('d-none');
        $('#daily-seasonal-streamflow-bad').addClass('d-none');
        $('#daily-seasonal-streamflow-loading').removeClass('d-none');

        $('#seasonal_d-view-file-loading').removeClass('d-none');
        m_downloaded_flow_duration = true;
        $.ajax({
            type: 'GET',
            url: url,

            data: {
                'watershed': watershed,
                'subbasin': subbasin,
                'comid': comid,
            },
            success: function(data) {
                if (!data.error) {
                    $('#seasonal_d-view-file-loading').addClass('d-none');
                    $('#seasonal_d-chart').removeClass('d-none');
                    $('#seasonal_d-chart').html(data);
                    Plotly.Plots.resize($("#seasonal_d-chart .js-plotly-plot")[0]);
                    
                    $('#daily-seasonal-streamflow-good').removeClass('d-none');
                    $('#daily-seasonal-streamflow-loading').addClass('d-none');

                } else if (data.error) {
                    $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the historic data</strong></p>');
                    $('#info').removeClass('d-none');
                    $('#fdc-view-file-loading').addClass('d-none');

                    $('#daily-seasonal-streamflow-bad').removeClass('d-none');
                    $('#daily-seasonal-streamflow-loading').addClass('d-none');
                    
                    setTimeout(function() {
                        $('#info').addClass('d-none')
                    }, 5000);
                } else {
                    $('#info').html('<p><strong>An unexplainable error occurred.</strong></p>').removeClass('d-none');
                }
            }
        });
    };
    this.get_monthly_seasonal_streamflow = function (url, watershed, subbasin, comid) {
        $('#monthly-seasonal-streamflow-good').addClass('d-none');
        $('#monthly-seasonal-streamflow-bad').addClass('d-none');
        $('#monthly-seasonal-streamflow-loading').removeClass('d-none');
        
        $('#seasonal_m-view-file-loading').removeClass('d-none');
        
        m_downloaded_flow_duration = true;
        $.ajax({
            type: 'GET',
            url: url,

            data: {
                'watershed': watershed,
                'subbasin': subbasin,
                'comid': comid,
            },
            success: function(data) {
                if (!data.error) {
                    $('#seasonal_m-view-file-loading').addClass('d-none');
                    $('#seasonal_m-chart').removeClass('d-none');
                    $('#seasonal_m-chart').html(data);
                    Plotly.Plots.resize($("#seasonal_m-chart .js-plotly-plot")[0]);

                    $('#monthly-seasonal-streamflow-good').removeClass('d-none');
                    $('#monthly-seasonal-streamflow-loading').addClass('d-none');


                } else if (data.error) {
                    $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the historic data</strong></p>');
                    $('#info').removeClass('d-none');
                    $('#fdc-view-file-loading').addClass('d-none');

                    $('#monthly-seasonal-streamflow-bad').removeClass('d-none');
                    $('#monthly-seasonal-streamflow-loading').addClass('d-none');
                    setTimeout(function() {
                        $('#info').addClass('d-none')
                    }, 5000);
                } else {
                    $('#info').html('<p><strong>An unexplainable error occurred.</strong></p>').removeClass('d-none');
                }
            }
        });
    };
    this.get_forecast_percent = function(url,watershed, subbasin, comid, startdate){
        $.ajax({
            type: 'GET',
            url: url,
            data: {
                'watershed': watershed,
                'subbasin': subbasin,
                'comid': comid,
                'startdate': startdate
            },
            error: function(xhr, errmsg, err) {
                $('#table').html("<div class='alert-box alert radius' data-alert>Oops! We have encountered an error: "+errmsg+".</div>"); // add the error to the dom
            },
            success: function(resp) {
              // console.log(resp)
              $('#forecast-table').html(resp);
    
              $("#forecast-table").removeClass('hidden');
    
              $("#forecast-table").show();
              // $('#table').html(resp);
            }
        });
    }

}