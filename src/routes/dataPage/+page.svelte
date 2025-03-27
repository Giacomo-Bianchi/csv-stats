<!-- <script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  import { goto } from '$app/navigation';
  import { dataPageCsvDataStore, dataPageChartsStore } from '$lib/store';

  let csvData = [];
  let charts = [];
  let chartsContainer;
  let maintainAspectRatio = true;

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
        restoreCharts();
      } else {
        await fetchDataFromJson();
      }
    }
  });

  async function fetchDataFromJson() {
    try {
      const response = await fetch('http://localhost:3000/api/data');
      if (response.ok) {
        const data = await response.json();
        csvData = parseCSV(data.csvData);
        dataPageCsvDataStore.set(csvData);
      } else {
        console.error('Error fetching data');
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }

  function restoreCharts() {
    if (chartsContainer && charts.length === 0) {
      createCharts();
    }
  }

  function createCharts() {
    if (typeof window === 'undefined') return;

    if (charts.length > 0) {
      charts.forEach(chart => chart.destroy());
      charts = [];
    }

    chartsContainer.innerHTML = '';

    if (csvData.length === 0) {
      console.log('No CSV data available');
      return;
    }

    const headers = Object.keys(csvData[0]);
    const step = Math.max(1, Math.ceil(csvData.length / 100000));
    const reducedCsvData = csvData.filter((_, index) => index % step === 0);
    const timeLabels = reducedCsvData.map(row => row.time);

    for (let i = 1; i < headers.length; i++) {
      const header = headers[i];
      const values = reducedCsvData.map(row => parseFloat(row[header]));

      const chartCard = document.createElement('div');
      chartCard.className = 'bg-white p-6 rounded-2xl shadow-lg mb-6';

      const chartCanvas = document.createElement('canvas');
      chartCard.appendChild(chartCanvas);
      chartsContainer.appendChild(chartCard);

      const chart = new Chart(chartCanvas, {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [{
            label: header,
            data: values,
            borderColor: getRandomColor(),
            backgroundColor: 'rgba(0, 123, 255, 0.2)',
            fill: true,
            borderWidth: 2
          }]
        },
        options: {
          parsing: false,
          responsive: true,
          maintainAspectRatio: maintainAspectRatio,
          scales: {
            x: { title: { display: true, text: 'Time', font: { weight: 'bold' } } },
            y: { title: { display: true, text: header, font: { weight: 'bold' } } }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: { font: { weight: 'bold' }, color: '#333' }
            },
            decimation: { enabled: true, algorithm: 'lttb', samples: 1000 },
            zoom: {
              pan: { enabled: true, mode: 'x' },
              zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
            }
          }
        }
      });

      charts.push(chart);
    }

    dataPageChartsStore.set(charts);
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

  function loadCharts() {
    createCharts();
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

<div class="min-h-screen bg-gradient-to-br from-blue-300 to-green-200 flex flex-col items-center py-12 px-6">


  <div class="w-full flex justify-end mb-6">
    <button onclick={toggleAspectRatio} class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition duration-200">
      🔄 Toggle Aspect Ratio
    </button>
  </div>
  <h1 class="text-4xl font-extrabold text-gray-800 mb-8">📊 Data CSV & Graphs</h1>

  <div class="flex space-x-4">
    <button onclick={goToMainPage} class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">
      ⬅️ Back to Main Page
    </button>
    <button onclick={goToEventPage} class="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">
      ➡️ Go to Event Page
    </button>
  </div>

  <div class="mt-6">
    <button onclick={loadCharts} class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">
      📊 Load Charts
    </button>
  </div>

  <div bind:this={chartsContainer} class="w-full max-w-4xl mt-10 space-y-6"></div>
</div> -->


<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import { goto } from '$app/navigation';
  import { dataPageCsvDataStore, dataPageChartsStore } from '$lib/store';
  import { parseCSV } from '$lib/utils';

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

  async function fetchDataFromJson() {
    try {
      const response = await fetch('http://localhost:3000/api/data');
      if (response.ok) {
        const data = await response.json();
        csvData = parseCSV(data.csvData);
        dataPageCsvDataStore.set(csvData);
        extractDates();
        setInitialDate();
      } else {
        console.error('Error fetching data');
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
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

  function createCharts() {
    if (typeof window === 'undefined') return;

    // Distruggi i grafici esistenti
    if (charts.length > 0) {
      charts.forEach(chart => chart.destroy());
      charts = [];
    }

    // Svuota il contenitore dei grafici
    if (chartsContainer) {
      chartsContainer.innerHTML = '';
    }

    // Controlla se ci sono dati CSV disponibili
    if (!csvData || csvData.length === 0) {
      console.warn('No CSV data available');
      return;
    }

    // Filtra i dati per la data selezionata
    const filteredData = csvData.filter(row => row.time.startsWith(selectedDate));
    if (filteredData.length === 0) {
      console.warn(`No data available for the selected date: ${selectedDate}`);
      return;
    }

    console.log('Filtered data:', filteredData); // Debugging

    // Ottieni le intestazioni e riduci i dati per prestazioni migliori
    const headers = Object.keys(filteredData[0]);
    const step = Math.max(1, Math.ceil(filteredData.length / 1000));
    const reducedData = filteredData.filter((_, index) => index % step === 0);

    // Mostra solo l'orario nell'asse delle ascisse
    const timeLabels = reducedData.map(row => row.time.split('-')[1].trim());

    // Crea un grafico per ogni colonna (eccetto la prima)
    for (let i = 1; i < headers.length; i++) {
      const header = headers[i];
      const values = reducedData.map(row => {
        const value = row[header]?.replace('\r', '').trim();
        return parseFloat(value) || 0;
      });

      console.log(`Values for ${header}:`, values); // Debugging

      // Crea un contenitore per il grafico
      const chartCard = document.createElement('div');
      chartCard.className = 'bg-white p-6 rounded-2xl shadow-lg mb-6';

      const chartCanvas = document.createElement('canvas');
      chartCard.appendChild(chartCanvas);
      chartsContainer.appendChild(chartCard);

      // Configura e crea il grafico
      const chart = new Chart(chartCanvas, {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [{
            label: header,
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
            x: { title: { display: true, text: 'Time', font: { weight: 'bold' } } },
            y: { title: { display: true, text: header, font: { weight: 'bold' } } }
          },
          plugins: {
            zoom: {
              pan: { enabled: true, mode: 'x' },
              zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
            }
          }
        }
      });

      charts.push(chart);
    }

    // Aggiorna lo store con i nuovi grafici
    dataPageChartsStore.set(charts);
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

