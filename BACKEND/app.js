import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}


import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import connectToSocket from "./scr/controllers/socketManager.js";


import cors from "cors";
import { connect } from "node:http2";

import userRouter from "./scr/routes/userRouter.js";
import session from "express-session";

const app = express();

import MongoStore from "connect-mongo";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "./scr/models/user.js";


app.use(cors());
const server = createServer(app);
const io = connectToSocket(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: true
    }

});



app.set("port", 3030);
app.use(cors({
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: true
    }

}));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));


const store = MongoStore.create({
    mongoUrl: process.env.ATLASDB_URL,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
})
store.on("error", (err) => {
    console.log("ERROR IN MONGO SESSION STORE ", err)
})
app.use(session({
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() * 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}))

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(passport.initialize());
app.use(passport.session());

app.use("/", (req, res, next) => {
    res.locals.currentUser = req.user;
    next();
})

app.use("/api/v1/users", userRouter);

app.get("/", (req, res) => {
    res.send("ZOONA!!!");
})


main().then(() => { console.log("connection made with MongoDB...") })
    .catch((err) => {
        console.log(err)
    }).catch(err => {
        console.error("MongoDB connection error:", err);
    });

async function main() {
    await mongoose.connect(process.env.ATLASDB_URL)
}


server.listen(app.get("port"), () => {
    console.log("ZOONA LISTENING!!!");
})