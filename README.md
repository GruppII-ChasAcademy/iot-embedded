# IoT GroupII – Climate Controlled Logistics Monitor  

This project is an **IoT-based logistics system** designed to guarantee **climate-controlled delivery of special goods** (e.g., bananas).  
The system monitors and logs **temperature, humidity, and GPS location** during transportation, ensuring traceability and quality control.  

---

##  System Overview  

- **Sensor Nodes (S)** powered by **Arduino UNO R4 WiFi** inside the cargo measure temperature & humidity.  
- **ESP32 Broker (C)** inside the vehicle collects sensor data via **WiFi or Bluetooth**.  
- **Mobile Unit (M)** forwards data to the **Web Server (W)** over **4G/5G**.  
- **GPS** provides continuous location tracking.  
- Data is logged both **locally** and in the **backend** for redundancy.  

---

## Sensor Package  

**Control Unit (in vehicle):**  
- GPS sensor  
- 4G/5G connection to backend  
- Automated control of temperature & dehumidification (simulated)  
- Connection to all package sensors  
- Local logging  

**Each Sensor Node (in package):**  
- Temperature sensor  
- Humidity sensor  
- Local logging  
- Wireless link to vehicle control unit  

---

## Tasks & Infrastructure  

**Sensor & Base Unit:**  
- Base unit with automation capacity (ESP32/RPi)  
- GPS + mobile network connection  
- Wireless sensor integration  
- Distributed & deployed sensor packages  

**CI/CD:**  
- GitHub Actions, Projects, and optional Packages  
- Test structure for IoT, Backend, and Frontend  
- Multiple repos using **Git Flow** (shift to **GitHub Flow** for Continuous Delivery/Deployment)  

---

## Logistics Flow (Chas Advance)  

1. **Warehouse Checkout** – Packages scanned (barcode + mobile terminal) → activates logging & sensor suite.  
2. **Transport** – Truck/train/airplane; handover possible with new base unit.  
3. **Monitoring & Control** – Data logged locally + sent to backend; vehicle unit can regulate climate conditions.  
4. **Delivery** – Data finalized upon arrival and logged at the receiving warehouse.  

---

## Tech Stack  
- **Arduino UNO R4 WiFi** – used as **sensor node** (temperature & humidity)  
- **ESP32-S3** – used as **BLE/WiFi gateway & broker** for collecting sensor data  
- **DHT22** – temperature and humidity sensing  
- **LCD 16x2 (I²C)** – real-time display  
- **Wokwi** – simulation of entire system  
- **PlatformIO (C++)** – development environment  
- **GitHub CI/CD** – workflow automation, testing & deployments  

