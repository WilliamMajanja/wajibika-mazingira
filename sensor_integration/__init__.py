"""
GPIO Sensor Integration for Wajibika Mazingira Project

This module provides GPIO sensor integration for the Wajibika Mazingira
environmental monitoring project using Raspberry Pi 5.

Usage:
    from sensor_integration import get_controller, SensorConfig, SensorType

    controller = get_controller()
    controller.add_sensor(sensor_config)
    controller.start_monitoring()
"""

__version__ = "1.0.0"
__author__ = "Wajibika Mazingira Team"
__email__ = "contact@wajibika.org"
__license__ = "MIT"

from .sensor_config import (
    SensorConfig,
    SystemConfig,
    SensorType,
    get_default_sensor_configs,
    get_default_system_config,
    get_system_config_from_env,
)

from .gpio_sensor_controller import (
    GPIOSensorController,
    GPIOSensor,
    GPIOSensorData,
    SensorState,
    AlertLevel,
    get_controller,
    setup_sensors,
    read_all_sensors,
)

__all__ = [
    "SensorConfig",
    "SystemConfig",
    "SensorType",
    "SensorState",
    "AlertLevel",
    "GPIOSensorController",
    "GPIOSensor",
    "GPIOSensorData",
    "get_controller",
    "setup_sensors",
    "read_all_sensors",
    "get_default_sensor_configs",
    "get_default_system_config",
    "get_system_config_from_env",
]
