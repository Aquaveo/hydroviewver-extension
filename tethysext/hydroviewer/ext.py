from tethys_sdk.base import TethysExtensionBase


class Hydroviewer(TethysExtensionBase):
    """
    Tethys extension class for Hydroviewer.
    """

    name = 'Hydroviewer'
    package = 'hydroviewer'
    root_url = 'hydroviewer'
    description = 'This is a extension to help to the development of different hydroviewer apps.'