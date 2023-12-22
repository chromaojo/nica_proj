const User = `
CREATE TABLE IF NOT EXIST user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    account_id INT UNIQUE,
    FOREIGN KEY (account_id) REFERENCES Account(id)
  );
  
//   -- Create the Account table
  CREATE TABLE Account (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phoneNumber INT NOT NULL,
    gender varchar(255) DEFAULT NULL,
    account_number VARCHAR(255) NOT NULL UNIQUE,
    account_balance INT NOT NULL
  );
  

`;






module.exports = User;