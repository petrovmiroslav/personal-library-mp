/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});
const CONNECT_MONGODB = (done)=>{
  MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
    db.s.databaseName = "Advanced-Node";

    if(err) {
          console.log('Database error: ' + err);
      } else {
          console.log('Successful database connection');
        done(db);
      }

  });
};
module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      CONNECT_MONGODB((db)=>{
          db.collection("Library").find(/*req.query*/).toArray((err,data)=>{
            if(err) { 
              console.log(err);
              return res.redirect('/');
            }
            data.forEach((el)=>{
              el.commentcount = el.comments.length;
              delete el.comments;
            });
            return res.json(data);
          });
        });
    })
    
    .post(function (req, res){
      var title = req.body.title;
      //response will contain new book object including atleast _id and title
      if(!req.body.title) {
        return res.send('missing title');
      }
      CONNECT_MONGODB((db)=>{
          db.collection("Library").insertOne({title: title, comments: []}, function (err, data) {
            if(err) { 
              console.log(err);
              return res.redirect('/');
            }
            return res.json(data.ops[0]);
          });
      });
    })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
      CONNECT_MONGODB((db)=>{
          db.collection("Library").deleteMany({}, function (err,data) {
            if(err) { 
              console.log(err);
              return res.redirect('/');
            }
            return res.send('complete delete successful');
          });
      });
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      CONNECT_MONGODB((db)=>{
          db.collection("Library").findOne({_id: new ObjectId(bookid)}, function (err, data) {
            if(err) { 
              console.log(err);
              return res.redirect('/');
            }
            data === null ? (res.send('no book exists')) : ( res.json(data) );
          });
      });
    })
    
    .post(function(req, res){
      var bookid = req.params.id;
      var comment = req.body.comment;
      if(bookid.length < 24) {
        return res.send("Invalid ID");
      };
      //json res format same as .get
      CONNECT_MONGODB((db)=>{
          try{
            db.collection('Library').findAndModify(
                                      {_id:new ObjectId(bookid)},
                                      [['_id',1]],
                                      {$push: { comments: comment } },
                                      {new: true}
                                                     ,function (err, data) {
             if(err) { 
               console.log(err);
                return res.redirect('/');
              }
              
              data.value === null ? (res.send('no book exists')) : (res.json(data.value));
                                                       
            });
          } catch (err) {
            //res.redirect('/');       
            throw err;
          }

        });
    })
    
    .delete(function(req, res){
      var bookid = req.params.id;
      //if successful response will be 'delete successful'
      CONNECT_MONGODB((db)=>{
          if(!bookid){
            return res.send("_id error");   
          };
          if(bookid.length < 24) {
            return res.send("Invalid ID");
          };
          db.collection('Library').findOneAndDelete(
                                                    { _id:new ObjectId(bookid)}
                                                    ,function (err, data) {
              if(err) { 
                console.log(err);
                return res.send('could not delete '+bookid);
              }
              data.value === null ? (res.send('could not delete '+bookid)) : (res.send("delete successful"));                                   
          });
        });
    });
  
};
