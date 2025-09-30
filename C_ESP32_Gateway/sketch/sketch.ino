#include <WiFi.h>
#include <uMQTTBroker.h>

const char* AP_SSID   = "ESP32-GW";
const char* AP_PASS   = "12345678";          // minst 8 tecken
const char* HOME_SSID = "DittWiFi";          // <- byt (valfritt)
const char* HOME_PASS = "DittWifiLosen";     // <- byt (valfritt)

class MyBroker : public uMQTTBroker {
  bool onConnect(IPAddress addr, uint16_t client_count) override {
    Serial.printf("Client connected. Count=%u\n", client_count);
    return true;
  }
  void onData(String topic, const char *data, uint32_t length) override {
    String msg(data, length);
    Serial.printf("[MQTT] %s => %s\n", topic.c_str(), msg.c_str());
  }
} broker;

void setup() {
  Serial.begin(115200); delay(200);

  WiFi.mode(WIFI_AP_STA);
  // Starta egen AP för UNO
  WiFi.softAP(AP_SSID, AP_PASS);
  Serial.print("AP   IP: "); Serial.println(WiFi.softAPIP()); // 192.168.4.1

  // Valfritt: koppla även upp mot hemmaroutern (så PC/backenden kan nå brokern utan att byta nät)
  WiFi.begin(HOME_SSID, HOME_PASS);
  unsigned long t0 = millis();
  while (WiFi.status()!=WL_CONNECTED && millis()-t0<15000) { delay(500); Serial.print("."); }
  if (WiFi.status()==WL_CONNECTED) {
    Serial.print("\nSTA  IP: "); Serial.println(WiFi.localIP()); // använd denna i backend om du vill
  } else {
    Serial.println("\nSTA not connected (only AP active).");
  }

  // Starta MQTT-broker (port 1883)
  broker.init();
  broker.subscribe("#");
  Serial.println("MQTT broker up on port 1883");
}

void loop() { /* broker kör i bakgrunden */ }
