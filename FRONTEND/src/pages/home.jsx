import React, { useEffect, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom"
import "../App.css"

import { toast } from "react-toastify";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from '@mui/icons-material/Restore';
import CloseIcon from '@mui/icons-material/Close';
import styles from '../styles/homeComponent.module.css'
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import servers from "../environment";
function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState(() => uuidv4());
    let [showModal, setShowModal] = useState();
    let [history, setHistory] = useState([]);
    const client = axios.create({
        baseURL: `${servers}/api/v1/users`
    })
    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_to_activity", {
                params: {
                    u: localStorage.getItem("user")
                }
            })
            return request.data
        } catch (e) {
            throw e;
        }
    }

    const addUserHistory = async (meetingCode) => {
        const request = await client.post("/add_to_activity", {
            token: localStorage.getItem("user"),
            meeting_code: meetingCode

        });
        return request.data;
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const h = await getHistoryOfUser();
                setHistory(h);
            } catch {

            }
        }
        fetchHistory()
    }, [])

    let formatDate = (date) => {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, "0")
        const month = (d.getMonth() + 1).toString().padStart(2, "0")
        const year = d.getFullYear()

        return `${day}/${month}/${year}`
    }

    const handleJoinVideoCall = async () => {
        try {
            await addUserHistory(meetingCode);
            localStorage.setItem("meetingCode", (meetingCode));
            navigate(`/${meetingCode}`);
        } catch (e) {
            console.error("Failed to add meeting history:", e);
        }
    };

    let handleModal = () => {
        setShowModal(!showModal);
    }


    return (
        <div className={styles.homeContainer}>
            {/* Navbar */}
            <nav className={styles.navbar}>
                <div className={styles.heading}>
                    <img src="/zoona.png" alt="Zoona Logo" />
                </div>

                <div className={styles.navButtons}>
                    <button
                        className={styles.historyBtn}
                        onClick={handleModal}
                    >
                        History
                    </button>


                    <button className={styles.logoutBtn} onClick={() => {
                        localStorage.removeItem("user"); navigate("/")
                        toast.success("Logout Successful!");
                    }}>Logout </button>
                </div>
            </nav>

            {/* Main section */}
            <main className={styles.hero}>
                {/* Left side: Meeting form */}
                <div className={styles.heroLeft}>
                    <h1 className={styles.heroTitle}>
                        Meet. Chat.
                        <br />
                        Have Fun!
                    </h1>

                    <p className={styles.heroText}>
                        Ready to meet?
                        Enter your meeting link below and join the fun!<br></br>

                        Link Suggestion:  <span style={{ fontFamily: "sans-serif" }}>  {meetingCode}</span></p>

                    <div className={styles.meetingForm}>
                        <TextField
                            label="Meeting Code"
                            variant="filled"
                            value={meetingCode}
                            onChange={(e) => setMeetingCode(e.target.value)}
                            fullWidth
                            sx={{
                                "& .MuiFilledInput-root": {
                                    backgroundColor: "rgba(255,255,255,0.25)",
                                    borderRadius: "10px",
                                },
                                "& .MuiInputLabel-root": {
                                    fontFamily: "Pixelify Sans, sans-serif",
                                },
                                "& .MuiInputBase-input": {
                                    fontFamily: "Pixelify Sans, sans-serif",
                                },
                            }}
                        />

                        <button
                            className={styles.joinBtn}
                            onClick={handleJoinVideoCall}
                        >
                            JOIN
                        </button>
                    </div>
                </div>

                {/* Right side: Illustration */}
                <div className={styles.heroRight}>
                    <img src="/img.jpeg"
                        alt="landing page image"
                        className={styles.heroImage}
                    />
                </div>
            </main>

            {/* History drawer */}
            <div
                className={`${styles.historyOverlay} ${showModal ? styles.historyOverlayOpen : ""
                    }`}
                onClick={handleModal}
            />

            <aside
                className={`${styles.historyDrawer} ${showModal ? styles.historyDrawerOpen : ""
                    }`}
            >
                <div className={styles.historyHeader}>
                    <h2>Meeting History</h2>
                    <IconButton onClick={handleModal}>
                        <CloseIcon></CloseIcon>
                    </IconButton>
                </div>

                <div className={styles.historyDisplay}>
                    {history.length > 0 ? (
                        history.slice().reverse().map((item, index) => (
                            <div
                                className={styles.historyItem}
                                key={index}
                            >
                                <p>
                                    <b>Meeting Code:</b>{" "}
                                    {item.meetingCode}
                                </p>

                                <p>
                                    <b>Participants:</b>{" "}
                                    {item.participants?.join(", ") ||
                                        "No participants"}
                                </p>

                                <p>
                                    <b>Date:</b>{" "}
                                    {new Date(item.date).toLocaleString(
                                        "en-IN",
                                        {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                        }
                                    )}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p>No meeting history yet.</p>
                    )}
                </div>
            </aside>
        </div>
    );
}

export default withAuth(HomeComponent)