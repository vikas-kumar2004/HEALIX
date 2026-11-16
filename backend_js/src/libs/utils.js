import jwt from "jsonwebtoken";


export const generateToken = (_id) => {
  const token = jwt.sign({ _id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  
  return token;
};
export const verifyJwtToken = (jwtToken) => {
  const user = jwt.verify(jwtToken, process.env.JWT_SECRET)
  
  return user;
};













