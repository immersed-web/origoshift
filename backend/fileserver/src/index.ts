import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import formidable, {IncomingForm} from 'formidable';

// Init app
const app : Express = express()
app.set('trust proxy', true);

// CORS Stuff
app.use(cors()); //Beware: CORS on all paths from all origins

app.get('/hello', (req,res) => {
  console.log("Heal the world!")
  res.send('Heal the world!')
})

app.post('/upload', (req,res) => {

  let data = {modelUrl:''}

  const form = formidable({uploadDir: 'src/uploads', filename(name, ext, part, form) {
    return part.originalFilename ? part.originalFilename : ''
  },})
  form.on('file', (field, file) => {
    console.log(field,file.originalFilename)
    if(file.originalFilename){
      const filenameSplit = file.originalFilename.split('.');
      const fileEnding = filenameSplit[filenameSplit.length-1]
      if(fileEnding === 'gltf'){
        data.modelUrl = 'src/uploads/'+file.originalFilename
      }
      else {
        res.status(403).json({msg: 'Only .gltf files are allowed'});
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
const port = process.env.FILESERVER_PORT?.split(':',)[1]
app.listen(port, () => console.log('Application listening on port ' + port))
