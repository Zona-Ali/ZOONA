import React, { useEffect, useRef, useState } from 'react'
import { Badge, IconButton, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CloseIcon from '@mui/icons-material/Close';
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat'
import styles from '../styles/videoComponent.module.css'
import io from "socket.io-client";
import axios from "axios";
import servers from '../environment';
const server_url = `${servers}`;
var connections = {};
const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {
    const server = `${servers}`;
    const client = axios.create({
        baseURL: `${server}/api/v1/users`
    })
    const addParticipantToHistory = async (username, meetingCode) => {
        try {
            const response = await axios.post(
                `${server}/api/v1/users/add_participant`,
                {
                    username: username,
                    meetingCode: meetingCode
                }
            );

        } catch (error) {
            console.log(error);
        }
    };
    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setShowModal] = useState();

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([]);

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [Username, setUsername] = useState(localStorage.getItem("user") || "");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // if(isChrome()===false){

    // }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true })

            if (videoPermission) {
                setVideoAvailable(true);
            } else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true })

            if (audioPermission) {
                setAudioAvailable(true);
            } else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream
                    }
                }
            }
        } catch (err) {
            console.log(err);
        }
    }


    useEffect(() => {
        getPermissions();
    }, [])

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [audio, video])

    let getUserMediaSuccess = (stream) => {
        try {

            window.localStream.getTracks().forEach(track => track.stop())

        } catch (e) { console.log(e) }

        window.localStream = stream;

        localVideoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
                    }).catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false)
            setAudio(false)

            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }


            let blackSlience = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSlience()
            localVideoRef.current.srcObject = window.localStream;


            for (let id in connections) {
                connections[id].addStream(window.localStream)
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketIdRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
                        }).catch(e => console.log(e))
                })
            }
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()

        let dst = oscillator.connect(ctx.createMediaStreamDestination())

        oscillator.start();
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e));
        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop())
            } catch (e) {

            }
        }
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId != socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === "offer") {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit("signal", fromId, JSON.stringify({ "sdp": connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }
        }

        if (signal.ice) {
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
        }
    }
    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };


    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', async () => {
            await addParticipantToHistory(
                Username,
                localStorage.getItem("meetingCode")
            );

            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }
    useEffect(() => {
        socketRef.current = io(server_url);

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    let routeTo = useNavigate();

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);

        connectToSocketServer();
    }
    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    let handleVideo = () => {
        setVideo(!video);
    }

    let handleAudio = () => {
        setAudio(!audio);
    }

    let handleScreen = () => {
        setScreen(!screen);
    }
    let handleModal = () => {
        setNewMessages(0);

        setShowModal(!showModal);
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            setMessages = [];
            setNewMessages(0);
        } catch (e) { console.log(e) };
        routeTo("/home")
    }

    let sendMessage = () => {
        socketRef.current.emit("chat-message", message, Username)
        setMessage("");

    }
    let getDislayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoRef.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoRef.current.srcObject = window.localStream

            getUserMedia()

        })
    }


    let getDisplayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }


    useEffect(() => {
        if (screen != undefined) {
            getDisplayMedia();
        }
    }, [screen])






    return (
        <div>
            {askForUsername === true ?
                <div className={styles.lobbyContainer}>
                    <nav className="landingPageNav">
                        <div className="zoona-logo float">
                            <img src="/zoona.png" alt="Zoona Logo" />
                        </div>

                        <div className="register">
                            <button
                                className="btn"
                                onClick={() => routeTo("/home")}
                            >
                                Back
                            </button>
                        </div>
                    </nav>

                    <div className={styles.lobbyMain}>
                        {/* Camera preview */}
                        <div className={styles.lobbyVideo}>
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                            />
                        </div>

                        {/* Lobby form */}
                        <div className={styles.lobbyForm}>

                            <p className={styles.lobbyWelcome}>
                                Welcome to the lobby! Enter your username and join the meeting.
                            </p>
                            {!localStorage.getItem("user") ? <p>Joining as Guest Your meeting link : {window.location.href}</p> : <></>}
                            <TextField
                                required
                                label="Username"
                                value={Username}
                                onChange={(e) => setUsername(e.target.value)}
                                variant="filled"
                                fullWidth
                                sx={{
                                    "& .MuiFilledInput-root": {
                                        backgroundColor: "transparent",
                                        borderRadius: "10px",
                                    },
                                    "& .MuiFilledInput-root:hover": {
                                        backgroundColor: "rgba(255,255,255,0.12)",
                                    },
                                    "& .MuiInputBase-input": {
                                        color: "#141413",
                                        fontFamily: "Pixelify Sans, sans-serif",
                                    },
                                    "& .MuiInputLabel-root": {
                                        color: "#fffbea",
                                        fontFamily: "Pixelify Sans, sans-serif",
                                    },
                                    "& .MuiInputLabel-root.Mui-focused": {
                                        color: "#2c2b26",
                                    },
                                    "& .MuiFilledInput-underline:before": {
                                        borderBottomColor: "#fffbea",
                                    },
                                    "& .MuiFilledInput-underline:after": {
                                        borderBottomColor: "#4d4c47",
                                    },
                                }}
                            />

                            <button
                                className={styles.btn}
                                onClick={connect}
                            >
                                Connect
                            </button>
                        </div>
                    </div>
                </div>
                :


                <div className={styles.meetVideoContainer}>
                    <div className={styles.meetingLayout}>
                        {/* Main video area */}
                        <div
                            className={`${styles.meetingArea} ${showModal ? styles.chatOpen : ""
                                } ${videos.length === 1
                                    ? styles.twoPeople
                                    : videos.length === 2
                                        ? styles.threePeople
                                        : styles.fourPeople
                                }`}
                        >
                            <div className={styles.conferenceView}>
                                {videos.map((video) => (
                                    <div className={styles.videoContainer} key={video.socketId}>
                                        <video
                                            autoPlay
                                            playsInline
                                            ref={(ref) => {
                                                if (
                                                    ref &&
                                                    video.stream &&
                                                    ref.srcObject !== video.stream
                                                ) {
                                                    ref.srcObject = video.stream;
                                                }
                                            }
                                            }

                                        />
                                    </div>
                                ))}
                            </div>

                            <div
                                className={`${styles.meContainer} ${videos.length === 3 ? styles.localGridTile : ""
                                    }`}
                            >
                                <video
                                    className={styles.meetUserVideo}
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                />
                            </div>
                        </div>

                        {/* Sliding chat panel */}
                        <div
                            className={`${styles.chatRoom} ${showModal ? styles.chatRoomOpen : ""
                                }`}
                        >
                            <div className={styles.chatHeader}>
                                <h2>Chat</h2>
                                <IconButton onClick={handleModal}>
                                    <CloseIcon />
                                </IconButton>
                            </div>

                            <div className={styles.chattingDisplay}>
                                {messages.length > 0 ? (
                                    messages.map((item, index) => (
                                        <div className={styles.chatMessage} key={index}>
                                            <p>{item.sender}</p>
                                            <span>{item.data}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p>No Messages Yet</p>
                                )}
                            </div>

                            <div className={styles.chattingArea}>
                                <TextField
                                    required
                                    fullWidth
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    label="Message"
                                    variant="outlined"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                />
                                <IconButton onClick={sendMessage}>
                                    <SendIcon />
                                </IconButton>
                            </div>
                        </div>
                    </div>

                    {/* Call controls */}
                    {/* Call controls - hidden when chat is open */}
                    {!showModal && (
                        <div className={styles.buttonContainer}>
                            <IconButton onClick={handleVideo}>
                                {video ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>

                            <IconButton
                                onClick={handleEndCall}
                                style={{ color: "rgb(194, 26, 26)" }}
                            >
                                <CallEndIcon />
                            </IconButton>

                            <IconButton onClick={handleAudio}>
                                {audio ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>

                            {screenAvailable && (
                                <IconButton onClick={handleScreen}>
                                    {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                                </IconButton>
                            )}

                            <Badge
                                badgeContent={newMessages}
                                max={999}
                                sx={{
                                    "& .MuiBadge-badge": {
                                        backgroundColor: "rgb(107, 81, 81)",
                                        color: "white",
                                    },
                                }}
                            >
                                <IconButton onClick={handleModal}>
                                    <ChatIcon />
                                </IconButton>
                            </Badge>
                        </div>
                    )}
                </div>

            }







        </div>
    )

}
