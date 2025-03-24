/* import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/api/upload', (req, res) => {
  const { email, dataCsv, eventCsv } = req.body;

  // Qui puoi aggiungere la logica per gestire i dati ricevuti
  console.log('Email:', email);
  console.log('Data CSV:', dataCsv);
  console.log('Event CSV:', eventCsv);

  res.status(200).send('Dati ricevuti con successo');
});

app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
}); */