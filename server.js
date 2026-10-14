
const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "bookstore",
    waitForConnections: true,
    connectionLimit: 10
});

// Check that a book ID is valid
function validId(id) {
    return Number.isInteger(Number(id)) && Number(id) > 0;
}

// Get all books
app.get("/api/books", async (req, res) => {
    try {
        const [books] = await pool.query(
            "SELECT * FROM books ORDER BY id DESC"
        );
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get one book by ID
app.get("/api/books/:id", async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ message: "Invalid book ID." });
    }

    try {
        const [books] = await pool.execute(
            "SELECT * FROM books WHERE id = ?",
            [Number(req.params.id)]
        );

        if (books.length === 0) {
            return res.status(404).json({ message: "Book not found." });
        }

        res.json(books[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a book
app.post("/api/books", async (req, res) => {
    const { title, author, category, price, stock } = req.body;

    if (
        !title?.trim() ||
        !author?.trim() ||
        !category?.trim() ||
        price === "" ||
        price === undefined ||
        stock === "" ||
        stock === undefined ||
        !Number.isFinite(Number(price)) ||
        !Number.isInteger(Number(stock)) ||
        Number(price) < 0 ||
        Number(stock) < 0
    ) {
        return res.status(400).json({
            message: "Enter valid book details. Price and stock cannot be negative."
        });
    }

    try {
        const [result] = await pool.execute(
            `INSERT INTO books (title, author, category, price, stock)
             VALUES (?, ?, ?, ?, ?)`,
            [
                title.trim(),
                author.trim(),
                category.trim(),
                Number(price),
                Number(stock)
            ]
        );

        res.status(201).json({
            message: "Book added successfully!",
            id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a book
app.put("/api/books/:id", async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ message: "Invalid book ID." });
    }

    const { title, author, category, price, stock } = req.body;

    if (
        !title?.trim() ||
        !author?.trim() ||
        !category?.trim() ||
        price === "" ||
        price === undefined ||
        stock === "" ||
        stock === undefined ||
        !Number.isFinite(Number(price)) ||
        !Number.isInteger(Number(stock)) ||
        Number(price) < 0 ||
        Number(stock) < 0
    ) {
        return res.status(400).json({
            message: "Enter valid book details."
        });
    }

    try {
        const [result] = await pool.execute(
            `UPDATE books
             SET title = ?, author = ?, category = ?, price = ?, stock = ?
             WHERE id = ?`,
            [
                title.trim(),
                author.trim(),
                category.trim(),
                Number(price),
                Number(stock),
                Number(req.params.id)
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Book not found." });
        }

        res.json({ message: "Book updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a book
app.delete("/api/books/:id", async (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ message: "Invalid book ID." });
    }

    try {
        const [result] = await pool.execute(
            "DELETE FROM books WHERE id = ?",
            [Number(req.params.id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Book not found." });
        }

        res.json({ message: "Book deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Open the home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function startServer() {
    try {
        await pool.query("SELECT 1");
        console.log("MySQL connected successfully.");

        app.listen(PORT, () => {
            console.log(`BookBloom is running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Could not connect to MySQL:", error.message);
        console.error("Check MySQL is running and verify server.js credentials.");
    }
}

startServer();
