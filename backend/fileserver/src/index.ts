import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import formidable, {IncomingForm} from 'formidable';
import fs from 'fs'

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

// TODO: Verify JWT and require at least moderator role.

// Upload 3D model
app.post('/upload', (req,res) => {

  let data = {modelUrl:''}
  console.log(modelsDir)

  const form = formidable({uploadDir: modelsDir, keepExtensions: true, maxFileSize: 50 * 1024 * 1024})
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
