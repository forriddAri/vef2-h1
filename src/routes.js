import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "./db.js";

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "supersecretkey";

// 🟢 REGISTER A NEW USER
router.post("/auth/register", async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Choose 'user' or 'admin'." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.create({
            data: { username, email, password: hashedPassword, role },
        });

        res.status(201).json({ message: "User registered successfully!", user: { id: user.id, username, email, role } });
    } catch (error) {
        res.status(400).json({ error: "User already exists or invalid data." });
    }
});

// 🟢 LOGIN A USER
router.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password." });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET, { expiresIn: "1h" });

    res.json({ message: "Login successful!", token });
});
import { authenticateUser, authorizeAdmin } from "./middleware.js";

// 🟢 PROTECTED ROUTE: View Profile
router.get("/profile", authenticateUser, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, username: true, email: true, role: true }
    });

    res.json(user);
});

// 🔴 ADMIN-ONLY ROUTE
router.get("/admin", authenticateUser, authorizeAdmin, async (req, res) => {
    res.json({ message: "Welcome, admin!" });
});

