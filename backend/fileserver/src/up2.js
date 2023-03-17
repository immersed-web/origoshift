// Kenneths program

var mv = require('mv');
const fs = require("fs");
//const obj2gltf = require("obj2gltf");
const recast = require('./build/Release/RecastCLI');
const download = require('download');
var formidable = require('formidable');
var mv = require('mv');

// UPLOAD-koden här
//var http = require('http');
var formidable = require('formidable');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// FR EXPRESS:
const express = require('express');
const app = express();
app.use(express.static('files'))
app.use(express.static('static_html_files'))
app.listen(8080, () => console.log('Server ready'));


// SLASH (8080) - VISA FORMULÄRET


//##################################################
// Formulärsidan - denna ska inte riktigt användas utan snarare används API:et rent
//##################################################
app.get('/start', (req, res) => {
    console.log(req);
    console.log(res);
    fs.readFile("static_html_files/index.html", function (err, data2) {
        if (err) throw err;
        console.log(data2);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(data2);
        //res.end();
    });
})


//##################################################
// Denna ska inte riktigt användas utan snarare används nedladdning av statisk resurs
//##################################################
app.get('/fetch_express', (req, res) => {
    let url = require('url');
    let uuidToGet = url.parse(req.url, true).query.uuid;
    let model_or_navmesh = url.parse(req.url, true).query.model_or_navmesh;
    console.log(model_or_navmesh);
    console.log(uuidToGet);
    // Ladda ned modell och navmesh

    if (model_or_navmesh == "model") {
        res.download(__dirname + "/files/" + uuidToGet + "-model.obj", 'jsonFile.json');
    }
    else {
        res.download(__dirname + "/files/" + uuidToGet + "-navmesh.obj", 'jsonFile.json');
    }
})

app.post('/fileupload', (req, res) => {

    var cellSize;
    var cellHeight;
    var agentHeight;
    var agentRadius;
    var agentMaxClimp;
    var agentMaxSlope;
    var regionMinSize;
    var regionMergeSize;
    var edgeMaxLen;
    var edgeMaxError;
    var vertsPerPoly;
    var detailSampleDist;
    var detailSampleMaxErro;

    var form = new formidable.IncomingForm();
    cl("######## I FILEUPLOAD")
    console.log(form);
    form.parse(req, async function (err, fields, files) {
        if (err) throw err;
        console.log(err);

        var oldpath = files.model.filepath;
        const newId = uuidv4()
        var originalFileName = newId + "-" + "model.obj";// files.filetoupload.originalFilename;
        var newpath = path.join("./files/", originalFileName);
        console.log("newpath:" + newpath);

        // GE HEL SÖKVÄG
        let oldpath2 = require('path').resolve(__dirname, oldpath);
        let newpath2 = require('path').resolve(__dirname, newpath);
        console.log("   oldpath " + oldpath);
        console.log("   oldpath2 " + oldpath2);
        console.log("   newpath " + newpath);
        console.log("   newpath2 " + newpath2);


        //#####################################
        // SPARA NED DEN UPPLADDADE MODELLEN
        //#####################################

        async function savef(inp, fullPathForSaving) {
            const promise = new Promise((resolve, reject) => {
                mv(inp, fullPathForSaving, function (err) {
                    if (err) reject('kunde inte spara filen');
                    cl("SPARADE NED MODELL " + fullPathForSaving);
                    resolve()
                })
            })
            return promise;
        }

        await savef(oldpath, newpath);

        //#####################################
        // LADDA, BYGG OCH SPARA NAVMESH
        //#####################################

        var navmesh_name = newId + "-navmesh.obj";
        var newPathToNavmesh = path.join("./files/", navmesh_name);
        var CREATED_NAVMESH_FILE;
        var CREATED_UUID;

        // set parameters from fieldinput
        if (fields.cellSize != undefined) { cellSize = parseFloat(fields.cellSize) }
        if (fields.cellHeight != undefined) { cellHeight = parseFloat(fields.cellHeight) }
        if (fields.agentHeight != undefined) { agentHeight = parseFloat(fields.agentHeight) }
        if (fields.agentRadius != undefined) { agentRadius = parseFloat(fields.agentRadius) }
        if (fields.agentMaxClimp != undefined) { agentMaxClimp = parseFloat(fields.agentMaxClimp) }
        if (fields.agentMaxSlope != undefined) { agentMaxSlope = parseFloat(fields.agentMaxSlope) }
        if (fields.regionMinSize != undefined) { regionMinSize = parseFloat(fields.regionMinSize) }
        if (fields.regionMergeSize != undefined) { regionMergeSize = parseFloat(fields.regionMergeSize) }
        if (fields.edgeMaxLen != undefined) { edgeMaxLen = parseFloat(fields.edgeMaxLen) }
        if (fields.edgeMaxError != undefined) { edgeMaxError = parseFloat(fields.edgeMaxError) }
        if (fields.vertsPerPoly != undefined) { vertsPerPoly = parseFloat(fields.vertsPerPoly) }
        if (fields.detailSampleDist != undefined) { detailSampleDist = parseFloat(fields.detailSampleDist) }
        if (fields.detailSampleMaxErro != undefined) { detailSampleMaxErro = parseFloat(fields.detailSampleMaxErro) }

        recast.loadFile(newpath);

        if (recast.build(cellSize, cellHeight, agentHeight, agentRadius, agentMaxClimp, agentMaxSlope, regionMinSize, regionMergeSize, edgeMaxLen, edgeMaxError, vertsPerPoly, detailSampleDist, detailSampleMaxErro)) {
            CREATED_NAVMESH_FILE = { "filename": navmesh_name };
            CREATED_UUID = { "uuid": newId };
            console.log("build FUNKADE")
            recast.save(newPathToNavmesh);
            console.log("########### SAVE NAVMESH FUNKADE");
            res.write(JSON.stringify({ CREATED_NAVMESH_FILE, CREATED_UUID, fields, files }, null, 2));
            res.end();
        };

    });


}) // FILEUPLOAD - SLUT

function cl(x) { console.log(x) }

