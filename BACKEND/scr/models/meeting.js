import mongoose from "mongoose";


const meetingschema = new mongoose.Schema({
 user_id: {
    type: String
    },
    meetingCode: {
        type: String,
        required: true},

    participants: {
        type: [String],
        default: []
    },
    date: {
        type: Date,
        default: Date.now,
        required: true 
    }
});


const Meeting = mongoose.model("Meeting", meetingschema);

export default Meeting;