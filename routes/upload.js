var express = require("express");
var router = express.Router();
var multer = require("multer");
var fs = require("fs");
var path = require("path");
var fse = require("fs-extra");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // cb(null, "../public/images");
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
  res.send("respond with a resource");
});

// 用于检测是否存在用于存放文件的路径，不存在则创建路径
const createFolder = function (folder) {
  try {
    fs.accessSync(folder);
  } catch (e) {
    fs.mkdirSync(folder);
  }
};
// 文件上传的路径
var uploadFolder = "./uploads/";
createFolder(uploadFolder);

// 用于传给multer进行复杂的文件上传配置
var storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    // 用于进行复杂的路径配置，此处考虑分片上传，先将分片文件保存在临时目录中
    let [fname, index, fext] = file.originalname.split(".");
    // let chunkDir = `${uploadFolder}/${fname}`;
    let chunkDir = path.join(__dirname, `../public/images2/${fname}`);
    if (!fse.existsSync(chunkDir)) {
      fse.mkdirsSync(chunkDir);
    }
    cb(null, chunkDir);
  },
  filename: function (req, file, cb) {
    // 根据上传的文件名，按分片顺序用分片索引命名，
    // 由于是分片文件，请不要加扩展名，在最后文件合并的时候再添加扩展名
    let fname = file.originalname;
    cb(null, fname.split(".")[1]);
  },
});

var upload2 = multer({ storage: storage2 }); // multer实例

// 切片
router.post("/file3", upload2.single("file"), function (req, res, next) {
  res.send({ code: 0, data: "success" });
});

// 文件合并路由
router.get("/merge", upload2.none(), function (req, res) {
  // let name = req.query.fileName;
  // let fname = name.split(".")[0];
  // let chunkDir = path.join(__dirname, `../public/images2/${fname}`);
  //
  // let chunks = fs.readdirSync(chunkDir); // 同步读取以防文件合并顺序混乱
  //
  // chunks
  //   .sort((a, b) => a - b)
  //   .map((chunkPath) => {
  //     fs.appendFileSync(chunkDir, fs.readFileSync(`${chunkDir}/${chunkPath}`));
  //   });
  //
  // fse.removeSync(chunkDir);
  // res.send({
  //   msg: "合并成功",
  //   url: `http://localhost:3000/public/images2/${name}`,
  // });

  const { fileName } = req.query
  let fname = fileName.split(".")[0];
  // 上传文件最终路径
  const STATIC_FILES = path.join(__dirname, '../public/images')
  try {
    let len = 0
    let chunkDir = path.join(__dirname, `../public/images2/${fname}`);
    const bufferList = fs.readdirSync(`${chunkDir}`).map((hash,index) => {
      const buffer = fs.readFileSync(`${chunkDir}/${index}`)
      len += buffer.length
      return buffer
    });
    //合并文件
    const buffer = Buffer.concat(bufferList, len);
    const ws = fs.createWriteStream(`${STATIC_FILES}/${fileName}`)
    ws.write(buffer);
    ws.close();
    res.send(`切片合并完成`);
  } catch (error) {
    console.error(error);
  }

});

module.exports = router;
