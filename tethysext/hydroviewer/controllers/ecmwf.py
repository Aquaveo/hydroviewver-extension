
import datetime as dt
import io
import json
import os
import httpx

import geoglows
import hydrostats
import numpy as np
import pandas as pd
import plotly.graph_objs as go
import requests
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from requests.auth import HTTPBasicAuth
from tethys_apps.utilities import get_active_app
from tethys_sdk.gizmos import *
from tethys_sdk.gizmos import Button, DatePicker, PlotlyView, SelectInput
from tethys_sdk.permissions import has_permission
from ..model import ForecastRecords, HistoricalSimulation, ReturnPeriods
import asyncio
from .utilities import Utilities
base_name = 'hydroviewer'

#cs = custom setting
class Ecmf:
    gizmo_template_name = 'hydroviewer/gizmo_ajax.html'
    
    cs_streams_layer= 'Streams_Layer_Name'
    cs_stations_layer= 'Stations_Layer_Name'
    cs_api_source = 'api_source'
    cs_reach_ids='reach_ids_path'
    cs_zoom_info='zoom_info'
    cs_workspace='workspace'
    cs_region='region'
    # cs_geojson_path='static_GeoJSON_path'
    cs_keywords='keywords'
    cs_default_watershed_name='default_watershed_name'
    cs_default_subbasin_name='default_subbasin_name'

    utilities_object = Utilities()
    # cd_default_model_type = 'default_model_type'
    # # parameterized constructor
    # def __init__(self, cs_streams_layer, cs_stations_layer,cs_api_source,cs_reach_ids,cs_zoom_info,cs_workspace,cs_region,cs_geojson_path,cs_keywords):
    #     self.cs_streams_layer = cs_streams_layer
    #     self.cs_stations_layer = cs_stations_layer
    #     self.cs_api_source = cs_api_source
    #     self.cs_reach_ids = cs_reach_ids
    #     self.cs_zoom_info = cs_zoom_info
    #     self.cs_workspace=cs_workspace
    #     self.cs_region=cs_region
    #     self.cs_region=cs_geojson_path
    #     self.cs_keywords= cs_keywords

    #getters and setters for custom settings

    @staticmethod
    def _create_rp(df_):
        war = {}

        list_coordinates = []
        for lat, lon in zip(df_['lat'].tolist() , df_['lon'].tolist()):
            list_coordinates.append([lat,lon])

        return list_coordinates

    @staticmethod
    def _template(name, x,y, color,visible, fill='toself'):
        return go.Scatter(
            name=name,
            x=x,
            y=y,
            legendgroup='returnperiods',
            fill=fill,
            visible=visible,
            line=dict(color=color, width=0))

    
    def ecmwf_get_time_series(self,request):
        # app_namespace = active_app.namespace
        active_app = get_active_app(request, get_class=True)
        SessionMaker = active_app.get_persistent_store_database("geoglows", as_sessionmaker=True)
        session = SessionMaker()
        
        get_data = request.GET
        try:
            comid = get_data['comid']

            '''Getting Forecast Stats'''
            if get_data['startdate'] != '':
                startdate = get_data['startdate']
                res = requests.get(
                    active_app.get_custom_setting(self.cs_api_source) + '/api/ForecastStats/?reach_id=' + comid + '&date=' + startdate + '&return_format=csv',
                    verify=False).content
            else:
                res = requests.get(
                    active_app.get_custom_setting(self.cs_api_source) + '/api/ForecastStats/?reach_id=' + comid + '&return_format=csv',
                    verify=False).content

            stats_df = pd.read_csv(io.StringIO(res.decode('utf-8')), index_col=0)
            stats_df.index = pd.to_datetime(stats_df.index)
            stats_df[stats_df < 0] = 0
            stats_df.index = stats_df.index.to_series().dt.strftime("%Y-%m-%d %H:%M:%S")
            stats_df.index = pd.to_datetime(stats_df.index)

            hydroviewer_figure = geoglows.plots.forecast_stats(stats=stats_df, titles={'Reach ID': comid})

            x_vals = (stats_df.index[0], stats_df.index[len(stats_df.index) - 1], stats_df.index[len(stats_df.index) - 1], stats_df.index[0])
            max_visible = max(stats_df.max())

            '''Getting Forecast Records'''
            records_df = self.utilities_object.cache_forecast_records(active_app,self.cs_api_source,comid,session)
            # forecast_records_query = session.query(ForecastRecords).filter(ForecastRecords.reach_id == comid)
            # session.commit()

            # if forecast_records_query.first() is not None:
            #     # print("we have records in db")
            #     # records_df = pd.DataFrame.from_records(forecast_records_query.all()
            #     #     , index='datetime'
            #     #     , columns=['datetim', 'streamflow'])
            #     # records_df = records_df.rename(columns={'stream_flow':'streamflow_m^3/s'})
            #     records_df = pd.read_sql(forecast_records_query.statement, forecast_records_query.session.bind, index_col='datetime')
            #     # print(records_df)
            #     records_df = records_df.rename(columns={'stream_flow':'streamflow_m^3/s'})
            #     # print(records_df)

            #     records_df = records_df.drop(columns=['reach_id', 'id'])
                
            #     # print(records_df)

            # else:
            #     # print("we dont have records in db")

            #     res = requests.get(
            #         active_app.get_custom_setting(self.cs_api_source) + '/api/ForecastRecords/?reach_id=' + comid + '&return_format=csv',
            #         verify=False).content

            #     records_df = pd.read_csv(io.StringIO(res.decode('utf-8')), index_col=0)
            #     records_df.index = pd.to_datetime(records_df.index)
            #     records_df[records_df < 0] = 0
            #     records_df.index = records_df.index.to_series().dt.strftime("%Y-%m-%d %H:%M:%S")
                
            #     new_records_df = records_df.assign(reach_id=comid)[['reach_id'] + records_df.columns.tolist()]
            #     # print(new_records_df)
            #     new_records_df = new_records_df.rename(columns={'streamflow_m^3/s': 'stream_flow'})
            #     new_records_df = new_records_df.reset_index()
            #     # print(new_records_df.to_dict(orient="records"))
            #     session.bulk_insert_mappings(ForecastRecords, new_records_df.to_dict(orient="records"))
            #     session.commit()
            records_df.index = pd.to_datetime(records_df.index)
            records_df = records_df.loc[records_df.index >= pd.to_datetime(stats_df.index[0] - dt.timedelta(days=8))]
            records_df = records_df.loc[records_df.index <= pd.to_datetime(stats_df.index[0] + dt.timedelta(days=2))]

            if len(records_df.index) > 0:
                hydroviewer_figure.add_trace(go.Scatter(
                    name='1st days forecasts',
                    x=records_df.index,
                    y=records_df.iloc[:, 0].values,
                    line=dict(
                        color='#FFA15A',
                    )
                ))

                x_vals = (records_df.index[0], stats_df.index[len(stats_df.index) - 1], stats_df.index[len(stats_df.index) - 1], records_df.index[0])
                max_visible = max(max(records_df.max()), max_visible)

            '''Getting Return Periods'''
            rperiods_df = self.utilities_object.cache_return_periods(active_app,self.cs_api_source,comid,session)
            # return_periods_query = session.query(ReturnPeriods).filter(ReturnPeriods.reach_id == comid)
            # session.commit()
            # if return_periods_query.first() is not None:
            #     # print("we have return periods in db")
            #     rperiods_df = pd.read_sql(return_periods_query.statement, return_periods_query.session.bind)
            #     # rperiods_df.set_index('reach_id')
            #     # print(rperiods_df)
            #     rperiods_df = rperiods_df.drop(columns=['reach_id', 'id'])
            #     # print(rperiods_df)
            # else:
            #     # print("we dont have return periods in db")

            #     res = requests.get(active_app.get_custom_setting(self.cs_api_source) + '/api/ReturnPeriods/?reach_id=' + comid + '&return_format=csv',
            #         verify=False).content
            #     rperiods_df = pd.read_csv(io.StringIO(res.decode('utf-8')), index_col=0)
            #     new_records_df = rperiods_df
            #     new_records_df = new_records_df.reset_index()
            #     new_records_df = new_records_df.rename(columns={'rivid': 'reach_id'})

            #     # print(new_records_df)
            #     # print(new_records_df.to_dict(orient="records"))
            #     session.bulk_insert_mappings(ReturnPeriods, new_records_df.to_dict(orient="records"))
            #     session.commit()

            r2 = int(rperiods_df.iloc[0]['return_period_2'])

            colors = {
                '2 Year': 'rgba(254, 240, 1, .4)',
                '5 Year': 'rgba(253, 154, 1, .4)',
                '10 Year': 'rgba(255, 56, 5, .4)',
                '20 Year': 'rgba(128, 0, 246, .4)',
                '25 Year': 'rgba(255, 0, 0, .4)',
                '50 Year': 'rgba(128, 0, 106, .4)',
                '100 Year': 'rgba(128, 0, 246, .4)',
            }

            if max_visible > r2:
                visible = True
                hydroviewer_figure.for_each_trace(
                    lambda trace: trace.update(visible=True) if trace.name == "Maximum & Minimum Flow" else (), )
            else:
                visible = 'legendonly'
                hydroviewer_figure.for_each_trace(
                    lambda trace: trace.update(visible=True) if trace.name == "Maximum & Minimum Flow" else (), )

            r5 = int(rperiods_df.iloc[0]['return_period_5'])
            r10 = int(rperiods_df.iloc[0]['return_period_10'])
            r25 = int(rperiods_df.iloc[0]['return_period_25'])
            r50 = int(rperiods_df.iloc[0]['return_period_50'])
            r100 = int(rperiods_df.iloc[0]['return_period_100'])

            hydroviewer_figure.add_trace(self._template('Return Periods',x_vals, (r100 * 0.05, r100 * 0.05, r100 * 0.05, r100 * 0.05), 'rgba(0,0,0,0)',visible, fill='none'))
            hydroviewer_figure.add_trace(self._template(f'2 Year: {r2}',x_vals, (r2, r2, r5, r5), colors['2 Year'],visible))
            hydroviewer_figure.add_trace(self._template(f'5 Year: {r5}',x_vals, (r5, r5, r10, r10), colors['5 Year'],visible))
            hydroviewer_figure.add_trace(self._template(f'10 Year: {r10}',x_vals, (r10, r10, r25, r25), colors['10 Year'],visible))
            hydroviewer_figure.add_trace(self._template(f'25 Year: {r25}',x_vals, (r25, r25, r50, r50), colors['25 Year'],visible))
            hydroviewer_figure.add_trace(self._template(f'50 Year: {r50}',x_vals, (r50, r50, r100, r100), colors['50 Year'],visible))
            hydroviewer_figure.add_trace(self._template(f'100 Year: {r100}',x_vals, (r100, r100, max(r100 + r100 * 0.05, max_visible), max(r100 + r100 * 0.05, max_visible)), colors['100 Year'],visible))

            hydroviewer_figure['layout']['xaxis'].update(autorange=True)

            # return JsonResponse({'plot_object': hydroviewer_figure})
            session.close()
            
            return hydroviewer_figure


            # chart_obj = PlotlyView(hydroviewer_figure)

            # context = {
            #     'gizmo_object': chart_obj,
            # }

            # return render(request, self.gizmo_template_name, context)

        except Exception as e:
            print(str(e))
            return JsonResponse({'error': 'No data found for the selected reach.'})
    
    
    def get_available_dates_watershed(self,request):
        app = get_active_app(request, get_class=True)
        api_base_endpoint = app.get_custom_setting(self.cs_api_source)
        # watershed = app.get_custom_setting(self.cs_default_watershed_name).split(' (')[0].replace(' ', '_').lower();
        watershed = app.get_custom_setting(self.cs_default_watershed_name)


        # print(api_base_endpoint,watershed,subbasin)
        res = requests.get(
            # api_base_endpoint + '/api/AvailableDates/?region=' + watershed + '-' + 'geoglows',
            api_base_endpoint + '/api/AvailableDates/?region=' + watershed ,
            verify=False)        
        data = res.json()
        print(data)
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
        return dates
        # return dates.reverse()
            
    def get_available_dates(self,request):
        get_data = request.GET
        active_app = get_active_app(request, get_class=True)

        watershed = get_data['watershed']
        subbasin = get_data['subbasin']
        comid = get_data['comid']
        res = requests.get(
            active_app.get_custom_setting(self.cs_api_source) + '/api/AvailableDates/?region=' + watershed + '-' + subbasin,
            verify=False)

        data = res.json()

        dates_array = (data.get('available_dates'))

        # print(dates_array)

        dates = []

        for date in dates_array:
            if len(date) == 10:
                date_mod = date + '000'
                date_f = dt.datetime.strptime(date_mod, '%Y%m%d.%H%M').strftime('%Y-%m-%d %H:%M')
            else:
                date_f = dt.datetime.strptime(date, '%Y%m%d.%H%M').strftime('%Y-%m-%d')
                date = date[:-3]
            dates.append([date_f, date, watershed, subbasin, comid])

        dates.append(['Select Date', dates[-1][1]])
        # print(dates)
        dates.reverse()
        # print(dates)

        return JsonResponse({
            "success": "Data analysis complete!",
            "available_dates": json.dumps(dates)
        })

    def get_historic_data(self,request):
        """""
        Returns ERA Interim hydrograph
        """""
        print("get_historic_data")

        get_data = request.GET
        active_app = get_active_app(request, get_class=True)
        SessionMaker = active_app.get_persistent_store_database("geoglows", as_sessionmaker=True)
        session = SessionMaker()
        try:
            # model = get_data['model']
            comid = get_data['comid']
            simulated_df = self.utilities_object.cache_historical_simulation(active_app,self.cs_api_source,comid,session)
            # historical_simulation_query = session.query(HistoricalSimulation).filter(HistoricalSimulation.reach_id == comid)
            # session.commit()

            # if historical_simulation_query.first() is not None:
            #     print("we have records in db for hs")
            #     simulated_df = pd.read_sql(historical_simulation_query.statement, historical_simulation_query.session.bind, index_col='datetime')
            #     # print(records_df)
            #     simulated_df = simulated_df.rename(columns={'stream_flow':'streamflow_m^3/s'})
            #     # print(records_df)

            #     simulated_df = simulated_df.drop(columns=['reach_id', 'id'])
                
            #     # print(records_df)

            # else:
            #     # print("we dont have records in db")
            #     era_res = requests.get(active_app.get_custom_setting(self.cs_api_source) + '/api/HistoricSimulation/?reach_id=' + comid + '&return_format=csv', verify=False).content

            #     simulated_df = pd.read_csv(io.StringIO(era_res.decode('utf-8')), index_col=0)
            #     simulated_df[simulated_df < 0] = 0
            #     simulated_df.to_json(os.path.join(active_app.get_app_workspace().path,f'historical_data/{comid}.json'))

                
            #     simulated_df.index = pd.to_datetime(simulated_df.index)
            #     simulated_df.index = simulated_df.index.to_series().dt.strftime("%Y-%m-%d")
            #     new_simulated_df = simulated_df.assign(reach_id=comid)[['reach_id'] + simulated_df.columns.tolist()]
            #     # print(new_records_df)
            #     new_simulated_df = new_simulated_df.rename(columns={'streamflow_m^3/s': 'stream_flow'})
            #     new_simulated_df = new_simulated_df.reset_index()
            #     # print(new_records_df.to_dict(orient="records"))
            #     session.bulk_insert_mappings(HistoricalSimulation, new_simulated_df.to_dict(orient="records"))
            #     session.commit()

            simulated_df.index = pd.to_datetime(simulated_df.index)


            # if not os.path.exists(os.path.join(active_app.get_app_workspace().path,f'historical_data/{comid}.json')):
            #     era_res = requests.get(active_app.get_custom_setting(self.cs_api_source) + '/api/HistoricSimulation/?reach_id=' + comid + '&return_format=csv', verify=False).content

            #     simulated_df = pd.read_csv(io.StringIO(era_res.decode('utf-8')), index_col=0)
            #     simulated_df[simulated_df < 0] = 0
            #     simulated_df.to_json(os.path.join(active_app.get_app_workspace().path,f'historical_data/{comid}.json'))

                
            #     simulated_df.index = pd.to_datetime(simulated_df.index)
            #     simulated_df.index = simulated_df.index.to_series().dt.strftime("%Y-%m-%d")
            #     simulated_df.index = pd.to_datetime(simulated_df.index)


            # else:
            #     simulated_df = pd.read_json(os.path.join(active_app.get_app_workspace().path,f'historical_data/{comid}.json'))
            #     simulated_df[simulated_df < 0] = 0
            #     simulated_df.index = pd.to_datetime(simulated_df.index)
            #     simulated_df.index = simulated_df.index.to_series().dt.strftime("%Y-%m-%d")
            #     simulated_df.index = pd.to_datetime(simulated_df.index)

            rperiods_df = self.utilities_object.cache_return_periods(active_app,self.cs_api_source,comid,session)

            # return_periods_query = session.query(ReturnPeriods).filter(ReturnPeriods.reach_id == comid)
            # session.commit()
            # if return_periods_query.first() is not None:
            #     # print("we have return periods in db")
            #     rperiods_df = pd.read_sql(return_periods_query.statement, return_periods_query.session.bind)
            #     # rperiods_df.set_index('reach_id')
            #     # print(rperiods_df)
            #     rperiods_df = rperiods_df.drop(columns=['reach_id', 'id'])
            #     # print(rperiods_df)
            # else:
            #     # print("we dont have return periods in db")

            #     res = requests.get(active_app.get_custom_setting(self.cs_api_source) + '/api/ReturnPeriods/?reach_id=' + comid + '&return_format=csv',
            #         verify=False).content
            #     rperiods_df = pd.read_csv(io.StringIO(res.decode('utf-8')), index_col=0)
            #     new_records_df = rperiods_df
            #     new_records_df = new_records_df.reset_index()
            #     new_records_df = new_records_df.rename(columns={'rivid': 'reach_id'})

            #     # print(new_records_df)
            #     # print(new_records_df.to_dict(orient="records"))
            #     session.bulk_insert_mappings(ReturnPeriods, new_records_df.to_dict(orient="records"))
            #     session.commit()


            hydroviewer_figure = geoglows.plots.historic_simulation(simulated_df, rperiods_df, titles={'Reach ID': comid})
            return hydroviewer_figure


        except Exception as e:
            print(str(e))
            return JsonResponse({'error': 'No historic data found for the selected reach.'})

    def get_flow_duration_curve(self,request):
        print("get_flow_duration_curve")
        get_data = request.GET
        active_app = get_active_app(request, get_class=True)
        SessionMaker = active_app.get_persistent_store_database("geoglows", as_sessionmaker=True)
        session = SessionMaker()
        try:
            comid = get_data['comid']
            simulated_df = self.utilities_object.cache_historical_simulation(active_app,self.cs_api_source,comid,session)

            # era_res = requests.get(active_app.get_custom_setting(self.cs_api_source) + '/api/HistoricSimulation/?reach_id=' + comid + '&return_format=csv', verify=False).content

            # simulated_df = pd.read_csv(io.StringIO(era_res.decode('utf-8')), index_col=0)
            # simulated_df[simulated_df < 0] = 0
            # simulated_df.index = pd.to_datetime(simulated_df.index)
            # simulated_df.index = simulated_df.index.to_series().dt.strftime("%Y-%m-%d")
            simulated_df.index = pd.to_datetime(simulated_df.index)

            hydroviewer_figure = geoglows.plots.flow_duration_curve(simulated_df, titles={'Reach ID': comid})
            # print(hydroviewer_figure)
            return hydroviewer_figure


        except Exception as e:
            print(str(e))
            return JsonResponse({'error': 'No historic data found for calculating flow duration curve.'})

    def get_daily_seasonal_streamflow(self,request):
        """
        Returns daily seasonal streamflow chart for unique river ID
        """
        get_data = request.GET
        active_app = get_active_app(request, get_class=True)
        SessionMaker = active_app.get_persistent_store_database("geoglows", as_sessionmaker=True)
        session = SessionMaker()

        try:

            comid = get_data['comid']
            simulated_df = self.utilities_object.cache_historical_simulation(active_app,self.cs_api_source,comid,session)

            # era_res = requests.get(
            #     active_app.get_custom_setting(self.cs_api_source) + '/api/HistoricSimulation/?reach_id=' + comid + '&return_format=csv',
            #     verify=False).content

            # simulated_df = pd.read_csv(io.StringIO(era_res.decode('utf-8')), index_col=0)
            # simulated_df[simulated_df < 0] = 0
            # simulated_df.index = pd.to_datetime(simulated_df.index)
            # simulated_df.index = simulated_df.index.to_series().dt.strftime("%Y-%m-%d")
            simulated_df.index = pd.to_datetime(simulated_df.index)

            dayavg_df = hydrostats.data.daily_average(simulated_df, rolling=True)

            hydroviewer_figure = geoglows.plots.daily_averages(dayavg_df, titles={'Reach ID': comid})
            return hydroviewer_figure
            # chart_obj = PlotlyView(hydroviewer_figure)

            # context = {
            #     'gizmo_object': chart_obj,
            # }

            return render(request, self.gizmo_template_name, context)

        except Exception as e:
            print(str(e))
            return {'error': 'No historic data found for calculating daily seasonality.'}

    def get_monthly_seasonal_streamflow(self,request):
        """
        Returns daily seasonal streamflow chart for unique river ID
        """
        get_data = request.GET
        active_app = get_active_app(request, get_class=True)
        SessionMaker = active_app.get_persistent_store_database("geoglows", as_sessionmaker=True)
        session = SessionMaker()

        try:
            comid = get_data['comid']
            simulated_df = self.utilities_object.cache_historical_simulation(active_app,self.cs_api_source,comid,session)

            # era_res = requests.get(
            #     active_app.get_custom_setting(self.cs_api_source) + '/api/HistoricSimulation/?reach_id=' + comid + '&return_format=csv',
            #     verify=False).content

            # simulated_df = pd.read_csv(io.StringIO(era_res.decode('utf-8')), index_col=0)
            # simulated_df[simulated_df < 0] = 0
            # simulated_df.index = pd.to_datetime(simulated_df.index)
            # simulated_df.index = simulated_df.index.to_series().dt.strftime("%Y-%m-%d")
            simulated_df.index = pd.to_datetime(simulated_df.index)

            monavg_df = hydrostats.data.monthly_average(simulated_df)

            hydroviewer_figure = geoglows.plots.monthly_averages(monavg_df, titles={'Reach ID': comid})
            return hydroviewer_figure
            # chart_obj = PlotlyView(hydroviewer_figure)

            # context = {
            #     'gizmo_object': chart_obj,
            # }

            # return render(request, self.gizmo_template_name, context)

        except Exception as e:
            print(str(e))
            return {'error': 'No historic data found for calculating monthly seasonality.'}

    def get_historic_data_csv(self,request):
        """""
        Returns ERA 5 data as csv
        """""

        get_data = request.GET
        active_app = get_active_app(request, get_class=True)


        try:
            # model = get_data['model']
            watershed = get_data['watershed_name']
            subbasin = get_data['subbasin_name']
            comid = get_data['reach_id']

            era_res = requests.get(
                active_app.get_custom_setting(self.cs_api_source) + '/api/HistoricSimulation/?reach_id=' + comid + '&return_format=csv',
                verify=False).content

            simulated_df = pd.read_csv(io.StringIO(era_res.decode('utf-8')), index_col=0)
            simulated_df[simulated_df < 0] = 0
            simulated_df.index = pd.to_datetime(simulated_df.index)
            simulated_df.index = simulated_df.index.to_series().dt.strftime("%Y-%m-%d")
            simulated_df.index = pd.to_datetime(simulated_df.index)

            response = HTTPResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename=historic_streamflow_{0}_{1}_{2}.csv'.format(watershed, subbasin, comid)

            simulated_df.to_csv(encoding='utf-8', header=True, path_or_buf=response)

            return response

        except Exception as e:
            print(str(e))
            return JsonResponse({'error': 'No historic data found.'})

    def get_forecast_data_csv(self,request):
        """""
        Returns Forecast data as csv
        """""

        get_data = request.GET
        active_app = get_active_app(request, get_class=True)


        try:
            # model = get_data['model']
            watershed = get_data['watershed_name']
            subbasin = get_data['subbasin_name']
            comid = get_data['reach_id']
            if get_data['startdate'] != '':
                startdate = get_data['startdate']
            else:
                startdate = 'most_recent'

            '''Getting Forecast Stats'''
            if get_data['startdate'] != '':
                startdate = get_data['startdate']
                res = requests.get(
                    active_app.get_custom_setting(
                        self.cs_api_source) + '/api/ForecastStats/?reach_id=' + comid + '&date=' + startdate + '&return_format=csv',
                    verify=False).content
            else:
                res = requests.get(
                    active_app.get_custom_setting(self.cs_api_source) + '/api/ForecastStats/?reach_id=' + comid + '&return_format=csv',
                    verify=False).content

            stats_df = pd.read_csv(io.StringIO(res.decode('utf-8')), index_col=0)
            stats_df.index = pd.to_datetime(stats_df.index)
            stats_df[stats_df < 0] = 0
            stats_df.index = stats_df.index.to_series().dt.strftime("%Y-%m-%d %H:%M:%S")
            stats_df.index = pd.to_datetime(stats_df.index)

            init_time = stats_df.index[0]
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename=streamflow_forecast_{0}_{1}_{2}_{3}.csv'.format(watershed, subbasin, comid, init_time)

            stats_df.to_csv(encoding='utf-8', header=True, path_or_buf=response)

            return response

        except Exception as e:
            print(str(e))
            return JsonResponse({'error': 'No forecast data found.'})

    def get_forecast_percent(self,request):

        # Check if its an ajax post request
        get_data = request.GET
        active_app = get_active_app(request, get_class=True)
        SessionMaker = active_app.get_persistent_store_database("geoglows", as_sessionmaker=True)
        session = SessionMaker()

        try:

            comid = request.GET.get('comid')

            '''Getting Forecast Stats'''
            if get_data['startdate'] != '':
                startdate = get_data['startdate']
                res = requests.get(
                    active_app.get_custom_setting(
                        self.cs_api_source) + '/api/ForecastStats/?reach_id=' + comid + '&date=' + startdate + '&return_format=csv',
                    verify=False).content

                ens = requests.get(
                    active_app.get_custom_setting(
                        self.cs_api_source) + '/api/ForecastEnsembles/?reach_id=' + comid + '&date=' + startdate + '&ensemble=all&return_format=csv',
                    verify=False).content

            else:
                res = requests.get(
                    active_app.get_custom_setting(self.cs_api_source) + '/api/ForecastStats/?reach_id=' + comid + '&return_format=csv',
                    verify=False).content

                ens = requests.get(
                    active_app.get_custom_setting(
                        self.cs_api_source) + '/api/ForecastEnsembles/?reach_id=' + comid + '&ensemble=all&return_format=csv',
                    verify=False).content

            stats_df = pd.read_csv(io.StringIO(res.decode('utf-8')), index_col=0)
            stats_df.index = pd.to_datetime(stats_df.index)
            stats_df[stats_df < 0] = 0
            stats_df.index = stats_df.index.to_series().dt.strftime("%Y-%m-%d %H:%M:%S")
            stats_df.index = pd.to_datetime(stats_df.index)

            ensemble_df = pd.read_csv(io.StringIO(ens.decode('utf-8')), index_col=0)
            ensemble_df.index = pd.to_datetime(ensemble_df.index)
            ensemble_df[ensemble_df < 0] = 0
            ensemble_df.index = ensemble_df.index.to_series().dt.strftime("%Y-%m-%d %H:%M:%S")
            ensemble_df.index = pd.to_datetime(ensemble_df.index)

            '''Getting Return Periods'''
            rperiods_df = self.utilities_object.cache_return_periods(active_app,self.cs_api_source,comid,session)

            # res = requests.get(
            #     active_app.get_custom_setting(self.cs_api_source) + '/api/ReturnPeriods/?reach_id=' + comid + '&return_format=csv',
            #     verify=False).content
            # rperiods_df = pd.read_csv(io.StringIO(res.decode('utf-8')), index_col=0)

            table = geoglows.plots.probabilities_table(stats_df, ensemble_df, rperiods_df)
            return table
            # return HttpResponse(table)

        except Exception:
            return {'error': 'No data found for the selected station.'}

    def get_warning_points(self,request):
        get_data = request.GET
        active_app = get_active_app(request, get_class=True)
        # watershed = active_app.get_custom_setting(self.cs_default_watershed_name).split(' (')[0].replace(' ', '_').lower();
        watershed = active_app.get_custom_setting(self.cs_default_watershed_name)

        # peru_id_path = os.path.join(app_workspace.path, 'peru_reachids.csv')
        reach_id_paths = active_app.get_custom_setting(self.cs_reach_ids)

        reach_pds = pd.read_csv(reach_id_paths)
        reach_ids_list = reach_pds['COMID'].tolist()
        return_obj = {}
        try:
            # watershed = get_data['watershed']
            # subbasin = get_data['subbasin']

            # res = requests.get(active_app.get_custom_setting(self.cs_api_source) + '/api/ForecastWarnings/?region=' + watershed + '-' + 'geoglows' + '&return_format=csv', verify=False).content
            res = requests.get(active_app.get_custom_setting(self.cs_api_source) + '/api/ForecastWarnings/?region=' + watershed + '&return_format=csv', verify=False).content

            res_df = pd.read_csv(io.StringIO(res.decode('utf-8')), index_col=0)
            cols = ['date_exceeds_return_period_2', 'date_exceeds_return_period_5', 'date_exceeds_return_period_10', 'date_exceeds_return_period_25', 'date_exceeds_return_period_50', 'date_exceeds_return_period_100']

            res_df["rp_all"] = res_df[cols].apply(lambda x: ','.join(x.replace(np.nan, '0')), axis=1)

            test_list = res_df["rp_all"].tolist()

            final_new_rp = []
            for term in test_list:
                new_rp = []
                terms = term.split(',')
                for te in terms:
                    if te is not '0':
                        # print('yeah')
                        new_rp.append(1)
                    else:
                        new_rp.append(0)
                final_new_rp.append(new_rp)

            res_df['rp_all2'] = final_new_rp

            res_df = res_df.reset_index()
            res_df = res_df[res_df['comid'].isin(reach_ids_list)]

            d = {'comid': res_df['comid'].tolist(), 'stream_order': res_df['stream_order'].tolist(), 'lat': res_df['stream_lat'].tolist(), 'lon': res_df['stream_lon'].tolist()}
            df_final = pd.DataFrame(data=d)

            df_final[['rp_2', 'rp_5', 'rp_10', 'rp_25', 'rp_50', 'rp_100']] = pd.DataFrame(res_df.rp_all2.tolist(), index=df_final.index)
            d2 = {'comid': res_df['comid'].tolist(), 'stream_order': res_df['stream_order'].tolist(), 'lat': res_df['stream_lat'].tolist(), 'lon': res_df['stream_lon'].tolist(), 'rp': df_final['rp_2']}
            d5 = {'comid': res_df['comid'].tolist(), 'stream_order': res_df['stream_order'].tolist(), 'lat': res_df['stream_lat'].tolist(), 'lon': res_df['stream_lon'].tolist(), 'rp': df_final['rp_5']}
            d10 = {'comid': res_df['comid'].tolist(), 'stream_order': res_df['stream_order'].tolist(), 'lat': res_df['stream_lat'].tolist(), 'lon': res_df['stream_lon'].tolist(), 'rp': df_final['rp_10']}
            d25 = {'comid': res_df['comid'].tolist(), 'stream_order': res_df['stream_order'].tolist(), 'lat': res_df['stream_lat'].tolist(), 'lon': res_df['stream_lon'].tolist(), 'rp': df_final['rp_25']}
            d50 = {'comid': res_df['comid'].tolist(), 'stream_order': res_df['stream_order'].tolist(), 'lat': res_df['stream_lat'].tolist(), 'lon': res_df['stream_lon'].tolist(), 'rp': df_final['rp_50']}
            d100 = {'comid': res_df['comid'].tolist(), 'stream_order': res_df['stream_order'].tolist(), 'lat': res_df['stream_lat'].tolist(), 'lon': res_df['stream_lon'].tolist(), 'rp': df_final['rp_100']}

            df_final_2 = pd.DataFrame(data=d2)
            df_final_2 = df_final_2[df_final_2['rp'] > 0]
            df_final_5 = pd.DataFrame(data=d5)
            df_final_5 = df_final_5[df_final_5['rp'] > 0]
            df_final_10 = pd.DataFrame(data=d10)
            df_final_10 = df_final_10[df_final_10['rp'] > 0]
            df_final_25 = pd.DataFrame(data=d25)
            df_final_25 = df_final_25[df_final_25['rp'] > 0]
            df_final_50 = pd.DataFrame(data=d50)
            df_final_50 = df_final_50[df_final_50['rp'] > 0]
            df_final_100 = pd.DataFrame(data=d100)
            df_final_100 = df_final_100[df_final_100['rp'] > 0]

            return_obj['success'] = "Data analysis complete!"
            return_obj['warning2'] = self._create_rp(df_final_2)
            return_obj['warning5'] = self._create_rp(df_final_5)
            return_obj['warning10'] = self._create_rp(df_final_10)
            return_obj['warning25'] = self._create_rp(df_final_25)
            return_obj['warning50'] = self._create_rp(df_final_50)
            return_obj['warning100'] = self._create_rp(df_final_100)

            return return_obj

        except Exception as e:
            print(str(e))
            return {'error': 'No data found for the selected reach.'}
        else:
            pass

    def get_start_custom_settings(self,request):

        # Can Set Default permissions : Only allowed for admin users
        app = get_active_app(request, get_class=True)


        # Check if we need to hide the WS options dropdown.


        # Retrieve a geoserver engine and geoserver credentials.
        geoserver_engine = app.get_spatial_dataset_service(
            name='main_geoserver', as_engine=True)


        my_geoserver = geoserver_engine.endpoint.replace('rest', '')
        # geos_username = geoserver_engine.username
        # geos_password = geoserver_engine.password
        # watershed_list = [['Select Watershed', '']]  # + watershed_list

        # res2 = requests.get(my_geoserver + '/rest/workspaces/' + app.get_custom_setting('workspace') +
        #                     '/featuretypes.json', auth=HTTPBasicAuth(geos_username, geos_password), verify=False)
        # print(app.get_custom_setting('keywords'))
        # for i in range(len(json.loads(res2.content)['featureTypes']['featureType'])):
        #     raw_feature = json.loads(res2.content)['featureTypes']['featureType'][i]['name']
        #     print("X",raw_feature)
        #     if 'drainage_line' in raw_feature and any(n in raw_feature for n in app.get_custom_setting('keywords').replace(' ', '').split(',')):
        #         feat_name = raw_feature.split('-')[0].replace('_', ' ').title() + ' (' + \
        #             raw_feature.split('-')[1].replace('_', ' ').title() + ')'
        #         print(("x"),feat_name)
                
        #         if feat_name not in str(watershed_list):
        #             watershed_list.append([feat_name, feat_name])

        # # Add the default WS if present and not already in the list
        # if init_ws_val and init_ws_val not in str(watershed_list):
        #     watershed_list.append([init_ws_val, init_ws_val])
        # print("list",watershed_list)

        # watershed_select = SelectInput(display_text='',
        #                             name='watershed',
        #                             options=watershed_list,
        #                             initial=[init_ws_val],
        #                             original=True,
        #                             classes=hiddenAttr,
        #                             attributes={'onchange': "javascript:view_watershed();"+hiddenAttr}
        #                             )

        # zoom_info = TextInput(display_text='',
        #                     initial=json.dumps(app.get_custom_setting(self.cs_zoom_info)),
        #                     name='zoom_info',
        #                     disabled=True)

        # Retrieve a geoserver engine and geoserver credentials.
        geoserver_engine = app.get_spatial_dataset_service(
            name='main_geoserver', as_engine=True)

        my_geoserver = geoserver_engine.endpoint.replace('rest', '')

        geoserver_base_url = my_geoserver
        geoserver_workspace = app.get_custom_setting(self.cs_workspace)
        region = app.get_custom_setting(self.cs_region)
        # print(type(geoserver_base_url),geoserver_workspace,region)
        # geoserver_endpoint = TextInput(display_text='',
        #                             initial=json.dumps([geoserver_base_url, geoserver_workspace, region]),
        #                             name='geoserver_endpoint',
        #                             disabled=True)


        # subasin = app.get_custom_setting(self.cs_default_watershed_name).split(' (')[1].replace(')', '').lower()


        # dates = self._get_available_dates(api_base_endpoint,watershed,subasin)

        # Date Picker Options
        # date_picker = DatePicker(name='datesSelect',
        #                         display_text='Date',
        #                         autoclose=True,
        #                         format='yyyy-mm-dd',
        #                         start_date=dates[-1][0],
        #                         end_date=dates[1][0],
        #                         start_view='month',
        #                         today_button=True,
        #                         initial='')

        # region_index = json.load(open(os.path.join(app.get_custom_setting(self.cs_geojson_path), 'index.json')))

        # regions = SelectInput(
        #     display_text='Zoom to a Region:',
        #     name='regions',
        #     multiple=False,
        #     original=True,
        #     options=[(region_index[opt]['name'], opt) for opt in region_index]
        # )
        print(app.get_custom_setting(self.cs_streams_layer))
        pre_context = {
            "base_name": base_name,
            "default_watershed_name": app.get_custom_setting(self.cs_default_watershed_name),
            # "default_subasin_name":subasin,
            "default_subasin_name":app.get_custom_setting(self.cs_default_subbasin_name),

            "geoserver_url": geoserver_base_url,
            "geoserver_workspace":geoserver_workspace,
            "geoserver_region": region,
            "streams_layer": app.get_custom_setting(self.cs_streams_layer),
            "stations_layer": app.get_custom_setting(self.cs_stations_layer),
            # "model_input": model_input,
            # "watershed_select": watershed_select,
            # "zoom_info": zoom_info,
            # "geoserver_endpoint": geoserver_endpoint,
            # "defaultUpdateButton": defaultUpdateButton,
            # "startdateobs": startdateobs,
            # "enddateobs": enddateobs,
            # "date_picker": date_picker,
            # "regions": regions,
            # "regions_json": json.dumps(region_index, ensure_ascii=False) ,
            # "path_geojson": app.get_custom_setting(self.cs_geojson_path),
        }
        #  "path_geojson" and regions should be taken out,also the date pickers should be done in the app not here, here also the json
        #   this is thought, so people can use the JS and not rely only in gizmos if they desire to do more customizations.
        
        # return render(request, '{0}/ecmwf.html'.format(base_name), context)
        return pre_context

    async def async_request(self,request):
        async_client = httpx.AsyncClient()

        tasks = [asyncio.create_task(self.forecast_async_wrapper(request,async_client))]
        # tasks = [asyncio.create_task(self.forecast_async_wrapper(request,async_client)),asyncio.create_task(self.historical_async_wrapper(request,async_client))]

        results = asyncio.gather(*tasks)
        

    async def forecast_async_wrapper(self,request,async_client):
        active_app = get_active_app(request, get_class=True)

        get_data = request.GET
        try:
            comid = get_data['comid']

            '''Getting Forecast Stats'''
            if get_data['startdate'] != '':
                startdate = get_data['startdate']
                response_await = await async_client.get(
                        url =  active_app.get_custom_setting(self.cs_api_source) + '/api/ForecastStats',
                        params = {
                            "reach_id": comid,
                            "date": startdate,
                            "return_format": 'csv',
                        }
                    )
            else:

                response_await = await async_client.get(
                        url =  active_app.get_custom_setting(self.cs_api_source) + '/api/ForecastStats',
                        params = {
                            "reach_id": comid,
                            "return_format": 'csv',
                        }
                    )
            stats_df = pd.read_csv(io.StringIO(response_await.text), index_col=0)
            stats_df.index = pd.to_datetime(stats_df.index)
            stats_df[stats_df < 0] = 0
            stats_df.index = stats_df.index.to_series().dt.strftime("%Y-%m-%d %H:%M:%S")
            stats_df.index = pd.to_datetime(stats_df.index)

            hydroviewer_figure = geoglows.plots.forecast_stats(stats=stats_df, titles={'Reach ID': comid})

            x_vals = (stats_df.index[0], stats_df.index[len(stats_df.index) - 1], stats_df.index[len(stats_df.index) - 1], stats_df.index[0])
            max_visible = max(stats_df.max())

            '''Getting Forecast Records'''
            res = requests.get(
                active_app.get_custom_setting(self.cs_api_source) + '/api/ForecastRecords/?reach_id=' + comid + '&return_format=csv',
                verify=False).content

            records_df = pd.read_csv(io.StringIO(res.decode('utf-8')), index_col=0)
            records_df.index = pd.to_datetime(records_df.index)
            records_df[records_df < 0] = 0
            records_df.index = records_df.index.to_series().dt.strftime("%Y-%m-%d %H:%M:%S")
            records_df.index = pd.to_datetime(records_df.index)

            records_df = records_df.loc[records_df.index >= pd.to_datetime(stats_df.index[0] - dt.timedelta(days=8))]
            records_df = records_df.loc[records_df.index <= pd.to_datetime(stats_df.index[0] + dt.timedelta(days=2))]

            if len(records_df.index) > 0:
                hydroviewer_figure.add_trace(go.Scatter(
                    name='1st days forecasts',
                    x=records_df.index,
                    y=records_df.iloc[:, 0].values,
                    line=dict(
                        color='#FFA15A',
                    )
                ))

                x_vals = (records_df.index[0], stats_df.index[len(stats_df.index) - 1], stats_df.index[len(stats_df.index) - 1], records_df.index[0])
                max_visible = max(max(records_df.max()), max_visible)

            '''Getting Return Periods'''
            res = requests.get(active_app.get_custom_setting(self.cs_api_source) + '/api/ReturnPeriods/?reach_id=' + comid + '&return_format=csv',
                verify=False).content
            rperiods_df = pd.read_csv(io.StringIO(res.decode('utf-8')), index_col=0)

            r2 = int(rperiods_df.iloc[0]['return_period_2'])

            colors = {
                '2 Year': 'rgba(254, 240, 1, .4)',
                '5 Year': 'rgba(253, 154, 1, .4)',
                '10 Year': 'rgba(255, 56, 5, .4)',
                '20 Year': 'rgba(128, 0, 246, .4)',
                '25 Year': 'rgba(255, 0, 0, .4)',
                '50 Year': 'rgba(128, 0, 106, .4)',
                '100 Year': 'rgba(128, 0, 246, .4)',
            }

            if max_visible > r2:
                visible = True
                hydroviewer_figure.for_each_trace(
                    lambda trace: trace.update(visible=True) if trace.name == "Maximum & Minimum Flow" else (), )
            else:
                visible = 'legendonly'
                hydroviewer_figure.for_each_trace(
                    lambda trace: trace.update(visible=True) if trace.name == "Maximum & Minimum Flow" else (), )

            r5 = int(rperiods_df.iloc[0]['return_period_5'])
            r10 = int(rperiods_df.iloc[0]['return_period_10'])
            r25 = int(rperiods_df.iloc[0]['return_period_25'])
            r50 = int(rperiods_df.iloc[0]['return_period_50'])
            r100 = int(rperiods_df.iloc[0]['return_period_100'])

            hydroviewer_figure.add_trace(self._template('Return Periods',x_vals, (r100 * 0.05, r100 * 0.05, r100 * 0.05, r100 * 0.05), 'rgba(0,0,0,0)',visible, fill='none'))
            hydroviewer_figure.add_trace(self._template(f'2 Year: {r2}',x_vals, (r2, r2, r5, r5), colors['2 Year'],visible))
            hydroviewer_figure.add_trace(self._template(f'5 Year: {r5}',x_vals, (r5, r5, r10, r10), colors['5 Year'],visible))
            hydroviewer_figure.add_trace(self._template(f'10 Year: {r10}',x_vals, (r10, r10, r25, r25), colors['10 Year'],visible))
            hydroviewer_figure.add_trace(self._template(f'25 Year: {r25}',x_vals, (r25, r25, r50, r50), colors['25 Year'],visible))
            hydroviewer_figure.add_trace(self._template(f'50 Year: {r50}',x_vals, (r50, r50, r100, r100), colors['50 Year'],visible))
            hydroviewer_figure.add_trace(self._template(f'100 Year: {r100}',x_vals, (r100, r100, max(r100 + r100 * 0.05, max_visible), max(r100 + r100 * 0.05, max_visible)), colors['100 Year'],visible))

            hydroviewer_figure['layout']['xaxis'].update(autorange=True)

            # return JsonResponse({'plot_object': hydroviewer_figure})
            return hydroviewer_figure


            # chart_obj = PlotlyView(hydroviewer_figure)

            # context = {
            #     'gizmo_object': chart_obj,
            # }

            # return render(request, self.gizmo_template_name, context)

        except Exception as e:
            print(str(e))
            return JsonResponse({'error': 'No data found for the selected reach.'})

    async def historical_async_wrapper(self,request):
        return self.get_historic_data(request)


