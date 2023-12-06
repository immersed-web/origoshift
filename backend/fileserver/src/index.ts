import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import formidable, {IncomingForm} from 'formidable';
import fs from 'fs'
import { verifyJwtToken } from 'shared-modules/jwtUtils';
import { hasAtLeastSecurityLevel } from 'schemas';

const app : Express = express()
app.set('trust proxy', true);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS Stuff
app.use(cors()); //Beware: CORS on all paths from all origins

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

// Upload 3D model
app.post('/upload', (req,res) => {

  let data = {modelUrl:''}
  console.log(modelsDir)
  
  const venueId = req.header('venueId')
  const token = req.header('token')
  const fileNameSuffix = req.header('fileNameSuffix') || 'model'

  if(!token){
    res.status(401).end('I need that auth header set, dude!');
    return;
  }
  if(!venueId) {
    res.status(400).end('I need that venueId header set, dude!');
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
      return `${venueId}.${fileNameSuffix}${ext}`;
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
  fs.unlink(modelsDir + req.body.fileName, (err) => {
    if (err) {
      console.error(err)
      res.status(403).end(JSON.stringify({msg: 'The file does not exist.'}));
      return
    }
    res.end();
  })
})

// Run Express app
const port = Number.parseInt(process.env.FILESERVER_PORT || '9002')
app.listen(port, () => console.log('Application listening on port ' + port))
