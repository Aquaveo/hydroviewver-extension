from tethys_sdk.base import TethysExtensionBase
from tethys_sdk.base import TethysAppBase, url_map_maker


class Hydroviewer(TethysExtensionBase):
    """
    Tethys extension class for Hydroviewer.
    """

    name = 'Hydroviewer'
    package = 'hydroviewer'
    root_url = 'hydroviewer'
    description = 'This is a extension to help to the development of different hydroviewer apps.'


    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (

            UrlMap(
                name='ecmwf-get-time-series',
                url='hydroviewer/rest/ecmwf-get-time-series/',
                controller='hydroviewer.controllers.rest.get_time_series'
            ),
            
        )

        return url_maps