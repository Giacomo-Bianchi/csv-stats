<script>
  import { onMount } from 'svelte';
  import { parseCSV } from '$lib/utils';
  import { dataPageCsvDataStore, eventPageCsvDataStore } from '$lib/store';
  import { goto } from '$app/navigation';

  let dataCsv = [];
  let eventCsv = [];
  let email = '';

  dataPageCsvDataStore.subscribe(value => {
    dataCsv = value;
  });

  eventPageCsvDataStore.subscribe(value => {
    eventCsv = value;
  });

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

  async function saveOnServer() {
    try {
      const dataHeaders = 'time,accelerometer X,accelerometer Y,accelerometer Z,gyroscope X,gyroscope Y,gyroscope Z,magnetometer X,magnetometer Y,magnetometer Z,temperature,pressure,VOC,CO2,Humidity';
      const eventHeaders = 'time,accelerometer X,accelerometer Y,accelerometer Z,gyroscope X,gyroscope Y,gyroscope Z';

      const dataCsvString = [dataHeaders, ...dataCsv.map(row => Object.values(row).join(','))].join('\n');
      const eventCsvString = [eventHeaders, ...eventCsv.map(row => Object.values(row).join(','))].join('\n');

      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          dataCsv: dataCsvString,
          eventCsv: eventCsvString
        })
      });

      if (response.ok) {
        alert('Data saved successfully');
      } else {
        alert('Error saving data');
      }
    } catch (error) {
      console.error('Error in request:', error);
      alert('Error in request: ' + error.message);
    }
  }

  async function fetchData() {
    try {
      const response = await fetch('http://localhost:3000/api/data');
      if (response.ok) {
        const data = await response.json();
        dataCsv = parseCSV(data.dataCsv);
        eventCsv = parseCSV(data.eventCsv);
        dataPageCsvDataStore.set(dataCsv);
        eventPageCsvDataStore.set(eventCsv);
      } else {
        console.error('Errore nel recupero dei dati');
      }
    } catch (error) {
      console.error('Errore nella richiesta:', error);
    }
  }

  onMount(() => {
    fetchData();
  });

  function sendData() {
    if (dataCsv.length === 0 || eventCsv.length === 0) {
      alert('Please upload both data.csv and event.csv files before sending.');
      return;
    }
    dataPageCsvDataStore.set(dataCsv);
    eventPageCsvDataStore.set(eventCsv);
    saveOnServer();
  }

  async function downloadCSV(type) {
    try {
      const response = await fetch(`http://localhost:3000/api/download/${type}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${type}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Error downloading CSV');
      }
    } catch (error) {
      console.error('Error in request:', error);
      alert('Error in request: ' + error.message);
    }
  }

  function navigateToDataPage() {
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
  }
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
    <div class="mt-6 flex flex-wrap justify-center gap-4">
      <button onclick={navigateToDataPage} class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition transform hover:scale-105">📊 Data Page</button>
      <button onclick={navigateToEventPage} class="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition transform hover:scale-105">📅 Event Page</button>
    </div>
  </div>
  
  <div class="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-lg text-center border border-gray-300 mt-8">
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
  </div>
  
</div>