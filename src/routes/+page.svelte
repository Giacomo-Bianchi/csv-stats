<script>
  import { onMount } from 'svelte';
  import { dataPageCsvDataStore, eventPageCsvDataStore } from '$lib/store';
  import { goto } from '$app/navigation';
  import { InfluxDB, Point } from '@influxdata/influxdb-client';

  let dataCsv = [];
  let eventCsv = [];
  let email = '';

  
  const influxUrl = 'http://localhost:8086'; // URL del server InfluxDB
  //const influxToken = '8u_7J1NllJCdZ65Dv0akBaay5VfGqIcFJoDIFRjBLTyVaJ7Uyx3cbpa8F7A57utihpNwOw2r4THWLyxanNMXSg==';
  const influxToken = '0PYfu5OFkWk3cl1LSfhBXUTtIDwka_4CDiQQKqWYEzhoDViTMeThhGH7WRxP7VjsgkUYN8cxoErTcugpBgsO8g=='; // Token di autenticazione
  const influxOrg = 'University_of_Trento'; //  organizzazione
  const influxBucket = 'NiclaData'; //  bucket

  const influxDB = new InfluxDB({ url: influxUrl, token: influxToken });
  const writeApi = influxDB.getWriteApi(influxOrg, influxBucket);
  const queryApi = influxDB.getQueryApi(influxOrg);


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
    headers.push('#'); // Aggiungi l'header per la nuova colonna
    const data = [];
  
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === headers.length - 1) {
            values.push(''); // Aggiungi una colonna vuota per ogni riga
        }
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


  function parseInfluxTimestamp(timestamp) {
    // Aggiunge uno zero ai secondi mancanti
    //const fixedTimestamp = timestamp.replace(/(\d+:\d+:\d)(?!\d)/, '$1:00');
    const fixedTimestamp = timestamp;
    // Divide la data e l'ora
    const [datePart, timePart] = fixedTimestamp.split('-');
    const [year, month, day] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    //  oggetto Date 
    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

    //  nanosecondi per InfluxDB ???
    return date.getTime() ; //* 1_000_000;
  }

    async function uploadToInfluxDB() {
    if (!dataCsv.length || !eventCsv.length) {
      alert('Carica entrambi i file prima di inviare.');
      return;
    }
    function safeParseFloat(value) {
      const parsed = parseFloat(value);
      return parsed;
    }
    
    dataCsv.forEach(record => {
      console.log(record);

      const point = new Point('data')
        .tag('source', 'data.csv')
        .timestamp(parseInfluxTimestamp(record.time));
        
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

    writeApi.flush(); 
    writeApi.close(); 
    alert('Dati caricati correttamente su InfluxDB!');
  }




/*   async function readFromInfluxDB() {
      const queryApi = influxDB.getQueryApi(influxOrg);
      const fluxQuery = `from(bucket: "${influxBucket}") |> range(start: -1h) |> filter(fn: (r) => r._measurement == "data" or r._measurement == "event")`;
      const result = [];

      for await (const { _measurement, _value, _time } of queryApi.iterateRows(fluxQuery)) {
          result.push({ measurement: _measurement, value: _value, time: _time });
      }

      console.log(result);
  }
 */
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
  </div>
</div>