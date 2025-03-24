<script>
  import Chart from 'chart.js/auto';
  import { goto } from '$app/navigation';
  import { dataPageCsvDataStore, dataPageChartsStore } from '$lib/store';
  import { onDestroy, onMount } from 'svelte';

  let csvData = [];
  let charts = [];
  let chartsContainer;
  let maintainAspectRatio = true;

  dataPageCsvDataStore.subscribe(value => {
    csvData = value;
  });

  dataPageChartsStore.subscribe(value => {
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
              labels: {
                font: { weight: 'bold' },
                color: '#333'
              }
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

  onDestroy(() => {
    charts.forEach(chart => chart.destroy());
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-100 to-gray-200 flex flex-col items-center py-12 px-6">
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
    <button onclick={goToEventPage} class="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">
      ➡️ Go to Event Page
    </button>
  </div>

  <div class="mt-6">
    <button onclick={loadCharts} class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">
      📊 Load Charts
    </button>
  </div>

  <div bind:this={chartsContainer} class="w-full max-w-4xl mt-10 space-y-6"></div>
</div>