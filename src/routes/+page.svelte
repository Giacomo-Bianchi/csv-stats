<script>
  import Chart from 'chart.js/auto';
  import { goto } from '$app/navigation';
  import { mainPageCsvDataStore, mainPageChartsStore } from '$lib/store';
  import { onDestroy, onMount } from 'svelte';

  let csvData = [];
  let charts = [];
  let chartsContainer;
  let maintainAspectRatio = true;

  mainPageCsvDataStore.subscribe(value => {
    csvData = value;
  });

  mainPageChartsStore.subscribe(value => {
    charts = value;
  });

  onMount(() => {
    if (csvData.length > 0) {
      restoreCharts();
    }
  });

  function restoreCharts() {
    if (chartsContainer && charts.length === 0) {
      createCharts();
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      const text = await file.text();
      csvData = await parseCSV(text);
      mainPageCsvDataStore.set(csvData);
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

  function createCharts() {
    if (charts.length > 0) {
      charts.forEach(chart => chart.destroy());
      charts = [];
    }

    chartsContainer.innerHTML = '';

    if (csvData.length === 0) return;

    const headers = Object.keys(csvData[0]);
    const timeLabels = csvData.map(row => row.time);

    for (let i = 1; i < headers.length; i++) {
      const header = headers[i];
      const values = csvData.map(row => parseFloat(row[header]));

      const chartCard = document.createElement('div');
      chartCard.className = 'bg-white p-4 rounded-xl shadow-md mb-6';

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
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: maintainAspectRatio,
          scales: {
            x: { title: { display: true, text: 'Time' } },
            y: { title: { display: true, text: header } }
          }
        }
      });

      charts.push(chart);
    }

    mainPageChartsStore.set(charts);
  }

  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  function toggleAspectRatio() {
    maintainAspectRatio = !maintainAspectRatio;
    createCharts();
  }

  function goToSecondPage() {
    goto('/eventPage');
  }

  onDestroy(() => {
    charts.forEach(chart => chart.destroy());
  });
</script>

<div class="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
  <div class="w-full flex justify-end mb-4">
    <button onclick={toggleAspectRatio} class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
      Toggle Aspect Ratio
    </button>
  </div>
  <h1 class="text-3xl font-bold text-gray-800 mb-6">📊 Upload and Visualize Data CSV</h1>

  <form class="bg-white shadow-lg rounded-lg p-6 w-full max-w-md" onsubmit={e => e.preventDefault()}>
    <div class="mb-4">
      <label class="block text-sm font-semibold text-gray-700 mb-2" for="csvFile">
        Upload your file 'data.csv'
      </label>
      <input
        onchange={handleFileChange}
        class="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring focus:ring-blue-300 focus:border-blue-500"
        id="csvFile"
        type="file"
        name="csvFile"
        accept=".csv"
      />
    </div>
    <button
      onclick={createCharts}
      class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
      type="submit"
    >
      📤 Send and Generate Plots
    </button>
  </form>

  <div bind:this={chartsContainer} class="w-full max-w-4xl mt-8 space-y-6"></div>

  <button onclick={goToSecondPage}
    class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
    ➡️ Go to Second Page
  </button>
</div>