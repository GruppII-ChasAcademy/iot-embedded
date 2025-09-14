# ESP32 BLE Server Project

This project demonstrates how to use the **ESP32** as a **Bluetooth Low Energy (BLE) server**.  
The ESP32 is configured to advertise itself and provide a custom **GATT service** with RX (write) and TX (notify/read) characteristics.

- **Device Name**: `GroupII chas advanced`  
- **RX Characteristic**: Allows a BLE central (like a smartphone app) to send data to the ESP32.  
- **TX Characteristic**: The ESP32 can notify and send data back to the central device.  
- The server also supports periodic notifications (uptime), and echoes back any text received.  

 **Note:** The server implementation is still a work in progress. More features and stability improvements are being added.

## Live Simulation
[Run the project on Wokwi](https://wokwi.com/projects/442017683177817089)

<img width="260" height="428" alt="ESP3222" src="https://github.com/user-attachments/assets/50676a81-9899-49e4-bbf2-8c2a27ca0c95" />

## Requirements

- **ESP32 Arduino core** (Boards Manager → install *esp32* by Espressif Systems)
- **Library:** *ESP32 BLE Arduino* (Library Manager → install)
- **Includes used in the sketch:**
  ```cpp
  #include <BLEDevice.h>
  #include <BLEServer.h>
  #include <BLEUtils.h>
  #include <BLE2902.h>
