import mongoose,{model,models,Schema} from "mongoose";

const userSchema = new Schema(
    {
        _id: {type: String, required: true},
        name: {type: String, required: true},
        email: {type: String, required: true,unique: true},
        imageUrl: {type: String, required: true},
        cartItems: {type: Object, default: {}}
    },
    {
        minimize: false
    }
)

const User = models?.user || model("user",userSchema)

export default User;