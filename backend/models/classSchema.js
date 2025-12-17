const mongoose = require("mongoose");

const classSchema = mongoose.Schema({
    class: {
        type: String,
        required: true
    },
    section: { 
        type: [String],
        default:[]
    }

},{timestamps:true});


module.exports = mongoose.model("class",classSchema);