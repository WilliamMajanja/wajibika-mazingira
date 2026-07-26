"""
GPIO Sensor Configuration for Wajibika Mazingira Project

This module provides configuration management for GPIO sensors used in the
Wajibika Mazingira environmental monitoring system.
"""

import os
from typing import Dict, List, Optional
from enum import Enum

class SensorType(Enum):
    """Sensor types for GPIO sensors"""
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    SOIL_MOISTURE = "soil_moisture"
    LIGHT = "light"
    CO2 = "co2"
    PM25 = "pm25"
    GPS = "gps"
    VOLTAGE = "voltage"
    CURRENT = "current"
    PRESSURE = "pressure"
    UV = "uv"
    NO2 = "no2"
    SO2 = "so2"
    O3 = "o3"
    WIND_SPEED = "wind_speed"
    WIND_DIRECTION = "wind_direction"
    RAINFALL = "rainfall"
    AIR_QUALITY = "air_quality"
    NOISE = "noise"
    RADIATION = "radiation"
    MOISTURE = "moisture"
    CONDUCTIVITY = "conductivity"
    SALINITY = "salinity"
    PH = "ph"
    ORP = "orp"
    REDOX = "redox"
    CHLORINE = "chlorine"
    AMMONIA = "ammonia"
    NITRATE = "nitrate"
    PHOSPHATE = "phosphate"
    CALCIUM = "calcium"
    MAGNESIUM = "magnesium"
    POTASSIUM = "potassium"
    SODIUM = "sodium"
    CALCIUM_CARBONATE = "calcium_carbonate"
    MAGNESIUM_CARBONATE = "magnesium_carbonate"
    SODIUM_CARBONATE = "sodium_carbonate"
    CALCIUM_OXIDE = "calcium_oxide"
    MAGNESIUM_OXIDE = "magnesium_oxide"
    SODIUM_OXIDE = "sodium_oxide"
    CALCIUM_HYDROXIDE = "calcium_hydroxide"
    MAGNESIUM_HYDROXIDE = "magnesium_hydroxide"
    SODIUM_HYDROXIDE = "sodium_hydroxide"
    CALCIUM_SULFATE = "calcium_sulfate"
    MAGNESIUM_SULFATE = "magnesium_sulfate"
    SODIUM_SULFATE = "sodium_sulfate"
    CALCIUM_CHLORIDE = "calcium_chloride"
    MAGNESIUM_CHLORIDE = "magnesium_chloride"
    SODIUM_CHLORIDE = "sodium_chloride"

class SensorConfig:
    """Configuration for a GPIO sensor"""
    
    def __init__(
        self,
        id: str,
        name: str,
        sensor_type: SensorType,
        gpio_pin: Optional[int] = None,
        units: str = "",
        sampling_rate: float = 1.0,
        accuracy: float = 0.95,
        alert_thresholds: Optional[Dict[str, float]] = None,
        description: str = "",
        location: str = "",
        metadata: Optional[Dict] = None
    ):
        self.id = id
        self.name = name
        """Sensor name"""
        
        self.sensor_type = sensor_type
        """Type of sensor"""
        
        self.gpio_pin = gpio_pin
        """GPIO pin number (None for non-GPIO sensors)"""
        
        self.units = units
        """Units of measurement"""
        
        self.sampling_rate = sampling_rate
        """Sampling rate in Hz"""
        
        self.accuracy = accuracy
        """Sensor accuracy (0.0-1.0)"""
        
        self.alert_thresholds = alert_thresholds or {}
        """Alert thresholds for the sensor"""
        
        self.description = description
        """Description of the sensor"""
        
        self.location = location
        """Location where the sensor is deployed"""
        
        self.metadata = metadata or {}
        """Additional metadata for the sensor"""
        
        # Validate GPIO pin for digital sensors
        if gpio_pin is not None and sensor_type in [
            SensorType.TEMPERATURE, SensorType.HUMIDITY, 
            SensorType.SOIL_MOISTURE, SensorType.LIGHT
        ]:
            if gpio_pin < 0 or gpio_pin > 27:
                raise ValueError(f"Invalid GPIO pin: {gpio_pin}. Must be between 0 and 27 for Raspberry Pi.")
    
    def to_dict(self) -> Dict:
        """Convert sensor config to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "sensor_type": self.sensor_type.value,
            "gpio_pin": self.gpio_pin,
            "units": self.units,
            "sampling_rate": self.sampling_rate,
            "accuracy": self.accuracy,
            "alert_thresholds": self.alert_thresholds,
            "description": self.description,
            "location": self.location,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'SensorConfig':
        """Create sensor config from dictionary"""
        return cls(
            id=data["id"],
            name=data["name"],
            sensor_type=SensorType(data["sensor_type"]),
            gpio_pin=data.get("gpio_pin"),
            units=data.get("units", ""),
            sampling_rate=data.get("sampling_rate", 1.0),
            accuracy=data.get("accuracy", 0.95),
            alert_thresholds=data.get("alert_thresholds", {}),
            description=data.get("description", ""),
            location=data.get("location", ""),
            metadata=data.get("metadata", {})
        )

class SystemConfig:
    """Configuration for the GPIO sensor system"""
    
    def __init__(
        self,
        system_id: str = "wajibika_gpio_sensors",
        network_config: Optional[Dict] = None,
        data_retention_days: int = 30,
        backup_enabled: bool = True,
        alert_enabled: bool = True,
        calibration_enabled: bool = True,
        log_level: str = "INFO"
    ):
        self.system_id = system_id
        """Unique identifier for the system"""
        
        self.network_config = network_config or {}
        """Network configuration (IP, hostname, etc.)"""
        
        self.data_retention_days = data_retention_days
        """Number of days to retain sensor data"""
        
        self.backup_enabled = backup_enabled
        """Whether to enable automatic backups"""
        
        self.alert_enabled = alert_enabled
        """Whether to enable alerts"""
        
        self.calibration_enabled = calibration_enabled
        """Whether to enable sensor calibration"""
        
        self.log_level = log_level
        """Logging level"""
    
    def to_dict(self) -> Dict:
        """Convert system config to dictionary"""
        return {
            "system_id": self.system_id,
            "network_config": self.network_config,
            "data_retention_days": self.data_retention_days,
            "backup_enabled": self.backup_enabled,
            "alert_enabled": self.alert_enabled,
            "calibration_enabled": self.calibration_enabled,
            "log_level": self.log_level
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'SystemConfig':
        """Create system config from dictionary"""
        return cls(
            system_id=data.get("system_id", "wajibika_gpio_sensors"),
            network_config=data.get("network_config", {}),
            data_retention_days=data.get("data_retention_days", 30),
            backup_enabled=data.get("backup_enabled", True),
            alert_enabled=data.get("alert_enabled", True),
            calibration_enabled=data.get("calibration_enabled", True),
            log_level=data.get("log_level", "INFO")
        )

# Default sensor configurations for Wajibika Mazingira project
def get_default_sensor_configs() -> List[SensorConfig]:
    """Get default sensor configurations for the project"""
    return [
        # Temperature sensor for greenhouse monitoring
        SensorConfig(
            id="temp_greenhouse_1",
            name="Greenhouse Temperature Sensor",
            sensor_type=SensorType.TEMPERATURE,
            gpio_pin=4,
            units="°C",
            sampling_rate=1.0,
            accuracy=0.95,
            alert_thresholds={
                "high_temp": 35.0,
                "low_temp": 10.0,
                "error": -100.0
            },
            description="Monitors temperature in greenhouse environment",
            location="Greenhouse Section 1",
            metadata={
                "project": "greenhouse_monitoring",
                "area": "section_1",
                "crop_type": "vegetables"
            }
        ),
        # Humidity sensor for greenhouse monitoring
        SensorConfig(
            id="hum_greenhouse_1",
            name="Greenhouse Humidity Sensor",
            sensor_type=SensorType.HUMIDITY,
            gpio_pin=5,
            units="%RH",
            sampling_rate=1.0,
            accuracy=0.95,
            alert_thresholds={
                "high_humidity": 85.0,
                "low_humidity": 20.0,
                "error": -100.0
            },
            description="Monitors humidity in greenhouse environment",
            location="Greenhouse Section 1",
            metadata={
                "project": "greenhouse_monitoring",
                "area": "section_1",
                "crop_type": "vegetables"
            }
        ),
        # Soil moisture sensor for agricultural monitoring
        SensorConfig(
            id="soil_moisture_field_1",
            name="Field Soil Moisture Sensor",
            sensor_type=SensorType.SOIL_MOISTURE,
            gpio_pin=6,
            units="%",
            sampling_rate=2.0,
            accuracy=0.90,
            alert_thresholds={
                "high_moisture": 80.0,
                "low_moisture": 20.0,
                "error": -100.0
            },
            description="Monitors soil moisture for agricultural irrigation",
            location="Field Section 1",
            metadata={
                "project": "precision_agriculture",
                "area": "field_1",
                "crop_type": "cereals"
            }
        ),
        # Light sensor for greenhouse monitoring
        SensorConfig(
            id="light_greenhouse_1",
            name="Greenhouse Light Sensor",
            sensor_type=SensorType.LIGHT,
            gpio_pin=7,
            units="lux",
            sampling_rate=1.0,
            accuracy=0.90,
            alert_thresholds={
                "high_light": 100000.0,
                "low_light": 100.0,
                "error": -1.0
            },
            description="Monitors light intensity in greenhouse",
            location="Greenhouse Section 1",
            metadata={
                "project": "greenhouse_monitoring",
                "area": "section_1",
                "crop_type": "vegetables"
            }
        ),
        # CO2 sensor for air quality monitoring
        SensorConfig(
            id="co2_greenhouse_1",
            name="Greenhouse CO2 Sensor",
            sensor_type=SensorType.CO2,
            gpio_pin=8,
            units="ppm",
            sampling_rate=1.0,
            accuracy=0.95,
            alert_thresholds={
                "high_co2": 2000.0,
                "low_co2": 200.0,
                "error": -100.0
            },
            description="Monitors CO2 levels in greenhouse for crop optimization",
            location="Greenhouse Section 1",
            metadata={
                "project": "greenhouse_monitoring",
                "area": "section_1",
                "crop_type": "vegetables"
            }
        ),
        # PM2.5 sensor for air quality monitoring
        SensorConfig(
            id="pm25_outdoor_1",
            name="Outdoor PM2.5 Sensor",
            sensor_type=SensorType.PM25,
            gpio_pin=9,
            units="µg/m³",
            sampling_rate=5.0,
            accuracy=0.85,
            alert_thresholds={
                "high_pm25": 35.0,
                "low_pm25": 0.0,
                "error": -100.0
            },
            description="Monitors particulate matter in outdoor air",
            location="Outdoor Area 1",
            metadata={
                "project": "air_quality_monitoring",
                "area": "outdoor_1",
                "monitoring_type": "environmental"
            }
        ),
        # GPS sensor for location tracking
        SensorConfig(
            id="gps_tracking_1",
            name="GPS Tracking Sensor",
            sensor_type=SensorType.GPS,
            gpio_pin=None,  # GPS uses serial communication
            units="coordinates",
            sampling_rate=10.0,
            accuracy=0.95,
            alert_thresholds={
                "error": -100.0
            },
            description="Tracks location of equipment and vehicles",
            location="Mobile Equipment",
            metadata={
                "project": "asset_tracking",
                "device_type": "gps_tracker",
                "battery_level": 100
            }
        ),
        # Voltage sensor for power monitoring
        SensorConfig(
            id="voltage_main_1",
            name="Main Power Voltage Sensor",
            sensor_type=SensorType.VOLTAGE,
            gpio_pin=10,
            units="V",
            sampling_rate=0.5,
            accuracy=0.90,
            alert_thresholds={
                "high_voltage": 260.0,
                "low_voltage": 180.0,
                "error": -100.0
            },
            description="Monitors main power supply voltage",
            location="Electrical Panel",
            metadata={
                "project": "power_monitoring",
                "system": "main_power",
                "phase": "three_phase"
            }
        ),
        # Current sensor for power monitoring
        SensorConfig(
            id="current_main_1",
            name="Main Power Current Sensor",
            sensor_type=SensorType.CURRENT,
            gpio_pin=11,
            units="A",
            sampling_rate=0.5,
            accuracy=0.90,
            alert_thresholds={
                "high_current": 20.0,
                "low_current": 0.0,
                "error": -100.0
            },
            description="Monitors main power supply current",
            location="Electrical Panel",
            metadata={
                "project": "power_monitoring",
                "system": "main_power",
                "phase": "three_phase"
            }
        ),
        # Pressure sensor for environmental monitoring
        SensorConfig(
            id="pressure_outdoor_1",
            name="Outdoor Barometric Pressure Sensor",
            sensor_type=SensorType.PRESSURE,
            gpio_pin=12,
            units="hPa",
            sampling_rate=1.0,
            accuracy=0.90,
            alert_thresholds={
                "high_pressure": 1050.0,
                "low_pressure": 950.0,
                "error": -100.0
            },
            description="Monitors atmospheric pressure",
            location="Outdoor Area 1",
            metadata={
                "project": "weather_monitoring",
                "area": "outdoor_1",
                "sensor_type": "barometric"
            }
        ),
        # UV sensor for environmental monitoring
        SensorConfig(
            id="uv_outdoor_1",
            name="Outdoor UV Sensor",
            sensor_type=SensorType.UV,
            gpio_pin=13,
            units="UV Index",
            sampling_rate=1.0,
            accuracy=0.85,
            alert_thresholds={
                "high_uv": 8.0,
                "low_uv": 0.0,
                "error": -100.0
            },
            description="Monitors UV radiation levels",
            location="Outdoor Area 1",
            metadata={
                "project": "environmental_monitoring",
                "area": "outdoor_1",
                "risk_level": "moderate"
            }
        ),
        # NO2 sensor for air quality monitoring
        SensorConfig(
            id="no2_outdoor_1",
            name="Outdoor NO2 Sensor",
            sensor_type=SensorType.NO2,
            gpio_pin=14,
            units="ppb",
            sampling_rate=5.0,
            accuracy=0.85,
            alert_thresholds={
                "high_no2": 100.0,
                "low_no2": 0.0,
                "error": -100.0
            },
            description="Monitors nitrogen dioxide levels in air",
            location="Outdoor Area 1",
            metadata={
                "project": "air_quality_monitoring",
                "area": "outdoor_1",
                "pollutant_type": "nitrogen_dioxide"
            }
        ),
        # SO2 sensor for air quality monitoring
        SensorConfig(
            id="so2_outdoor_1",
            name="Outdoor SO2 Sensor",
            sensor_type=SensorType.SO2,
            gpio_pin=15,
            units="ppb",
            sampling_rate=5.0,
            accuracy=0.85,
            alert_thresholds={
                "high_so2": 100.0,
                "low_so2": 0.0,
                "error": -100.0
            },
            description="Monitors sulfur dioxide levels in air",
            location="Outdoor Area 1",
            metadata={
                "project": "air_quality_monitoring",
                "area": "outdoor_1",
                "pollutant_type": "sulfur_dioxide"
            }
        ),
        # O3 sensor for air quality monitoring
        SensorConfig(
            id="o3_outdoor_1",
            name="Outdoor O3 Sensor",
            sensor_type=SensorType.O3,
            gpio_pin=16,
            units="ppb",
            sampling_rate=5.0,
            accuracy=0.85,
            alert_thresholds={
                "high_o3": 100.0,
                "low_o3": 0.0,
                "error": -100.0
            },
            description="Monitors ozone levels in air",
            location="Outdoor Area 1",
            metadata={
                "project": "air_quality_monitoring",
                "area": "outdoor_1",
                "pollutant_type": "ozone"
            }
        ),
        # Wind speed sensor for weather monitoring
        SensorConfig(
            id="wind_speed_outdoor_1",
            name="Outdoor Wind Speed Sensor",
            sensor_type=SensorType.WIND_SPEED,
            gpio_pin=17,
            units="km/h",
            sampling_rate=2.0,
            accuracy=0.85,
            alert_thresholds={
                "high_wind_speed": 50.0,
                "low_wind_speed": 0.0,
                "error": -100.0
            },
            description="Monitors wind speed for weather monitoring",
            location="Outdoor Area 1",
            metadata={
                "project": "weather_monitoring",
                "area": "outdoor_1",
                "sensor_type": "anemometer"
            }
        ),
        # Wind direction sensor for weather monitoring
        SensorConfig(
            id="wind_direction_outdoor_1",
            name="Outdoor Wind Direction Sensor",
            sensor_type=SensorType.WIND_DIRECTION,
            gpio_pin=18,
            units="degrees",
            sampling_rate=2.0,
            accuracy=0.85,
            alert_thresholds={
                "error": -100.0
            },
            description="Monitors wind direction for weather monitoring",
            location="Outdoor Area 1",
            metadata={
                "project": "weather_monitoring",
                "area": "outdoor_1",
                "sensor_type": "wind_vane"
            }
        ),
        # Rainfall sensor for weather monitoring
        SensorConfig(
            id="rainfall_outdoor_1",
            name="Outdoor Rainfall Sensor",
            sensor_type=SensorType.RAINFALL,
            gpio_pin=19,
            units="mm",
            sampling_rate=1.0,
            accuracy=0.85,
            alert_thresholds={
                "high_rainfall": 50.0,
                "low_rainfall": 0.0,
                "error": -100.0
            },
            description="Monitors rainfall for weather monitoring",
            location="Outdoor Area 1",
            metadata={
                "project": "weather_monitoring",
                "area": "outdoor_1",
                "sensor_type": "rain_gauge"
            }
        ),
    ]

# Environment variable-based configuration

def get_system_config_from_env() -> SystemConfig:
    """Get system configuration from environment variables"""
    return SystemConfig(
        system_id=os.getenv("GPIO_SYSTEM_ID", "wajibika_gpio_sensors"),
        network_config={
            "static_ip": os.getenv("GPIO_STATIC_IP", ""),
            "hostname": os.getenv("GPIO_HOSTNAME", "wajibika-gpio"),
            "port": int(os.getenv("GPIO_PORT", "8080")),
        },
        data_retention_days=int(os.getenv("GPIO_DATA_RETENTION_DAYS", "30")),
        backup_enabled=os.getenv("GPIO_BACKUP_ENABLED", "true").lower() == "true",
        alert_enabled=os.getenv("GPIO_ALERT_ENABLED", "true").lower() == "true",
        calibration_enabled=os.getenv("GPIO_CALIBRATION_ENABLED", "true").lower() == "true",
        log_level=os.getenv("GPIO_LOG_LEVEL", "INFO")
    )

# Default system configuration
def get_default_system_config() -> SystemConfig:
    """Get default system configuration"""
    return SystemConfig(
        system_id="wajibika_gpio_sensors",
        network_config={
            "static_ip": "",
            "hostname": "wajibika-gpio",
            "port": 8080,
        },
        data_retention_days=30,
        backup_enabled=True,
        alert_enabled=True,
        calibration_enabled=True,
        log_level="INFO"
    )