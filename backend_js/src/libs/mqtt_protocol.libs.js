import User from "../models/user.models.js";


const appendRiskValue = async (KIT_ID, R) => {
  try {
    const updateResult = await User.updateOne(
      { KIT_ID: KIT_ID },
      {
        $push: {
          TOTAL_RISK_ARRAY: {
            $each: [Number(R)],        
            $slice: -1000
          }
        },
        $set: { updated_at: new Date() }
      }
    );

    if (updateResult.matchedCount === 0) {
      console.warn(`[MongoDB Warning]: No user found matching KIT_ID: ${KIT_ID}`);
      return false;
    }

    console.log(`[MongoDB Success]: Appended Risk (${R}) for KIT_ID: ${KIT_ID}`);
    return true;

  } catch (error) {
    console.error(`[MongoDB Error]: Failed to append risk for ${KIT_ID}:`, error.message);
    throw error;
  }
};







import mqtt from "mqtt"

export const startMQTT_Protocol = () => {


    const client = mqtt.connect("mqtt://broker.hivemq.com")//'mqtt://18.184.120.97:1883');//process.env.MQTT_URI);
    const TOPIC_PATTERN = 'KIT_NODE/+';  // '+' matches koi bhi single word

    client.on('connect', () => {
        console.log('Connected to MQTT broker');
        client.subscribe(TOPIC_PATTERN, (err) => {
            if (!err) console.log('Subscribed to all kits:', TOPIC_PATTERN);
            else console.log("mqtt se error at initail: ",err)
        });
    });

    client.on('message', async (topic, message) => {
        const KIT_ID = topic;
        const payload = JSON.parse(message.toString());
        console.log(`Received from ${topic}:`, payload.R);
        const R = payload.R;

        if (R === undefined || R === null) {
        console.warn(`[MQTT Warning]: Field 'R' is missing in payload from ${KIT_ID}`);
        return;
        }

        // Append risk to MongoDB
        await appendRiskValue(KIT_ID, R);
    });

    client.on('error', (err) => {
        console.error('MQTT error:', err);
    });

};