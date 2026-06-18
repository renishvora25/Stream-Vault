import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app=express();

//Do not forget to define cors origin before deployment
app.use(cors());
app.use(express.json({limit:"20kb"}));
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());


//import router 
import router from "./routes/user.routes.js";

// router declaration
app.use("/api/v1/users",router)

export default app;