const crypto = require("crypto");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const express = require("express");



const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.set("view engine", "ejs");

const mongoURI = "mongodb://localhost:27017/node-file-upl";

// mongodb connection
    //connection for normal mongodb access
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology:true})
    .then(() => console.log("Connected to MongoDB"))
    .catch(() => console.log("Could not connect to MongoDB"));

    //connection for upload files
const conn = mongoose.createConnection(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//here the connection stream initialize named uploads 
let gfs;
conn.once("open", () => {
  // init stream
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads"
  });
});

    // create a storage to get or file information from html
// Storage
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString("hex") + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: "uploads"
          };
          resolve(fileInfo);
        });
      });
    }
  });
  
  ///here is the upload funtion intialized 
  const upload = multer({
    storage
  });

  // this db store a reference about the uploaded document like orginal name and size of the file 
  const {Document} = require('./document')

  app.get("/", (req, res) => {
    if(!gfs) {
      console.log("some error occured, check connection to db");
      res.send("some error occured, check connection to db");
      process.exit(0);
    }
    gfs.find().toArray((err, files) => {
      // check if files
      if (!files || files.length === 0) {
        return res.render("index", {
          files: false
        });
      } else {
        const f = files
          .map(file => {
            if (
              file.contentType === "image/png" ||
              file.contentType === "image/jpeg"
            ) {
              file.isImage = true;
            } else {
              file.isImage = false;
            }
            return file;
          })
          .sort((a, b) => {
            return (
              new Date(b["uploadDate"]).getTime() - new Date(a["uploadDate"]).getTime()
            );
          });
  
        return res.render("index", {
          files: f
        });
      }
    });
  });

app.post("/upload", upload.single("file"), async(req, res) => {
   // console.log(req.file);
    let document = await Document.findOne({oid: "123"});
   
  if (!document) {
     let document = new Document({
      oid: 123,
    })
    console.log("entry 1")
    try {
      let doc = await document.save();
      console.log(doc);
    } catch (e) {
      console.log(e);
      return res.status(500).send("Internal Server Error")
    }
  }

  try {
    let doc = await Document.findByIdAndUpdate(document._id, {
      $push: {
        uploadedDocs: {
          mimetype: req.file.mimetype,
          encoding: req.file.encoding,
          metadata: req.file.metadata,
          size: req.file.size,
          originalname: req.file.originalname,
          filename: req.file.filename,
          fileid: req.body.id
        }
      }
    }, { new: true } );
  } catch (e) {
    console.log(e);
    return res.status(500).send("Internal Server Error");
  }
    res.redirect("/");
  });

  //to download the file 
  app.get("/image/:filename", (req, res) => {
    // console.log('id', req.params.id)
    const file = gfs
      .find({
        filename: req.params.filename
      })
      .toArray((err, files) => {
        if (!files || files.length === 0) {
          return res.status(404).json({
            err: "no files exist"
          });
        }
        gfs.openDownloadStreamByName(req.params.filename).pipe(res);
      });
  });

  // to remove the file 
  app.post("/files/del/:id", (req, res) => {
    gfs.delete(new mongoose.Types.ObjectId(req.params.id), (err, data) => {
      if (err) return res.status(404).json({ err: err.message });
      res.redirect("/");
    });
  });





const port = 5001;
app.listen(port, () => {
  console.log("server started on " + port);
});