import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  console.log("aya")
  const { Name, email, password } = req.body;
  try {
    if (!Name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      Name,
      email,
      password: hashedPassword,
    });

    if (newUser) {

      await newUser.save();

      const token = generateToken(newUser._id);

      res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 100,
        httpOnly: true, //prevet XSS attacts cross-site scripting attacts
        sameSite: "strict", //CSRF attacts  cross-site request forgery attacts
        secure: process.env.NODE_ENV !== "development",
      });

      res.status(201).json({
        _id: newUser._id,
        Name: newUser.Name,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const login = async (req, res) => {


  //handling fast login

  // Step 1: Find the cookie (this is what you asked for: "first find cookie")
  if (req.cookies && req.cookies.jwt) {
    try {
      let token = null;
      token = req.cookies.jwt;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = User.findOne(decoded._id);
      if (!user) {
        throw new Error("token expired")
      }

      const newtoken = generateToken(user._id);

      res.cookie("jwt", newtoken, {
        maxAge: 7 * 24 * 60 * 60 * 100,
        httpOnly: true, //prevet XSS attacts cross-site scripting attacts
        sameSite: "strict", //CSRF attacts  cross-site request forgery attacts
        secure: process.env.NODE_ENV !== "development",
      });

      res.status(200).json({
        _id: user._id,
        Name: user.Name,
        email: user.email,
        password: user.password,
        profilePic: user.profilePic,
      });

      return;


    } catch (error) {
      console.log(error.message)

    }
    console.log('Cookie found → token:', token.substring(0, 20) + '...'); // optional debug
  }

  if(!req.body) return;


  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials user not find" });
    }
    // const isPasswordCorrect = await bcrypt.compare(password, user.password);
    // if (!isPasswordCorrect) {
    //   return res.status(400).json({ message: "Invalid Credentials" });
    // }
    const token = generateToken(user._id);

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 100,
      httpOnly: true, //prevet XSS attacts cross-site scripting attacts
      sameSite: "strict", //CSRF attacts  cross-site request forgery attacts
      secure: process.env.NODE_ENV !== "development",
    });

    res.status(200).json({
      _id: user._id,
      Name: user.Name,
      email: user.email,
      password: user.password,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller ", error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
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
