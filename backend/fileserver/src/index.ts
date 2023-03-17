import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import formidable, {IncomingForm} from 'formidable';
import mv from 'mv'

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
  const form = new IncomingForm()
  form.on('file', (field, file) => {
    mv(file.filepath, 'src/uploads/'+file.originalFilename, function(err) {
      console.log(err)
    });
  })
  form.on('end', () => {
    res.json()
  })
  form.parse(req)
})
const port = process.env.FILESERVER_PORT?.split(':',)[1]
app.listen(port, () => console.log('Application listening on port ' + port))
