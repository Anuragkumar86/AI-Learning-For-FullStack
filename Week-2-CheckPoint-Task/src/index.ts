import express from "express"
import dotenv from "dotenv"
import allRoute from "./routes/route"

dotenv.config();
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString() 
  };

  try {
    res.status(200).json(healthStatus);
  } catch (error: any) {
    res.status(503).json({ status: 'DOWN', error: error.message });
  }
});


app.use("/ai", allRoute)

app.listen(PORT, () =>{
    console.log(`App is Listening on port ${PORT}`)
})