require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Middleware
app.use(
  cors({
    origin: "https://taradeshpande.com", // Allow only your frontend domain
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDir)); // Serve static image files

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Recipe Schema
const recipeSchema = new mongoose.Schema({
  recipeName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  ingredients: {
    type: String,
    required: true,
  },
  instructions: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
  },
  servings: {
    type: Number,
    required: true,
  },
  cookTime: {
    type: Number,
    required: true,
  },
  prepTime: {
    type: Number,
    required: true,
  },
  youtubeLink: {
    type: String,
  },
  language: {
    type: String,
  },
  category: {
    type: String,
    required: true,
  },
  status: {
    type: String,
  },
  image: {
    type: String,
    required: false,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  // You can add more fields as needed
});

const Recipe = mongoose.model("Recipe", recipeSchema);

// API Endpoints

// POST /api/recipes - Add a new recipe
app.post("/api/recipes", upload.single("image"), async (req, res) => {
  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const newRecipe = new Recipe({
      ...req.body,
      image: imageUrl,
    });
    const savedRecipe = await newRecipe.save();
    res.status(201).json(savedRecipe);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/recipes/:id - Update a recipe
app.put("/api/recipes/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedRecipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.json(updatedRecipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/recipes - Get all recipes
app.get("/api/recipes", async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/recipes/:id - Delete a recipe
app.delete("/api/recipes/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    await recipe.deleteOne();
    res.json({ message: "Recipe deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
