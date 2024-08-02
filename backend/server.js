const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const { PDFDocument, PDFPage } = require('pdf-lib');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set Content Security Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      fontSrc: ["'self'", 'http://localhost:3000'],
      // ...other directives
    }
  }
}));

// Ensure uploads directory exists
const dir = './uploads';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ fileName: req.file.filename });
});

app.get('/api/download/:filename', (req, res) => {
  const file = path.resolve(__dirname, 'uploads', req.params.filename);
  fs.access(file, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).send('File not found');
    } else {
      res.download(file);
    }
  });
});

app.delete('/api/delete/:filename', (req, res) => {
  const file = path.resolve(__dirname, 'uploads', decodeURIComponent(req.params.filename));
  fs.access(file, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).send('File not found');
    } else {
      fs.unlink(file, err => {
        if (err) {
          console.error(err);
          res.status(500).send('An error occurred while deleting the file');
        } else {
          res.send('File deleted successfully');
        }
      });
    }
  });
});

app.put('/api/rename/:oldFilename', express.json(), (req, res) => {
  const oldFile = path.resolve(__dirname, 'uploads', decodeURIComponent(req.params.oldFilename));
  const newFile = path.resolve(__dirname, 'uploads', req.body.newFilename);
  fs.access(oldFile, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).send('File not found');
    } else {
      fs.rename(oldFile, newFile, err => {
        if (err) {
          console.error(err);
          res.status(500).send('An error occurred while renaming the file');
        } else {
          res.send('File renamed successfully');
        }
      });
    }
  });
});

app.get('/api/files', (req, res) => {
  fs.readdir(path.join(__dirname, 'uploads'), (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while fetching the files');
    } else {
      res.json(files);
    }
  });
});

app.get('/api/pages/:filename', async (req, res) => {
  const file = path.resolve(__dirname, 'uploads', decodeURIComponent(req.params.filename));
  const pdfDoc = await PDFDocument.load(fs.readFileSync(file));
  res.json(pdfDoc.getPageCount());
});

app.post('/api/create', async (req, res) => {
  const { inputFilename, pages } = req.body;
  const inputFile = path.resolve(__dirname, 'uploads', inputFilename);
  const inputPdfDoc = await PDFDocument.load(fs.readFileSync(inputFile));
  const outputPdfDoc = await PDFDocument.create();
  for (let i = 0; i < pages.length; i++) {
    const [copiedPage] = await outputPdfDoc.copyPages(inputPdfDoc, [pages[i] - 1]);
    outputPdfDoc.addPage(copiedPage);
  }
  const outputFilename = `output_${Date.now()}.pdf`;
  const outputFile = path.resolve(__dirname, 'uploads', outputFilename);
  fs.writeFileSync(outputFile, await outputPdfDoc.save());
  res.json({ fileName: outputFilename });
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

