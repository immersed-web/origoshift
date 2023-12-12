import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import formidable, {IncomingForm} from 'formidable';
import fs from 'fs'
import path from 'path';
import { verifyJwtToken } from 'shared-modules/jwtUtils';
import { hasAtLeastSecurityLevel } from 'schemas';

const app : Express = express()
app.set('trust proxy', 1);
// app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS Stuff
// app.use(cors()); //Beware: CORS on all paths from all origins
if(!process.env.EXPOSED_SERVER_URL){
  console.error('no SERVER_URL env provided. Required! Quitting');
  process.exit(1);
}

app.use(cors({
  origin: [process.env.EXPOSED_SERVER_URL],
  credentials: true
}));

// Static file serving
const publicDir = '../../public/'
const uploadsDir = publicDir + 'uploads/'
const modelsDir = uploadsDir + '3d_models/'
app.use(express.static(publicDir));

// Heal the world
app.get('/hello', (req,res) => {
  console.log("Heal the world!")
  res.send('Heal the world!')
})

// app.get('/:modelType/:venueId', (req, res) => {
//   const venueId = req.params.venueId;
//   const modelType = req.params.modelType;
//   console.log(`received ${modelType} request`);
//   if(modelType !== 'model' && modelType !== 'navmesh') {
//     res.status(400).end('no good request. modeltype should be "model" or "navmesh"');
//     return;
//   }
//   const parsedpath = path.parse(venueId);
//   if(parsedpath.dir !== '' || parsedpath.root !== '') {
//     res.status(400).end('no good request. venueId should be a venueId, not a path');
//     return;
//   }
//   let fileName = `${venueId}.${modelType}`
//   let pathToFile = modelsDir + fileName;
// //   const pathToGlb = path.resolve(pathToFile+'.glb');
// //   const pathToGltf = path.resolve(pathToFile+'.gltf');
// //   console.log(pathToGltf);
// //   const parsed = path.parse(pathToGlb);
// //   console.log(parsed);
// // console.log(fs.existsSync(parsed.dir + '/' + parsed.base));
  
//   let extension = '.glb'
//   if(fs.existsSync(pathToFile + '.gltf')){
//     // console.log(`${pathToGltf} found`);
//     extension = '.gltf'
//   }
//   // } else if(fs.existsSync(pathToGlb)){
//   //   console.log(`${pathToGlb} found`);
//   //   extension = '.glb'
//   // } else {
//   //   console.error('no file found!!!');
//   //   res.status(404).end('didnt find the file');
//   //   return;
//   // }
//   try{
//     res.sendFile(`${fileName}${extension}`, {
//       root: modelsDir
//     })
//   } catch (e) {
//     console.error(e);
//     res.status(404).end('no file found');
//   }
// })

// Upload 3D model
app.post('/upload', (req,res) => {

  let data = {modelUrl:''}
  // console.log(modelsDir)
  
  const modelId = req.header('model-id')
  const token = req.header('token')
  const fileNameSuffix = req.header('file-name-suffix') || 'model'

  if(!token){
    res.status(401).end('I need that auth header set, dude!');
    return;
  }
  if(!modelId) {
    res.status(400).end('I need that modelId header set, dude!');
    return;
  }
  let userInfo = undefined
  try{
    userInfo = verifyJwtToken(token)
  } catch(e: unknown){
    res.status(401).end('Invalid token. I refuse!');
    return;
  }
  if(!hasAtLeastSecurityLevel(userInfo.role, 'moderator')){
    res.status(403).end('your access level is too low. No upload for you!!');
    return;
  }

  const form = formidable({
    uploadDir: modelsDir, 
    keepExtensions: true, 
    maxFileSize: 50 * 1024 * 1024,
    filename(name, ext, part, form) {
      return `${modelId}.${fileNameSuffix}${ext}`;
    },})
  form.on('file', (field, file) => {
    console.log(field,file.originalFilename)
    if(file.originalFilename){
      const filenameSplit = file.originalFilename.split('.');
      const fileEnding = filenameSplit[filenameSplit.length-1]
      if(fileEnding === 'gltf' || fileEnding === 'glb'){
        data.modelUrl = file.newFilename
      }
      else {
        res.status(403).json({msg: 'Only .gltf or .glb files are allowed'});
      }
    }
  })
  form.on('field', (field, data) => {
    console.log('received formfield:', field, data);
  })
  form.on('end', () => {
    if(data.modelUrl !== ''){
      res.end(JSON.stringify(data))
    }
    else {
      res.status(403).end(JSON.stringify({msg: 'No file was attached'}));
    }
  })
  form.parse(req)
})

// Remove 3D model
app.post('/remove', (req,res) => {

  console.log(req.body)

  const token = req.header('token')
  if(!token){
    res.status(401).end('I need that auth header set, dude!');
    return;
  }
  let userInfo = undefined
  try{
    userInfo = verifyJwtToken(token)
  } catch(e: unknown){
    res.status(401).end('Invalid token. I refuse!');
    return;
  }
  if(!hasAtLeastSecurityLevel(userInfo.role, 'moderator')){
    res.status(403).end('your access level is too low. No file removal for you!!');
    return;
  }
  const filename: string = req.body.fileName;
  if(filename.includes('/') || filename.includes('..')) {
    res.status(400).end('Dude. Why?')
    return;
  }
  fs.unlink(modelsDir + filename, (err) => {
    if (err) {
      console.error(err)
      res.status(404).end(JSON.stringify({msg: 'The file does not exist.'}));
      return
    }
    res.end();
  })
})

// Run Express app
const port = Number.parseInt(process.env.FILESERVER_PORT || '9002')
app.listen(port, () => console.log('Application listening on port ' + port))
