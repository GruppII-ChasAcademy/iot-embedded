# IoT GruppII Climate Monitor

The **IoT GruppII Climate Monitor** is an IoT-based project designed to measure and monitor environmental conditions.  
It combines a **temperature and humidity sensor** with an **ESP32 server** that can process and share data with other devices or cloud services.  
The system is lightweight, scalable, and can be simulated in **Wokwi** before being deployed to real hardware.

This repository contains the firmware for both the **sensor node** and the **ESP32 server**, written in **C++** and built using **PlatformIO**.

---

## Features
- **Real-Time Sensing** – Measures ambient temperature (°C) and humidity (%) using the DHT22 sensor.  
- **LCD Display** – Live readings shown on a 16x2 I2C LCD module.  
- **ESP32 Server** – Acts as a hub to receive and forward sensor data via Wi-Fi.  
- **Serial Debugging** – Outputs sensor values and server logs for developers.  
- **Wokwi Simulation** – Entire project can be tested virtually before deployment.  
- **Future Extensions** – Low-power design, MQTT integration, and cloud dashboards.  

---

## Hardware Requirements
| Component                  | Description                                 |
|-----------------------------|---------------------------------------------|
| Arduino UNO R4 WiFi / ESP32-S3 | Microcontroller boards used in this project |
| DHT22 Sensor               | Temperature & humidity measurement          |
| LCD 16x2 with I2C module   | Displays readings                           |
| Waveshare ESP32-S3-Zero    | Used as server for communication            |
| Breadboard + Jumper Wires  | Circuit prototyping                         |
| Power Supply               | USB or LiPo battery                         |

---

## Use Cases
- Local weather station for small-scale environments.  
- IoT learning prototype for embedded systems.  
- Gateway for collecting and forwarding sensor data to a backend or mobile app.  


## Developer Notes
- Developed and tested with **Wokwi simulator** → [wokwi.com](https://wokwi.com)  
- Built with **PlatformIO** and **Arduino framework**  
- Easily extendable with MQTT, cloud integrations, or custom dashboards.  

---
