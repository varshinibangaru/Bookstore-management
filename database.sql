
CREATE DATABASE IF NOT EXISTS bookstore;

USE bookstore;

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    author VARCHAR(100) NOT NULL,
    category VARCHAR(80) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0
);

INSERT INTO books (title, author, category, price, stock)
VALUES
('The Alchemist', 'Paulo Coelho', 'Fiction', 299.00, 12),
('Wings of Fire', 'A.P.J. Abdul Kalam', 'Biography', 250.00, 8),
('Java Programming', 'Herbert Schildt', 'Technology', 450.00, 15);
