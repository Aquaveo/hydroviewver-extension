from django.shortcuts import render
from tethys_sdk.gizmos import TextInput, SelectInput

from tethys_apps.utilities import get_active_app

import os
import json

class HIWAT:
    def home(self,request):
        app = get_active_app(request, get_class=True)

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
            "base_name": 'hydroviewer',
            "model_input": model_input,
            "watershed_select": watershed_select,
            "zoom_info": zoom_info
        }

        return render(request, 'hydroviewer/hiwat.html', context)


