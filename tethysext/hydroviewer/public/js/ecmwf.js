var GeoGlows = function(){

    this.get_time_series = function (url,watershed, subbasin, comid, startdate) {
        $loading.removeClass('hidden');
        $('#long-term-chart').addClass('hidden');
        $('#dates').addClass('hidden');
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
                $('#info').removeClass('hidden');
                $loading.addClass('hidden');
    
                setTimeout(function() {
                    $('#info').addClass('hidden')
                }, 5000);
            },
            success: function(data) {
                if (!data.error) {
                    $('#dates').removeClass('hidden');
                    $loading.addClass('hidden');
                    $('#long-term-chart').removeClass('hidden');
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
    
                    // $('#download_forecast').removeClass('hidden');
    
                } else if (data.error) {
                    $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the forecast</strong></p>');
                    $('#info').removeClass('hidden');
    
                    setTimeout(function() {
                        $('#info').addClass('hidden')
                    }, 5000);
                } else {
                    $('#info').html('<p><strong>An unexplainable error occurred.</strong></p>').removeClass('hidden');
                }
            }
        });
    }
    this.get_historical_data = function(url,watershed, subbasin, comid, startdate){
        $('#his-view-file-loading').removeClass('hidden');
        console.log(comid)
        m_downloaded_historical_streamflow = true;
        $.ajax({
            type: 'GET',
            url: url,
            data: {
                'watershed': watershed,
                'subbasin': subbasin,
                'comid': comid,
                'startdate': startdate
            },
            success: function(data) {
                if (!data.error) {
                    $("#historical_tab_link_li").removeClass("hidden");
                    $("#historical").removeClass("hidden");

                    $('#his-view-file-loading').addClass('hidden');
                    $('#historical-chart').removeClass('hidden');
                    $('#historical-chart').html(data);
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
    
                    // $('#download_era_5').removeClass('hidden');
    
                } else if (data.error) {
                    $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the historic data</strong></p>');
                    $('#info').removeClass('hidden');
                    $('#his-view-file-loading').addClass('hidden');
    
                    setTimeout(function() {
                        $('#info').addClass('hidden')
                    }, 5000);
                } else {
                    $('#info').html('<p><strong>An unexplainable error occurred.</strong></p>').removeClass('hidden');
                }
            }
        });
    }

    this.get_flow_duration_curve = function (url, watershed, subbasin, comid, startdate) {
        $('#fdc-view-file-loading').removeClass('hidden');
        m_downloaded_flow_duration = true;
        $.ajax({
            type: 'GET',
            // url: 'get-flow-duration-curve',
            url: url,

            data: {
                'watershed': watershed,
                'subbasin': subbasin,
                'comid': comid,
                'startdate': startdate
            },
            success: function(data) {
                if (!data.error) {
                    $('#fdc-view-file-loading').addClass('hidden');
                    $('#fdc-chart').removeClass('hidden');
                    $('#fdc-chart').html(data);
                } else if (data.error) {
                    $('#info').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the historic data</strong></p>');
                    $('#info').removeClass('hidden');
                    $('#fdc-view-file-loading').addClass('hidden');
    
                    setTimeout(function() {
                        $('#info').addClass('hidden')
                    }, 5000);
                } else {
                    $('#info').html('<p><strong>An unexplainable error occurred.</strong></p>').removeClass('hidden');
                }
            }
        });
    };


}