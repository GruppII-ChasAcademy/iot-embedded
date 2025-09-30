import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv"; dotenv.config();
import { recent, pushRecent } from "./store/recent.js";
import "./mqtt.js"; // starta MQTT-konsument

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req,res)=>res.json({ok:true,time:new Date().toISOString()}));

app.get("/api/iot/recent", (req,res)=>{
  const limit = Math.max(1, Math.min(Number(req.query.limit)||20, 100));
  res.json(recent.slice(0,limit));
});

app.post("/api/iot/ingest",(req,res)=>{
  pushRecent({deviceId:req.body?.deviceId||"manual",payload:req.body,time:new Date().toISOString()});
  res.status(202).json({accepted:true});
});

const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log(`[Web] http://localhost:${port}`));
