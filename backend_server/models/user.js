import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 8 },
    phone: { 
      type: String, 
      required: false, 
      trim: true, 
      match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number'] 
    },
    role: { 
      type: String, 
      enum: ['user', 'admin', 'restaurant_owner'], 
      default: 'user' 
    },
  },
  { timestamps: true }
);

// Remove the password field from the returned user object when converting to JSON
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  }
});

const User = model('User', userSchema);

export default User;