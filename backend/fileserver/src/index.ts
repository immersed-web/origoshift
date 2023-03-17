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
  res.setHeader('Content-Type', 'application/json');

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
    res.writeHead(200, { 'Content-Type': 'application/json' });
    // res.write(data)
    res.end()
    // res.send(data)
  })
  form.parse(req)
  // form.parse(req, (err, fields, files) => {
  //   console.log(files)
  //   // if(files.originalFilename){
  //   //   const filenameSplit = Object.entries(files).forEach(([key, file]) => {
  //   //     file.originalFilename.split('.');
  //   //   const fileEnding = filenameSplit[filenameSplit.length-1]
  //   //   if(fileEnding === 'gltf'){
  //   //     mv(files.filepath, 'src/uploads/'+files.originalFilename, function(err) {
  //   //       if(err){
  //   //         console.log("Error", err)
  //   //       }
  //   //     });
  //   //     data.modelUrl = 'src/uploads/'+files.originalFilename
  //   //   }
  //   //   else {
  //   //     res.status(403).json({msg: 'Only .gltf files are allowed'});
  //   //   }
  //   // }
  //   // }
  // })
  return
})
const port = process.env.FILESERVER_PORT?.split(':',)[1]
app.listen(port, () => console.log('Application listening on port ' + port))
