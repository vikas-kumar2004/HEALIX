import User from "../models/User.js";
// sigup route all logic should be here
export async function signup(req, res) {
  res.send("singup route");
}


// login route all logic should be here
export async function login(req, res) {
  res.send("login route");
}

// logout route all logic should be here
export async function logout(req, res) {
  res.send("logout route");
}
