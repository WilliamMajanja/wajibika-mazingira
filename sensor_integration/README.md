# GPIO Sensor Integration for Wajibika Mazingira Project

## Overview

This module provides GPIO sensor integration for the Wajibika Mazingira environmental monitoring project using Raspberry Pi 5. The system enables real-time monitoring of environmental parameters through a comprehensive sensor management framework.

## Features

### Core Functionality
- **Multi-sensor support**: Temperature, humidity, soil moisture, light, CO2, PM2.5, GPS, and more
- **Real-time monitoring**: Continuous sensor data collection and processing
- **Alert management**: Configurable alerts for threshold breaches
- **Data persistence**: Local and cloud data storage
- **System monitoring**: Comprehensive system status reporting
- **Calibration support**: Sensor calibration and maintenance

### Hardware Integration
- **Raspberry Pi 5**: Primary processing unit
- **GPIO interface**: Direct GPIO pin control
- **Sensor support**: Wide range of environmental sensors
- **Power management**: Efficient power consumption and backup
- **Network connectivity**: WiFi and Ethernet support

### Software Architecture
- **Modular design**: Separate components for different functionalities
- **Event-driven**: Real-time event processing
- **Thread-safe**: Multi-threaded operation
- **Extensible**: Plugin architecture for custom sensors
- **Configurable**: Extensive configuration options

## Installation

### Prerequisites
- Python 3.7 or higher
- Raspberry Pi 5 with GPIO support
- Required Python packages

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Wajibika-Mazingira/Zanzibar.git
   cd wajibika-mazingira-main/sensor_integration
   ```

2. **Install Python packages**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   ```bash
   export GPIO_SYSTEM_ID=wajibika_gpio_sensors
   export GPIO_STATIC_IP=""
   export GPIO_HOSTNAME=wajibika-gpio
   export GPIO_PORT=8080
   export GPIO_DATA_RETENTION_DAYS=30
   export GPIO_BACKUP_ENABLED=true
   export GPIO_ALERT_ENABLED=true
   export GPIO_CALIBRATION_ENABLED=true
   export GPIO_LOG_LEVEL=INFO
   ```

4. **Run the setup script**:
   ```bash
   python gpio_sensor_setup.py --setup-sensors
   ```

## Usage

### Basic Commands

#### Setup Sensors
```bash
python gpio_sensor_setup.py --setup-sensors
```

#### List Sensors
```bash
python gpio_sensor_setup.py --list-sensors
```

#### Start Monitoring
```bash
python gpio_sensor_setup.py --start-monitoring
```

#### Stop Monitoring
```bash
python gpio_sensor_setup.py --stop-monitoring
```

#### Check System Status
```bash
python gpio_sensor_setup.py --status
```

#### Save Data
```bash
python gpio_sensor_setup.py --save-data data.json
```

#### Load Data
```bash
python gpio_sensor_setup.py --load-data data.json
```

#### Cleanup
```bash
python gpio_sensor_setup.py --cleanup
```

### Python API

#### Import the module
```python
from sensor_integration import GPIOSensorController, SensorConfig, SensorType, get_controller
```

#### Create a custom sensor
```python
from sensor_integration import SensorConfig, SensorType

# Create a custom sensor configuration
sensor_config = SensorConfig(
    id="custom_sensor_1",
    name="Custom Temperature Sensor",
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
    description="Custom temperature sensor",
    location="Custom Location"
)

# Add sensor to controller
controller = get_controller()
controller.add_sensor(sensor_config)
```

#### Read sensor data
```python
# Get sensor data for a specific sensor
sensor_data = controller.get_sensor_data("custom_sensor_1", limit=100)

# Get all sensor data
all_data = controller.get_all_sensor_data(limit=1000)

# Get sensor status
sensor_status = controller.get_sensor_status("custom_sensor_1")

# Get system status
system_status = controller.get_system_status()
```

#### Add alert callback
```python
def alert_callback(sensor_id, alert_level, value):
    print(f"Alert: Sensor {sensor_id} - {alert_level} - {value}")

controller.add_alert_callback(alert_callback)
```

#### Save and load data
```python
# Save data to file
controller.save_data_to_file("sensor_data.json")

# Load data from file
controller.load_data_from_file("sensor_data.json")
```

## Configuration

### System Configuration
The system configuration can be customized through environment variables or a configuration file.

#### Environment Variables
- `GPIO_SYSTEM_ID`: System ID (default: `wajibika_gpio_sensors`)
- `GPIO_STATIC_IP`: Static IP address (default: empty)
- `GPIO_HOSTNAME`: Hostname (default: `wajibika-gpio`)
- `GPIO_PORT`: Port number (default: 8080)
- `GPIO_DATA_RETENTION_DAYS`: Data retention days (default: 30)
- `GPIO_BACKUP_ENABLED`: Enable backup (default: true)
- `GPIO_ALERT_ENABLED`: Enable alerts (default: true)
- `GPIO_CALIBRATION_ENABLED`: Enable calibration (default: true)
- `GPIO_LOG_LEVEL`: Log level (default: INFO)

#### Configuration File
Create a `config.json` file with the following structure:
```json
{
  "system_config": {
    "system_id": "wajibika_gpio_sensors",
    "network_config": {
      "static_ip": "",
      "hostname": "wajibika-gpio",
      "port": 8080
    },
    "data_retention_days": 30,
    "backup_enabled": true,
    "alert_enabled": true,
    "calibration_enabled": true,
    "log_level": "INFO"
  },
  "sensor_configs": [
    {
      "id": "temp_greenhouse_1",
      "name": "Greenhouse Temperature Sensor",
      "sensor_type": "temperature",
      "gpio_pin": 4,
      "units": "°C",
      "sampling_rate": 1.0,
      "accuracy": 0.95,
      "alert_thresholds": {
        "high_temp": 35.0,
        "low_temp": 10.0,
        "error": -100.0
      },
      "description": "Monitors temperature in greenhouse environment",
      "location": "Greenhouse Section 1",
      "metadata": {
        "project": "greenhouse_monitoring",
        "area": "section_1",
        "crop_type": "vegetables"
      }
    }
  ]
}
```

### Sensor Configuration
Each sensor configuration includes:

#### Required Parameters
- `id`: Unique identifier for the sensor
- `name`: Human-readable name
- `sensor_type`: Type of sensor (see SensorType enum)
- `gpio_pin`: GPIO pin number (None for non-GPIO sensors)

#### Optional Parameters
- `units`: Units of measurement
- `sampling_rate`: Sampling rate in Hz
- `accuracy`: Sensor accuracy (0.0-1.0)
- `alert_thresholds`: Alert thresholds for the sensor
- `description`: Description of the sensor
- `location`: Location where the sensor is deployed
- `metadata`: Additional metadata for the sensor

### Sensor Types
The following sensor types are supported:

#### Environmental Sensors
- `temperature`: Temperature sensor
- `humidity`: Humidity sensor
- `soil_moisture`: Soil moisture sensor
- `light`: Light sensor
- `co2`: CO2 sensor
- `pm25`: PM2.5 sensor
- `uv`: UV sensor
- `pressure`: Barometric pressure sensor
- `wind_speed`: Wind speed sensor
- `wind_direction`: Wind direction sensor
- `rainfall`: Rainfall sensor

#### Air Quality Sensors
- `no2`: Nitrogen dioxide sensor
- `so2`: Sulfur dioxide sensor
- `o3`: Ozone sensor
- `air_quality`: General air quality sensor

#### Physical Sensors
- `voltage`: Voltage sensor
- `current`: Current sensor
- `gps`: GPS sensor
- `noise`: Noise sensor
- `radiation`: Radiation sensor
- `moisture`: Moisture sensor
- `conductivity`: Conductivity sensor
- `salinity`: Salinity sensor
- `ph`: pH sensor
- `orp`: ORP sensor
- `redox`: Redox sensor
- `chlorine`: Chlorine sensor
- `ammonia`: Ammonia sensor
- `nitrate`: Nitrate sensor
- `phosphate`: Phosphate sensor
- `calcium`: Calcium sensor
- `magnesium`: Magnesium sensor
- `potassium`: Potassium sensor
- `sodium`: Sodium sensor
- `calcium_carbonate`: Calcium carbonate sensor
- `magnesium_carbonate`: Magnesium carbonate sensor
- `sodium_carbonate`: Sodium carbonate sensor
- `calcium_oxide`: Calcium oxide sensor
- `magnesium_oxide`: Magnesium oxide sensor
- `sodium_oxide`: Sodium oxide sensor
- `calcium_hydroxide`: Calcium hydroxide sensor
- `magnesium_hydroxide`: Magnesium hydroxide sensor
- `sodium_hydroxide`: Sodium hydroxide sensor
- `calcium_sulfate`: Calcium sulfate sensor
- `magnesium_sulfate`: Magnesium sulfate sensor
- `sodium_sulfate`: Sodium sulfate sensor
- `calcium_chloride`: Calcium chloride sensor
- `magnesium_chloride`: Magnesium chloride sensor
- `sodium_chloride`: Sodium chloride sensor

## API Reference

### GPIOSensorController

#### Methods
- `add_sensor(config)`: Add a new GPIO sensor
- `remove_sensor(sensor_id)`: Remove a sensor
- `start_monitoring(interval)`: Start monitoring sensors
- `stop_monitoring()`: Stop monitoring sensors
- `get_sensor_data(sensor_id, limit)`: Get sensor data
- `get_all_sensor_data(limit)`: Get all sensor data
- `get_sensor_status(sensor_id)`: Get sensor status
- `get_system_status()`: Get system status
- `save_data_to_file(file_path)`: Save data to file
- `load_data_from_file(file_path)`: Load data from file
- `cleanup()`: Cleanup resources

#### Properties
- `sensors`: Dictionary of sensors
- `sensor_data`: List of sensor data
- `is_monitoring`: Whether monitoring is active
- `alert_callbacks`: List of alert callbacks

### GPIOSensor

#### Methods
- `read_sensor()`: Read sensor value
- `check_alerts(value)`: Check for alerts
- `calibrate()`: Calibrate sensor
- `get_status()`: Get sensor status

#### Properties
- `config`: Sensor configuration
- `state`: Sensor state
- `last_reading`: Last reading timestamp
- `last_value`: Last sensor value
- `error_count`: Number of errors
- `data_points`: Number of data points
- `alert_count`: Number of alerts

### GPIOSensorData

#### Properties
- `sensor_id`: Sensor identifier
- `timestamp`: Timestamp of reading
- `value`: Sensor value
- `units`: Units of measurement
- `quality_score`: Quality score
- `metadata`: Additional metadata
- `alert_level`: Alert level
- `status`: Sensor status

## Examples

### Basic Usage
```python
from sensor_integration import get_controller, SensorConfig, SensorType

# Get the controller
controller = get_controller()

# Add a sensor
sensor_config = SensorConfig(
    id="custom_sensor_1",
    name="Custom Temperature Sensor",
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
    description="Custom temperature sensor",
    location="Custom Location"
)

controller.add_sensor(sensor_config)

# Start monitoring
controller.start_monitoring()

# Read sensor data
sensor_data = controller.get_sensor_data("custom_sensor_1", limit=100)

# Get system status
system_status = controller.get_system_status()

# Save data
controller.save_data_to_file("sensor_data.json")

# Cleanup
controller.cleanup()
```

### Alert Handling
```python
def alert_callback(sensor_id, alert_level, value):
    print(f"Alert: Sensor {sensor_id} - {alert_level} - {value}")

controller.add_alert_callback(alert_callback)
```

### Configuration File
```python
import json
from sensor_integration import get_controller, SensorConfig, SensorType

# Load configuration from file
with open("config.json", "r") as f:
    config = json.load(f)

# Get system config
system_config = config["system_config"]

# Get sensor configs
sensor_configs = [SensorConfig.from_dict(c) for c in config["sensor_configs"]]

# Setup sensors
controller = get_controller()
for sensor_config in sensor_configs:
    controller.add_sensor(sensor_config)

controller.start_monitoring()
```

## Troubleshooting

### Common Issues

#### Sensor Not Detected
- Check GPIO pin connections
- Verify sensor power supply
- Ensure proper sensor configuration
- Check GPIO permissions

#### Monitoring Not Starting
- Check if sensors are added
- Verify GPIO permissions
- Check for errors in sensor configuration
- Ensure system is not already monitoring

#### Data Not Saving
- Check file permissions
- Ensure disk space is available
- Verify file path is correct
- Check for write permissions

#### Alert Not Triggering
- Check alert thresholds
- Verify sensor readings
- Check alert callback configuration
- Ensure alert system is enabled

### Debugging

#### Enable Debug Logging
```bash
export GPIO_LOG_LEVEL=DEBUG
python gpio_sensor_setup.py --setup-sensors
```

#### Check System Status
```bash
python gpio_sensor_setup.py --status
```

#### View Logs
```bash
tail -f gpio_sensor_setup.log
```

## Support

### Issues and Bugs
- Report issues on GitHub: https://github.com/Wajibika-Mazingira/Zanzibar/issues
- Include system information and logs
- Provide detailed steps to reproduce

### Questions and Discussions
- Join the community forum: https://forum.wajibika.org
- Ask questions in the Discord server: https://discord.gg/wajibika
- Discuss on GitHub Discussions: https://github.com/Wajibika-Mazingira/Zanzibar/discussions

### Documentation
- API documentation: https://docs.wajibika.org/sensor-integration
- User guides: https://docs.wajibika.org/user-guides
- Installation guides: https://docs.wajibika.org/installation

## License

This project is licensed under the MIT License. See the LICENSE file for more information.

## Acknowledgments

- Raspberry Pi Foundation for providing the hardware platform
- Python Software Foundation for providing the Python programming language
- Open source contributors for their valuable libraries and tools
- The Wajibika Mazingira community for their support and feedback

---

*This documentation is continuously updated. Please check for updates regularly.*
