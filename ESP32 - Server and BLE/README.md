# ESP32 BLE Server Project

This project demonstrates how to use the **ESP32** as a **Bluetooth Low Energy (BLE) server**.  
The ESP32 is configured to advertise itself and provide a custom **GATT service** with RX (write) and TX (notify/read) characteristics.

- **Device Name**: `GroupII chas advanced`  
- **RX Characteristic**: Allows a BLE central (like a smartphone app) to send data to the ESP32.  
- **TX Characteristic**: The ESP32 can notify and send data back to the central device.  
- The server also supports periodic notifications (uptime), and echoes back any text received.

## Live Simulation
🔗 [Run the project on Wokwi](https://wokwi.com/projects/442017683177817089)

<img width="260" height="428" alt="ESP3222" src="https://github.com/user-attachments/assets/50676a81-9899-49e4-bbf2-8c2a27ca0c95" />


## Use Cases
- **IoT applications**: sensors sending data over BLE  
- **Mobile communication**: ESP32 acting as a peripheral device  
- **Embedded systems learning**: understanding BLE GATT services and server roles  

## How It Works
1. ESP32 starts advertising under the name **GroupII chas advanced**  
2. Connect with a BLE scanner app (e.g., nRF Connect or LightBlue)  
3. Write data to the **RX characteristic** → ESP32 receives it and echoes back  
4. Enable notifications on the **TX characteristic** → ESP32 sends periodic uptime data  

---

✨ Built with [Wokwi](https://wokwi.com) for simulation and testing.
