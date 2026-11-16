// import mongoose from "mongoose";
// import bcrypt from "bcrypt";

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     password: {
//       type: String,
//       required: true,
//       minLength: 6,
//     },
//     availableFeatures: {
//       type: [Object],
//       default: undefined
//     },
//     problems: {
//       type: [String],
//       default: undefined
//     }
//   },
//   { timestamps: true },
// );


// userSchema.pre("save", async function () {
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//   } catch (error) {
//   }
// });

// userSchema.methods.matchPassword = async function (enteredPassword) {
//   const isPasswordCorrect = await bcrypt.compare(
//     enteredPassword,
//     this.password,
//   );
//   return isPasswordCorrect;
// };

// const User = mongoose.model("User", userSchema);

// export default User;



import mongoose from "mongoose";
// import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      // unique: true,
    },
    password: {
      type: String,
      required: true,
      // minLength: 6,
    },
    KIT_ID: { type: String, required: true, unique: true },
    SEVERITY_SCORE: { type: Number, default: 8.0 },
    OPTIMUM_SPO2_MIN: { type: Number, default: 95.0 },
    SUB_OPTIMUM_SPO2_MIN: { type: Number, default: 85.0 },
    OPTIMUM_HEART_RATE_MAX: { type: Number, default: 100.0 },
    SUB_OPTIMUM_HEART_RATE_MAX: { type: Number, default: 140.0 },
    OPTIMUM_TEMP_MIN: { type: Number, default: 18.0 },
    OPTIMUM_TEMP_MAX: { type: Number, default: 32.0 },
    OPTIMUM_HUMID_MAX: { type: Number, default: 70.0 },
    TOTAL_RISK_ARRAY: {type: [Number], default: []},
    updated_at: { type: Date, default: Date.now }
  },
  { timestamps: true },
);


// userSchema.pre("save", async function () {
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//   } catch (error) {
//   }
// });

// userSchema.methods.matchPassword = async function (enteredPassword) {
//   const isPasswordCorrect = await bcrypt.compare(
//     enteredPassword,
//     this.password,
//   );
//   return isPasswordCorrect;
// };

const User = mongoose.model("User", userSchema);

export default User;
