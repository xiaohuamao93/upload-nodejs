var express = require("express");
var router = express.Router();
var multer = require("multer");
var fs = require("fs");
var path = require("path");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images"));
  },
  filename: function (req, file, cb) {
    var str = file.originalname.split(".");
    cb(null, Date.now() + "." + str[1]);
  },
});
var upload = multer({ storage: storage });

/* GET users listing. */
router.post("/file", upload.single("file"), function (req, res, next) {
  res.send({
    code: 0,
    data: 'success'
  });
});



module.exports = router;
