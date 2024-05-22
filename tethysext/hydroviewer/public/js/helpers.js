
function toggleAcc(layerID) {
    let layer = wms_layers[layerID];
    if (document.getElementById(`wmsToggle${layerID}`).checked) {
        // Turn the layer and legend on
        layer.setVisible(true);
        $("#wmslegend" + layerID).show(200);
    } else {
        layer.setVisible(false);
        $("#wmslegend" + layerID).hide(200);

    }
}

function get_available_dates(model, watershed, subbasin, comid) {
    if (model === 'ECMWF-RAPID') {
        $.ajax({
            type: 'GET',
            url: 'get-available-dates/',
            dataType: 'json',
            data: {
                'watershed': watershed,
                'subbasin': subbasin,
                'comid': comid
            },
            error: function() {
                $('#dates').html(
                    '<p class="alert alert-danger" style="text-align: center"><strong>An error occurred while retrieving the available dates</strong></p>'
                );

                setTimeout(function() {
                    $('#dates').addClass('d-none')
                }, 5000);
            },
            success: function(dates) {
                datesParsed = JSON.parse(dates.available_dates);
                $('#datesSelect').empty();

                $.each(datesParsed, function(i, p) {
                    var val_str = p.slice(1).join();
                    $('#datesSelect').append($('<option></option>').val(val_str).html(p[0]));
                });

            }
        });
    }
}

function submit_model() {
    $('#model').on('change', function() {
        var base_path = location.pathname;

        if (base_path.includes('ecmwf-rapid') || base_path.includes('lis-rapid') || base_path.includes('hiwat-rapid')) {
            base_path = base_path.replace('/ecmwf-rapid', '').replace('/lis-rapid', '').replace('/hiwat-rapid', '');
        }

        if ($('#model option:selected').val() === 'ecmwf') {
            location.href = 'http://' + location.host + base_path + 'ecmwf-rapid/?model=ECMWF-RAPID';
        } else if ($('#model option:selected').val() === 'lis') {
            location.href = 'http://' + location.host + base_path + 'lis-rapid/?model=LIS-RAPID';
        } else if ($('#model option:selected').val() === 'hiwat') {
            location.href = 'http://' + location.host + base_path + 'hiwat-rapid/?model=HIWAT-RAPID';
        } else {
            location.href = 'http://' + location.host + base_path;
        }
    });
};

function resize_graphs() {
    $("#forecast_tab_link").click(function() {
        Plotly.Plots.resize($("#long-term-chart .js-plotly-plot")[0]);
    });

    $("#historical_tab_link").click(function() {
        if (m_downloaded_historical_streamflow) {
        	Plotly.Plots.resize($("#historical-chart .js-plotly-plot")[0]);
        }
    });

    $("#flow_duration_tab_link").click(function() {
        if (m_downloaded_flow_duration) {
            Plotly.Plots.resize($("#fdc-chart .js-plotly-plot")[0]);
            Plotly.Plots.resize($("#seasonal_d-chart .js-plotly-plot")[0]);
            Plotly.Plots.resize($("#seasonal_m-chart .js-plotly-plot")[0]);
        }
    });
    $("#observedQ_tab_link").click(function() {
        Plotly.Plots.resize($("#observed-chart-Q .js-plotly-plot")[0]);
    });
    $("#observedWL_tab_link").click(function() {
        Plotly.Plots.resize($("#observed-chart-WL .js-plotly-plot")[0]);
    });
};