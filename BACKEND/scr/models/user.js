import mongoose from "mongoose";
import passportLocalMongooseModule from "passport-local-mongoose";
const passportLocalMongoose = passportLocalMongooseModule.default;

const userschema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

userschema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userschema);

export default User;