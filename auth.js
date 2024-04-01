// auth.js

import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Define a secret key for JWT signing
const secretKey = process.env.json_secretKey; // Replace with your actual secret key

// Function to generate authentication token
const generateAuthToken = (userId) => {
  // Generate a JWT token with the user ID and secret key
  const token = jwt.sign({ userId }, secretKey, { expiresIn: '1h' }); // Token expires in 1 hour
  return token;
};

export default generateAuthToken;
