#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>

#define DHTPIN 7
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

LiquidCrystal_I2C lcd(0x27, 16, 2); 

void setup() {
  Serial.begin(115200);
  dht.begin();

  lcd.init();
  lcd.backlight();

  lcd.setCursor(0, 0);
  lcd.print("Startar...");
  delay(1000);
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print("Sensorfel!");
    lcd.setCursor(0, 1); lcd.print("Kontrollera DHT");
    Serial.println("Misslyckad avlasning");
    delay(2000);
    return;
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(t, 1);
  lcd.print((char)223);
  lcd.print("C");

  lcd.setCursor(0, 1);
  lcd.print("Fukt: ");
  lcd.print(h, 1);
  lcd.print("%");

  Serial.print("Temp: "); Serial.print(t, 1); Serial.print(" °C  ");
  Serial.print("Fukt: "); Serial.print(h, 1); Serial.println(" %");

  delay(2000);
}
