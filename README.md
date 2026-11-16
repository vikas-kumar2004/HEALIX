# Environment Monitor Controller

## version 2.0

A full-stack IoT application for real-time indoor environment controller for patients using ESP32 microcontrollers, sensor, actuators, MQTT protocol, and a web-based dashboard.

---

### 1. Sensors used

- spo2 sensor
- heart rate sensor
- temperature sensor
- humidity sensor
- pm2.5 sensor
- pm10 sensor
- co sensor

### 2. Basic Parameters doctors will set for a patient

- SEVERITY_SCORE
- OPTIMUM_SPO2_MIN
- SUB_OPTIMUM_SPO2_MIN
- OPTIMUM_HEART_RATE_MAX
- SUB_OPTIMUM_HEART_RATE_MAX
- OPTIMUM_TEMP_MIN
- OPTIMUM_TEMP_MAX
- OPTIMUM_HUMID_MAX

### 3. Advanced Parameters set by the W.H.O. for the patients

| pollutant | safe level(MAX) at strict risks | safe level (MAX) at normal risks |
| :--- | :--- | :--- |
| PM2.5 level | 5 | 15 |
| PM10 level | 15 | 45 |
| CO level | 4 | 4 |

### 4. Medical direct risk

```
MEDICAL RISK = SEVERITY_SCORE / 10
```

### 5. Vital risks

```
SPO2 RISK = 1 if spo2 < 85
        (95.0f - spo2_val) / 10 if spo2_val >= SUB_OPTIMUM_SPO2_MIN
        0 if spo2_val >= OPTIMUM_SPO2_MIN

HEART RATE RISK = 1 if spo2_val < SUB_OPTIMUM_SPO2_MIN
              (hr_val - 100.0f) / 40 if hr_val <= SUB_OPTIMUM_HEART_RATE_MAX
              0 if hr_val <= OPTIMUM_HEART_RATE_MAX

VITAL RISK = 0.7 * (SPO2 RISK) + 0.3 * (HEART RATE RISK)
```

### 6. Environmental risks

```
TEMPERATURE RISK = 0 if 32 > temp > 18
         0.5 else

HUMIDITY RISK = 0.5 if humid > 70
          0 else

ENVIRONMENTAL RISK = TEMPERATURE RISK + HUMIDITY RISK
```

### 7. Total risks

```
R = 0.5 * MEDICAL RISK + 0.3 * VITAL RISK + 0.2 * ENVIRONMENTAL RISK
```

### 8. Dynamically adjusting/varying W.H.O. thresholds between strict and normal based on Total Risk

```
PEAK VALUE for a person = (normal prescribed w.h.o. value) - Risk * (range between strict and normal value of w.h.o.)

T_pm2.5 = T_2.5_normal - R * (T_pm2.5_normal - T_pm2.5_strict)
T_pm10 = T_pm10_normal - R * (T_pm10_normal - T_pm10_strict)
T_co = T_co_normal - R * (T_co_normal - T_co_strict)
```

### 9. Trigger ratios


trigger ratio = (REALTIME SENSOR VALUE) / (CALCULATED THEORETICAL PEAK VALUE)
 

trigger ratios less than one means completely safe conditions

```
I_pm2.5 = pm2.5 / T_pm2.5
I_pm10 = pm10 / T_pm10
I_co = co / T_co
```

### 10. Realtime ratios table for decision of actuators

| Parameter Index | Ratio < 1 | Ratio = 1.0 | Ratio ≈ 1.3 | Ratio ≈ 1.5 | Ratio ≈ 2.5 | Ratio > 5.0 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **I<sub>PM2.5</sub>** | All actuators OFF | Purifier at 12.5% speed | Purifier at 18.8% speed | Purifier at 24.7% speed | Purifier at 50.2% speed | Purifier at 100% speed |
| **I<sub>PM10</sub>** | All actuators OFF | Purifier at 12.5% speed | Purifier at 18.8% speed | Purifier at 24.7% speed | Purifier at 50.2% speed | Purifier at 100% speed |
| **I<sub>CO</sub>** | All actuators OFF | Exhaust 25% speed<br>Valve open | Exhaust 25% speed<br>Valve open | Exhaust 25% speed<br>Valve open | Exhaust 75% speed<br>Valve open | Exhaust 100% speed<br>Valve open |
| **I<sub>CO2</sub>** | All actuators OFF | Purifier 50% speed<br>Exhaust 50% speed<br>Valve open | Purifier 50% speed<br>Exhaust 54% speed<br>Valve open | Purifier 50% speed<br>Exhaust 58.8% speed<br>Valve open | Purifier 50% speed<br>Exhaust 75% speed<br>Valve open | Purifier 50% speed<br>Exhaust 100% speed<br>Valve open |
| **I<sub>VOC</sub>** | All actuators OFF | Purifier 25% speed<br>Exhaust 25% speed<br>Valve open | Purifier 25% speed<br>Exhaust 31% speed<br>Valve open | Purifier 25% speed<br>Exhaust 37.6% speed<br>Valve open | Purifier 25% speed<br>Exhaust 75% speed<br>Valve open | Purifier 25% speed<br>Exhaust 100% speed<br>Valve open |
| **I<sub>Temp</sub>** | All actuators OFF | AC 25% cooling | AC 35% cooling | AC 50% cooling | AC 75% cooling | AC 100% turbo cooling<br>Valve open |
| **I<sub>Humidity</sub>** | All actuators OFF | Dehumidifier ON | Dehumidifier ON<br>AC Dry Mode ON | Dehumidifier ON<br>AC Dry Mode ON<br>Exhaust 50% speed | Dehumidifier ON<br>AC Dry Mode ON<br>Exhaust 75% speed | Dehumidifier ON<br>AC Dry Mode ON<br>Exhaust 100% speed |

### 11. Update the information of total-risk on the cloud so that track of risks is saved

### 11.A Backend API


```
POST api/auth/signup

{ name, email, password, kitid, role, doctoremail }

email : must be unique
kitid : must be required(if role is not doctor) and unique
doctoremail : must be required(if role is not doctor) and unique
```

```
POST api/auth/login

req.cookies.jwt
```

```
POST api/auth/logout

res.cookie
```

```
POST /api/update/personal-details
verify :
{
email,
patient_jwt
}
then update
{
name
}
```

```
POST /api/update/medical-detals
verify :
{
email,
doctoremail,
doctor_jwt,
}
then update
{

SEVERITY_SCORE,
OPTIMUM_SPO2_MIN,
SUB_OPTIMUM_SPO2_MIN,
OPTIMUM_HEART_RATE_MAX,
SUB_OPTIMUM_HEART_RATE_MAX,
OPTIMUM_TEMP_MIN,
OPTIMUM_TEMP_MAX,
OPTIMUM_HUMID_MAX
}

these can only be updated by doctors
```

```
app.listen({
        connect this server to db
        connect this server to broker of mqtt and become a subscriber of kits
        append risk value on db which are coming from publisher kits
})
```

### 11.B Frontend Client

```
After Signup/Login Succees Frontend User gets :
{
    name,
    email,
    KIT_ID,
    SEVERITY_SCORE: default: 5.0 ,
    OPTIMUM_SPO2_MIN: default: 95.0 ,
    SUB_OPTIMUM_SPO2_MIN: default: 85.0 ,
    OPTIMUM_HEART_RATE_MAX: default: 100.0 ,
    SUB_OPTIMUM_HEART_RATE_MAX: default: 140.0 ,
    OPTIMUM_TEMP_MIN: default: 18.0 ,
    OPTIMUM_TEMP_MAX: default: 32.0 ,
    OPTIMUM_HUMID_MAX: default: 70.0 ,
    TOTAL_RISK_ARRAY: default: []
  }
```



### 12. Technologies used

- ESP32: based kit for each user to collect and process sensor data and control the actuators.
- MQTT: based broker used for updating the risks data frequently on cloud for each 10 seconds.
- NodeJs: is being used as backend for users to update the meta data of users.
- ReactJs: is being used as frontend for updating and viewing users profile and track of risk.

---

## Author

**Shivam Kumar**
- IoT Developer & Full-Stack Engineer
- Project developed as part of an IoT environmental monitoring system
- [GitHub](https://github.com/shivam3050) | [Email](mailto:shivamkumar30508209@gmail.com)