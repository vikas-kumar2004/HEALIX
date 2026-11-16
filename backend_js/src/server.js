




import express from "express";
import dotenv from "dotenv";
dotenv.config()
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import authRoutes from "./routes/auth.routes.js";
import updateRoutes from "./routes/update.routes.js";

import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { connectDB } from "./libs/db.js";

import { startMQTT_Protocol } from "./libs/mqtt_protocol.libs.js";



const app = express();
const PORT = process.env.PORT;

const __dirname = path.resolve();

app.use(express.json());
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    }),
);
app.use(cookieParser());

app.get("/devtest", (req, res) => {
    res.send("server is working");
    return
});

app.use("/api/auth", authRoutes);
app.use("/api/update", updateRoutes);


// app.use("{any}",(req, res) => {
//     res.status(404).send("invalid route");
//     return
// });


app.listen(PORT, async() => {
    try {
        await connectDB(); // iske ander try catch already hai and exit mechanism bhi
        startMQTT_Protocol();
        console.log(`server is running on ${PORT}`);
        
    } catch(e) {
        console.log("server fully closed: ",e);
        process.exit(1);
    }

});





