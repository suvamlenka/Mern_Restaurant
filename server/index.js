const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const Stripe = require('stripe')


const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 8080;

// MongoDB connection
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Connected to database"))
  .catch((err) => console.log("Database connection error:", err));

// Schema and model
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: { type: String, required: true },
  confirmPassword: { type: String, required: true },
  image: { type: String },
});

const User = mongoose.model("User", userSchema);

// API routes
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Signup route
app.post("/signup", async (req, res) => {
  const { email, firstName, password, confirmPassword } = req.body;

  // Check if the email, firstName, password, and confirmPassword are provided
  if (!email || !firstName || !password || !confirmPassword) {
    return res.status(400).send({ message: "Please fill in all required fields" });
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).send({ message: "Passwords do not match" });
  }

  try {
    // Check if the email is already registered
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).send({ message: "Email is already registered",  alert: false });
    }

    // Create and save the new user
    const newUser = new User({
      firstName,
      lastName: req.body.lastName, // Optional field
      email,
      password, // Ideally, you should hash the password before saving it
      confirmPassword, // Optional field
      image: req.body.image, // Optional field
    });
    await newUser.save();

    res.send({ message: "Successfully signed up", alert: true });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});


//api login
app.post("/login", async (req, res) => {
  const { email, password } = req.body; // Extract email and password from request body

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: "Email not registered, please sign up", alert: false });
    }

    // Check if the provided password matches the stored password
    if (user.password !== password) { // Plain password comparison
      return res.status(400).send({ message: "Invalid password, please try again", alert: false });
    }

    // Prepare data to send back
    const dataSend = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      image: user.image,
    };

    res.send({ message: "Login successful", alert: true, data: dataSend });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});



//product section

const schemaProduct = mongoose.Schema({
  name: String,
  category:String,
  image: String,
  price: String,
  description: String,
});
const productModel = mongoose.model("product",schemaProduct)

//save product in data
//api

app.post("/uploadProduct", async(req, res)=>{
   //console.log(req.body);
   const data = await productModel(req.body)
    const datasave = await data.save()
   res.send({message : "upload successfully"})
})


//
app.get("/product",async(req,res)=>{
  const data = await productModel.find({})
  res.send(JSON.stringify(data))
})
 

/*****payment getWay */
console.log(process.env.STRIPE_SECRET_KEY)


const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post("/create-checkout-session",async(req,res)=>{

     try{
      const params = {
          submit_type : 'pay',
          mode : "payment",
          payment_method_types : ['card'],
          billing_address_collection : "auto",
          shipping_options : [{shipping_rate : "shr_1Q8z21P3U17uDjq8hNatHHVy"}],

          line_items : req.body.map((item)=>{
            return{
              price_data : {
                currency : "usd",
                product_data : {
                  name : item.name,
                  // images : [item.image]
                },
                unit_amount : item.price * 100,
              },
              adjustable_quantity : {
                enabled : true,
                minimum : 1,
              },
              quantity : item.qty
            }
          }),

          success_url : `${process.env.FRONTEND_URL}/success`,
          cancel_url : `${process.env.FRONTEND_URL}/cancel`,

      }

      
      const session = await stripe.checkout.sessions.create(params)
      // console.log(session)
      res.status(200).json(session.id)
     }
     catch (err){
        res.status(err.statusCode || 500).json(err.message)
     }

})


app.listen(PORT, () => console.log("Server is running on port:", PORT));
