from .ecmwf import Ecmf
# from tethysext.hydroviewer.controllers import ecmwf


def get_time_series(request):
    
    ecmwf_object = Ecmf()
    ecmwf_object.ecmwf_get_time_series(request)
    
    pass

