require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

connectDB();

const app = express();
const isAllowedOrigin = (origin) => {
		if (!origin) return true;
		return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
			|| /^https:\/\/[\w-]+\.onrender\.com$/.test(origin);
	};

	app.use(cors({
		origin(origin, callback) {
			if (isAllowedOrigin(origin)) {
				callback(null, true);
				return;
			}

			callback(new Error("Not allowed by CORS"));
		}
	}));
app.use(express.json());

// Serve static files from the parent directory (frontend)
app.use(express.static(path.join(__dirname, '../')));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Global error handler — ensures errors always return JSON, not HTML
app.use((err, req, res, next) => {
	if (err) {
		const status = err.status || 500;
		res.status(status).json({ message: err.message || "Internal server error" });
		return;
	}
	next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
