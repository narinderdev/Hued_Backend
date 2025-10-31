import config from "config";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Jimp from "jimp";
import Vibrant from "node-vibrant";
import fs from "fs";
import path from "path";
import kmeans from "ml-kmeans";
import sharp from "sharp";
//import convert from "heic-convert";
//import imageType from "image-type";
//const getPixels = require('get-pixels');
// import { S3Client } from "@aws-sdk/client-s3";
// import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
// import { config as awsConfig } from "@aws-sdk/config";
// awsConfig.update({
//   region: config.get("AWS.region"),
//   credentials: fromCognitoIdentityPool({
//     identityPoolId: config.get("AWS.IdentityPoolId"),
//   }),
// });
// const s3Client = new S3Client({
//   region: config.get("AWS.region"),
// });
let AWS = require("aws-sdk");
// let s3 = new AWS.S3({
//   accessKeyId: config.get("AWS.accessKeyId"),
//   secretAccessKey: config.get("AWS.secretAccessKey"),
//   // region: 'us-east-2'
// });
AWS.config.region = config.get("AWS.region");
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: config.get("AWS.IdentityPoolId"),
});



const BUCKET_NAME = config.get("AWS.bucket");

const s3 = new AWS.S3({
  region: AWS.config.region,
  credentials: AWS.config.credentials
});

const { ImageAnnotatorClient } = require("@google-cloud/vision").v1;
const client = new ImageAnnotatorClient({
  key: "AIzaSyBBEtiY9DuB8zkjpLNHstUONoce3OF6Ky4",
});
import { promisify } from "util";
import convert from "heic-convert";
export default {
  getOTP() {
    var otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
  },

  getToken: async (payload) => {
    var token = await jwt.sign(payload, config.get("jwtsecret"), {
      expiresIn: "365d",
    });
    return token;
  },

  sendEmail: async (email, sub, text) => {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "moinkhanOfficial0@gmail.com",
          pass: "dlkigussyfqfhwps",
        },
      });
      const mailOptions = {
        from: "moinkhanOfficial0@gmail.com",
        to: email,
        subject: sub,
        html: text,
      };
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  },

  readImageAndExtractColors: async (imagePath, mimetype) => {
    try {
      let fileName = `${Date.now().toString()}.jpg`;
      console.log(mimetype)
      if (mimetype == 'image/heic') {
        const inputBuffer = await promisify(fs.readFile)(imagePath);
        const outputBuffer = await convert({
          buffer: inputBuffer, // the HEIC file buffer
          format: "JPEG", // output format
          quality: 1, // the jpeg compression quality, between 0 and 1
        });
        await promisify(fs.writeFile)(`./tmp/${fileName}`, outputBuffer);
        let filePath = path.resolve(`./tmp/${fileName}`);
        const image = await Jimp.read(filePath);
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        const pixelColors = [];
        function rgbToHex(red, green, blue) {
          const toHex = (value) => {
            const hex = value.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          };

          const hexRed = toHex(red);
          const hexGreen = toHex(green);
          const hexBlue = toHex(blue);
          // const hexAlpha = toHex(alpha);
          return `#${hexRed}${hexGreen}${hexBlue}`;
        }
        // Loop through each pixel in the image
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            // Get the color of the pixel at position (x, y)
            const color = Jimp.intToRGBA(image.getPixelColor(x, y));

            // Access individual color components (red, green, blue, alpha)
            const red = color.r;
            const green = color.g;
            const blue = color.b;
            //const alpha = color.a;
            //pixelColors.push([red, green, blue]);
            //Store pixel color information in the array
            const hexColor = rgbToHex(red, green, blue);
            // console.log(hexColor);
            pixelColors.push(hexColor);
          }
        }

        return pixelColors;

      }
      if (mimetype == 'image/heif') {
        const inputBuffer = await promisify(fs.readFile)(imagePath);
        const outputBuffer = await convert({
          buffer: inputBuffer, // the HEIC file buffer
          format: "JPEG", // output format
          quality: 1, // the jpeg compression quality, between 0 and 1
        });
        await promisify(fs.writeFile)(`./tmp/${fileName}`, outputBuffer);
        let filePath = path.resolve(`./tmp/${fileName}`);
        const image = await Jimp.read(filePath);
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        const pixelColors = [];
        function rgbToHex(red, green, blue) {
          const toHex = (value) => {
            const hex = value.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          };

          const hexRed = toHex(red);
          const hexGreen = toHex(green);
          const hexBlue = toHex(blue);
          // const hexAlpha = toHex(alpha);
          return `#${hexRed}${hexGreen}${hexBlue}`;
        }
        // Loop through each pixel in the image
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            // Get the color of the pixel at position (x, y)
            const color = Jimp.intToRGBA(image.getPixelColor(x, y));

            // Access individual color components (red, green, blue, alpha)
            const red = color.r;
            const green = color.g;
            const blue = color.b;
            //const alpha = color.a;
            //pixelColors.push([red, green, blue]);
            //Store pixel color information in the array
            const hexColor = rgbToHex(red, green, blue);
            // console.log(hexColor);
            pixelColors.push(hexColor);
          }
        }

        return pixelColors;
      }
      const image = await Jimp.read(imagePath);
      const width = image.bitmap.width;
      const height = image.bitmap.height;
      const pixelColors = [];
      function rgbToHex(red, green, blue) {
        const toHex = (value) => {
          const hex = value.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        };

        const hexRed = toHex(red);
        const hexGreen = toHex(green);
        const hexBlue = toHex(blue);
        // const hexAlpha = toHex(alpha);
        return `#${hexRed}${hexGreen}${hexBlue}`;
      }
      // Loop through each pixel in the image
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Get the color of the pixel at position (x, y)
          const color = Jimp.intToRGBA(image.getPixelColor(x, y));

          // Access individual color components (red, green, blue, alpha)
          const red = color.r;
          const green = color.g;
          const blue = color.b;
          //const alpha = color.a;
          //pixelColors.push([red, green, blue]);
          //Store pixel color information in the array
          const hexColor = rgbToHex(red, green, blue);
          // console.log(hexColor);
          pixelColors.push(hexColor);
        }
      }

      return pixelColors;
    } catch (error) {
      console.log(error);
      throw new Error("Error reading or processing the image");
    }
  },
  extractColorsFromImage: async (imagePath, type, name) => {
    console.log(type);
    try {
      let image;
      let pathOfFile;
      let fileName = `${Date.now().toString()}.jpg`;
      let x = name.split(".")[1];
      // if (type == "image/jpeg" && String(x) !== "jpg" && String(x) !== "jpeg") {
      //   const inputBuffer = await promisify(fs.readFile)(imagePath);
      //   const outputBuffer = await convert({
      //     buffer: inputBuffer, // the HEIC file buffer
      //     format: "JPEG", // output format
      //     quality: 1, // the jpeg compression quality, between 0 and 1
      //   });
      //   await promisify(fs.writeFile)(`./tmp/${fileName}`, outputBuffer);
      //   pathOfFile = path.resolve(`./tmp/${fileName}`);
      // } else if (type == "image/heif") {
      //   const inputBuffer = await promisify(fs.readFile)(imagePath);
      //   const outputBuffer = await convert({
      //     buffer: inputBuffer, // the HEIC file buffer
      //     format: "JPEG", // output format
      //     quality: 1, // the jpeg compression quality, between 0 and 1
      //   });
      //   await promisify(fs.writeFile)(`./tmp/${fileName}`, outputBuffer);
      //   pathOfFile = path.resolve(`./tmp/${fileName}`);
      // } else if (type == "image/heic") {
      //   const inputBuffer = await promisify(fs.readFile)(imagePath);
      //   const outputBuffer = await convert({
      //     buffer: inputBuffer, // the HEIC file buffer
      //     format: "JPEG", // output format
      //     quality: 1, // the jpeg compression quality, between 0 and 1
      //   });
      //   await promisify(fs.writeFile)(`./tmp/${fileName}`, outputBuffer);
      //   pathOfFile = path.resolve(`./tmp/${fileName}`);
      // } else if (type == "application/octet-stream") {
      //   const inputBuffer = await promisify(fs.readFile)(imagePath);
      //   const outputBuffer = await convert({
      //     buffer: inputBuffer, // the HEIC file buffer
      //     format: "JPEG", // output format
      //     quality: 1, // the jpeg compression quality, between 0 and 1
      //   });
      //   await promisify(fs.writeFile)(`./tmp/${fileName}`, outputBuffer);
      //   pathOfFile = path.resolve(`./tmp/${fileName}`);
      // }
      // else if (type == "image/webp") {
      //   const inputBuffer = await promisify(fs.readFile)(imagePath);
      //   const type = imageType(inputBuffer);
      //   console.log(type);
      //   // if (type && type.ext === "heic") {
      //   const outputBuffer = await convert({
      //     buffer: type,
      //     format: "JPEG",
      //     quality: 1,
      //   });
      //   // }
      //   const fileName =
      //     path.basename(imagePath, path.extname(imagePath)) + ".jpg";
      //   await promisify(fs.writeFile)(`./tmp/${fileName}`, outputBuffer);
      //   pathOfFile = path.resolve(`./tmp/${fileName}`);
      // }
      //else {
      pathOfFile = imagePath;
      //}
      console.log(imagePath);
      console.log(pathOfFile);
      image = await Jimp.read(pathOfFile);
      const imageBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
      const palette = await Vibrant.from(imageBuffer).getPalette();
      console.dir(palette, { depth: null });
      // let findPath = path.resolve(pathOfFile);
      // // deleteFile(findPath);    const allColors = {
      console.log(
        palette.Vibrant.getHex(),
        palette.Muted.getHex(),
        palette.DarkVibrant.getHex(),
        palette.DarkMuted.getHex(),
        palette.LightVibrant.getHex(),
        palette.LightMuted.getHex(),
        palette.Vibrant.getHex(),
        palette.Muted.getHex(),
        palette.LightMuted.getHex(),
        palette.DarkVibrant.getHex(),
        palette.LightVibrant.getHex()
      );
      return {
        Vibrant: palette.Vibrant.getHex(),
        Muted: palette.Muted.getHex(),
        DarkVibrant: palette.DarkVibrant.getHex(),
        DarkMuted: palette.DarkMuted.getHex(),
        LightVibrant: palette.LightVibrant.getHex(),
        LightMuted: palette.LightMuted.getHex(),
        dominant: palette.Vibrant.getHex(),
        muted: palette.Muted.getHex(),
        lightMuted: palette.LightMuted.getHex(),
        dark: palette.DarkVibrant.getHex(),
        light: palette.LightVibrant.getHex(),
      };

      return {
        dominant: palette.Vibrant.getHex(),
        muted: palette.Muted.getHex(),
        lightMuted: palette.LightMuted.getHex(),
        dark: palette.DarkVibrant.getHex(),
        light: palette.LightVibrant.getHex(),
      };
    } catch (err) {
      console.error(err);
    }
  },

  uploadImage: async (image) => {
    try {
      let fileName = `${Date.now().toString()}.jpg`;
      let x = image.name.split(".")[1];
      if (
        image.mimetype !== "image/jpeg" &&
        image.mimetype !== "image/png" &&
        String(x) !== "jpg" &&
        String(x) !== "jpeg"
      ) {
        const inputBuffer = await promisify(fs.readFile)(image.tempFilePath);
        const outputBuffer = await convert({
          buffer: inputBuffer, // the HEIC file buffer
          format: "JPEG", // output format
          quality: 1, // the jpeg compression quality, between 0 and 1
        });
        await promisify(fs.writeFile)(`./tmp/${fileName}`, outputBuffer);
        let filePath = path.resolve(`./tmp/${fileName}`);
        let UploadedPresdPhoto =
          Date.now() + "-" + `${image.name.split(".")[0]}.jpg`;
        var filePathS3 = "uploads" + "/" + UploadedPresdPhoto;
        let file = fs.readFileSync(filePath);
        const params = {
          Bucket: BUCKET_NAME, // pass your bucket name
          Key: filePathS3,
          Body: file,
          ContentType: "image/jpg",
        };
        await new Promise(function (resolve, reject) {
          s3.upload(params, function (err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
        // let findPath = path.resolve(filePath);
        // // deleteFile(findPath);
        return `${config.get("AWS.baseURL") + filePathS3}`;
      } else if (image.mimetype == "image/heic") {
        const inputBuffer = await promisify(fs.readFile)(image.tempFilePath);
        const outputBuffer = await convert({
          buffer: inputBuffer, // the HEIC file buffer
          format: "JPEG", // output format
          quality: 1, // the jpeg compression quality, between 0 and 1
        });
        await promisify(fs.writeFile)(`./tmp/${fileName}`, outputBuffer);
        let filePath = path.resolve(`./tmp/${fileName}`);
        let UploadedPresdPhoto =
          Date.now() + "-" + `${image.name.split(".")[0]}.jpg`;
        var filePathS3 = "uploads" + "/" + UploadedPresdPhoto;
        let file = fs.readFileSync(filePath);
        const params = {
          Bucket: BUCKET_NAME, // pass your bucket name
          Key: filePathS3,
          Body: file,
          ContentType: "image/jpg",
        };
        await new Promise(function (resolve, reject) {
          s3.upload(params, function (err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
        // let findPath = path.resolve(filePath);
        // // deleteFile(findPath);
        return `${config.get("AWS.baseURL") + filePathS3}`;
      } else if (image.mimetype == "image/heif") {
        const inputBuffer = await promisify(fs.readFile)(image.tempFilePath);
        const outputBuffer = await convert({
          buffer: inputBuffer, // the HEIC file buffer
          format: "JPEG", // output format
          quality: 1, // the jpeg compression quality, between 0 and 1
        });
        await promisify(fs.writeFile)(`./tmp/${fileName}`, outputBuffer);
        let filePath = path.resolve(`./tmp/${fileName}`);
        let UploadedPresdPhoto =
          Date.now() + "-" + `${image.name.split(".")[0]}.jpg`;
        var filePathS3 = "uploads" + "/" + UploadedPresdPhoto;
        let file = fs.readFileSync(filePath);
        const params = {
          Bucket: BUCKET_NAME, // pass your bucket name
          Key: filePathS3,
          Body: file,
          ContentType: "image/jpg",
        };
        await new Promise(function (resolve, reject) {
          s3.upload(params, function (err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
        // let findPath = path.resolve(filePath);
        // // deleteFile(findPath);
        return `${config.get("AWS.baseURL") + filePathS3}`;
      } else if (image.mimetype == "application/octet-stream") {
        const inputBuffer = await promisify(fs.readFile)(image.tempFilePath);
        const outputBuffer = await convert({
          buffer: inputBuffer, // the HEIC file buffer
          format: "JPEG", // output format
          quality: 1, // the jpeg compression quality, between 0 and 1
        });
        await promisify(fs.writeFile)(`./tmp/${fileName}`, outputBuffer);
        let filePath = path.resolve(`./tmp/${fileName}`);
        let UploadedPresdPhoto =
          Date.now() + "-" + `${image.name.split(".")[0]}.jpg`;
        var filePathS3 = "uploads" + "/" + UploadedPresdPhoto;
        let file = fs.readFileSync(filePath);
        const params = {
          Bucket: BUCKET_NAME, // pass your bucket name
          Key: filePathS3,
          Body: file,
          ContentType: "image/jpg",
        };
        await new Promise(function (resolve, reject) {
          s3.upload(params, function (err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
        // let findPath = path.resolve(filePath);
        // // deleteFile(findPath);
        return `${config.get("AWS.baseURL") + filePathS3}`;
      } else {
        let UploadedPresdPhoto = Date.now() + "-" + image.name;
        var filePathS3 = "uploads" + "/" + UploadedPresdPhoto;
        let filePath = path.resolve(image.tempFilePath);
        let file = fs.readFileSync(filePath);
        const params = {
          Bucket: BUCKET_NAME, // pass your bucket name
          Key: filePathS3,
          Body: file,
          ContentType: image.mimetype,
        };
        await new Promise(function (resolve, reject) {
          s3.upload(params, function (err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
        return `${config.get("AWS.baseURL") + filePathS3}`;
      }
    } catch (error) {
      throw error;
    }
  },

  upload64: async (file, name, type) => {
    try {
      name = `${Date.now().toString()}` + name;
      let filePathS3 = "uploads" + "/" + name;
      const params = {
        Bucket: config.get("AWS.bucket"),
        Key: filePathS3,
        Body: Buffer.from(file, 'base64'),
        ContentType: type
      };
      await new Promise(function (resolve, reject) {
        s3.putObject(params, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      return `${config.get("AWS.baseURL") + filePathS3}`;
    } catch (error) {
      throw error
    }
  }

};

function deleteFile(path) {
  fs.unlink(path, (err) => {
    if (err) {
      console.log("file delete error", err);
    } else {
      console.log("file deleted");
    }
  });
}

// async function emailx() {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: 'smtp.office365.com',
//       port: 587,
//       auth: {
//         user: 'contact@hoggledoc.com.au'
//       },
//       secure: true,
//       tls: { ciphers: 'SSLv3' }
//     });
//     const mailOptions = {
//       from: 'contact@hoggledoc.com.au',
//       to: "moinkhan7554@gmail.com",
//       subject: "sub",
//       html: "html"
//     };
//     return await transporter.sendMail(mailOptions);
//   } catch (error) {
//     throw error;
//   }

// }

// emailx()

async function openCV(imagePath) {
  try {
  } catch (error) {
    console.log(error);
  }
}
