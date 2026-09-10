import dotenv from "dotenv";

dotenv.config();

const config={
    PORT:process.env.PORT || 5000,
    MONGO_URI:process.env.MONGO_URI || "mongodb://127.0.0.1:27017/interviewsync",
    CLIENT_URL:process.env.CLIENT_URL || "http://localhost:5173",
    JWT_SECRET:process.env.JWT_SECRET,
    NODE_ENV:process.env.NODE_ENV || "development",
    CODE_EXECUTION_API_URL:process.env.CODE_EXECUTION_API_URL || "https://ce.judge0.com",
    CODE_EXECUTION_API_KEY:process.env.CODE_EXECUTION_API_KEY
}

export default config;

