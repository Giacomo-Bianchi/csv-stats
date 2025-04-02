<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';
    import { goto } from '$app/navigation';
    import { dataPageCsvDataStore, dataPageChartsStore } from '$lib/store';
    import { parseCSV } from '$lib/utils';
    import { InfluxDB } from '@influxdata/influxdb-client';

    const influxUrl = 'http://localhost:8086'; // URL del server InfluxDB
    const influxToken = 'TUO_TOKEN_INFLUXDB'; // Sostituisci con il tuo token
    const influxOrg = 'University_of_Trento'; // Sostituisci con la tua organizzazione
    const influxBucket = 'TUO_BUCKET'; // Sostituisci con il tuo bucket

    const influxDB = new InfluxDB({ url: influxUrl, token: influxToken });

    let csvData = [];
    let charts = [];
    let chartsContainer;
    let maintainAspectRatio = true;
    let availableDates = [];
    let selectedDate = null;
  
    onMount(async () => {
      if (typeof window !== 'undefined') {
        const zoomPlugin = (await import('chartjs-plugin-zoom')).default;
        Chart.register(zoomPlugin);
  
        dataPageCsvDataStore.subscribe(value => {
          csvData = value;
        });
  
        dataPageChartsStore.subscribe(value => {
          charts = value;
        });
  
        if (csvData.length > 0) {
          extractDates();
          setInitialDate();
          //restoreCharts();
        } else {
          await fetchDataFromJson();
        }
      }
    });
  

    async function fetchDataFromInfluxDB(measurement) {
        const queryApi = influxDB.getQueryApi(influxOrg);
        const fluxQuery = `
            from(bucket: "${influxBucket}")
                |> range(start: -1d) // Leggi i dati delle ultime 24 ore
                |> filter(fn: (r) => r._measurement == "${measurement}")
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
                |> sort(columns: ["_time"])
        `;

        const rows = [];
        return new Promise((resolve, reject) => {
            queryApi.queryRows(fluxQuery, {
                next(row, tableMeta) {
                    const data = tableMeta.toObject(row);
                    rows.push(data);
                },
                error(error) {
                    console.error('Errore durante la query:', error);
                    reject(error);
                },
                complete() {
                    resolve(rows);
                }
            });
        });
    }
  
    function extractDates() {
      const uniqueDates = new Set(csvData.map(row => row.time.split('-')[0].trim()));
      availableDates = Array.from(uniqueDates).sort();
    }
  
  
    function setInitialDate() {
      if (availableDates.length > 0) {
        selectedDate = availableDates[0];
        //createCharts();
      }
    }
  
    function changeDate(direction) {
      const currentIndex = availableDates.indexOf(selectedDate);
      if (direction === 'prev' && currentIndex > 0) {
        selectedDate = availableDates[currentIndex - 1];
      } else if (direction === 'next' && currentIndex < availableDates.length - 1) {
        selectedDate = availableDates[currentIndex + 1];
      }
      createCharts();
    }
  
    async function createCharts(measurement) {
        try {
            const data = await fetchDataFromInfluxDB(measurement);

            if (data.length === 0) {
                console.warn('Nessun dato disponibile per il grafico.');
                return;
            }

            // Estrai i dati per i grafici
            const timeLabels = data.map(row => new Date(row._time).toLocaleTimeString());
            const fields = Object.keys(data[0]).filter(key => key !== '_time');

            // Crea un grafico per ogni campo
            fields.forEach(field => {
                const values = data.map(row => row[field]);

                const chartCard = document.createElement('div');
                chartCard.className = 'bg-white p-6 rounded-2xl shadow-lg mb-6';

                const chartCanvas = document.createElement('canvas');
                chartCard.appendChild(chartCanvas);
                chartsContainer.appendChild(chartCard);

                new Chart(chartCanvas, {
                    type: 'line',
                    data: {
                        labels: timeLabels,
                        datasets: [{
                            label: field,
                            data: values,
                            borderColor: getRandomColor(),
                            backgroundColor: 'rgba(0, 123, 255, 0.2)',
                            fill: true,
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: maintainAspectRatio,
                        scales: {
                            x: { title: { display: true, text: 'Time' } },
                            y: { title: { display: true, text: field } }
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Errore durante la creazione dei grafici:', error);
        }
    }
  
    function getRandomColor() {
      return `hsl(${Math.random() * 360}, 100%, 60%)`;
    }
  
    function toggleAspectRatio() {
      maintainAspectRatio = !maintainAspectRatio;
      createCharts();
    }
  
    function goToMainPage() {
      goto('/');
    }
  
    function goToEventPage() {
      goto('/eventPage');
    }
  </script>
  
  <style>
    .charts-wrapper {
      overflow-x: auto;
      white-space: nowrap;
      width: 100%;
    }
    
    .charts-wrapper > div {
      display: inline-block;
      min-width: 800px;
    }
  </style>
  
  
  <div class="min-h-screen bg-gradient-to-br from-green-300 to-purple-400 flex flex-col items-center py-12 px-6">
    <div class="w-full flex justify-end mb-6">
        <button onclick={toggleAspectRatio} class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition duration-200">
            🔄 Toggle Aspect Ratio
        </button>
    </div>
    <h1 class="text-4xl font-extrabold text-gray-900 mb-8">📊 Event CSV & Graphs</h1>
    <div class="flex items-center space-x-6 mb-6">
        <button onclick={() => changeDate('prev')} class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md transition transform hover:scale-110">
            ⬅️ Previous Day
        </button>
        <span class="text-3xl font-bold text-gray-900 px-4 py-2 bg-gray-100 rounded-lg shadow-inner">
            {selectedDate}
        </span>
        <button onclick={() => changeDate('next')} class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md transition transform hover:scale-110">
            ➡️ Next Day
        </button>
    </div>
    <div class="flex space-x-4">
        <button onclick={goToMainPage} class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">
            ⬅️ Back to Main Page
        </button>
        <button onclick={goToEventPage} class="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">
            ➡️ Go to Event Page
        </button>
    </div>
    <div class="mt-6">
        <button onclick={createCharts} class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">
            📊 Load Charts
        </button>
    </div>
    <div bind:this={chartsContainer} class="w-full max-w-6xl mt-10 space-y-8"></div>
  </div>
  
  