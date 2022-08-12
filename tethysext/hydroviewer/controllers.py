from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from tethys_sdk.gizmos import *
from django.http import HttpResponse, JsonResponse
from tethys_sdk.permissions import has_permission
from tethys_sdk.base import TethysAppBase
from tethys_sdk.gizmos import PlotlyView
from tethys_sdk.workspaces import app_workspace


import os
import pytz
import requests
from requests.auth import HTTPBasicAuth
import json
import urllib.request
import urllib.error
import urllib.parse
import numpy as np
import netCDF4 as nc
import pandas as pd
import io
import geoglows
import hydrostats

from osgeo import ogr
from osgeo import osr
from csv import writer as csv_writer
import csv
import scipy.stats as sp
import datetime as dt
import ast
import plotly.graph_objs as go

from dateutil.relativedelta import relativedelta
from bs4 import BeautifulSoup
from .app import Hydroviewer as app
from .helpers import *
base_name = __package__.split('.')[-1]


def set_custom_setting(defaultModelName, defaultWSName):

    from tethys_apps.models import TethysApp
    db_app = TethysApp.objects.get(package=app.package)
    custom_settings = db_app.custom_settings

    db_setting = db_app.custom_settings.get(name='default_model_type')
    db_setting.value = defaultModelName
    db_setting.save()

    db_setting = db_app.custom_settings.get(name='default_watershed_name')
    db_setting.value = defaultWSName
    db_setting.save()


def home(request):

    # Check if we have a default model. If we do, then redirect the user to the default model's page
    default_model = app.get_custom_setting('default_model_type')
    if default_model:
        model_func = switch_model(default_model)
        if model_func is not 'invalid':
            return globals()[model_func](request)
        else:
            return home_standard(request)
    else:
        return home_standard(request)


def home_standard(request):
    model_input = SelectInput(display_text='',
                              name='model',
                              multiple=False,
                              options=[('Select Model', ''), ('ECMWF-RAPID', 'ecmwf'), ('LIS-RAPID', 'lis')],
                              initial=['Select Model'],
                              original=True)

    zoom_info = TextInput(display_text='',
                          initial=json.dumps(app.get_custom_setting('zoom_info')),
                          name='zoom_info',
                          disabled=True)

    context = {
        "base_name": base_name,
        "model_input": model_input,
        "zoom_info": zoom_info
    }

    return render(request, '{0}/home.html'.format(base_name), context)


def ecmwf(request):

    # Can Set Default permissions : Only allowed for admin users
    can_update_default = has_permission(request, 'update_default')

    if(can_update_default):
        defaultUpdateButton = Button(
            display_text='Save',
            name='update_button',
            style='success',
            attributes={
                'data-toggle': 'tooltip',
                'data-placement': 'bottom',
                'title': 'Save as Default Options for WS'
            })
    else:
        defaultUpdateButton = False

    # Check if we need to hide the WS options dropdown.
    hiddenAttr = ""
    if app.get_custom_setting('show_dropdown') and app.get_custom_setting('default_model_type') and app.get_custom_setting('default_watershed_name'):
        hiddenAttr = "hidden"

    init_model_val = request.GET.get('model', False) or app.get_custom_setting('default_model_type') or 'Select Model'
    init_ws_val = app.get_custom_setting('default_watershed_name') or 'Select Watershed'

    model_input = SelectInput(display_text='',
                              name='model',
                              multiple=False,
                              options=[('Select Model', ''), ('ECMWF-RAPID', 'ecmwf'),
                                       ('LIS-RAPID', 'lis'), ('HIWAT-RAPID', 'hiwat')],
                              initial=[init_model_val],
                              classes=hiddenAttr,
                              original=True)

    # uncomment for displaying watersheds in the SPT
    # res = requests.get(app.get_custom_setting('api_source') + '/apps/streamflow-prediction-tool/api/GetWatersheds/',
    #                    headers={'Authorization': 'Token ' + app.get_custom_setting('spt_token')})
    #
    # watershed_list_raw = json.loads(res.content)
    #
    # app.get_custom_setting('keywords').lower().replace(' ', '').split(',')
    # watershed_list = [value for value in watershed_list_raw if
    #                   any(val in value[0].lower().replace(' ', '') for
    #                       val in app.get_custom_setting('keywords').lower().replace(' ', '').split(','))]

    # Retrieve a geoserver engine and geoserver credentials.
    geoserver_engine = app.get_spatial_dataset_service(
        name='main_geoserver', as_engine=True)

    geos_username = geoserver_engine.username
    geos_password = geoserver_engine.password
    my_geoserver = geoserver_engine.endpoint.replace('rest', '')

    watershed_list = [['Select Watershed', '']]  # + watershed_list

    res2 = requests.get(my_geoserver + '/rest/workspaces/' + app.get_custom_setting('workspace') +
                        '/featuretypes.json', auth=HTTPBasicAuth(geos_username, geos_password), verify=False)

    for i in range(len(json.loads(res2.content)['featureTypes']['featureType'])):
        raw_feature = json.loads(res2.content)['featureTypes']['featureType'][i]['name']
        if 'drainage_line' in raw_feature and any(n in raw_feature for n in app.get_custom_setting('keywords').replace(' ', '').split(',')):
            feat_name = raw_feature.split('-')[0].replace('_', ' ').title() + ' (' + \
                raw_feature.split('-')[1].replace('_', ' ').title() + ')'
            if feat_name not in str(watershed_list):
                watershed_list.append([feat_name, feat_name])

    # Add the default WS if present and not already in the list
    if init_ws_val and init_ws_val not in str(watershed_list):
        watershed_list.append([init_ws_val, init_ws_val])

    watershed_select = SelectInput(display_text='',
                                   name='watershed',
                                   options=watershed_list,
                                   initial=[init_ws_val],
                                   original=True,
                                   classes=hiddenAttr,
                                   attributes={'onchange': "javascript:view_watershed();"+hiddenAttr}
                                   )

    zoom_info = TextInput(display_text='',
                          initial=json.dumps(app.get_custom_setting('zoom_info')),
                          name='zoom_info',
                          disabled=True)

    # Retrieve a geoserver engine and geoserver credentials.
    geoserver_engine = app.get_spatial_dataset_service(
        name='main_geoserver', as_engine=True)

    my_geoserver = geoserver_engine.endpoint.replace('rest', '')

    geoserver_base_url = my_geoserver
    geoserver_workspace = app.get_custom_setting('workspace')
    region = app.get_custom_setting('region')
    geoserver_endpoint = TextInput(display_text='',
                                   initial=json.dumps([geoserver_base_url, geoserver_workspace, region]),
                                   name='geoserver_endpoint',
                                   disabled=True)

    today = dt.datetime.now()
    year = str(today.year)
    month = str(today.strftime("%m"))
    day = str(today.strftime("%d"))
    date = day + '/' + month + '/' + year
    lastyear = int(year) - 1
    date2 = day + '/' + month + '/' + str(lastyear)

    startdateobs = DatePicker(name='startdateobs',
                              display_text='Start Date',
                              autoclose=True,
                              format='dd/mm/yyyy',
                              start_date='01/01/1950',
                              start_view='month',
                              today_button=True,
                              initial=date2,
                              classes='datepicker')

    enddateobs = DatePicker(name='enddateobs',
                            display_text='End Date',
                            autoclose=True,
                            format='dd/mm/yyyy',
                            start_date='01/01/1950',
                            start_view='month',
                            today_button=True,
                            initial=date,
                            classes='datepicker')

    res = requests.get('https://geoglows.ecmwf.int/api/AvailableDates/?region=central_america-geoglows', verify=False)
    data = res.json()
    dates_array = (data.get('available_dates'))

    dates = []

    for date in dates_array:
        if len(date) == 10:
            date_mod = date + '000'
            date_f = dt.datetime.strptime(date_mod, '%Y%m%d.%H%M').strftime('%Y-%m-%d %H:%M')
        else:
            date_f = dt.datetime.strptime(date, '%Y%m%d.%H%M').strftime('%Y-%m-%d')
            date = date[:-3]
        dates.append([date_f, date])
        dates = sorted(dates)

    dates.append(['Select Date', dates[-1][1]])
    # print(dates)
    dates.reverse()

    # Date Picker Options
    date_picker = DatePicker(name='datesSelect',
                             display_text='Date',
                             autoclose=True,
                             format='yyyy-mm-dd',
                             start_date=dates[-1][0],
                             end_date=dates[1][0],
                             start_view='month',
                             today_button=True,
                             initial='')

    region_index = json.load(open(os.path.join(os.path.dirname(__file__), 'public', 'geojson', 'index.json')))
    regions = SelectInput(
        display_text='Zoom to a Region:',
        name='regions',
        multiple=False,
        original=True,
        options=[(region_index[opt]['name'], opt) for opt in region_index]
    )

    context = {
        "base_name": base_name,
        "model_input": model_input,
        "watershed_select": watershed_select,
        "zoom_info": zoom_info,
        "geoserver_endpoint": geoserver_endpoint,
        "defaultUpdateButton": defaultUpdateButton,
        "startdateobs": startdateobs,
        "enddateobs": enddateobs,
        "date_picker": date_picker,
        "regions": regions
    }

    return render(request, '{0}/ecmwf.html'.format(base_name), context)


def lis(request):

    default_model = app.get_custom_setting('default_model_type')
    init_model_val = request.GET.get('model', False) or default_model or 'Select Model'
    init_ws_val = app.get_custom_setting('default_watershed_name') or 'Select Watershed'

    model_input = SelectInput(display_text='',
                              name='model',
                              multiple=False,
                              options=[('Select Model', ''), ('ECMWF-RAPID', 'ecmwf'),
                                       ('LIS-RAPID', 'lis'), ('HIWAT-RAPID', 'hiwat')],
                              initial=[init_model_val],
                              original=True)

    watershed_list = [['Select Watershed', '']]

    if app.get_custom_setting('lis_path'):
        res = os.listdir(app.get_custom_setting('lis_path'))

        for i in res:
            feat_name = i.split('-')[0].replace('_', ' ').title() + ' (' + \
                i.split('-')[1].replace('_', ' ').title() + ')'
            if feat_name not in str(watershed_list):
                watershed_list.append([feat_name, i])

    # Add the default WS if present and not already in the list
    # Not sure if this will work with LIS type. Need to test it out.
    if default_model == 'LIS-RAPID' and init_ws_val and init_ws_val not in str(watershed_list):
        watershed_list.append([init_ws_val, init_ws_val])

    watershed_select = SelectInput(display_text='',
                                   name='watershed',
                                   options=watershed_list,
                                   initial=[init_ws_val],
                                   original=True,
                                   attributes={'onchange': "javascript:view_watershed();"}
                                   )

    zoom_info = TextInput(display_text='',
                          initial=json.dumps(app.get_custom_setting('zoom_info')),
                          name='zoom_info',
                          disabled=True)
    context = {
        "base_name": base_name,
        "model_input": model_input,
        "watershed_select": watershed_select,
        "zoom_info": zoom_info
    }

    return render(request, '{0}/lis.html'.format(base_name), context)


def hiwat(request):
    default_model = app.get_custom_setting('default_model_type')
    init_model_val = request.GET.get('model', False) or default_model or 'Select Model'
    init_ws_val = app.get_custom_setting('default_watershed_name') or 'Select Watershed'

    model_input = SelectInput(display_text='',
                              name='model',
                              multiple=False,
                              options=[('Select Model', ''), ('ECMWF-RAPID', 'ecmwf'),
                                       ('LIS-RAPID', 'lis'), ('HIWAT-RAPID', 'hiwat')],
                              initial=[init_model_val],
                              original=True)

    watershed_list = [['Select Watershed', '']]

    if app.get_custom_setting('lis_path'):
        res = os.listdir(app.get_custom_setting('hiwat_path'))

        for i in res:
            feat_name = i.split('-')[0].replace('_', ' ').title() + ' (' + \
                i.split('-')[1].replace('_', ' ').title() + ')'
            if feat_name not in str(watershed_list):
                watershed_list.append([feat_name, i])

    # Add the default WS if present and not already in the list
    # Not sure if this will work with LIS type. Need to test it out.
    if default_model == 'HIWAT-RAPID' and init_ws_val and init_ws_val not in str(watershed_list):
        watershed_list.append([init_ws_val, init_ws_val])

    watershed_select = SelectInput(display_text='',
                                   name='watershed',
                                   options=watershed_list,
                                   initial=[init_ws_val],
                                   original=True,
                                   attributes={'onchange': "javascript:view_watershed();"}
                                   )

    zoom_info = TextInput(display_text='',
                          initial=json.dumps(app.get_custom_setting('zoom_info')),
                          name='zoom_info',
                          disabled=True)
    context = {
        "base_name": base_name,
        "model_input": model_input,
        "watershed_select": watershed_select,
        "zoom_info": zoom_info
    }

    return render(request, '{0}/hiwat.html'.format(base_name), context)




def get_waterlevel_data(request):
    """
    Get data from telemetric stations
    """
    get_data = request.GET

    try:
        codEstacion = get_data['stationcode']
        nomEstacion = get_data['stationname']
        oldCodEstacion = get_data['oldcode']
        tipoEstacion = get_data['stationtype']
        catEstacion = get_data['stationcat']
        statusEstacion = get_data['stationstatus']
        river = get_data['stream']

        tz = pytz.timezone('America/Bogota')
        hoy = dt.datetime.now(tz)

        end_date = dt.datetime(int(hoy.year),int(hoy.month),1)
        ini_date = end_date - relativedelta(months=7)

        time_array = []

        while ini_date <= end_date:
            time_array.append(ini_date)
            ini_date += relativedelta(months=1)

        if statusEstacion == "DIFERIDO":

            fechas = []
            values = []

            for t in time_array:

                anyo = t.year
                mes = t.month

                if mes < 10:
                    MM = '0' + str(mes)
                else:
                    MM = str(mes)

                YYYY = str(anyo)

                url = 'https://www.senamhi.gob.pe/mapas/mapa-estaciones-2/_dato_esta_tipo02.php?estaciones={0}&CBOFiltro={1}{2}&t_e=H&estado={3}&cod_old={4}&cate_esta={5}&alt=263'.format(codEstacion, YYYY, MM, statusEstacion, oldCodEstacion, catEstacion)

                page = requests.get(url)
                soup = BeautifulSoup(page.content, 'html.parser')

                results = soup.find(id='dataTable')
                df_stations = pd.read_html(str(results))[0]
                df_stations = df_stations.loc[df_stations.index >= 2]

                if len(df_stations.iloc[:, 0].values) > 0:
                    dates = df_stations.iloc[:, 0].values
                    values_06hrs = df_stations.iloc[:, 1].values
                    values_10hrs = df_stations.iloc[:, 2].values
                    values_14hrs = df_stations.iloc[:, 3].values
                    values_18hrs = df_stations.iloc[:, 4].values

                    for i in range(0, len(dates)):
                        fechas.append(dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 6, 0, 0))
                        fechas.append(dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 10, 0, 0))
                        fechas.append(dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 14, 0, 0))
                        fechas.append(dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 18, 0, 0))
                        if values_06hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_06hrs[i]) >= 200:
                            values.append(float(values_06hrs[i])/200)
                        else:
                            values.append(float(values_06hrs[i]))
                        if values_10hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_10hrs[i]) >= 200:
                            values.append(float(values_10hrs[i])/200)
                        else:
                            values.append(float(values_10hrs[i]))
                        if values_14hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_14hrs[i]) >= 200:
                            values.append(float(values_14hrs[i])/200)
                        else:
                            values.append(float(values_14hrs[i]))
                        if values_18hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_18hrs[i]) >= 200:
                            values.append(float(values_18hrs[i])/200)
                        else:
                            values.append(float(values_18hrs[i]))

        elif statusEstacion == "REAL":

            fechas = []
            values = []

            for t in time_array:

                anyo = t.year
                mes = t.month

                if mes < 10:
                    MM = '0' + str(mes)

                else:
                    MM = str(mes)

                YYYY = str(anyo)

                url = 'https://www.senamhi.gob.pe/mapas/mapa-estaciones-2/_dato_esta_tipo02.php?estaciones={0}&CBOFiltro={1}{2}&t_e=H&estado={3}&cod_old={4}&cate_esta={5}&alt=101'.format(codEstacion, YYYY, MM, statusEstacion, oldCodEstacion, catEstacion)
                page = requests.get(url)
                soup = BeautifulSoup(page.content, 'html.parser')

                results = soup.find(id='dataTable')
                df_stations = pd.read_html(str(results))[0]
                df_stations = df_stations.loc[df_stations.index >= 2]

                if len(df_stations.iloc[:, 0].values) > 0:
                    dates = df_stations.iloc[:, 0].values
                    values_06hrs = df_stations.iloc[:, 1].values
                    values_10hrs = df_stations.iloc[:, 2].values
                    values_14hrs = df_stations.iloc[:, 3].values
                    values_18hrs = df_stations.iloc[:, 4].values

                    for i in range(0, len(dates)):
                        fechas.append(dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 6, 0, 0))
                        fechas.append(dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 10, 0, 0))
                        fechas.append(dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 14, 0, 0))
                        fechas.append(dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 18, 0, 0))
                        if values_06hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_06hrs[i]) >= 200:
                            values.append(float(values_06hrs[i])/200)
                        else:
                            values.append(float(values_06hrs[i]))
                        if values_10hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_10hrs[i]) >= 200:
                            values.append(float(values_10hrs[i])/200)
                        else:
                            values.append(float(values_10hrs[i]))
                        if values_14hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_14hrs[i]) >= 200:
                            values.append(float(values_14hrs[i])/200)
                        else:
                            values.append(float(values_14hrs[i]))
                        if values_18hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_18hrs[i]) >= 200:
                            values.append(float(values_18hrs[i])/200)
                        else:
                            values.append(float(values_18hrs[i]))

        elif statusEstacion == "AUTOMATICA":

            fechas = []
            values = []
            lluvia = []

            for t in time_array:

                anyo = t.year
                mes = t.month

                if mes < 10:
                    MM = '0' + str(mes)
                else:
                    MM = str(mes)

                YYYY = str(anyo)

                url = 'https://www.senamhi.gob.pe/mapas/mapa-estaciones-2/_dato_esta_tipo02.php?estaciones={0}&CBOFiltro={1}{2}&t_e=H&estado={3}&cod_old={4}&cate_esta={5}&alt=280'.format(codEstacion, YYYY, MM, statusEstacion, oldCodEstacion, catEstacion)
                page = requests.get(url)
                soup = BeautifulSoup(page.content, 'html.parser')

                results = soup.find(id='dataTable')
                df_stations = pd.read_html(str(results))[0]
                df_stations = df_stations.loc[df_stations.index >= 1]

                if len(df_stations.iloc[:, 0].values) > 0:
                    dates = df_stations.iloc[:, 0].values
                    horas = df_stations.iloc[:, 1].values
                    niveles = df_stations.iloc[:, 2].values
                    try:
                        precipitacion = df_stations.iloc[:, 3].values
                    except IndexError:
                        print('No hay datos de lluvia en esta estación')

                    for i in range(0, len(dates)):
                        fechas.append(
                            dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), int(horas[i][0:2]),
                                        int(horas[i][3:5])))
                        if niveles[i] == 'S/D':
                            values.append(np.nan)
                        elif float(niveles[i]) >= 100:
                            values.append(float(niveles[i])/100)
                        else:
                            values.append(float(niveles[i]))
                        try:
                            if precipitacion[i] == 'S/D':
                                lluvia.append(np.nan)
                            else:
                                lluvia.append(float(precipitacion[i]))
                        except IndexError:
                            print('No hay datos de lluvia en esta estación')

        datesObservedWaterLevel = fechas
        observedWaterLevel = values

        pairs = [list(a) for a in zip(datesObservedWaterLevel, observedWaterLevel)]
        water_level_df = pd.DataFrame(pairs, columns=['Datetime', 'Water Level (m)'])

        water_level_df.set_index('Datetime', inplace=True)
        water_level_df.dropna(inplace=True)

        observed_WL = go.Scatter(
            x=water_level_df.index,
            y=water_level_df.iloc[:, 0].values,
            name='Observed'
        )

        layout = go.Layout(title='Observed Water Level',
                           xaxis=dict(
                               title='Dates', ),
                           yaxis=dict(
                               title='Water Level (m)',
                               autorange=True),
                           showlegend=True)

        chart_obj = PlotlyView(
            go.Figure(data=[observed_WL],
                      layout=layout)
        )

        context = {
            'gizmo_object': chart_obj,
        }

        return render(request, '{0}/gizmo_ajax.html'.format(base_name), context)

    except Exception as e:
        print(str(e))
        return JsonResponse({'error': 'No  data found for the station.'})

def get_observed_waterlevel_csv(request):
    """
    Get data from fews stations
    """

    get_data = request.GET

    try:
        codEstacion = get_data['stationcode']
        nomEstacion = get_data['stationname']
        oldCodEstacion = get_data['oldcode']
        tipoEstacion = get_data['stationtype']
        catEstacion = get_data['stationcat']
        statusEstacion = get_data['stationstatus']
        river = get_data['stream']

        tz = pytz.timezone('America/Bogota')
        hoy = dt.datetime.now(tz)

        end_date = dt.datetime(int(hoy.year), int(hoy.month), 1)
        ini_date = end_date - relativedelta(months=7)

        time_array = []

        while ini_date <= end_date:
            time_array.append(ini_date)
            ini_date += relativedelta(months=1)

        if statusEstacion == "DIFERIDO":

            fechas = []
            values = []

            for t in time_array:

                anyo = t.year
                mes = t.month

                if mes < 10:
                    MM = '0' + str(mes)
                else:
                    MM = str(mes)

                YYYY = str(anyo)

                url = 'https://www.senamhi.gob.pe/mapas/mapa-estaciones-2/_dato_esta_tipo02.php?estaciones={0}&CBOFiltro={1}{2}&t_e=H&estado={3}&cod_old={4}&cate_esta={5}&alt=263'.format(
                    codEstacion, YYYY, MM, statusEstacion, oldCodEstacion, catEstacion)

                page = requests.get(url)
                soup = BeautifulSoup(page.content, 'html.parser')

                results = soup.find(id='dataTable')
                df_stations = pd.read_html(str(results))[0]
                df_stations = df_stations.loc[df_stations.index >= 2]

                if len(df_stations.iloc[:, 0].values) > 0:
                    dates = df_stations.iloc[:, 0].values
                    values_06hrs = df_stations.iloc[:, 1].values
                    values_10hrs = df_stations.iloc[:, 2].values
                    values_14hrs = df_stations.iloc[:, 3].values
                    values_18hrs = df_stations.iloc[:, 4].values

                    for i in range(0, len(dates)):
                        fechas.append(dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 6, 0, 0))
                        fechas.append(
                            dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 10, 0, 0))
                        fechas.append(
                            dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 14, 0, 0))
                        fechas.append(
                            dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 18, 0, 0))
                        if values_06hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_06hrs[i]) >= 200:
                            values.append(float(values_06hrs[i]) / 200)
                        else:
                            values.append(float(values_06hrs[i]))
                        if values_10hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_10hrs[i]) >= 200:
                            values.append(float(values_10hrs[i]) / 200)
                        else:
                            values.append(float(values_10hrs[i]))
                        if values_14hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_14hrs[i]) >= 200:
                            values.append(float(values_14hrs[i]) / 200)
                        else:
                            values.append(float(values_14hrs[i]))
                        if values_18hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_18hrs[i]) >= 200:
                            values.append(float(values_18hrs[i]) / 200)
                        else:
                            values.append(float(values_18hrs[i]))

        elif statusEstacion == "REAL":

            fechas = []
            values = []

            for t in time_array:

                anyo = t.year
                mes = t.month

                if mes < 10:
                    MM = '0' + str(mes)

                else:
                    MM = str(mes)

                YYYY = str(anyo)

                url = 'https://www.senamhi.gob.pe/mapas/mapa-estaciones-2/_dato_esta_tipo02.php?estaciones={0}&CBOFiltro={1}{2}&t_e=H&estado={3}&cod_old={4}&cate_esta={5}&alt=101'.format(
                    codEstacion, YYYY, MM, statusEstacion, oldCodEstacion, catEstacion)
                page = requests.get(url)
                soup = BeautifulSoup(page.content, 'html.parser')

                results = soup.find(id='dataTable')
                df_stations = pd.read_html(str(results))[0]
                df_stations = df_stations.loc[df_stations.index >= 2]

                if len(df_stations.iloc[:, 0].values) > 0:
                    dates = df_stations.iloc[:, 0].values
                    values_06hrs = df_stations.iloc[:, 1].values
                    values_10hrs = df_stations.iloc[:, 2].values
                    values_14hrs = df_stations.iloc[:, 3].values
                    values_18hrs = df_stations.iloc[:, 4].values

                    for i in range(0, len(dates)):
                        fechas.append(dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 6, 0, 0))
                        fechas.append(
                            dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 10, 0, 0))
                        fechas.append(
                            dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 14, 0, 0))
                        fechas.append(
                            dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), 18, 0, 0))
                        if values_06hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_06hrs[i]) >= 200:
                            values.append(float(values_06hrs[i]) / 200)
                        else:
                            values.append(float(values_06hrs[i]))
                        if values_10hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_10hrs[i]) >= 200:
                            values.append(float(values_10hrs[i]) / 200)
                        else:
                            values.append(float(values_10hrs[i]))
                        if values_14hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_14hrs[i]) >= 200:
                            values.append(float(values_14hrs[i]) / 200)
                        else:
                            values.append(float(values_14hrs[i]))
                        if values_18hrs[i] == 'S/D':
                            values.append(np.nan)
                        elif float(values_18hrs[i]) >= 200:
                            values.append(float(values_18hrs[i]) / 200)
                        else:
                            values.append(float(values_18hrs[i]))

        elif statusEstacion == "AUTOMATICA":

            fechas = []
            values = []
            lluvia = []

            for t in time_array:

                anyo = t.year
                mes = t.month

                if mes < 10:
                    MM = '0' + str(mes)
                else:
                    MM = str(mes)

                YYYY = str(anyo)

                url = 'https://www.senamhi.gob.pe/mapas/mapa-estaciones-2/_dato_esta_tipo02.php?estaciones={0}&CBOFiltro={1}{2}&t_e=H&estado={3}&cod_old={4}&cate_esta={5}&alt=280'.format(
                    codEstacion, YYYY, MM, statusEstacion, oldCodEstacion, catEstacion)
                page = requests.get(url)
                soup = BeautifulSoup(page.content, 'html.parser')

                results = soup.find(id='dataTable')
                df_stations = pd.read_html(str(results))[0]
                df_stations = df_stations.loc[df_stations.index >= 1]

                if len(df_stations.iloc[:, 0].values) > 0:
                    dates = df_stations.iloc[:, 0].values
                    horas = df_stations.iloc[:, 1].values
                    niveles = df_stations.iloc[:, 2].values
                    try:
                        precipitacion = df_stations.iloc[:, 3].values
                    except IndexError:
                        print('No hay datos de lluvia en esta estación')

                    for i in range(0, len(dates)):
                        fechas.append(
                            dt.datetime(int(dates[i][0:4]), int(dates[i][5:7]), int(dates[i][8:10]), int(horas[i][0:2]),
                                        int(horas[i][3:5])))
                        if niveles[i] == 'S/D':
                            values.append(np.nan)
                        elif float(niveles[i]) >= 100:
                            values.append(float(niveles[i]) / 100)
                        else:
                            values.append(float(niveles[i]))
                        try:
                            if precipitacion[i] == 'S/D':
                                lluvia.append(np.nan)
                            else:
                                lluvia.append(float(precipitacion[i]))
                        except IndexError:
                            print('No hay datos de lluvia en esta estación')

        datesObservedWaterLevel = fechas
        observedWaterLevel = values

        pairs = [list(a) for a in zip(datesObservedWaterLevel, observedWaterLevel)]
        water_level_df = pd.DataFrame(pairs, columns=['Datetime', 'Water Level (m)'])

        water_level_df.set_index('Datetime', inplace=True)
        water_level_df.dropna(inplace=True)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename=observed_water_level_{0}_{1}.csv'.format(
            codEstacion, nomEstacion)

        water_level_df.to_csv(encoding='utf-8', header=True, path_or_buf=response)

        return response

    except Exception as e:
        print(str(e))
        return JsonResponse({'error': 'An unknown error occurred while retrieving the Water Level Data.'})
