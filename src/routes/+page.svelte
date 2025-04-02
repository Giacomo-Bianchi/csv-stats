<script>
  import { onMount } from 'svelte';
  import { dataPageCsvDataStore, eventPageCsvDataStore } from '$lib/store';
  import { goto } from '$app/navigation';
  import { InfluxDB, Point } from '@influxdata/influxdb-client';

  let dataCsv = [];
  let eventCsv = [];
  let email = '';

  
  const influxUrl = 'http://localhost:8086'; // URL del server InfluxDB
  const influxToken = '8u_7J1NllJCdZ65Dv0akBaay5VfGqIcFJoDIFRjBLTyVaJ7Uyx3cbpa8F7A57utihpNwOw2r4THWLyxanNMXSg=='; // Sostituisci con il tuo token
  //const influxToken = 'lg3uVDlIpYLdLPPo2qpH5kiNeHzeX3lAmamDuQGM81gsLVasG3abKVGtBIsYgUV4NB-1KI20M6-QL0gKb1uLJQ=='
  const influxOrg = 'University of Trento'; // Sostituisci con la tua organizzazione
  const influxBucket = 'NiclaData'; // Sostituisci con il tuo bucket

  const influxDB = new InfluxDB({ url: influxUrl, token: influxToken });
  const writeApi = influxDB.getWriteApi(influxOrg, influxBucket);


  dataPageCsvDataStore.subscribe(value => {
    dataCsv = value;
  });

  eventPageCsvDataStore.subscribe(value => {
    eventCsv = value;
  });

  // Funzione per parsare un CSV
  function parseCSV(csvString) {
    const lines = csvString.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',');
    const data = [];
  
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        const row = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = values[j];
        }
        data.push(row);
      }
    }
    return data;
  }

  async function handleDataFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      const text = await file.text();
      dataCsv = await parseCSV(text);
      dataPageCsvDataStore.set(dataCsv);
    }
  }

  async function handleEventFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      const text = await file.text();
      eventCsv = await parseCSV(text);
      eventPageCsvDataStore.set(eventCsv);
    }
  }





  function sendData() {
    if (dataCsv.length === 0 || eventCsv.length === 0) {
      alert('Please upload both data.csv and event.csv files before sending.');
      return;
    }
    dataPageCsvDataStore.set(dataCsv);
    eventPageCsvDataStore.set(eventCsv);
    uploadToInfluxDB();
  }

  //const influxDB = new InfluxDB({ url: influxUrl, token: influxToken });
/*   function parseInfluxTimestamp(timestamp) {
    // Esempio input: "2025/3/26-18:11:19"
    const [datePart, timePart] = timestamp.split("-");
    const [year, month, day] = datePart.split("/").map(Number);
    const [hours, minutes, seconds] = timePart.split(":").map(Number);

    // Creiamo una data ISO compatibile
    const isoString = new Date(year, month - 1, day, hours, minutes, seconds).toISOString();
    return isoString;
  } */
  
  /* function parseInfluxTimestamp(timestamp) {
    // Esempio input: "2025/3/26-18:11:19"
    const [datePart, timePart] = timestamp.split("-");
    const [year, month, day] = datePart.split("/").map(Number);
    const [hours, minutes, seconds] = timePart.split(":").map(Number);

    // Creiamo la data
    const date = new Date(year, month - 1, day, hours, minutes, seconds);

    // Restituiamo il timestamp in nanosecondi per InfluxDB
    return date.getTime() * 1_000_000; // Converti in nanosecondi
  } */

  function parseInfluxTimestamp(timestamp) {
    // Aggiunge uno zero ai secondi mancanti
    const fixedTimestamp = timestamp.replace(/(\d+:\d+:\d)(?!\d)/, '$1:00');

    // Divide la data e l'ora
    const [datePart, timePart] = fixedTimestamp.split('-');
    const [year, month, day] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    // Creiamo un oggetto Date valido
    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

    // Convertiamo in nanosecondi per InfluxDB
    return date.getTime() ; //* 1_000_000;
  }


/*   async function uploadToInfluxDB() {
    if (!dataCsv.length || !eventCsv.length) {
        alert('Carica entrambi i file prima di inviare.');
        return;
    }

    //console.log('Dati CSV:', dataCsv);
    //console.log('Eventi CSV:', eventCsv);
    console.log(parseInfluxTimestamp("2025/3/26-18:12:4"));
    console.log(parseInfluxTimestamp("2025/3/26-18:12:39"));


    // Caricamento dei dati da data.csv
    dataCsv.forEach(record => {
        const point = new Point('data')
            .tag('source', 'data.csv')
            .timestamp(parseInfluxTimestamp(record.time)) // Converte correttamente il timestamp

            // Campi numerici
            .floatField('Acceleration_X', parseFloat(record.Acceleration_X))
            .floatField('Acceleration_Y', parseFloat(record.Acceleration_Y))
            .floatField('Acceleration_Z', parseFloat(record.Acceleration_Z))
            .floatField('Gyroscope_X', parseFloat(record.Gyroscope_X))
            .floatField('Gyroscope_Y', parseFloat(record.Gyroscope_Y))
            .floatField('Gyroscope_Z', parseFloat(record.Gyroscope_Z))
            .floatField('Magnetometer_X', parseFloat(record.Magnetometer_X))
            .floatField('Magnetometer_Y', parseFloat(record.Magnetometer_Y))
            .floatField('Magnetometer_Z', parseFloat(record.Magnetometer_Z))
            .floatField('Temperature', parseFloat(record.Temperature))
            .floatField('Pressure', parseFloat(record.Pressure))
            .floatField('VOC', parseFloat(record.VOC))
            .floatField('CO2', parseFloat(record.CO2))
            //.floatField('Humidity\r', parseFloat(record.Humidity));

        writeApi.writePoint(point);
    });

    // Caricamento dei dati da event.csv
    eventCsv.forEach(record => {
        const point = new Point('event')
            .tag('source', 'event.csv')
            .timestamp(parseInfluxTimestamp(record.time)) // Converte correttamente il timestamp

            .floatField('Acceleration_X', parseFloat(record.Acceleration_X))
            .floatField('Acceleration_Y', parseFloat(record.Acceleration_Y))
            .floatField('Acceleration_Z', parseFloat(record.Acceleration_Z))
            .floatField('Gyroscope_X', parseFloat(record.Gyroscope_X))
            .floatField('Gyroscope_Y', parseFloat(record.Gyroscope_Y))
            //.floatField('Gyroscope_Z\r', parseFloat(record.Gyroscope_Z));

        writeApi.writePoint(point);
    });

    await writeApi.flush();
    await writeApi.close();
    alert('Dati caricati correttamente su InfluxDB!');
  } */

  async function uploadToInfluxDB() {
    if (!dataCsv.length || !eventCsv.length) {
      alert('Carica entrambi i file prima di inviare.');
      return;
    }

    function safeParseFloat(value) {
      const parsed = parseFloat(value);
      //return isNaN(parsed) ? null : parsed;
      return parsed
    }

    dataCsv.forEach(record => {
      const point = new Point('data')
        .tag('source', 'data.csv')
        
        .timestamp(parseInfluxTimestamp(record.time));
        console.log(parseInfluxTimestamp(record.time));
      ["Acceleration_X", "Acceleration_Y", "Acceleration_Z", "Gyroscope_X", "Gyroscope_Y", "Gyroscope_Z", "Magnetometer_X", "Magnetometer_Y", "Magnetometer_Z", "Temperature", "Pressure", "VOC", "CO2", "Humidity\r"].forEach(field => {
        const value = safeParseFloat(record[field]);
        if (value !== null) point.floatField(field, value);
      });
      writeApi.writePoint(point);
    });

    eventCsv.forEach(record => {
      const point = new Point('event')
        .tag('source', 'event.csv')
        .timestamp(parseInfluxTimestamp(record.time));
      ["Acceleration_X", "Acceleration_Y", "Acceleration_Z", "Gyroscope_X", "Gyroscope_Y", "Gyroscope_Z\r"].forEach(field => {
        const value = safeParseFloat(record[field]);
        if (value !== null) point.floatField(field, value);
      });
      writeApi.writePoint(point);
    });

    await writeApi.close();
    alert('Dati caricati correttamente su InfluxDB!');
  }















  async function readFromInfluxDB() {
      const queryApi = influxDB.getQueryApi(influxOrg);
      const fluxQuery = `from(bucket: "${influxBucket}") |> range(start: -1h) |> filter(fn: (r) => r._measurement == "data" or r._measurement == "event")`;
      const result = [];

      for await (const { _measurement, _value, _time } of queryApi.iterateRows(fluxQuery)) {
          result.push({ measurement: _measurement, value: _value, time: _time });
      }

      console.log(result);
  }




/*   function navigateToDataPage() {
    goto('/dataPage');
  }

  function navigateToEventPage() {
    goto('/eventPage');
  }

  function resetData() {
    dataCsv = [];
    eventCsv = [];
    dataPageCsvDataStore.set([]);
    eventPageCsvDataStore.set([]);
    alert('All data has been reset.');
  } */
</script>
  
<div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-300 to-purple-400 p-6">
  <div class="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-lg text-center border border-gray-300">
    <h1 class="text-3xl font-extrabold text-gray-900 mb-6">📂 Upload Your CSV Files</h1>
    <div class="mb-6">
      <label for="dataFile" class="block text-gray-700 font-medium mb-2">Upload <span class="font-semibold">'data.csv'</span></label>
      <input type="file" id="dataFile" accept=".csv" onchange={handleDataFileChange}
              class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 p-3 focus:outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
    <div class="mb-6">
      <label for="eventFile" class="block text-gray-700 font-medium mb-2">Upload <span class="font-semibold">'event.csv'</span></label>
      <input type="file" id="eventFile" accept=".csv" onchange={handleEventFileChange}
              class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 p-3 focus:outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
    <div class="flex justify-center">
      <button onclick={sendData} class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition transform hover:scale-110 text-xl tracking-wide flex items-center gap-2">
        🚀 <span>Send Data</span>
      </button>
    </div>
<!--     <div class="mt-6 flex flex-wrap justify-center gap-4">
      <button onclick={navigateToDataPage} class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition transform hover:scale-105">📊 Data Page</button>
      <button onclick={navigateToEventPage} class="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition transform hover:scale-105">📅 Event Page</button>
    </div> -->
  </div>
  
<!--   <div class="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-lg text-center border border-gray-300 mt-8">
    <h2 class="text-2xl font-extrabold text-gray-900 mb-6">⬇️ Download Your CSV Files</h2>
    <div class="flex flex-wrap justify-center gap-4">
      <button onclick={() => downloadCSV('data')} class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition transform hover:scale-105">Download Data CSV</button>
      <button onclick={() => downloadCSV('event')} class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition transform hover:scale-105">Download Event CSV</button>
    </div>
  </div>

  <div class="bg-white shadow-2xl rounded-2xl p-5 w-full max-w-lg text-center border border-gray-300 mt-8">
    <h2 class="text-2xl font-extrabold text-gray-900 mb-6"> ⚠️ Reset All Data ⚠️ </h2>
    <button onclick={resetData} class="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-2xl">
      🚨 Reset All Data ❗
    </button>
  </div> -->
  
</div>