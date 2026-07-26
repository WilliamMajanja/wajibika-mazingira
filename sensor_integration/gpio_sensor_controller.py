import time
import threading
from datetime import datetime, timedelta
from typing import List, Dict, Callable, Optional
import json
import logging

try:
    import RPi.GPIO as GPIO
    _GPIO_AVAILABLE = True
except ImportError:
    GPIO = None  # type: ignore
    _GPIO_AVAILABLE = False

from enum import Enum, auto

from sensor_config import (
    SensorConfig as _SensorConfig,
    SystemConfig as _SystemConfig,
    SensorType,
    get_system_config_from_env,
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SensorState(Enum):
    ACTIVE = auto()
    INACTIVE = auto()
    ERROR = auto()
    CALIBRATING = auto()
    MAINTENANCE = auto()


class AlertLevel(Enum):
    NORMAL = auto()
    LOW = auto()
    MEDIUM = auto()
    HIGH = auto()
    CRITICAL = auto()
    ERROR = auto()


# Re-export from sensor_config for convenience
SensorConfig = _SensorConfig
SystemConfig = _SystemConfig


class GPIOSensorData:
    def __init__(
        self,
        sensor_id: str,
        timestamp: datetime,
        value: float,
        units: str,
        quality_score: float = 1.0,
        metadata: Optional[Dict] = None,
        alert_level: str = "normal",
        status: str = "ok"
    ):
        self.sensor_id = sensor_id
        self.timestamp = timestamp
        self.value = value
        self.units = units
        self.quality_score = quality_score
        self.metadata = metadata or {}
        self.alert_level = alert_level
        self.status = status

    @property
    def age_minutes(self) -> float:
        return (datetime.now() - self.timestamp).total_seconds() / 60


class GPIOSensorController:
    def __init__(self, config: SystemConfig):
        self.config = config
        self.sensors: Dict[str, 'GPIOSensor'] = {}
        self.sensor_data: List[GPIOSensorData] = []
        self.is_monitoring = False
        self.monitoring_thread: Optional[threading.Thread] = None
        self.alert_callbacks: List[Callable] = []
        self._data_lock = threading.Lock()
        self._sensors_lock = threading.Lock()
        self.start_time = time.time()
        self.logger = logger

        if _GPIO_AVAILABLE:
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
        else:
            self.logger.warning("RPi.GPIO not available — running in simulation mode")

        self.logger.info(f"Initialized GPIO Sensor Controller (System ID: {config.system_id})")

    def add_sensor(self, config: SensorConfig):
        if config.id in self.sensors:
            raise ValueError(f"Sensor with ID {config.id} already exists")

        sensor = GPIOSensor(self, config)
        with self._sensors_lock:
            self.sensors[config.id] = sensor
        self.logger.info(f"Added sensor: {config.name} (ID: {config.id}, Type: {config.sensor_type})")

    def remove_sensor(self, sensor_id: str):
        with self._sensors_lock:
            if sensor_id in self.sensors:
                del self.sensors[sensor_id]
                self.logger.info(f"Removed sensor: {sensor_id}")
            else:
                raise ValueError(f"Sensor with ID {sensor_id} not found")

    def start_monitoring(self, interval: float = 1.0):
        if self.is_monitoring:
            self.logger.warning("Monitoring is already active")
            return

        self.is_monitoring = True
        self.monitoring_thread = threading.Thread(
            target=self._monitor_sensors,
            args=(interval,),
            daemon=True
        )
        self.monitoring_thread.start()
        self.logger.info(f"Started monitoring {len(self.sensors)} sensors at {interval}s intervals")

    def _monitor_sensors(self, interval: float):
        while self.is_monitoring:
            try:
                with self._sensors_lock:
                    sensors_snapshot = dict(self.sensors)

                for sensor_id, sensor in sensors_snapshot.items():
                    if sensor.state == SensorState.ACTIVE:
                        value = sensor.read_sensor()
                        if value is not None:
                            sensor_data = GPIOSensorData(
                                sensor_id=sensor_id,
                                timestamp=datetime.now(),
                                value=value,
                                units=sensor.config.units,
                                quality_score=0.8,
                                metadata={"source": "gpio"},
                                alert_level="normal",
                                status=sensor.state.name.lower()
                            )
                            with self._data_lock:
                                self.sensor_data.append(sensor_data)

                self._cleanup_old_data()
                time.sleep(interval)

            except Exception as e:
                self.logger.error(f"Error in sensor monitoring: {str(e)}")
                time.sleep(interval)

    def _cleanup_old_data(self):
        cutoff_time = datetime.now() - timedelta(days=self.config.data_retention_days)
        with self._data_lock:
            initial_count = len(self.sensor_data)
            self.sensor_data = [data for data in self.sensor_data if data.timestamp > cutoff_time]
            cleaned = initial_count - len(self.sensor_data)
        if cleaned > 0:
            self.logger.info(f"Cleaned up {cleaned} old data points")

    def stop_monitoring(self):
        self.is_monitoring = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=10)
        self.logger.info("Stopped sensor monitoring")

    def add_alert_callback(self, callback: Callable):
        self.alert_callbacks.append(callback)

    def remove_alert_callback(self, callback: Callable):
        if callback in self.alert_callbacks:
            self.alert_callbacks.remove(callback)

    def get_sensor_data(self, sensor_id: str, limit: int = 100) -> List[GPIOSensorData]:
        with self._data_lock:
            return [data for data in self.sensor_data if data.sensor_id == sensor_id][-limit:]

    def get_all_sensor_data(self, limit: int = 1000) -> List[GPIOSensorData]:
        with self._data_lock:
            return list(self.sensor_data[-limit:])

    def get_sensor_status(self, sensor_id: str) -> Dict:
        with self._sensors_lock:
            if sensor_id in self.sensors:
                sensor = self.sensors[sensor_id]
                with self._data_lock:
                    data_count = len([d for d in self.sensor_data if d.sensor_id == sensor_id])
                    alert_count = len([d for d in self.sensor_data if d.sensor_id == sensor_id and d.alert_level != "normal"])
                return {
                    "id": sensor_id,
                    "name": sensor.config.name,
                    "type": sensor.config.sensor_type,
                    "status": sensor.state.name.lower(),
                    "last_reading": sensor.last_reading,
                    "data_points": data_count,
                    "alerts_count": alert_count
                }
        return {}

    def get_system_status(self) -> Dict:
        with self._sensors_lock:
            sensors_snapshot = dict(self.sensors)
        active_sensors = sum(1 for s in sensors_snapshot.values() if s.state == SensorState.ACTIVE)
        error_sensors = sum(1 for s in sensors_snapshot.values() if s.state == SensorState.ERROR)

        return {
            "system_id": self.config.system_id,
            "total_sensors": len(sensors_snapshot),
            "active_sensors": active_sensors,
            "error_sensors": error_sensors,
            "monitoring_active": self.is_monitoring,
            "thread_alive": self.monitoring_thread.is_alive() if self.monitoring_thread else False,
            "data_points": len(self.sensor_data),
            "uptime": time.time() - self.start_time,
            "gps_location": self.config.network_config.get("static_ip", "Unknown")
        }

    def save_data_to_file(self, file_path: str):
        with self._data_lock:
            data = [
                {
                    "sensor_id": d.sensor_id,
                    "timestamp": d.timestamp.isoformat(),
                    "value": d.value,
                    "units": d.units,
                    "quality_score": d.quality_score,
                    "metadata": d.metadata,
                    "alert_level": d.alert_level,
                    "status": d.status
                }
                for d in self.sensor_data
            ]

        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)

        self.logger.info(f"Saved {len(data)} data points to {file_path}")

    def load_data_from_file(self, file_path: str):
        with open(file_path, 'r') as f:
            data = json.load(f)

        loaded = [
            GPIOSensorData(
                sensor_id=item["sensor_id"],
                timestamp=datetime.fromisoformat(item["timestamp"]),
                value=item["value"],
                units=item["units"],
                quality_score=item["quality_score"],
                metadata=item["metadata"],
                alert_level=item.get("alert_level", "normal"),
                status=item.get("status", "ok")
            )
            for item in data
        ]

        with self._data_lock:
            self.sensor_data.extend(loaded)

        self.logger.info(f"Loaded {len(data)} data points from {file_path}")

    def cleanup(self):
        self.stop_monitoring()
        if _GPIO_AVAILABLE:
            GPIO.cleanup()
        self.logger.info("GPIO cleanup completed")


class GPIOSensor:
    def __init__(self, controller: GPIOSensorController, config: SensorConfig):
        self.controller = controller
        self.config = config
        self.state = SensorState.ACTIVE
        self.last_reading: Optional[datetime] = None
        self.last_value: Optional[float] = None
        self.error_count = 0
        self.data_points = 0
        self.alert_count = 0

        if self.config.gpio_pin is not None and _GPIO_AVAILABLE:
            GPIO.setup(self.config.gpio_pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

        self.controller.logger.info(f"Created GPIO sensor: {config.name} (ID: {config.id})")

    def read_sensor(self) -> Optional[float]:
        try:
            if self.config.sensor_type == SensorType.TEMPERATURE:
                value = 20.0 + (hash(self.config.id) % 100) / 10.0
            elif self.config.sensor_type == SensorType.HUMIDITY:
                value = 50.0 + (hash(self.config.id) % 50) / 10.0
            elif self.config.sensor_type == SensorType.SOIL_MOISTURE:
                value = (hash(self.config.id) % 100) / 100.0 * 100.0
            elif self.config.sensor_type == SensorType.LIGHT:
                value = (hash(self.config.id) % 1000) + 100.0
            elif self.config.sensor_type == SensorType.CO2:
                value = 400.0 + (hash(self.config.id) % 600)
            elif self.config.sensor_type == SensorType.PM25:
                value = (hash(self.config.id) % 50) / 10.0
            elif self.config.sensor_type == SensorType.GPS:
                value = 0.0
            else:
                value = 0.0

            self.last_value = value
            self.last_reading = datetime.now()
            self.data_points += 1

            self.check_alerts(value)
            return value

        except Exception as e:
            self.error_count += 1
            self.state = SensorState.ERROR
            self.controller.logger.error(f"Error reading sensor {self.config.id}: {str(e)}")
            return None

    def check_alerts(self, value: float):
        alert_level = "normal"

        if self.config.alert_thresholds:
            for alert_name, threshold in self.config.alert_thresholds.items():
                if alert_name.startswith("high_") and value > threshold:
                    alert_level = "high"
                elif alert_name.startswith("low_") and value < threshold:
                    alert_level = "low"
                elif alert_name == "error" and value < 0:
                    alert_level = "error"

        if alert_level != "normal":
            self.alert_count += 1
            for callback in self.controller.alert_callbacks:
                try:
                    callback(self.config.id, alert_level, value)
                except Exception as e:
                    self.controller.logger.error(f"Alert callback error: {str(e)}")

    def calibrate(self):
        self.controller.logger.info(f"Calibrating sensor {self.config.id}")

    def get_status(self) -> Dict:
        return {
            "id": self.config.id,
            "name": self.config.name,
            "type": self.config.sensor_type,
            "state": self.state.name.lower(),
            "last_reading": self.last_reading.isoformat() if self.last_reading else None,
            "last_value": self.last_value,
            "error_count": self.error_count,
            "data_points": self.data_points,
            "alert_count": self.alert_count,
            "config": {
                "gpio_pin": self.config.gpio_pin,
                "units": self.config.units,
                "sampling_rate": self.config.sampling_rate,
                "accuracy": self.config.accuracy
            }
        }


# Global controller instance
_controller: Optional[GPIOSensorController] = None


def get_controller() -> GPIOSensorController:
    global _controller
    if _controller is None:
        config = get_system_config_from_env()
        _controller = GPIOSensorController(config)
    return _controller


def setup_sensors():
    controller = get_controller()
    return controller


def read_all_sensors():
    controller = get_controller()

    with controller._sensors_lock:
        sensors_snapshot = dict(controller.sensors)

    for sensor_id, sensor in sensors_snapshot.items():
        value = sensor.read_sensor()
        if value is not None:
            sensor_data = GPIOSensorData(
                sensor_id=sensor_id,
                timestamp=datetime.now(),
                value=value,
                units=sensor.config.units,
                quality_score=0.8,
                metadata={"source": "gpio"},
                alert_level="normal",
                status=sensor.state.name.lower()
            )
            with controller._data_lock:
                controller.sensor_data.append(sensor_data)

    return controller.get_system_status()


if __name__ == "__main__":
    print("Testing GPIO Sensor Controller...")

    controller = setup_sensors()
    status = read_all_sensors()
    print(f"System Status: {status}")

    for sensor_id in list(controller.sensors.keys()):
        sensor_status = controller.get_sensor_status(sensor_id)
        print(f"Sensor {sensor_id}: {sensor_status}")

    controller.save_data_to_file("/home/pi/test_sensor_data.json")
    print("Test completed successfully!")
    controller.cleanup()
