
from tethys_apps.utilities import get_active_app
from django.http import JsonResponse
import os
import json
from osgeo import ogr
from osgeo import osr


class Utilities:
    app = get_active_app() 
    @staticmethod
    def _set_custom_setting(defaultModelName, defaultWSName):

        from tethys_apps.models import TethysApp
        db_app = TethysApp.objects.get(package=app.package)

        db_setting = db_app.custom_settings.get(name='default_model_type')
        db_setting.value = defaultModelName
        db_setting.save()

        db_setting = db_app.custom_settings.get(name='default_watershed_name')
        db_setting.value = defaultWSName
        db_setting.save()

    def setDefault(self,request):
        get_data = request.GET
        self.set_custom_setting(get_data.get('ws_name'), get_data.get('model_name'))
        return JsonResponse({'success': True})

    def shp_to_geojson(self,request):
        get_data = request.GET

        try:
            model = get_data['model']
            watershed = get_data['watershed']
            subbasin = get_data['subbasin']

            driver = ogr.GetDriverByName('ESRI Shapefile')
            if model == 'LIS-RAPID':
                reprojected_shp_path = os.path.join(
                    self.app.get_custom_setting('lis_path'),
                    '-'.join([watershed, subbasin]).replace(' ', '_'),
                    '-'.join([watershed, subbasin, 'drainage_line']).replace(' ', '_'),
                    '-'.join([watershed, subbasin, 'drainage_line', '3857.shp']).replace(' ', '_')
                )
            elif model == 'HIWAT-RAPID':
                reprojected_shp_path = os.path.join(
                    self.app.get_custom_setting('hiwat_path'),
                    '-'.join([watershed, subbasin]).replace(' ', '_'),
                    '-'.join([watershed, subbasin, 'drainage_line']).replace(' ', '_'),
                    '-'.join([watershed, subbasin, 'drainage_line', '3857.shp']).replace(' ', '_')
                )

            if not os.path.exists(reprojected_shp_path):

                raw_shp_path = reprojected_shp_path.replace('-3857', '')

                raw_shp_src = driver.Open(raw_shp_path)
                raw_shp = raw_shp_src.GetLayer()

                in_prj = raw_shp.GetSpatialRef()

                out_prj = osr.SpatialReference()

                out_prj.ImportFromWkt(
                    """
                    PROJCS["WGS 84 / Pseudo-Mercator",
                        GEOGCS["WGS 84",
                            DATUM["WGS_1984",
                                SPHEROID["WGS 84",6378137,298.257223563,
                                    AUTHORITY["EPSG","7030"]],
                                AUTHORITY["EPSG","6326"]],
                            PRIMEM["Greenwich",0,
                                AUTHORITY["EPSG","8901"]],
                            UNIT["degree",0.0174532925199433,
                                AUTHORITY["EPSG","9122"]],
                            AUTHORITY["EPSG","4326"]],
                        PROJECTION["Mercator_1SP"],
                        PARAMETER["central_meridian",0],
                        PARAMETER["scale_factor",1],
                        PARAMETER["false_easting",0],
                        PARAMETER["false_northing",0],
                        UNIT["metre",1,
                            AUTHORITY["EPSG","9001"]],
                        AXIS["X",EAST],
                        AXIS["Y",NORTH],
                        EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],
                        AUTHORITY["EPSG","3857"]]
                    """
                )

                coordTrans = osr.CoordinateTransformation(in_prj, out_prj)

                reprojected_shp_src = driver.CreateDataSource(reprojected_shp_path)
                reprojected_shp = reprojected_shp_src.CreateLayer('-'.join([watershed, subbasin,
                                                                            'drainage_line', '3857']).encode('utf-8'),
                                                                geom_type=ogr.wkbLineString)

                raw_shp_lyr_def = raw_shp.GetLayerDefn()
                for i in range(0, raw_shp_lyr_def.GetFieldCount()):
                    field_def = raw_shp_lyr_def.GetFieldDefn(i)
                    if field_def.name in ['COMID', 'watershed', 'subbasin']:
                        reprojected_shp.CreateField(field_def)

                # get the output layer's feature definition
                reprojected_shp_lyr_def = reprojected_shp.GetLayerDefn()

                # loop through the input features
                in_feature = raw_shp.GetNextFeature()
                while in_feature:
                    # get the input geometry
                    geom = in_feature.GetGeometryRef()
                    # reproject the geometry
                    geom.Transform(coordTrans)
                    # create a new feature
                    out_feature = ogr.Feature(reprojected_shp_lyr_def)
                    # set the geometry and attribute
                    out_feature.SetGeometry(geom)
                    out_feature.SetField('COMID', in_feature.GetField(in_feature.GetFieldIndex('COMID')))
                    # out_feature.SetField('watershed', in_feature.GetField(in_feature.GetFieldIndex('watershed')))
                    # out_feature.SetField('subbasin', in_feature.GetField(in_feature.GetFieldIndex('subbasin')))
                    # add the feature to the shapefile
                    reprojected_shp.CreateFeature(out_feature)
                    # dereference the features and get the next input feature
                    out_feature = None
                    in_feature = raw_shp.GetNextFeature()

                fc = {
                    'type': 'FeatureCollection',
                    'features': []
                }

                for feature in reprojected_shp:
                    fc['features'].append(feature.ExportToJson(as_object=True))

                with open(reprojected_shp_path.replace('.shp', '.json'), 'w') as f:
                    json.dump(fc, f)

                # Save and close the shapefiles
                raw_shp_src = None
                reprojected_shp_src = None

            shp_src = driver.Open(reprojected_shp_path)
            shp = shp_src.GetLayer()

            extent = list(shp.GetExtent())
            xmin, ymin, xmax, ymax = extent[0], extent[2], extent[1], extent[3]

            with open(reprojected_shp_path.replace('.shp', '.json'), 'r') as f:
                geojson_streams = json.load(f)

                geojson_layer = {
                    'source': 'GeoJSON',
                    'options': json.dumps(geojson_streams),
                    'legend_title': '-'.join([watershed, subbasin, 'drainage_line']),
                    'legend_extent': [xmin, ymin, xmax, ymax],
                    'legend_extent_projection': 'EPSG:3857',
                    'feature_selection': True
                }

                return JsonResponse(geojson_layer)

        except Exception as e:
            print(str(e))
            return JsonResponse({'error': 'No shapefile found.'})
