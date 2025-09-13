/*
 * ESP32 (incl. S3) — Classic BLE Arduino
 * - Advertises "GroupII chas advanced"
 * - Nordic UART-style service
 */

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define DEVICE_NAME "GroupII chas advanced"

// UUIDs (Nordic UART style)
static BLEUUID SERVICE_UUID("6E400001-B5A3-F393-E0A9-E50E24DCCA9E");
static BLEUUID RX_UUID     ("6E400002-B5A3-F393-E0A9-E50E24DCCA9E"); // central -> ESP32 (write)
static BLEUUID TX_UUID     ("6E400003-B5A3-F393-E0A9-E50E24DCCA9E"); // ESP32 -> central (notify/read)

BLEServer* pServer = nullptr;
BLECharacteristic* pTxChar = nullptr;
volatile bool deviceConnected = false;
uint32_t lastNotify = 0;
const uint32_t notifyEveryMs = 1000;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* /*server*/) override {
    deviceConnected = true;
  }
  void onDisconnect(BLEServer* server) override {
    deviceConnected = false;
    server->getAdvertising()->start(); // keep advertising after disconnect
  }
};

class RxCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* chr) override {
    String s = chr->getValue();   // Arduino String
    if (!s.length()) return;

    Serial.print("RX: ");
    Serial.println(s);

    // Echo back to TX (safe overloads)
    if (pTxChar) {
      pTxChar->setValue(s.c_str());   // use const char* overload
      pTxChar->notify();
    }
  }
};

void setup() {
  Serial.begin(115200);
  delay(100);

  BLEDevice::init(DEVICE_NAME);

  // Optional TX power (adjust if needed)
  #ifdef ESP_PWR_LVL_P9
    BLEDevice::setPower(ESP_PWR_LVL_P9);
  #endif

  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  // TX: Notify + Read
  pTxChar = pService->createCharacteristic(
    TX_UUID,
    BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ
  );
  pTxChar->addDescriptor(new BLE2902()); // CCCD for notifications

  // RX: Write + Write No Response
  BLECharacteristic* pRxChar = pService->createCharacteristic(
    RX_UUID,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
  );
  pRxChar->setCallbacks(new RxCallbacks());

  pService->start();

  BLEAdvertising* pAdv = pServer->getAdvertising();
  pAdv->addServiceUUID(SERVICE_UUID);
  pAdv->setScanResponse(true);
  pAdv->start();

  Serial.println("BLE started: advertising as \"GroupII chas advanced\"");
}

void loop() {
  // Optional: periodic notify with uptime
  uint32_t now = millis();
  if (deviceConnected && (now - lastNotify >= notifyEveryMs)) {
    lastNotify = now;
    char buf[48];
    snprintf(buf, sizeof(buf), "uptime_ms=%lu", (unsigned long)now);
    pTxChar->setValue(buf);  // const char* overload
    pTxChar->notify();
  }
  delay(10);
}
