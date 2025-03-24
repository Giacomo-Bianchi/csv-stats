<script>
    import { dataPageCsvDataStore, eventPageCsvDataStore } from '$lib/store';
    import { goto } from '$app/navigation';
  
    let dataCsv = [];
    let eventCsv = [];
    let email = 'giovanenobile@gmail.com';
  
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
  
    function parseCSV(text) {
      const lines = text.split('\n').filter(line => line.trim() !== '');
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
  
/*     async function sendDataToServer() {
        try {
            const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                dataCsv: dataCsv.map(row => Object.values(row).join(',')).join('\n'),
                eventCsv: eventCsv.map(row => Object.values(row).join(',')).join('\n')
            })
            });

            if (response.ok) {
            alert('Dati inviati con successo a ' + email);
            } else {
            alert('Errore nell\'invio dei dati');
            }
        } catch (error) {
            console.error('Errore nella richiesta:', error);
            alert('Errore nella richiesta: ' + error.message);
        }
    } */

    function sendData() {
        dataPageCsvDataStore.set(dataCsv);
        eventPageCsvDataStore.set(eventCsv);
        alert('Data saved successfully');
    }

    function downloadCSV(data, filename) {
      const csvContent = data.map(row => Object.values(row).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  
    function navigateToDataPage() {
      goto('/dataPage');
    }
  
    function navigateToEventPage() {
      goto('/eventPage');
    }
</script>
  
<div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-200 p-6">
  <div class="bg-white shadow-2xl rounded-xl p-8 w-full max-w-lg text-center border border-gray-200">
    <h1 class="text-3xl font-extrabold text-gray-900 mb-6">Upload Your CSV Files</h1>
    <div class="mb-6">
      <label for="dataFile" class="block text-gray-700 font-semibold mb-2">Upload 'data.csv'</label>
      <input type="file" id="dataFile" accept=".csv" onchange={handleDataFileChange}
             class="block w-full text-sm text-gray-900 border border-gray-400 rounded-lg cursor-pointer bg-gray-100 p-3" />
    </div>
    <div class="mb-6">
      <label for="eventFile" class="block text-gray-700 font-semibold mb-2">Upload 'event.csv'</label>
      <input type="file" id="eventFile" accept=".csv" onchange={handleEventFileChange}
             class="block w-full text-sm text-gray-900 border border-gray-400 rounded-lg cursor-pointer bg-gray-100 p-3" />
    </div>
    <button onclick={sendData} class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">Send Data</button>
    <div class="mt-6 space-x-4">
      <button onclick={navigateToDataPage} class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">Go to Data Page</button>
      <button onclick={navigateToEventPage} class="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">Go to Event Page</button>
    </div>
  </div>
  <div class="bg-white shadow-2xl rounded-xl p-8 w-full max-w-lg text-center border border-gray-200 mt-6">
    <h2 class="text-2xl font-extrabold text-gray-900 mb-6">Download Your CSV Files</h2>
    <div class="space-x-4">
      <button onclick={() => downloadCSV(dataCsv, 'data.csv')} class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">Download Data CSV</button>
      <button onclick={() => downloadCSV(eventCsv, 'event.csv')} class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">Download Event CSV</button>
    </div>
  </div>
</div>