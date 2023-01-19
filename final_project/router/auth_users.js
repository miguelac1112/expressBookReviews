const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  let userswithsamename = users.filter((user)=>{
    return user.username === username
  });
  if(userswithsamename.length > 0){
    return true;
  } else {
    return false;
  }
}

const authenticatedUser = (username,password)=>{ //returns boolean
  let validusers = users.filter((user)=>{
    return (user.username === username && user.password === password)
  });
  if(validusers.length > 0){
    return true;
  } else {
    return false;
  }
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({message: "Error logging in"});
  }
  if (authenticatedUser(username,password)) {
    let accessToken = jwt.sign({
      username: username
    }, 'access', { expiresIn: 60 * 60 });

    req.session.authorization = {
      accessToken,username
    }
    return res.status(200).send("User successfully logged in");
  } else {
    return res.status(208).json({message: "Invalid Login. Check username and password"});
  }});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  if(req.session.authorization){
    token = req.session.authorization['accessToken'];
    jwt.verify(token, "access",(err,user)=>{
      if(!err){
        let isbn = req.params.isbn;
        let book = books[isbn];
        if (book) { //Check if book exists
          if (user.username) {
            let currentUser = user.username;
            let review = req.body.review;
            if(book.reviews[currentUser]) {
              book.reviews[currentUser] = review
            } else {
              book.reviews[currentUser] = review
            }
            books[isbn]=book;
            res.send(`Review for the book with ISBN  ${isbn} added/updated.`);
          } else {
            return res.status(403).json({message: "User not logged in"})
          }
        }
        else{
          res.send("Unable to find book!");
        }
      }
      else{
        return res.status(403).json({message: "User not authenticated"})
      }
    });
  }else{
    return res.status(403).json({message: "User not logged in"})
  }
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  if(req.session.authorization){
    token = req.session.authorization['accessToken'];
    jwt.verify(token, "access",(err,user)=>{
      if(!err){
        let isbn = req.params.isbn;
        let book = books[isbn];
        if(book){
          if (user.username){
            let currentUser = user.username;
            if(book.reviews[currentUser]) {
              delete book.reviews[currentUser]
              books[isbn]=book;
              res.send(`Book with ISBN ${isbn} was deleted.`);
            }else{
              res.send(`We don't find a review from you in book with ISBN ${isbn}.`);
            }
          }else {
            return res.status(403).json({message: "User not logged in"})
          }
        }else{
          res.send("Unable to find book!");
        }
      }else{
        return res.status(403).json({message: "User not logged in"})
      }
    });
  }else{
    return res.status(403).json({message: "User not logged in"})
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
