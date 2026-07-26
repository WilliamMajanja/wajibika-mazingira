#!/usr/bin/env python3
"""
GPIO Sensor Setup Script for Wajibika Mazingira Project

This script sets up and configures GPIO sensors for the Wajibika Mazingira
environmental monitoring project using Raspberry Pi 5.
"""

import sys
import time
import argparse
import logging
from typing import List

from sensor_config import (
    SensorConfig, SystemConfig,
    get_default_sensor_configs, get_system_config_from_env
)
from gpio_sensor_controller import get_controller

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('gpio_sensor_setup.log')
    ]
)

logger = logging.getLogger(__name__)

def print_banner():
    """Print the script banner"""
    print("=" * 80)
    print("Wajibika Mazingira - GPIO Sensor Setup Script")
    print("=" * 80)
    print("This script sets up and configures GPIO sensors for the Wajibika")
    print("Mazingira environmental monitoring project using Raspberry Pi 5.")
    print("=" * 80)

def print_usage():
    """Print usage information"""
    print("\nUsage:")
    print("  python gpio_sensor_setup.py [options]")
    print("\nOptions:")
    print("  --help, -h                    Show this help message")
    print("  --config-file FILE           Path to configuration file")
    print("  --setup-sensors              Setup sensors (default)")
    print("  --list-sensors               List configured sensors")
    print("  --start-monitoring           Start monitoring")
    print("  --stop-monitoring            Stop monitoring")
    print("  --status                     Show system status")
    print("  --save-data FILE             Save sensor data to file")
    print("  --load-data FILE             Load sensor data from file")
    print("  --cleanup                    Cleanup and exit")
    print("\nEnvironment Variables:")
    print("  GPIO_SYSTEM_ID              System ID (default: wajibika_gpio_sensors)")
    print("  GPIO_STATIC_IP              Static IP address (default: empty)")
    print("  GPIO_HOSTNAME               Hostname (default: wajibika-gpio)")
    print("  GPIO_PORT                   Port number (default: 8080)")
    print("  GPIO_DATA_RETENTION_DAYS    Data retention days (default: 30)")
    print("  GPIO_BACKUP_ENABLED         Enable backup (default: true)")
    print("  GPIO_ALERT_ENABLED          Enable alerts (default: true)")
    print("  GPIO_CALIBRATION_ENABLED    Enable calibration (default: true)")
    print("  GPIO_LOG_LEVEL              Log level (default: INFO)")

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="GPIO Sensor Setup Script for Wajibika Mazingira Project",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        "--config-file",
        help="Path to configuration file"
    )
    
    parser.add_argument(
        "--setup-sensors",
        action="store_true",
        default=True,
        help="Setup sensors (default)"
    )
    
    parser.add_argument(
        "--list-sensors",
        action="store_true",
        help="List configured sensors"
    )
    
    parser.add_argument(
        "--start-monitoring",
        action="store_true",
        help="Start monitoring"
    )
    
    parser.add_argument(
        "--stop-monitoring",
        action="store_true",
        help="Stop monitoring"
    )
    
    parser.add_argument(
        "--status",
        action="store_true",
        help="Show system status"
    )
    
    parser.add_argument(
        "--save-data",
        help="Save sensor data to file"
    )
    
    parser.add_argument(
        "--load-data",
        help="Load sensor data from file"
    )
    
    parser.add_argument(
        "--cleanup",
        action="store_true",
        help="Cleanup and exit"
    )
    
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )
    
    return parser.parse_args()

def load_config_from_file(file_path: str) -> SystemConfig:
    """Load configuration from file"""
    try:
        import json
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Load system config
        system_config = SystemConfig.from_dict(data.get("system_config", {}))
        
        # Load sensor configs
        sensor_configs = []
        for sensor_data in data.get("sensor_configs", []):
            sensor_configs.append(SensorConfig.from_dict(sensor_data))
        
        return system_config, sensor_configs
        
    except Exception as e:
        logger.error(f"Error loading configuration from {file_path}: {str(e)}")
        raise

def save_config_to_file(system_config: SystemConfig, sensor_configs: List[SensorConfig], file_path: str):
    """Save configuration to file"""
    try:
        import json
        data = {
            "system_config": system_config.to_dict(),
            "sensor_configs": [config.to_dict() for config in sensor_configs]
        }
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Configuration saved to {file_path}")
        
    except Exception as e:
        logger.error(f"Error saving configuration to {file_path}: {str(e)}")
        raise

def setup_sensors_with_config(system_config: SystemConfig, sensor_configs: List[SensorConfig]):
    """Setup sensors with configuration"""
    logger.info("Setting up GPIO sensors...")
    
    # Get the controller
    controller = get_controller()
    
    # Clear existing sensors
    for sensor_id in list(controller.sensors.keys()):
        del controller.sensors[sensor_id]
    
    # Add sensors from configuration
    for config in sensor_configs:
        try:
            controller.add_sensor(config)
            logger.info(f"Added sensor: {config.name} (ID: {config.id})")
        except Exception as e:
            logger.error(f"Error adding sensor {config.id}: {str(e)}")
    
    # Start monitoring
    controller.start_monitoring()
    
    logger.info(f"Setup completed. {len(controller.sensors)} sensors configured.")

def list_sensors(controller):
    """List all configured sensors"""
    print("\nConfigured Sensors:")
    print("-" * 80)
    
    for sensor_id, sensor in controller.sensors.items():
        status = sensor.get_status()
        print(f"ID: {status['id']}")
        print(f"  Name: {status['name']}")
        print(f"  Type: {status['type']}")
        print(f"  State: {status['state']}")
        print(f"  Last Reading: {status['last_reading']}")
        print(f"  Last Value: {status['last_value']}")
        print(f"  Error Count: {status['error_count']}")
        print(f"  Data Points: {status['data_points']}")
        print(f"  Alert Count: {status['alert_count']}")
        print("-" * 80)
    
    print(f"\nTotal Sensors: {len(controller.sensors)}")

def main():
    """Main function"""
    print_banner()
    
    # Parse command line arguments
    args = parse_arguments()
    
    # Update logging level if verbose
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        # Load configuration
        if args.config_file:
            system_config, sensor_configs = load_config_from_file(args.config_file)
            logger.info(f"Loaded configuration from {args.config_file}")
        else:
            # Use environment variables or defaults
            system_config = get_system_config_from_env()
            sensor_configs = get_default_sensor_configs()
            logger.info("Using default configuration")
        
        # Get the controller
        controller = get_controller()
        
        # Handle different commands
        if args.list_sensors:
            list_sensors(controller)
            return
        
        if args.start_monitoring:
            controller.start_monitoring()
            print("\nMonitoring started.")
            return
        
        if args.stop_monitoring:
            controller.stop_monitoring()
            print("\nMonitoring stopped.")
            return
        
        if args.status:
            status = controller.get_system_status()
            print("\nSystem Status:")
            print("-" * 80)
            for key, value in status.items():
                print(f"{key}: {value}")
            print("-" * 80)
            return
        
        if args.save_data:
            controller.save_data_to_file(args.save_data)
            print(f"\nData saved to {args.save_data}")
            return
        
        if args.load_data:
            controller.load_data_from_file(args.load_data)
            print(f"\nData loaded from {args.load_data}")
            return
        
        if args.cleanup:
            controller.cleanup()
            print("\nCleanup completed.")
            return
        
        # Default: setup sensors
        setup_sensors_with_config(system_config, sensor_configs)
        
        print("\nSetup completed successfully!")
        print("\nNext steps:")
        print("  - Use --list-sensors to view configured sensors")
        print("  - Use --start-monitoring to start monitoring")
        print("  - Use --status to check system status")
        print("  - Use --cleanup to cleanup and exit")
        
        # Keep the script running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nInterrupted by user. Cleaning up...")
            controller.cleanup()
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()