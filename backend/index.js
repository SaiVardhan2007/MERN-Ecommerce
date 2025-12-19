const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "secret_ecom";

app.use(express.json());
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
  "http://localhost:5173",
  "http://localhost:4000",
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (same-origin requests, curl, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const uploadDir = path.join(__dirname, "upload/images");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });

app.post("/upload", upload.single('product'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: 0, error: "No file uploaded" });
  }
  res.json({
    success: 1,
    image_url: `/images/${req.file.filename}`
  });
});

app.use('/images', express.static(path.join(__dirname, "upload/images")));

const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};

const Users = mongoose.model("Users", {
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  cartData: { type: Object },
  date: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number },
  old_price: { type: Number },
  date: { type: Date, default: Date.now },
  avilable: { type: Boolean, default: true },
});

app.get("/", (req, res) => {
  res.send("Root");
});

app.post('/login', async (req, res) => {
  try {
    console.log("Login");
    let success = false;
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
      const passCompare = req.body.password === user.password;
      if (passCompare) {
        const data = { user: { id: user.id } };
        success = true;
        const token = jwt.sign(data, JWT_SECRET);
        return res.json({ success, token });
      } else {
        return res.status(400).json({ success, errors: "please try with correct email/password" });
      }
    } else {
      return res.status(400).json({ success, errors: "please try with correct email/password" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.post('/signup', async (req, res) => {
  try {
    console.log("Sign Up");
    let success = false;
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
      return res.status(400).json({ success: false, errors: "existing user found with this email" });
    }
    let cart = {};
    for (let i = 0; i < 300; i++) cart[i] = 0;

    const user = new Users({
      name: req.body.username,
      email: req.body.email,
      password: req.body.password,
      cartData: cart,
    });
    await user.save();

    const data = { user: { id: user.id } };
    const token = jwt.sign(data, JWT_SECRET);
    success = true;
    res.json({ success, token });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.post('/getuser', fetchuser, async (req, res) => {
  try {
    let user = await Users.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error("getuser error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.get("/allproducts", async (req, res) => {
  try {
    let products = await Product.find({});
    console.log("All Products");
    res.send(products);
  } catch (err) {
    console.error("allproducts error:", err);
    res.status(500).send([]);
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    console.error("/api/products error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch products" });
  }
});

app.get("/newcollections", async (req, res) => {
  try {
    let products = await Product.find({});
    let arr = products.slice(0).slice(-8);
    console.log("New Collections");
    res.send(arr);
  } catch (err) {
    console.error("newcollections error:", err);
    res.status(500).send([]);
  }
});

app.get("/popularinwomen", async (req, res) => {
  try {
    let products = await Product.find({ category: "women" });
    let arr = products.slice(0, 4);
    console.log("Popular In Women");
    res.send(arr);
  } catch (err) {
    console.error("popularinwomen error:", err);
    res.status(500).send([]);
  }
});

app.post("/relatedproducts", async (req, res) => {
  try {
    console.log("Related Products");
    const { category } = req.body;
    const products = await Product.find({ category });
    const arr = products.slice(0, 4);
    res.send(arr);
  } catch (err) {
    console.error("relatedproducts error:", err);
    res.status(500).send([]);
  }
});

app.post('/addtocart', fetchuser, async (req, res) => {
  try {
    console.log("Add Cart");
    let userData = await Users.findOne({ _id: req.user.id });
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Added");
  } catch (err) {
    console.error("addtocart error:", err);
    res.status(500).send("Error");
  }
});

app.post('/removefromcart', fetchuser, async (req, res) => {
  try {
    console.log("Remove Cart");
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartData[req.body.itemId] != 0) {
      userData.cartData[req.body.itemId] -= 1;
    }
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Removed");
  } catch (err) {
    console.error("removefromcart error:", err);
    res.status(500).send("Error");
  }
});

app.post('/getcart', fetchuser, async (req, res) => {
  try {
    console.log("Get Cart");
    let userData = await Users.findOne({ _id: req.user.id });
    res.json(userData.cartData);
  } catch (err) {
    console.error("getcart error:", err);
    res.status(500).send("Error");
  }
});

app.post("/addproduct", async (req, res) => {
  try {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
      let last_product_array = products.slice(-1);
      let last_product = last_product_array[0];
      id = last_product.id + 1;
    } else { id = 1; }
    const product = new Product({
      id: id,
      name: req.body.name,
      description: req.body.description,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
    });
    await product.save();
    console.log("Saved");
    res.json({ success: true, name: req.body.name });
  } catch (err) {
    console.error("addproduct error:", err);
    res.status(500).json({ success: false });
  }
});

app.post("/removeproduct", async (req, res) => {
  try {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Removed");
    res.json({ success: true, name: req.body.name });
  } catch (err) {
    console.error("removeproduct error:", err);
    res.status(500).json({ success: false });
  }
});

const Coupon = mongoose.model("Coupon", {
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  minCartValue: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date },
  date: { type: Date, default: Date.now },
});

const Payment = mongoose.model("Payment", {
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  razorpay_order_id: { type: String, required: true },
  razorpay_payment_id: { type: String, required: true },
  razorpay_signature: { type: String, required: true },
  status: { type: String, default: 'completed' },
  date: { type: Date, default: Date.now },
});

app.post("/api/coupons/admin", async (req, res) => {
  try {
    const { code, discountType, discountValue, minCartValue, isActive, expiryDate } = req.body;
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }
    const coupon = new Coupon({
      code,
      discountType,
      discountValue,
      minCartValue: minCartValue || 0,
      isActive: isActive !== undefined ? isActive : true,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    });
    await coupon.save();
    console.log("Coupon Saved");
    res.json({ success: true, message: "Coupon created successfully", coupon });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ success: false, message: "Error creating coupon" });
  }
});

app.get("/api/coupons/admin", async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ date: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ success: false, message: "Error fetching coupons" });
  }
});

app.get("/api/coupons/admin/:id", async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.json({ success: true, coupon });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({ success: false, message: "Error fetching coupon" });
  }
});

app.put("/api/coupons/admin/:id", async (req, res) => {
  try {
    const { code, discountType, discountValue, minCartValue, isActive, expiryDate } = req.body;
    const existingCoupon = await Coupon.findOne({ code, _id: { $ne: req.params.id } });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        code,
        discountType,
        discountValue,
        minCartValue: minCartValue || 0,
        isActive: isActive !== undefined ? isActive : true,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
      { new: true }
    );
    if (!updatedCoupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    console.log("Coupon Updated");
    res.json({ success: true, message: "Coupon updated successfully", coupon: updatedCoupon });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ success: false, message: "Error updating coupon" });
  }
});

app.delete("/api/coupons/admin/:id", async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!deletedCoupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    console.log("Coupon Deleted");
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ success: false, message: "Error deleting coupon" });
  }
});

app.get("/api/coupons", async (req, res) => {
  try {
    const currentDate = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [
        { expiryDate: { $gt: currentDate } },
        { expiryDate: null }
      ]
    }).sort({ date: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    console.error("Error fetching active coupons:", error);
    res.status(500).json({ success: false, message: "Error fetching coupons" });
  }
});

app.post("/api/coupons/apply", async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code || cartTotal === undefined) {
      return res.status(400).json({ success: false, message: "Coupon code and cart total are required" });
    }
    const coupon = await Coupon.findOne({ code });
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon code" });
    }
    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: "Coupon is inactive" });
    }
    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return res.status(400).json({ success: false, message: "Coupon has expired" });
    }
    if (cartTotal < coupon.minCartValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum cart value of ${coupon.minCartValue} required`
      });
    }
    let discountAmount = 0;
    let finalTotal = cartTotal;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      finalTotal = cartTotal - discountAmount;
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
      finalTotal = cartTotal - discountAmount;
    }
    if (finalTotal < 0) {
      finalTotal = 0;
      discountAmount = cartTotal;
    }
    res.json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalTotal: Math.round(finalTotal * 100) / 100
      }
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ success: false, message: "Error applying coupon" });
  }
});

app.get("/allpayments", async (req, res) => {
  try {
    let payments = await Payment.find({}).sort({ date: -1 });
    console.log("All Payments");
    res.send(payments);
  } catch (err) {
    console.error("allpayments error:", err);
    res.status(500).send([]);
  }
});

app.post("/api/payment/checkout", async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const options = {
      amount: Number(req.body.amount * 100),
      currency: "INR",
    };
    const order = await instance.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/payment/paymentverification", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, amount } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");
    const isAuthentic = expectedSignature === razorpay_signature;
    if (isAuthentic) {
      const payment = new Payment({
        email: email || 'polampallisaivardhan1423@gmail.com',
        amount: amount || 0,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        status: 'completed'
      });
      await payment.save();
      console.log("Payment Saved");
      res.json({ success: true, paymentId: razorpay_payment_id });
    } else {
      res.status(400).json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.listen(PORT, (error) => {
  if (!error) console.log("Server Running on port " + PORT);
  else console.log("Error : ", error);
});