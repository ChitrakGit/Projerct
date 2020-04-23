const mongoose = require('mongoose');

const docSchema = mongoose.Schema({
    oid: {
        type: String,
       
    },
    uploadedDocs: [{
        mimetype: {
            type: String,
           
        },
        encoding: {
            type: String,
           
        },
        metadata: {
            type: String, 
          
        },
        size: {
            type: String, 
           
        },
        originalname: {
            type: String, 
           
        },
        filename: {
            type: String, 
           
        },
        fileid: {
            type: String,
            
        }
    }]
});

const Document = mongoose.model('Document', docSchema, 'Documents Reference');

module.exports.Document = Document;