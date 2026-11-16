export function getLocation(cb) {
  try {
    navigator.geolocation.getCurrentPosition(
      p => cb({ lat: p.coords.latitude, lon: p.coords.longitude }),
      e => { throw e; }
    );
  } catch (err) {
    throw err;
  }
}



export function listenMotion(cb) {
  try {
    window.addEventListener("devicemotion", e => {
      cb(e.accelerationIncludingGravity);
    });
  } catch (err) {
    throw err;
  }
}

export function listenLight(cb) {
  try {
    if (!("AmbientLightSensor" in window)) {
      throw new Error("AmbientLightSensor not supported");
    }
    const s = new AmbientLightSensor();
    s.onreading = () => cb(s.illuminance);
    s.start();
  } catch (err) {
    throw err;
  }
}




export async function listenMic(cb) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    src.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    setInterval(() => {
      analyser.getByteFrequencyData(data);
      cb(Math.max(...data));
    }, 500);
  } catch (err) {
    throw err;
  }
}

export async function lightIntensityLevel(cb) {
    
}
export async function magneticFieldIntensityLevel(cb) {

}

export async function objectDetection(cb) {

}


