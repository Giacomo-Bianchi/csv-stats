import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '1gb' }));
app.use(bodyParser.urlencoded({ limit: '1gb', extended: true }));

app.post('/api/upload', (req, res) => {
  const { email, dataCsv, eventCsv } = req.body;

  const data = {
    email,
    dataCsv,
    eventCsv
  };

  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

  res.status(200).send('Dati ricevuti con successo');
});

app.get('/api/data', (req, res) => {
  if (fs.existsSync('data.json')) {
    const data = fs.readFileSync('data.json');
    res.status(200).json(JSON.parse(data));
  } else {
    res.status(404).send('Nessun dato trovato');
  }
});

app.get('/api/download/:type', (req, res) => {
  const { type } = req.params;
  if (fs.existsSync('data.json')) {
    const data = JSON.parse(fs.readFileSync('data.json'));
    let csvContent = '';
    if (type === 'data') {
      csvContent = data.dataCsv;
    } else if (type === 'event') {
      csvContent = data.eventCsv;
    } else {
      return res.status(400).send('Tipo non valido');
    }
    res.header('Content-Type', 'text/csv');
    res.attachment(`${type}.csv`);
    res.send(csvContent);
  } else {
    res.status(404).send('Nessun dato trovato');
  }
});

app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});