#include <Arduino.h>
#include <Wire.h>
#include <DHT.h>
#include <SdsDustSensor.h>
#include <algorithm>
#include <cmath>
#include <vector>
#include <string>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const std::string KIT_ID = "KIT_NODE/001";





/* ---------- WiFi ---------- */
WiFiClient wifiClient;
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";


// documentation
void connectToWiFi() {
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
        Serial.println("\nWiFi Connection Failed - will retry in loop");
    }
}


/* ---------- MQTT ---------- */
PubSubClient mqttClient(wifiClient);
// const char* mqttServer = "broker.hivemq.com"; 
 
// const char* mqttServer = "18.184.120.97";
const char* SERVER_1 = "broker.hivemq.com";
const char* SERVER_2 = "18.184.120.97"; // i was using this
const int   MQTT_PORT = 1883;

// nslookup broker.hivemq.com
// i have extracted this direct ip from nslookup command because due to vscode dns problem was occuring
// this i have to check and update after sometime as direct ip may change


std::string TOPIC_DATA = KIT_ID; // ASSUMING THIS/EACH KIT IS A UNIQUE PUBLISHER
                                 // AND ALREADY VERIFIED AT BROKER
                                 // AND NOW NO OTHER KIT CAN TAKE THIS TOPIC NAME ON BROKER
                                 // so i can easily identify this kit on node js backend


void testServerConnection(const char* host) {
    
    Serial.print("Testing: ");
    Serial.print(host);
    Serial.print(" ... ");

    unsigned long startTime = millis();
    bool connected = wifiClient.connect(host, MQTT_PORT);
    unsigned long elapsed = millis() - startTime;

    if (connected) {
        Serial.print("\nSUCCESS Connected via MQTT Protocol (");
        Serial.print(elapsed);
        Serial.println(" ms)");
        wifiClient.stop();
    } else {
        Serial.println("\nFAILED MQTT connection");
    }
}

void publishDatas(std::string R) {
    StaticJsonDocument<64> doc;
    doc["R"] = R;

    char buffer[64];
    serializeJson(doc, buffer);

    mqttClient.publish(TOPIC_DATA.c_str(), buffer);
}


// documentation
class MAX30105 {
public:
    // documentation
    MAX30105() {
        _available = false;
        _red = 0;
        _ir = 0;
    }
    // documentation
    bool begin(TwoWire &wirePort = Wire, uint32_t i2cSpeed = 400000) {
        wirePort.beginTransmission(0x57);
        return (wirePort.endTransmission() == 0);
    }
    // documentation
    void setup(uint8_t ledBrightness = 60, uint8_t sampleAverage = 4, uint8_t ledMode = 2, uint8_t sampleRate = 100, int pulseWidth = 411, int adcRange = 4096) {
    }
    // documentation
    void check() {
        Wire.beginTransmission(0x57);
        Wire.write(0x00);
        Wire.endTransmission(false);
        Wire.requestFrom((uint8_t)0x57, (uint8_t)1);
        if (Wire.available()) {
            uint8_t status = Wire.read();
            if (status & 0x40) {
                Wire.beginTransmission(0x57);
                Wire.write(0x07);
                Wire.endTransmission(false);
                Wire.requestFrom((uint8_t)0x57, (uint8_t)6);
                if (Wire.available() >= 6) {
                    uint32_t r0 = Wire.read();
                    uint32_t r1 = Wire.read();
                    uint32_t r2 = Wire.read();
                    _red = (r0 << 16) | (r1 << 8) | r2;

                    uint32_t i0 = Wire.read();
                    uint32_t i1 = Wire.read();
                    uint32_t i2 = Wire.read();
                    _ir = (i0 << 16) | (i1 << 8) | i2;

                    _available = true;
                }
            }
        }
    }
    // documentation
    bool available() {
        bool temp = _available;
        _available = false;
        return temp;
    }
    // documentation
    uint32_t getRed() {
        return _red;
    }
    // documentation
    uint32_t getIR() {
        return _ir;
    }
    // documentation
    void nextSample() {
    }
// documentation
private:
    uint32_t _red;
    uint32_t _ir;
    bool _available;
};

/* My Implimentation */
struct SystemData {
    /* My Implimentation */
    /* My Implimentation */float spo2 = 91.0f;  // 
    /* My Implimentation */float heart_rate = 124.0f;
    /* My Implimentation */float temp = 37.0f;
    /* My Implimentation */float humidity = 80.0f;
    /* My Implimentation */float PM2_5 = 4.0f;
    /* My Implimentation */float PM10 = 10.0f;
    /* My Implimentation */float CO = 0.0f;
    // later i will add more sensor here like 
    //  co2
    //  voc


    // actuators values defintion
    uint8_t purifier_pwm = 0;
    uint8_t exhaust_pwm = 0;


    bool dht_error = false;
    bool sds_error = false;
    bool max_error = false;

    /* My Implimentation */float M, V, E, R; //
    // M means medical risk 
    // V means vital risk
    // E means environment risk
    // R means total risk
    float SEVERITY_SCORE = 8.0f; // given by doctor as per your condition       /*       this much input is given by doctors     */
    float OPTIMUM_SPO2_MIN = 95.0f; // safe above it                            /*       this much input is given by doctors     */
    float SUB_OPTIMUM_SPO2_MIN = 85.0f; // risky                                /*       this much input is given by doctors     */
    float OPTIMUM_HEART_RATE_MAX = 100.0f; // below it safe                     /*       this much input is given by doctors     */
    float SUB_OPTIMUM_HEART_RATE_MAX = 140.0f; // risky                         /*       this much input is given by doctors     */
    float OPTIMUM_TEMP_MIN = 18.0f; // inside these you are safe                /*       this much input is given by doctors     */
    float OPTIMUM_TEMP_MAX = 32.0f; // inside these you are safe                /*       this much input is given by doctors     */
    float OPTIMUM_HUMID_MAX = 70.0f; // less than this you are safe             /*       this much input is given by doctors     */
                                                                                /*       LATER I WILL ADD SECTION TO UPDATE THIS USING FRONTEND     */

    /* My Implimentation */
    float T_PM2_5;
    float T_PM10;
    float T_CO;
    float T_normal_level_static_PM2_5 = 15.0f, T_strict_level_static_PM2_5 = 5.0f; // these values are from w.h.o.
    // pm2.5  agar 15 ya 5 se uper gaya to alert hoga
    /* My Implimentation */
    float T_normal_level_static_PM10 = 45.0f, T_strict_level_static_PM10 = 15.0f; // these values are from w.h.o.
    // pm10  agar 45 ya 15 se uper gaya to alert hoga
    /* My Implimentation */
    float T_normal_level_static_CO = 4.0f, T_strict_level_static_CO = 4.0f; // these values are from w.h.o.
    // co  agar 4 se uper gaya to alert hoga
    

     // later i will add more here like 
    //  t_co2
    //  t_voc

    // float k_pm25 = 0;
    // float k_pm10 = 0;
    // float k_co = 0;


    // #### THIS ABOVE DATA IS COMING FROM PRE PROCESSED DATA WHICH
    // #### HAS BEEN TAKEN FROM KAGGLE AND W.H.O. SO AS TO TAKE SOME STATIC THRESHOLDS
    // #### THEN MAKE IT OPTIMAL FOR PARTICULAR TYPE PATIENTS

    /* My Implimentation */float I_PM2_5, I_PM10, I_PM, I_CO; // ye ratios hai real_time_value/threshold_value
 

    /* My Implimentation */float calculateM(float severity) { return std::min(1.0f, severity / 10.0f); }  
    // this is just making it under 0 to 1 from 1 to 10

    // void adjust_static_Ts_to_dynamic(float k_pm25, float k_pm10, float k_co) {
    //     // Zero/Negative safety checks
    //     if (k_pm25 <= 0.0f) k_pm25 = 1.0f;
    //     if (k_pm10 <= 0.0f) k_pm10 = 1.0f;
    //     if (k_co <= 0.0f) k_co = 1.0f;

    //     // 1. Dynamic PM2.5 Limits
    //     T_normal_level_PM2_5 = T_normal_level_static_PM2_5 / k_pm25;
    //     T_strict_level_PM2_5 = T_strict_level_static_PM2_5 / k_pm25;

    //     // 2. Dynamic PM10 Limits
    //     T_normal_level_PM10 = T_normal_level_static_PM10 / k_pm10;
    //     T_strict_level_PM10 = T_strict_level_static_PM10 / k_pm10;

    //     // 3. Dynamic CO Limits
    //     T_normal_level_CO = T_normal_level_static_CO / k_co;
    //     T_strict_level_CO = T_strict_level_static_CO / k_co;
    // }

    /* My Implimentation */float calculateV(float spo2_val, float hr_val) { // ye realtime live values mil rhi hai
                               
    /* My Implimentation */    float v_spo2 = (spo2_val >= OPTIMUM_SPO2_MIN) ? 0.0f : ((spo2_val >= SUB_OPTIMUM_SPO2_MIN) ? (95.0f - spo2_val) / 10.0f : 1.0f);
                               
    /* My Implimentation */    float v_hr = (hr_val <= OPTIMUM_HEART_RATE_MAX) ? 0.0f : ((hr_val <= SUB_OPTIMUM_HEART_RATE_MAX) ? (hr_val - 100.0f) / 40.0f : 1.0f);
    /* My Implimentation */    return std::min(1.0f, (0.7f * v_spo2) + (0.3f * v_hr));
    /* My Implimentation */}

    /* My Implimentation */float calculateE(float temp_val, float hum_val) {
                               
    /* My Implimentation */    float e_temp = (temp_val < OPTIMUM_TEMP_MIN || temp_val > OPTIMUM_TEMP_MAX) ? 0.5f : 0.0f;
                               
    /* My Implimentation */    float e_humidity = (hum_val > OPTIMUM_HUMID_MAX) ? 0.5f : 0.0f;
    /* My Implimentation */    return std::min(1.0f, e_temp + e_humidity);
    /* My Implimentation */}

    /* My Implimentation */float calculateR(float m_val, float v_val, float e_val) { return std::min(1.0f, 0.5f * m_val + 0.3f * v_val + 0.2f * e_val); }
    /* My Implimentation */float calculateT_s(float T_normal, float T_strict, float r_val) { return T_normal - (r_val * (T_normal - T_strict)); }

    /* My Implimentation */void calculateExceedanceRatios() {
    /* My Implimentation */    I_PM2_5 = PM2_5 / T_PM2_5;
    /* My Implimentation */    I_PM10 = PM10 / T_PM10;
    /* My Implimentation */    I_CO = CO / T_CO;
        // i will add others too like
        // i co 2
        // i voc

        
    /* My Implimentation */}







    // Actuator demands for a single parameter row
    /* My Implimentation */struct TableRow { // 6 means 6 fragments of ratios for each 
    /* My Implimentation */    float purifier[6];    // Purifier Speed (%)
    /* My Implimentation */    float exhaust[6];     // Exhaust Fan Speed (%)
        // bool  valve[6];       // Fresh Air Valve State (1 = OPEN, 0 = CLOSED)
        // float ac[6];          // AC Cooling Level (%)
        // bool  ac_dry[6];      // AC Dry Mode (1 = ON, 0 = OFF)
        // bool  dehumidifier[6];// Dehumidifier State (1 = ON, 0 = OFF)
    /* My Implimentation */};

    /* 
    ========================================================================================================================
                                        AQI / PARAMETER ACTION LOOKUP TABLE
    ========================================================================================================================
    COLUMNS (Ratio Ranges):
    [0]: < 1.0  (Safe / Below Threshold)
    [1]: = 1.0  (Threshold Level)
    [2]: ~ 1.3  (Low Exceedance)
    [3]: ~ 1.5  (Mild Exceedance)
    [4]: ~ 2.5  (Moderate Exceedance)
    [5]: > 5.0  (Critical Exceedance)
    ========================================================================================================================
    */

    // /* My Implimentation */const TableRow ACTION_TABLE[3] = { 

    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    // INDEX 0: PM2.5 (Target Unit: ug/m3)
    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    //                    [ <1.0  ,  1.0  ,  1.3  ,  1.5  ,  2.5  , >5.0 ]
    // /* My Implimentation */    /* Purifier Speed % */ {{ 0.0f , 12.5f , 18.8f , 24.7f , 50.2f , 100.0f }},
    // /* My Implimentation */    /* Exhaust Speed  % */ {{ 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f }},
    // // /* My Implimentation */    /* Valve Open State */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},
    // // /* My Implimentation */    /* AC Cooling     % */ {{ 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f }},
    // // /* My Implimentation */    /* AC Dry Mode     */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},
    // // /* My Implimentation */    /* Dehumidifier    */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},

    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    // INDEX 1: PM10 (Target Unit: ug/m3)
    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    //                    [ <1.0  ,  1.0  ,  1.3  ,  1.5  ,  2.5  , >5.0 ]
    // /* My Implimentation */    /* Purifier Speed % */ {{ 0.0f , 12.5f , 18.8f , 24.7f , 50.2f , 100.0f }},
    // /* My Implimentation */    /* Exhaust Speed  % */ {{ 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f }},
    // // /* My Implimentation */    /* Valve Open State */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},
    // // /* My Implimentation */    /* AC Cooling     % */ {{ 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f }},
    // // /* My Implimentation */    /* AC Dry Mode     */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},
    // // /* My Implimentation */    /* Dehumidifier    */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},

    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    // INDEX 2: CO (Target Unit: ppm)
    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    //                    [ <1.0  ,  1.0  ,  1.3  ,  1.5  ,  2.5  , >5.0 ]
    // /* My Implimentation */    /* Purifier Speed % */ {{ 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f }},
    // /* My Implimentation */    /* Exhaust Speed  % */ {{ 0.0f , 25.0f , 25.0f , 25.0f , 75.0f , 100.0f }},
    // // /* My Implimentation */    /* Valve Open State */ {{    0 ,     1 ,     1 ,     1 ,     1 ,      1 }},
    // // /* My Implimentation */    /* AC Cooling     % */ {{ 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f }},
    // // /* My Implimentation */    /* AC Dry Mode     */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},
    // // /* My Implimentation */    /* Dehumidifier    */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},

    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    // INDEX 3: CO2 (Target Unit: ppm)
    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    //                    [ <1.0  ,  1.0  ,  1.3  ,  1.5  ,  2.5  , >5.0 ]
    // // /* My Implimentation */    /* Purifier Speed % */ {{ 0.0f , 50.0f , 50.0f , 50.0f , 50.0f ,  50.0f }},
    // // /* My Implimentation */    /* Exhaust Speed  % */ {{ 0.0f , 50.0f , 54.0f , 58.8f , 75.0f , 100.0f }},
    // // /* My Implimentation */    /* Valve Open State */ {{    0 ,     1 ,     1 ,     1 ,     1 ,      1 }},
    // // /* My Implimentation */    /* AC Cooling     % */ {{ 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f }},
    // // /* My Implimentation */    /* AC Dry Mode     */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},
    // // /* My Implimentation */    /* Dehumidifier    */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},

    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    // INDEX 4: VOC (Target Unit: ppb)
    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    //                    [ <1.0  ,  1.0  ,  1.3  ,  1.5  ,  2.5  , >5.0 ]
    // // /* My Implimentation */    /* Purifier Speed % */ {{ 0.0f , 25.0f , 25.0f , 25.0f , 25.0f ,  25.0f }},
    // // /* My Implimentation */    /* Exhaust Speed  % */ {{ 0.0f , 25.0f , 31.0f , 37.6f , 75.0f , 100.0f }},
    // // /* My Implimentation */    /* Valve Open State */ {{    0 ,     1 ,     1 ,     1 ,     1 ,      1 }},
    // // /* My Implimentation */    /* AC Cooling     % */ {{ 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f }},
    // // /* My Implimentation */    /* AC Dry Mode     */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},
    // // /* My Implimentation */    /* Dehumidifier    */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},

    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    // INDEX 5: Temp (Target Unit: Deg C)
    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    //                    [ <1.0  ,  1.0  ,  1.3  ,  1.5  ,  2.5  , >5.0 ]
    // // /* My Implimentation */    /* Purifier Speed % */ {{ 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f }},
    // // /* My Implimentation */    /* Exhaust Speed  % */ {{ 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f }},
    // // /* My Implimentation */    /* Valve Open State */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      1 }},
    // // /* My Implimentation */    /* AC Cooling     % */ {{ 0.0f , 25.0f , 35.0f , 50.0f , 75.0f , 100.0f }},
    // // /* My Implimentation */    /* AC Dry Mode     */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},
    // // /* My Implimentation */    /* Dehumidifier    */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},

    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    // INDEX 6: Humidity (Target Unit: %RH)
    // /* My Implimentation */    // -----------------------------------------------------------------------------------------------------------------
    // /* My Implimentation */    //                    [ <1.0  ,  1.0  ,  1.3  ,  1.5  ,  2.5  , >5.0 ]
    // // /* My Implimentation */    /* Purifier Speed % */ {{ 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f }},
    // // /* My Implimentation */    /* Exhaust Speed  % */ {{ 0.0f ,  0.0f ,  0.0f , 50.0f , 75.0f , 100.0f }},
    // // /* My Implimentation */    /* Valve Open State */ {{    0 ,     0 ,     0 ,     0 ,     0 ,      0 }},
    // // /* My Implimentation */    /* AC Cooling     % */ {{ 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f }},
    // // /* My Implimentation */    /* AC Dry Mode     */ {{    0 ,     0 ,     1 ,     1 ,     1 ,      1 }},
    // // /* My Implimentation */    /* Dehumidifier    */ {{    0 ,     1 ,     1 ,     1 ,     1 ,      1 }}
    // /* My Implimentation */};


    /* My Implimentation */TableRow ACTION_TABLE[3] = { // this is an array whose elements are of type TableRow 

                            { // for ratio for pm2.5
                                { 0.0f , 12.5f , 18.8f , 24.7f , 50.2f , 100.0f }, // purifier different speeds
                                { 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f } // exhaust different speeds
                            },

                            { // for ratio for pm10
                                { 0.0f , 12.5f , 18.8f , 24.7f , 50.2f , 100.0f },
                                { 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f }
                            },

                            { // for ratio for co
                                { 0.0f ,  0.0f ,  0.0f ,  0.0f ,  0.0f ,   0.0f },
                                { 0.0f , 25.0f , 25.0f , 25.0f , 75.0f , 100.0f }
                            }
                        };




  
    int getColumnIndexFromTable(float ratio) {
        if (ratio < 1.0f) return 0;
        if (ratio < 1.3f) return 1;
        if (ratio < 1.5f) return 2;
        if (ratio < 3.0f) return 3; // adjust as per requirement
        if (ratio < 5.0f) return 4;
        return 5;
    }



    


    /* My Implimentation */struct ActuatorArrays {
    /* My Implimentation */    std::vector<float> purifier_speeds;
    /* My Implimentation */    std::vector<float> exhaust_speeds;
        // std::vector<bool>  valve_states;
        // std::vector<float> ac_cooling_levels;
        // std::vector<bool>  ac_dry_states;
        // std::vector<bool>  dehumidifier_states;
    /* My Implimentation */};
    
    /* My Implimentation */ActuatorArrays collectActuatorValues(const float ratios[3]) {
    /* My Implimentation */    ActuatorArrays candidate_values;

        // Loop through all 7 parameters (PM2.5, PM10, CO, CO2, VOC, Temp, Humidity)
    /* My Implimentation */    for (int param = 0; param < 3; param++) { // can be 7
    /* My Implimentation */        int col = getColumnIndexFromTable(ratios[param]);

       
    /* My Implimentation */        candidate_values.purifier_speeds.push_back(ACTION_TABLE[param].purifier[col]);
    /* My Implimentation */        candidate_values.exhaust_speeds.push_back(ACTION_TABLE[param].exhaust[col]);
            // candidate_values.valve_states.push_back(ACTION_TABLE[param].valve[col]);
            // candidate_values.ac_cooling_levels.push_back(ACTION_TABLE[param].ac[col]);
            // candidate_values.ac_dry_states.push_back(ACTION_TABLE[param].ac_dry[col]);
            // candidate_values.dehumidifier_states.push_back(ACTION_TABLE[param].dehumidifier[col]);
    /* My Implimentation */    }

    /* My Implimentation */    return candidate_values;
    /* My Implimentation */}




    /* My Implimentation */void setPurifierSpeed(float speed_pct) {
        // Convert percentage (0-100%) to 8-bit PWM duty (0-255)
    /* My Implimentation */    purifier_pwm = (uint8_t)map((long)speed_pct, 0, 100, 0, 255);
    /* My Implimentation */}

    /* My Implimentation */void setExhaustSpeed(float speed_pct) {
        // Convert percentage (0-100%) to 8-bit PWM duty (0-255)
    /* My Implimentation */    exhaust_pwm = (uint8_t)map((long)speed_pct, 0, 100, 0, 255);
    /* My Implimentation */}


    /* My Implimentation */void findValuesOfActuatorUsingRatios() {
    /* My Implimentation */    // purifier  <- get_priotised_value( from all purifier values coming to purifier)
    /* My Implimentation */    // exhaust   <- get_priotised_value( from all exhaust values coming to exhaust)
    /* My Implimentation */    // valve     <- get_priotised_value( from all valve values coming to value)
    /* My Implimentation */    // AC         <- get_priotised_value( from all AC values coming to AC)
    /* My Implimentation */    // dehumidifier  <- get_priotised_value( from all dehumidifier values coming to dehumidifier)

      



    /* My Implimentation */    float ratios[3] = { I_PM2_5, I_PM10, I_CO};//, I_CO2, I_VOC, I_Temp, I_Humidity };

        // Step A: Candidate Arrays Collect karna
    /* My Implimentation */    ActuatorArrays values = collectActuatorValues(ratios);

        // for simple i am prioritising max values
    /* My Implimentation */    float final_purifier = *std::max_element(values.purifier_speeds.begin(), values.purifier_speeds.end());
    /* My Implimentation */    float final_exhaust  = *std::max_element(values.exhaust_speeds.begin(), values.exhaust_speeds.end());
        // float final_ac       = *std::max_element(values.ac_cooling_levels.begin(), values.ac_cooling_levels.end());
        // bool final_valve    = std::any_of(values.valve_states.begin(), values.valve_states.end(), [](bool v) { return v; }); // agar koi bhi ek value true hui to true dega
        // bool final_ac_dry   = std::any_of(values.ac_dry_states.begin(), values.ac_dry_states.end(), [](bool v) { return v; });
        // bool final_dehum    = std::any_of(values.dehumidifier_states.begin(), values.dehumidifier_states.end(), [](bool v) { return v; });

   
    /* My Implimentation */    setPurifierSpeed(final_purifier);
    /* My Implimentation */    setExhaustSpeed(final_exhaust);
        // setFreshAirValve(final_valve);
        // setACCooling(final_ac);
        // setACDryMode(final_ac_dry);
        // setDehumidifier(final_dehum);
    /* My Implimentation */}





 
   
};

// documentation
void maxim_heart_rate_and_oxygen_saturation(
    uint32_t *pun_ir_buffer, int32_t n_ir_buffer_length, 
    uint32_t *pun_red_buffer, int32_t *pn_spo2, int8_t *pch_spo2_valid, 
    int32_t *pn_heart_rate, int8_t *pch_hr_valid
) {
    *pn_spo2 = 98;
    *pch_spo2_valid = 1;
    *pn_heart_rate = 75;
    *pch_hr_valid = 1;
}



// Currently Used Pins
// I2C (MAX30105): GPIO 21 (SDA), GPIO 22 (SCL)

// DHT Sensor: GPIO 4

// MQ-7 Sensor: GPIO 32 (Analog ADC), GPIO 23 (Heater PWM)

// SDS Dust Sensor (UART2): GPIO 16 (RX), GPIO 17 (TX)

// Existing Actuators: GPIO 18 (Purifier PWM), GPIO 19 (Exhaust PWM)

// Serial Debug (UART0): GPIO 1 (TX0), GPIO 3 (RX0)


// Available Free Pins for New Actuators
// mere pass 8 ideal GPIO pins available hain jinhe naye actuators (jaise Relay, Servo Valve, ya AC Speed Control PWM) ke liye use kiya ja sakta hai:

// GPIO 12, GPIO 13, GPIO 14, GPIO 27 (Recommended - PWM / Digital Outputs ke liye best hain)

// GPIO 25, GPIO 26 (DAC outputs, normal PWM ya relay digital control ke liye use ho sakte hain)

// GPIO 33 (Input / Output dono supports karta hai)

// GPIO 2 (On-board LED connected rehti hai, lekin digital output ke roop mein use ki ja sakti hai)

// Avoidable Pins: GPIO 34, 35, 36 (VP), aur 39 (VN) ko actuators ke liye use mat karein kyunki ye sirf Input-only pins hain (inpar Output/PWM kaam nahi karega). GPIO 6 to 11 internal flash memory ke liye reserved rehte hain.


// documentation
// ESP32 Pin Assignment
#define PIN_DHT            4
#define DHTTYPE            DHT22
#define PIN_CO_ANALOG      32
#define PIN_CO_HEATER      23
#define PIN_SDS_RX         16
#define PIN_SDS_TX         17
#define PIN_PURIFIER_PWM   18
#define PIN_EXHAUST_PWM    19
// documentation
// PWM Configuration
#define PWM_FREQ         5000
#define PWM_RESOLUTION   8
#define HEATER_PWM_CHAN  2
#define PURIFIER_PWM_CHAN 0
#define EXHAUST_PWM_CHAN  1
// documentation
// MQ-7 Calibration Constants
#define RL_VALUE         10.0f
float R0_CALIBRATED    = 10.0f;
unsigned long mq7Timer = 0;
bool isHighHeatPhase   = true;
bool isWarmupComplete  = false;
// documentation
// Sensor Health Status
bool isMaxSensorOK = false;
// documentation
// Sensor Objects
DHT dht(PIN_DHT, DHTTYPE);
MAX30105 particleSensor;
SdsDustSensor sds(Serial2);
// documentation
// MAX30102 Buffers
uint32_t irBuffer[100];
uint32_t redBuffer[100];
int32_t bufferLength = 100;
int32_t spo2_val;
int8_t validSPO2;
int32_t heartRate_val;
int8_t validHeartRate;

SystemData liveData;

// documentation
void setDutyCycleOn_GPIO_PIN(uint8_t pin, uint8_t channel, uint8_t duty) {
    //ledcWrite() function ESP32 ke hardware PWM (Pulse Width Modulation) 
    //signal generator ko instruction deta hai ki wo kisi GPIO pin par kitna Duty Cycle rakhega. isse hi frequency alag alag ki jati hai
    #if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
        ledcWrite(pin, duty);
    #else
        ledcWrite(channel, duty);
    #endif
}
// documentation
void setupPwmChannels() {
    #if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
        ledcAttach(PIN_PURIFIER_PWM, PWM_FREQ, PWM_RESOLUTION);
        ledcAttach(PIN_EXHAUST_PWM, PWM_FREQ, PWM_RESOLUTION);
        ledcAttach(PIN_CO_HEATER, PWM_FREQ, PWM_RESOLUTION);
    #else
        ledcSetup(PURIFIER_PWM_CHAN, PWM_FREQ, PWM_RESOLUTION);
        ledcAttachPin(PIN_PURIFIER_PWM, PURIFIER_PWM_CHAN);
        
        ledcSetup(EXHAUST_PWM_CHAN, PWM_FREQ, PWM_RESOLUTION);
        ledcAttachPin(PIN_EXHAUST_PWM, EXHAUST_PWM_CHAN);
        
        ledcSetup(HEATER_PWM_CHAN, PWM_FREQ, PWM_RESOLUTION);
        ledcAttachPin(PIN_CO_HEATER, HEATER_PWM_CHAN);
    #endif
}
// documentation
void calibrateMQ7() {
    float totalVoltage = 0;
    for (int i = 0; i < 50; i++) {
        int raw = analogRead(PIN_CO_ANALOG);
        totalVoltage += (raw / 4095.0f) * 3.3f;
        delay(10);
    }
    float avgVoltage = totalVoltage / 50.0f;
    if (avgVoltage > 0.05f && avgVoltage < 3.25f) {
        float rs_air = ((3.3f - avgVoltage) / avgVoltage) * RL_VALUE;
        R0_CALIBRATED = rs_air / 27.0f;
    }
}
// documentation
void updateMQ7Heater() {
    unsigned long currentMillis = millis();
    if (isHighHeatPhase && (currentMillis - mq7Timer >= 60000)) {
        isHighHeatPhase = false;
        mq7Timer = currentMillis;
        setDutyCycleOn_GPIO_PIN(PIN_CO_HEATER, HEATER_PWM_CHAN, 71); 
    } else if (!isHighHeatPhase && (currentMillis - mq7Timer >= 90000)) {
        isHighHeatPhase = true;
        if (!isWarmupComplete) {
            calibrateMQ7();
            isWarmupComplete = true;
        }
        mq7Timer = currentMillis;
        setDutyCycleOn_GPIO_PIN(PIN_CO_HEATER, HEATER_PWM_CHAN, 255);
    }
}
// documentation
float readCO_PPM() {
    updateMQ7Heater();

    if (!isWarmupComplete || isHighHeatPhase) return liveData.CO;

    int rawADC = analogRead(PIN_CO_ANALOG);
    float voltage = (rawADC / 4095.0f) * 3.3f;

    if (voltage < 0.05f || voltage >= 3.25f) return liveData.CO;

    float rs = ((3.3f - voltage) / voltage) * RL_VALUE;
    float ratio = rs / R0_CALIBRATED;
    
    if (ratio <= 0.0f) return liveData.CO;
    
    float ppm = 99.042f * pow(ratio, -1.518f);
    return std::max(0.0f, ppm);
}
// documentation
void readMAX30102(SystemData &data) {
    if (!isMaxSensorOK) return;

    static int sampleIdx = 0;
    particleSensor.check();

    while (particleSensor.available()) {
        redBuffer[sampleIdx] = particleSensor.getRed();
        irBuffer[sampleIdx] = particleSensor.getIR();
        particleSensor.nextSample();
        sampleIdx++;

        if (sampleIdx >= bufferLength) {
            maxim_heart_rate_and_oxygen_saturation(
                irBuffer, bufferLength, redBuffer, 
                &spo2_val, &validSPO2, 
                &heartRate_val, &validHeartRate
            );

            if (validSPO2 && spo2_val >= 70 && spo2_val <= 100) {
                data.spo2 = (float)spo2_val;
                data.max_error = false;
            } else {
                data.max_error = true;
            }

            if (validHeartRate && heartRate_val >= 30 && heartRate_val <= 220) {
                data.heart_rate = (float)heartRate_val;
            }

            for (int i = 25; i < 100; i++) {
                redBuffer[i - 25] = redBuffer[i];
                irBuffer[i - 25] = irBuffer[i];
            }
            sampleIdx = 75;
        }
    }
}
// documentation
void readOtherSensorsAndUpdate(SystemData &data) {
    float h = dht.readHumidity(); // Humidity
    float t = dht.readTemperature(); // temperature
    if (isnan(h) || isnan(t)) {
        data.dht_error = true;
        data.temp = data.temp; // sensor is not present in simulatio so using hard coded values
        data.humidity = data.humidity; // sensor is not present in simulatio so using hard coded values
    } else {
        data.humidity = h;
        data.temp = t;
        data.dht_error = false;
    }

    PmResult pm = sds.readPm();
    if (pm.isOk()) {
        data.PM2_5 = pm.pm25;
        data.PM10 = pm.pm10;
        data.sds_error = false;
    } else {
        data.PM2_5 = data.PM2_5;
        data.PM10 = data.PM10;
        data.sds_error = true;
    }

    data.CO = readCO_PPM(); // if sensor not present then return hardcoded value
}

/* My Implimentation */void executeActuatorCommands(const SystemData &data) { // this is updating the actuator
/* My Implimentation */    setDutyCycleOn_GPIO_PIN(PIN_PURIFIER_PWM, PURIFIER_PWM_CHAN, data.purifier_pwm);
/* My Implimentation */    setDutyCycleOn_GPIO_PIN(PIN_EXHAUST_PWM, EXHAUST_PWM_CHAN, data.exhaust_pwm); // currently i am having only two actuators
/* My Implimentation */}

void simulateSensorReadings(SystemData &data) {

    // SpO2: 70% se 100% (Sub-optimum < 95%, Critical < 85% test hoga)
    data.spo2 = 70.0f + (random(0, 3000) / 100.0f);

    // Heart Rate: 50 se 170 BPM (Optimum > 100 BPM, Sub-optimum > 140 BPM test hoga)
    data.heart_rate = 50.0f + (random(0, 12000) / 100.0f);

    // Temp: 10°C se 42°C (18°C - 32°C range se bahar ke values test honge)
    data.temp = 10.0f + (random(0, 3200) / 100.0f);

    // Humidity: 20% se 95% (Optimum max 70% ko cross karega)
    data.humidity = 20.0f + (random(0, 7500) / 100.0f);

    // PM2.5: 0.0 se 150.0 ug/m3 (High pollution triggers test karne ke liye)
    data.PM2_5 = (random(0, 15000) / 100.0f);

    // PM10: 0.0 se 250.0 ug/m3
    data.PM10 = (random(0, 25000) / 100.0f);

    // CO: 0.0 se 25.0 ppm
    data.CO = (random(0, 2500) / 100.0f);

    // Error flags simulation mode mein false
    data.dht_error = false;
    data.sds_error = false;
    data.max_error = false;
}
void processSystem() {


    simulateSensorReadings(liveData);// readOtherSensorsAndUpdate(liveData);

    // Updating individual sensor thresholds
    // liveData.adjust_static_Ts_to_dynamic(k_pm25, k_pm10, k_co);

    

    liveData.M = liveData.calculateM(liveData.SEVERITY_SCORE);
    liveData.V = liveData.calculateV(liveData.spo2, liveData.heart_rate);
    liveData.E = liveData.calculateE(liveData.temp, liveData.humidity);
    liveData.R = liveData.calculateR(liveData.M, liveData.V, liveData.E);

    liveData.T_PM2_5 = liveData.calculateT_s(liveData.T_normal_level_static_PM2_5, liveData.T_strict_level_static_PM2_5, liveData.R);
    liveData.T_PM10  = liveData.calculateT_s(liveData.T_normal_level_static_PM10, liveData.T_strict_level_static_PM10, liveData.R);
    liveData.T_CO    = liveData.calculateT_s(liveData.T_normal_level_static_CO, liveData.T_strict_level_static_CO, liveData.R);
    // later i will add more here like 
    //  t_co2
    //  t_voc

    liveData.calculateExceedanceRatios();
    liveData.findValuesOfActuatorUsingRatios();

    executeActuatorCommands(liveData);

    Serial.print("Live SEVERITY_SCORE: "); Serial.println(liveData.SEVERITY_SCORE);
    Serial.print("T_PM2.5: "); Serial.println(liveData.T_PM2_5);
    Serial.print("T_PM10: "); Serial.println(liveData.T_PM10);
    Serial.print("T_CO: "); Serial.println(liveData.T_CO);
    Serial.print("Live PM2.5: "); Serial.println(liveData.PM2_5);
    Serial.print("Live PM10: "); Serial.println(liveData.PM10);
    Serial.print("Live Temp: "); Serial.print(liveData.temp); Serial.println(" C");
    Serial.print("Live Humidity: "); Serial.print(liveData.humidity); Serial.println("%");
    Serial.print("Live HeartRate: "); Serial.println(liveData.heart_rate);
    Serial.print("Live SPO2: "); Serial.println(liveData.spo2);
    Serial.print("Live M(Medical Risk): "); Serial.println(liveData.M);
    Serial.print("Live V(Vital Risk): "); Serial.println(liveData.V);
    Serial.print("Live E(Environment Risk): "); Serial.println(liveData.E);
    Serial.print("Live R(Total Risk): "); Serial.println(liveData.R);
    Serial.print("PURIFIER_PMW: "); Serial.println(liveData.purifier_pwm);
    Serial.print("EXHAUST_PMW: "); Serial.println(liveData.exhaust_pwm);
    Serial.println("-----------------------------------");

    publishDatas(std::to_string(liveData.R));

}
/* ---------- SIMULATION MODE (Testing ke liye) ---------- */
// Ye single function hi sabkuch karta hai — real sensors (DHT, SDS, MQ7, MAX30105)
// ko replace karta hai aur har call pe values ko thoda random +/- shift karta hai.


void setup() {
    Serial.begin(115200);
    randomSeed(analogRead(0)); // ignore this line and you may alos delet this line

    connectToWiFi();

    Serial.println("\n--- Testing MQTT Servers ---");
    // testServerConnection(SERVER_1);
    testServerConnection(SERVER_2);
    Serial.println("--- Test MQTT Complete ---");

    mqttClient.setServer(SERVER_2, MQTT_PORT); // now actually connectting to mqtt server


    
    analogSetPinAttenuation(PIN_CO_ANALOG, ADC_11db);
    dht.begin();
    
    setupPwmChannels();
    setDutyCycleOn_GPIO_PIN(PIN_CO_HEATER, HEATER_PWM_CHAN, 255);
    
    Wire.begin(21, 22);
    if (!particleSensor.begin(Wire, 400000)) {
        isMaxSensorOK = false;
    } else {
        uint8_t ledBrightness = 60;
        uint8_t sampleAverage = 4;
        uint8_t ledMode = 2;
        uint8_t sampleRate = 100;
        int pulseWidth = 411;
        int adcRange = 4096;

        particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
        isMaxSensorOK = true;
    }
    
    Serial2.begin(9600, SERIAL_8N1, PIN_SDS_RX, PIN_SDS_TX);
    sds.begin();

    mq7Timer = millis();



}

void loop() {

    if (!mqttClient.connected()) {
        while (!mqttClient.connected()) {
            Serial.print("Connecting to MQTT...");
            if (mqttClient.connect(KIT_ID.c_str())) {
                Serial.println("connected");
            } else {
                Serial.print("failed, rc=");
                Serial.print(mqttClient.state());
                delay(2000);
            }
        }
        
    }
    mqttClient.loop();

    readMAX30102(liveData);
    
    // static unsigned long lastSystemUpdate = 0;
    // if (millis() - lastSystemUpdate >= 1000) {
        // lastSystemUpdate = millis();
        processSystem();
    // }
    delay(100);
}