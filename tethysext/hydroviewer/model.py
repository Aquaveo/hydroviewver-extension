import datetime
from sqlalchemy import Column
from sqlalchemy.types import Integer, String, Numeric

from sqlalchemy.ext.declarative import declarative_base


HydroviewerExtensionBase = declarative_base()


class ReturnPeriods(HydroviewerExtensionBase):
    """
    SQLAlchemy interface for projects table
    """
    __tablename__ = 'return_periods'
    id = Column(Integer, primary_key=True)  # Record number.

    reach_id = Column(Integer)
    return_period_100 = Column(Numeric)
    return_period_50 = Column(Numeric)
    return_period_25 = Column(Numeric)
    return_period_10 = Column(Numeric)
    return_period_5 = Column(Numeric)
    return_period_2 = Column(Numeric)

    def __init__(self, reach_id, return_period_100,return_period_50,return_period_25,return_period_10,return_period_5,return_period_2):
        self.reach_id = reach_id
        self.return_period_100= return_period_100
        self.return_period_50= return_period_50
        self.return_period_25= return_period_25
        self.return_period_10= return_period_10
        self.return_period_5= return_period_5
        self.return_period_2= return_period_2

class HistoricalSimulation(HydroviewerExtensionBase):
    """
    SQLAlchemy interface for projects table
    """
    __tablename__ = 'historical_simulation'
    id = Column(Integer, primary_key=True)  # Record number.

    reach_id = Column(Integer)
    datetime = Column(String)
    stream_flow = Column(Numeric)
    def __init__(self, reach_id, datetime,stream_flow):
        self.reach_id = reach_id
        self.datetime= datetime
        self.stream_flow= stream_flow

class ForecastRecords(HydroviewerExtensionBase):
    """
    SQLAlchemy interface for projects table
    """
    __tablename__ = 'forecast_records'
    id = Column(Integer, primary_key=True)  # Record number.

    reach_id = Column(Integer)
    datetime = Column(String)
    stream_flow = Column(Numeric)

    def __init__(self, reach_id, datetime,stream_flow):
        self.reach_id = reach_id
        self.datetime= datetime
        self.stream_flow= stream_flow    