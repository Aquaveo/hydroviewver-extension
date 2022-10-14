var GeoGlows = function(){

    this.get_time_series = function (url,watershed, subbasin, comid, startdate) {
        // $loading.removeClass('d-none');
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
    
                setTimeout(function() {
                    $('#info').addClass('d-none')
                }, 5000);
            },
            success: function(data) {
                if (!data.error) {
                    $('#dates').removeClass('d-none');
                    // $loading.addClass('d-none');
                    $('#long-term-chart').removeClass('d-none');
                    // log(data)
                    $('#long-term-chart').html(data);
    
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
    }

    this.get_flow_duration_curve = function (url, watershed, subbasin, comid) {
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
    this.get_daily_seasonal_streamflow = function (url, watershed, subbasin, comid) {
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
    this.get_monthly_seasonal_streamflow = function (url, watershed, subbasin, comid) {
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


}