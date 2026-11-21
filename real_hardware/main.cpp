/*
 * KIT_NODE/001  -  REAL HARDWARE VERSION
 * ------------------------------------------------------------------
 * Board     : ESP32 DevKit (CP2102, USB-C, 30 pin)
 * Sensors   : DHT22 (temp/humidity), MQ-7 Flying-Fish (CO), MAX30102 (SpO2/HR)
 * Actuator  : SG90 micro servo  -> "exhaust vent / fresh-air valve"
 * REMOVED   : SDS011 (PM2.5/PM10), purifier PWM, MQ-7 heater PWM
 *             (Flying-Fish module me heater direct 5V se juda hota hai, control nahi hota)
 *
 * Architecture (diagram wala same):
 *   M = severity/10,  V = 0.7*spo2Risk + 0.3*hrRisk,  E = temp(0/.5) + humidity(0/.5)
 *   R = 0.5M + 0.3V + 0.2E
 *   T_CO = normal - R*(normal - strict)
 *   I_CO = CO / T_CO  ->  ACTION_TABLE  ->  servo angle
 *
 * Wiring ke liye guide dekho (chat me di hui table).
 */
#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <MAX30105.h>          // SparkFun MAX3010x lib (MAX30102 bhi isi se chalta hai)
#include <spo2_algorithm.h>    // real SpO2 + heart-rate algorithm
#include <ESP32Servo.h>
#include <algorithm>
#include <cmath>
#include <string>

/* ====================== USER CONFIG ====================== */
#define SIMULATION_MODE 0      // 1 = fake random values (sensors ke bina test), 0 = real sensors

const std::string KIT_ID = "KIT_NODE/001";

const char* WIFI_SSID     = "Redmi Note 11T 5G";        // <-- apna WiFi naam
const char* WIFI_PASSWORD = "00000000";    // <-- apna password

const char* MQTT_HOST          = "broker.hivemq.com";
const char* MQTT_HOST_FALLBACK = "18.184.120.97";    // DNS fail ho to (IP badal sakta hai, nslookup se check karo)
const int   MQTT_PORT          = 1883;
std::string TOPIC_DATA = KIT_ID;

#define PUBLISH_INTERVAL_MS  2000
#define PROCESS_INTERVAL_MS  1000

/* ====================== PINS ====================== */
#define PIN_DHT        4      // DHT22 data
#define DHTTYPE        DHT22
#define PIN_CO_ANALOG  32     // MQ-7 AO (divider ke through)  [ADC1 pin - WiFi ke saath kaam karta hai]
#define PIN_SERVO      18     // SG90 signal
#define PIN_I2C_SDA    21     // MAX30102 SDA
#define PIN_I2C_SCL    22     // MAX30102 SCL

/* ====================== SERVO ====================== */
#define SERVO_CLOSED_ANGLE 0      // vent band
#define SERVO_OPEN_ANGLE   90     // vent poora khula (SG90 ko 180 tak bhi le ja sakte ho, par 90 safe hai)

/* ====================== MQ-7 CONSTANTS ====================== */
#define MQ7_VCC_MV        5000.0f   // MQ-7 module ka supply (multimeter se VIN pin naap ke update karo, e.g. 4800)
#define DIV_R1_K          10.0f     // divider upar wala resistor  (AO  -> GPIO32)
#define DIV_R2_K          20.0f     // divider neeche wala resistor (GPIO32 -> GND) = 2 x 10k series
#define MQ7_RL_K          10.0f     // module ka onboard load resistor (chip/SMD marking "103" = 10k; alag ho to badlo)
#define MQ7_WARMUP_MS     180000UL  // 3 min warm-up (pehli baar 24 ghante burn-in karna best hai)
#define MQ7_CALIB_MS      30000UL   // 30 sec clean-air calibration
#define MQ7_CLEAN_AIR_RATIO 27.0f   // datasheet: Rs/R0 in clean air

const float DIV_RATIO = (DIV_R1_K + DIV_R2_K) / DIV_R2_K;                                   // Vao = Vadc * DIV_RATIO
// divider RL ke parallel me lagta hai, isliye effective load:
const float RL_EFF_K  = (MQ7_RL_K * (DIV_R1_K + DIV_R2_K)) / (MQ7_RL_K + DIV_R1_K + DIV_R2_K);

float R0_KOHM        = 10.0f;
bool  isMq7Calibrated = false;
unsigned long mq7Start = 0;

/* ====================== MAX30102 ====================== */
#define FINGER_IR_THRESHOLD 50000   // isse kam IR = ungli nahi rakhi
MAX30105 particleSensor;
bool isMaxSensorOK = false;
uint32_t irBuffer[100];
uint32_t redBuffer[100];
int32_t  bufferLength = 100;
int32_t  spo2_val, heartRate_val;
int8_t   validSPO2, validHeartRate;

/* ====================== OBJECTS ====================== */
DHT dht(PIN_DHT, DHTTYPE);
Servo ventServo;
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

/* ====================== RISK ENGINE ====================== */
struct SystemData {
    // live values (safe defaults - ungli/sensor na ho tab bhi risk galat na badhe)
    float spo2 = 98.0f;
    float heart_rate = 75.0f;
    float temp = 25.0f;
    float humidity = 50.0f;
    float CO = 0.0f;

    // actuator
    float exhaust_pct = 0.0f;
    int   servo_angle = SERVO_CLOSED_ANGLE;

    // status flags
    bool dht_error = false;
    bool max_error = false;
    bool finger_present = false;
    bool mq7_ready = false;

    float M = 0, V = 0, E = 0, R = 0;

    // doctor ke inputs
    float SEVERITY_SCORE = 8.0f;
    float OPTIMUM_SPO2_MIN = 95.0f;
    float SUB_OPTIMUM_SPO2_MIN = 85.0f;
    float OPTIMUM_HEART_RATE_MAX = 100.0f;
    float SUB_OPTIMUM_HEART_RATE_MAX = 140.0f;
    float OPTIMUM_TEMP_MIN = 18.0f;
    float OPTIMUM_TEMP_MAX = 32.0f;
    float OPTIMUM_HUMID_MAX = 70.0f;

    // CO limits (ppm). WHO: 24h = 4 mg/m3 (~3.5 ppm) strict, 8h = 10 mg/m3 (~8.7 ppm) normal
    // NOTE: pehle normal = strict = 4 tha, to R ka CO threshold pe koi asar hi nahi padta tha.
    float T_normal_level_static_CO = 8.7f;
    float T_strict_level_static_CO = 3.5f;
    float T_CO = 8.7f;
    float I_CO = 0.0f;

    float calculateM(float severity) { return std::min(1.0f, severity / 10.0f); }

    float calculateV(float spo2_val_, float hr_val) {
        float v_spo2 = (spo2_val_ >= OPTIMUM_SPO2_MIN) ? 0.0f
                     : ((spo2_val_ >= SUB_OPTIMUM_SPO2_MIN) ? (95.0f - spo2_val_) / 10.0f : 1.0f);
        float v_hr = (hr_val <= OPTIMUM_HEART_RATE_MAX) ? 0.0f
                   : ((hr_val <= SUB_OPTIMUM_HEART_RATE_MAX) ? (hr_val - 100.0f) / 40.0f : 1.0f);
        return std::min(1.0f, (0.7f * v_spo2) + (0.3f * v_hr));
    }

    float calculateE(float temp_val, float hum_val) {
        float e_temp = (temp_val < OPTIMUM_TEMP_MIN || temp_val > OPTIMUM_TEMP_MAX) ? 0.5f : 0.0f;
        float e_humidity = (hum_val > OPTIMUM_HUMID_MAX) ? 0.5f : 0.0f;
        return std::min(1.0f, e_temp + e_humidity);
    }

    float calculateR(float m, float v, float e) { return std::min(1.0f, 0.5f * m + 0.3f * v + 0.2f * e); }
    float calculateT_s(float T_normal, float T_strict, float r) { return T_normal - (r * (T_normal - T_strict)); }

    void calculateExceedanceRatios() { I_CO = CO / T_CO; }

    // ---------- ACTION TABLE ----------
    // Columns: [<1.0, <1.3, <1.5, <3.0, <5.0, >=5.0]   (getColumnIndexFromTable dekho)
    // Abhi sirf CO ka row hai. Naya parameter (CO2, VOC...) aaye to row + ratio add karo.
    struct TableRow { float exhaust[6]; };
    static const int NUM_PARAMS = 1;
    TableRow ACTION_TABLE[NUM_PARAMS] = {
        { { 0.0f, 25.0f, 25.0f, 25.0f, 75.0f, 100.0f } }   // CO -> vent opening %
    };

    int getColumnIndexFromTable(float ratio) {
        if (ratio < 1.0f) return 0;
        if (ratio < 1.3f) return 1;
        if (ratio < 1.5f) return 2;
        if (ratio < 3.0f) return 3;
        if (ratio < 5.0f) return 4;
        return 5;
    }

    void setExhaustSpeed(float pct) {
        exhaust_pct = constrain(pct, 0.0f, 100.0f);
        servo_angle = map((long)exhaust_pct, 0, 100, SERVO_CLOSED_ANGLE, SERVO_OPEN_ANGLE);
    }

    void findValuesOfActuatorUsingRatios() {
        float ratios[NUM_PARAMS] = { I_CO };
        float final_exhaust = 0.0f;               // abhi priority = max value
        for (int p = 0; p < NUM_PARAMS; p++) {
            int col = getColumnIndexFromTable(ratios[p]);
            final_exhaust = std::max(final_exhaust, ACTION_TABLE[p].exhaust[col]);
        }
        setExhaustSpeed(final_exhaust);
    }
};

SystemData liveData;

/* ====================== WiFi / MQTT ====================== */
void connectToWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Connecting to WiFi");
    unsigned long startAttempt = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 15000) {
        delay(500);
        Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi Connected. IP: " + WiFi.localIP().toString());
    } else {
        Serial.println("\nWiFi failed - loop me retry hoga (sensors/servo chalte rahenge)");
    }
}

// Non-blocking: internet na ho tab bhi sensors + servo band nahi hote
void maintainConnectivity() {
    static unsigned long lastWifiTry = 0, lastMqttTry = 0;
    unsigned long now = millis();

    if (WiFi.status() != WL_CONNECTED) {
        if (now - lastWifiTry > 10000) {
            lastWifiTry = now;
            Serial.println("WiFi lost, reconnecting...");
            WiFi.disconnect();
            WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        }
        return;
    }

    if (!mqttClient.connected() && (lastMqttTry == 0 || now - lastMqttTry > 5000)) {
        lastMqttTry = now;
        const char* hosts[2] = { MQTT_HOST, MQTT_HOST_FALLBACK };
        for (int i = 0; i < 2; i++) {
            mqttClient.setServer(hosts[i], MQTT_PORT);
            Serial.print("MQTT -> "); Serial.print(hosts[i]); Serial.print(" ... ");
            if (mqttClient.connect(KIT_ID.c_str())) {
                Serial.println("connected");
                break;
            }
            Serial.print("failed rc="); Serial.println(mqttClient.state());
        }
    }
}

// "R" pehle jaisa string hi hai (Node.js backend na toote). Baaki fields extra hain.
void publishDatas(const SystemData &d) {
    if (!mqttClient.connected()) return;
    StaticJsonDocument<320> doc;
    doc["R"]    = std::to_string(d.R);
    doc["M"]    = d.M;
    doc["V"]    = d.V;
    doc["E"]    = d.E;
    doc["co"]   = d.CO;
    doc["t"]    = d.temp;
    doc["h"]    = d.humidity;
    doc["spo2"] = d.spo2;
    doc["hr"]   = d.heart_rate;
    doc["vent"] = d.exhaust_pct;

    char buffer[320];
    serializeJson(doc, buffer);
    mqttClient.publish(TOPIC_DATA.c_str(), buffer);
}

/* ====================== MQ-7 (CO) ====================== */
// Rs (kOhm) nikalta hai. Invalid ho to -1.
float readRs_kohm() {
    uint32_t sum = 0;
    for (int i = 0; i < 16; i++) {
        sum += analogReadMilliVolts(PIN_CO_ANALOG);
        delayMicroseconds(200);
    }
    float v_adc = sum / 16.0f;                 // mV at GPIO32
    if (v_adc < 30.0f) return -1.0f;           // ESP32 ADC bahut kam voltage pe bharosemand nahi
    float v_ao = v_adc * DIV_RATIO;            // module ke AO ka asli voltage
    if (v_ao >= MQ7_VCC_MV - 50.0f) return -1.0f;
    return RL_EFF_K * (MQ7_VCC_MV - v_ao) / v_ao;
}

float readCO_PPM() {
    unsigned long now = millis();

    // 1) warm-up
    if (now - mq7Start < MQ7_WARMUP_MS) {
        liveData.mq7_ready = false;
        return liveData.CO;
    }

    // 2) clean-air calibration (is dauran sensor ko saaf hawa me rakho)
    if (!isMq7Calibrated) {
        static unsigned long calibStart = 0;
        static float rsSum = 0;
        static int rsCount = 0;
        if (calibStart == 0) { calibStart = now; Serial.println(">>> MQ-7 calibration shuru: saaf hawa me rakho <<<"); }
        float rs = readRs_kohm();
        if (rs > 0) { rsSum += rs; rsCount++; }
        if (now - calibStart >= MQ7_CALIB_MS && rsCount > 0) {
            R0_KOHM = (rsSum / rsCount) / MQ7_CLEAN_AIR_RATIO;
            isMq7Calibrated = true;
            Serial.print("MQ-7 R0 = "); Serial.print(R0_KOHM); Serial.println(" kOhm");
        }
        liveData.mq7_ready = false;
        return liveData.CO;
    }

    // 3) normal reading
    float rs = readRs_kohm();
    if (rs <= 0) return liveData.CO;
    float ratio = rs / R0_KOHM;
    float ppm = 99.042f * pow(ratio, -1.518f);
    ppm = constrain(ppm, 0.0f, 2000.0f);
    liveData.mq7_ready = true;
    return 0.3f * ppm + 0.7f * liveData.CO;    // smoothing (EMA)
}

/* ====================== DHT22 ====================== */
void readDHT(SystemData &data) {
    static unsigned long lastRead = 0;
    if (millis() - lastRead < 2500) return;    // DHT22 ko 2 sec se kam me mat padho
    lastRead = millis();

    float h = dht.readHumidity();
    float t = dht.readTemperature();
    if (std::isnan(h) || std::isnan(t)) {
        data.dht_error = true;                 // purani value hold
    } else {
        data.humidity = h;
        data.temp = t;
        data.dht_error = false;
    }
}

/* ====================== MAX30102 ====================== */
void readMAX30102(SystemData &data) {
    if (!isMaxSensorOK) return;

    static int sampleIdx = 0;
    particleSensor.check();

    while (particleSensor.available()) {
        redBuffer[sampleIdx] = particleSensor.getFIFORed();
        irBuffer[sampleIdx]  = particleSensor.getFIFOIR();
        particleSensor.nextSample();

        data.finger_present = (irBuffer[sampleIdx] > FINGER_IR_THRESHOLD);
        sampleIdx++;

        if (sampleIdx >= bufferLength) {
            if (data.finger_present) {
                maxim_heart_rate_and_oxygen_saturation(
                    irBuffer, bufferLength, redBuffer,
                    &spo2_val, &validSPO2, &heartRate_val, &validHeartRate);

                bool spo2_ok = validSPO2 && spo2_val >= 70 && spo2_val <= 100;
                bool hr_ok   = validHeartRate && heartRate_val >= 30 && heartRate_val <= 220;
                if (spo2_ok) data.spo2 = (float)spo2_val;
                if (hr_ok)   data.heart_rate = (float)heartRate_val;
                data.max_error = !(spo2_ok || hr_ok);
            } else {
                data.max_error = false;        // ungli nahi hai - purani values hold
            }

            for (int i = 25; i < 100; i++) {   // sliding window: 25 naye samples
                redBuffer[i - 25] = redBuffer[i];
                irBuffer[i - 25]  = irBuffer[i];
            }
            sampleIdx = 75;
        }
    }
}

/* ====================== SIMULATION (optional) ====================== */
void simulateSensorReadings(SystemData &data) {
    data.spo2       = 70.0f + (random(0, 3000) / 100.0f);
    data.heart_rate = 50.0f + (random(0, 12000) / 100.0f);
    data.temp       = 10.0f + (random(0, 3200) / 100.0f);
    data.humidity   = 20.0f + (random(0, 7500) / 100.0f);
    data.CO         = (random(0, 2500) / 100.0f);
    data.dht_error = data.max_error = false;
}

/* ====================== ACTUATOR ====================== */
void executeActuatorCommands(const SystemData &data) {
    static int lastAngle = -100;
    if (abs(data.servo_angle - lastAngle) >= 2) {   // chhote jitter pe servo na hile
        ventServo.write(data.servo_angle);
        lastAngle = data.servo_angle;
    }
}

/* ====================== MAIN PIPELINE ====================== */
void processSystem() {
#if SIMULATION_MODE
    simulateSensorReadings(liveData);
#else
    readDHT(liveData);
    liveData.CO = readCO_PPM();
#endif

    liveData.M = liveData.calculateM(liveData.SEVERITY_SCORE);
    liveData.V = liveData.calculateV(liveData.spo2, liveData.heart_rate);
    liveData.E = liveData.calculateE(liveData.temp, liveData.humidity);
    liveData.R = liveData.calculateR(liveData.M, liveData.V, liveData.E);

    liveData.T_CO = liveData.calculateT_s(liveData.T_normal_level_static_CO,
                                          liveData.T_strict_level_static_CO, liveData.R);
    liveData.calculateExceedanceRatios();
    liveData.findValuesOfActuatorUsingRatios();
    executeActuatorCommands(liveData);

    Serial.printf("Temp %.1fC | Hum %.1f%% | CO %.2f ppm%s | SpO2 %.0f | HR %.0f | finger:%s\n",
                  liveData.temp, liveData.humidity, liveData.CO,
                  liveData.mq7_ready ? "" : " (MQ7 warming/calib)",
                  liveData.spo2, liveData.heart_rate, liveData.finger_present ? "YES" : "NO");
    Serial.printf("M %.2f | V %.2f | E %.2f | R %.2f | T_CO %.2f | I_CO %.2f | vent %.0f%% (%d deg)\n",
                  liveData.M, liveData.V, liveData.E, liveData.R, liveData.T_CO, liveData.I_CO,
                  liveData.exhaust_pct, liveData.servo_angle);
    if (liveData.dht_error) Serial.println("!! DHT22 read error");
    if (liveData.max_error) Serial.println("!! MAX30102 invalid reading");
    Serial.println("-----------------------------------");

    static unsigned long lastPublish = 0;
    if (millis() - lastPublish >= PUBLISH_INTERVAL_MS) {
        lastPublish = millis();
        publishDatas(liveData);
    }
}

void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("\n=== KIT_NODE/001 starting ===");

    analogSetPinAttenuation(PIN_CO_ANALOG, ADC_11db);
    dht.begin();

    ESP32PWM::allocateTimer(0);
    ventServo.setPeriodHertz(50);
    ventServo.attach(PIN_SERVO, 500, 2400);
    ventServo.write(SERVO_CLOSED_ANGLE);

    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
        Serial.println("!! MAX30102 nahi mila - wiring / soldering check karo");
        isMaxSensorOK = false;
    } else {
        // ledBrightness, sampleAverage, ledMode(2=Red+IR), sampleRate, pulseWidth, adcRange
        particleSensor.setup(60, 4, 2, 100, 411, 4096);
        isMaxSensorOK = true;
        Serial.println("MAX30102 OK");
    }

    connectToWiFi();
    mqttClient.setBufferSize(512);
    mqttClient.setSocketTimeout(5);

    mq7Start = millis();
}

void loop() {
    maintainConnectivity();
    if (mqttClient.connected()) mqttClient.loop();

    readMAX30102(liveData);            // FIFO jaldi jaldi khali karna zaroori hai

    static unsigned long lastProcess = 0;
    if (millis() - lastProcess >= PROCESS_INTERVAL_MS) {
        lastProcess = millis();
        processSystem();
    }
    delay(10);
}
