# Temperature and Humidity Sensor (Arduino UNO R4 WiFi)

This project demonstrates how to measure **temperature and humidity** using a **DHT22 sensor** and display the values on a **16x2 LCD with I²C adapter**.


<img width="738" height="489" alt="sfwrwwrgw" src="https://github.com/user-attachments/assets/d458e629-fb01-446b-8a1d-8e990f0b187a" />


## Hardware
- Arduino UNO R4 WiFi  
- DHT22 (connected to digital pin D7)  
- 16x2 LCD with I²C adapter (SDA=A4, SCL=A5)  
- Dupont wires  

---

## Wiring
- **DHT22**  
  - VCC → 5V  
  - DATA → D7  
  - GND → GND  

- **LCD I²C**  
  - VCC → 5V  
  - GND → GND  
  - SDA → A4  
  - SCL → A5  

---

## Code
The code uses the following libraries:
```cpp
- `Adafruit Unified Sensor`  
- `Adafruit DHT sensor library`  
- `LiquidCrystal I2C`

For more information about this project, you will find it here
https://wokwi.com/projects/441919864818625537
