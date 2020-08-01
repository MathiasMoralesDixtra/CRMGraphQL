const User = require("../models/User");
const Product = require("../models/Product");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "variables.env" });

const createToken = (user, secret, expiresIn) => {
  const { id, email, name, surname } = user;
  return jwt.sign({ id, email, name, surname }, secret, {
    expiresIn,
  });
};
//Resolvers
const resolvers = {
  Query: {
    getUser: async (_, { token }) => {
      const userId = await jwt.verify(token, process.env.SECRET);
      return userId;
    },
  },
  Mutation: {
    newUser: async (_, { input }) => {
      const { email, password } = input;
      //Check if the user is already registered
      const userExist = await User.findOne({ email });
      if (userExist) {
        throw new Error("The user already exist");
      }
      //Hash Password
      const salt = await bcryptjs.genSalt(10);
      input.password = await bcryptjs.hash(password, salt);
      //Save on DB
      try {
        const user = new User(input);
        user.save();
        return user;
      } catch (error) {
        console.log("Occurred an error to save the user.", error);
      }
    },
    authUser: async (_, { input }) => {
      //Check if the user is already registered
      const { email, password } = input;
      const userExist = await User.findOne({ email });
      if (!userExist) {
        throw new Error("The user not exist");
      }
      // Check password
      const correctPassword = await bcryptjs.compare(
        password,
        userExist.password
      );
      if (!correctPassword) {
        throw new Error("Incorrect password");
      }
      //Create Token
      return {
        token: createToken(userExist, process.env.SECRET, "24h"),
      };
    },
    newProduct: async (_, { input }) => {
      try {
        const newProduct = new Product(input);
        //Save
        const result = await newProduct.save();

        return result;
      } catch (error) {
        console.log("Occurred an error to save the product.", error);
      }
    },
  },
};

module.exports = resolvers;
