CREATE DATABASE IF NOT EXISTS dti_project 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE dti_project;

CREATE TABLE user_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATETIME NOT NULL
);

CREATE TABLE stock_names (
  name_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  full_name VARCHAR(255)
);

CREATE TABLE table_securities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  securitie_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

INSERT INTO user_info (date) VALUES ('2025-12-12 18:00:00');

INSERT INTO table_securities (user_id, securitie_id, quantity, price) VALUES
(1, 1, 1, 3000),
(1, 2, 2, 210),
(1, 3, 4, 120);