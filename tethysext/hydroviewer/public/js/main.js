$(function() {
    $('#app-content-wrapper').removeClass('show-nav');
    $(".toggle-nav").removeClass('toggle-nav');

    //make sure active Plotly plots resize on window resize
    window.onresize = function() {
        $('#graph .modal-body .tab-pane.active .js-plotly-plot').each(function(){
            Plotly.Plots.resize($(this)[0]);
        });
    };

    init_map();
    map_events();
    submit_model();
    resize_graphs();
    // If there is a defined Watershed, then lets render it and hide the controls
    let ws_val = $('#watershed').find(":selected").text();
    if (ws_val && ws_val !== 'Select Watershed') {
        view_watershed();
        $("[name='update_button']").hide();
    }
    // If there is a button to save default WS, let's add handler
    $("[name='update_button']").click(() => {
        $.ajax({
            url: 'admin/setdefault',
            type: 'GET',
            dataType: 'json',
            data: {
                'ws_name': $('#model').find(":selected").text(),
                'model_name': $('#watershed').find(":selected").text()
            },
            success: function() {
                // Remove the set default button
                $("[name='update_button']").hide(500);
                console.log('Updated Defaults Successfully');
            }
        });
    })


    $('#datesSelect').change(function() { //when date is changed
    	//console.log($("#datesSelect").val());

        //var sel_val = ($('#datesSelect option:selected').val()).split(',');
        sel_val = $("#datesSelect").val()

        //var startdate = sel_val[0];
        var startdate = sel_val;
        startdate = startdate.replace("-","");
        startdate = startdate.replace("-","");

        //var watershed = sel_val[1];
        var watershed = 'south_america';

        //var subbasin = sel_val[2];
        var subbasin = 'geoglows';

        //var comid = sel_val[3];
        var model = 'ECMWF-RAPID';

        $loading.removeClass('hidden');
        get_time_series(model, watershed, subbasin, comid, startdate);
        get_forecast_percent(watershed, subbasin, comid, startdate);
    });
});


$('#stp-stream-toggle').on('change', function() {
    wmsLayer.setVisible($('#stp-stream-toggle').prop('checked'))
})
$('#stp-stations-toggle').on('change', function() {
    wmsLayer2.setVisible($('#stp-stations-toggle').prop('checked'))
})
$('#stp-100-toggle').on('change', function() {
    hundred_year_warning.setVisible($('#stp-100-toggle').prop('checked'))
})
$('#stp-50-toggle').on('change', function() {
    fifty_year_warning.setVisible($('#stp-50-toggle').prop('checked'))
})
$('#stp-25-toggle').on('change', function() {
    twenty_five_year_warning.setVisible($('#stp-25-toggle').prop('checked'))
})
$('#stp-10-toggle').on('change', function() {
    ten_year_warning.setVisible($('#stp-10-toggle').prop('checked'))
})
$('#stp-5-toggle').on('change', function() {
    five_year_warning.setVisible($('#stp-5-toggle').prop('checked'))
})
$('#stp-2-toggle').on('change', function() {
    two_year_warning.setVisible($('#stp-2-toggle').prop('checked'))
})

// Regions gizmo listener
$('#regions').change(function() {getRegionGeoJsons()});