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