import User from "../models/user.js";
import Meeting from "../models/meeting.js";
import passport from "passport";


const register = async (req, res) => {

    try {
        let { name, username, password } = req.body;
        let newUser = new User({ name, username })
        let register = await User.register(newUser, password)
        req.login(register, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                })
            }
            return res.status(201).json({
                success: true,
                user: register
            })
        })
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}


const login = async (req, res) => {
    passport.authenticate("local", (err, user, info) => {

        if (err) {
            return res.status(500).json({ message: err.message });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: info.message
            });
        }

        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            return res.json({
                success: true,
                user: user
            });
        });

    })(req, res);
};


const getUserHistory = async (req, res) => {
    const { u } = req.query;

    try {
        const user = await User.findOne({ username: u });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const meetings = await Meeting.find({
            user_id: user.username
        });

        return res.status(200).json(meetings);

    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};


const addtoHistory = async (req, res) => {
    const { token, meeting_code } = req.body;
    try {
        const user = await User.findOne({ username: token })
        const newMeeting = new Meeting({ user_id: user.username, meetingCode: meeting_code })
        await newMeeting.save()
        res.send("history added")
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }
}

const addParticipant = async (req, res) => {
    const { meetingCode, username } = req.body;

    try {
        if (!meetingCode || !username) {
            return res.status(400).json({
                message: "Meeting code and username are required"
            });
        }

        const result = await Meeting.updateMany(
            { meetingCode: meetingCode },
            {
                $addToSet: {
                    participants: username
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: "Meeting history not found"
            });
        }

        res.json({
            message: "Participant added",
            username,
            meetingCode
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


export { register, login, getUserHistory, addtoHistory, addParticipant }