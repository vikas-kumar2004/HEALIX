


export function sendNotification(title, body) {  // AS NOTIFICATION IS ALSO TRIGERRING SOME ANSWER SO I CONSIDER IT IS AS A CONTROLLER THAT IS WHY I PUT THIS FUNCTION HERE
  try {
    if (!("Notification" in window)) throw new Error("This browser does not support notifications.");

    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") new Notification(title, { body });
      }).catch(err => { throw err; });
    } else {
      console.log("Notifications are denied by the user.");
    }
  } catch (err) {
    console.error("Notification error:", err);
    // throw err;
  }
}

// Example usage
// sendNotification("Health Alert", "High noise level detected!");





export function isNormalRangeFixedSensors(sensorName, sensorValue) {
    let normal = true;
    let message = { title: "", body: "" };

    // Define normal ranges for each sensor
    const ranges = {
        "SGP30": [0, 600],
        "Grove - GSR": [0, 600],
        "ADXL345": [0, 600],
        "Honeywell HPM series": [0, 600],
        "MQ-131": [0, 600],
        "EMF/RF Detector": [0, 600],
        "MiCS-6814": [0, 600],
        "Plantower PMS7003": [0, 600]
    };

    if (ranges[sensorName]) {
        const [min, max] = ranges[sensorName];
        if (sensorValue < min || sensorValue > max) {
            normal = false;
            message.title = "Alert: " + sensorName;
            message.body = `Value ${sensorValue} is out of range (${min}-${max})`;
        }
    } else {
        console.warn("No range defined for sensor:", sensorName);
    }

    return { isNormal: normal, message };
}

