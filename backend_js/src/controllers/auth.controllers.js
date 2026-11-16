
import { generateToken, verifyJwtToken } from "../libs/utils.js";

import User from "../models/user.models.js";
import bcrypt from "bcryptjs";


export const signup = async (req, res) => {


  const { name, email, password, kitid } = req.body;
  console.log("initial password at signup time: ", password)
  if (!name || !email || !password || !kitid) {
      console.log("All fields are required")
      return res.status(400).json({ message: "All fields are required" });
  }

  try {


    const user = await User.findOne({ email });

    if (user) {
      res.status(400).json({ message: "Email already exists" });
      console.log("Email already exists")
      return;
  }





    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: password,
      KIT_ID: kitid
  
    });

    if (newUser) {


      // generate jwt token here
      const newToken = generateToken(newUser._id); // only for _id

      res.cookie("jwt", newToken, {
        maxAge: 7 * 24 * 60 * 60 * 100,
        httpOnly: true, //prevet XSS attacts cross-site scripting attacts
        sameSite: process.env.MODE === "development" ? "lax" : "strict", //CSRF attacts  cross-site request forgery attacts
        secure: process.env.MODE === "development" ? false : true
      });

      await newUser.save();
      
      // 2. Mongoose document to plain object
      const userResponse = newUser.toObject();

      delete userResponse.password;

      res.status(201).json(userResponse);
    } else {
      res.status(404).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const login = async (req, res) => {
  console.log("arrive")
  // console.log(req.cookies)
  // console.log(req.cookies?.jwt)

  if (req.cookies && req.cookies.jwt) {

    try {

      const decoded = verifyJwtToken(req.cookies.jwt);
      console.log(decoded)
      const user = await User.findById(decoded._id);
      if (!user) {
        throw new Error("token expired")
      }
      const newToken = generateToken(user._id);
      res.cookie("jwt", newToken, {
        maxAge: 7 * 24 * 60 * 60 * 100,
        httpOnly: true, //prevet XSS attacts cross-site scripting attacts
        sameSite: process.env.MODE === "development" ? "lax" : "strict", //CSRF attacts  cross-site request forgery attacts
        secure: process.env.MODE === "development" ? false : true
      });

      const userResponse = user.toObject();

      delete userResponse.password;

      res.status(201).json(userResponse);

      

      return




    } catch (error) {
      //pass
      console.log(error.message)
    }
  }

  // if (!req.body) {
  //   return
  // }


  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid credentials user not find" });
    }
    // const isPasswordCorrect = await bcrypt.compare(password, user.password);
    // console.log("password at login time: ", user.password)
    // if (!isPasswordCorrect) {
    //   return res.status(400).json({ message: "Invalid Credentials" });
    // }





    const newToken = generateToken(user._id);
    res.cookie("jwt", newToken, {
      maxAge: 7 * 24 * 60 * 60 * 100,
      httpOnly: true, //prevet XSS attacts cross-site scripting attacts
      sameSite: process.env.MODE === "development" ? "lax" : "strict", //CSRF attacts  cross-site request forgery attacts
      secure: process.env.MODE === "development" ? false : true
    });

    const userResponse = user.toObject();

      delete userResponse.password;

      res.status(201).json(userResponse);

    
  } catch (error) {
    console.log("Error in login controller ", error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
  return;
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logout succesfully" });
  } catch (error) {
    console.log("Error in logout controller ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
