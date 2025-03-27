<script>
  import { goto } from '$app/navigation';
  import Chart from 'chart.js/auto';
  import { eventPageCsvDataStore, eventPageChartsStore } from '$lib/store';
  import { onDestroy, onMount } from 'svelte';

  let csvData = [];
  let charts = [];
  let chartsContainer;
  let maintainAspectRatio = true;

  eventPageCsvDataStore.subscribe(value => {
    csvData = value;
  });

  eventPageChartsStore.subscribe(value => {
    charts = value;
  });

  onMount(async () => {
    if (typeof window !== 'undefined') {
      // Importa dinamicamente il plugin per evitare problemi SSR
      const zoomPlugin = (await import('chartjs-plugin-zoom')).default;
      Chart.register(zoomPlugin);

    /*if (csvData.length > 0) {
        restoreCharts();
      } */
    }
  });

  function restoreCharts() {
    if (chartsContainer && charts.length === 0) {
      createCharts();
    }
  }

/*   function createCharts() {
    if (charts.length > 0) {
      charts.forEach(chart => chart.destroy());
      charts = [];
    }

    chartsContainer.innerHTML = '';

    if (csvData.length === 0) return;

    const headers = Object.keys(csvData[0]);
    const step = Math.max(1, Math.ceil(csvData.length / 100000));
    const reducedCsvData = csvData.filter((_, index) => index % step === 0);
    const timeLabels = reducedCsvData.map(row => row.time);

    for (let i = 1; i < headers.length; i++) {
      const header = headers[i];
      const values = csvData.map(row => parseFloat(row[header]));

      const chartCard = document.createElement('div');
      chartCard.className = 'bg-white p-6 rounded-xl shadow-lg border border-gray-300 mb-6';

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
            },
            zoom: {
              pan: { enabled: true, mode: 'x' }, // Abilita lo scorrimento orizzontale
              zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' } // Abilita lo zoom orizzontale
            }
          }
        }
      });

      charts.push(chart);
    }

    eventPageChartsStore.set(charts);
  }
 */
  function createCharts() {
    if (charts.length > 0) {
      charts.forEach(chart => chart.destroy());
      charts = [];
    }

    chartsContainer.innerHTML = '';

    if (csvData.length === 0) return;

    const headers = Object.keys(csvData[0]);
    const step = Math.max(1, Math.ceil(csvData.length / 100000));
    const reducedCsvData = csvData.filter((_, index) => index % step === 0);
    const timeLabels = reducedCsvData.map(row => row.time);

    // Numero di dati visibili inizialmente
    const visibleDataCount = 50;

    for (let i = 1; i < headers.length; i++) {
      const header = headers[i];
      const values = reducedCsvData.map(row => parseFloat(row[header]));

      const chartCard = document.createElement('div');
      chartCard.className = 'bg-white p-6 rounded-xl shadow-lg border border-gray-300 mb-6';

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
            x: {
              title: { display: true, text: 'Time', font: { weight: 'bold' } },
              min: 0, // Mostra i primi dati
              max: visibleDataCount - 1, // Mostra fino al dato `visibleDataCount`
              ticks: {
                autoSkip: true,
                maxTicksLimit: 10
              }
            },
            y: {
              title: { display: true, text: header, font: { weight: 'bold' } }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                font: { weight: 'bold' },
                color: '#333'
              }
            },
            decimation: { enabled: true, algorithm: 'lttb', samples: 100 },
            zoom: {
              pan: { enabled: true, mode: 'x' }, // Abilita lo scorrimento orizzontale
              zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' } // Abilita lo zoom orizzontale
            }
          }
        }
      });

      charts.push(chart);
    }

    eventPageChartsStore.set(charts);
  }

  function getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  }

  function toggleAspectRatio() {
    maintainAspectRatio = !maintainAspectRatio;
    createCharts();
  }

  function goToMainPage() {
    goto('/');
  }

  function goToDataPage() {
    goto('/dataPage');
  }

  function loadCharts() {
    createCharts();
  }

  onDestroy(() => {
    charts.forEach(chart => chart.destroy());
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-green-300 to-purple-400 flex flex-col items-center py-12 px-6">
  <div class="w-full flex justify-end mb-6">
    <button onclick={toggleAspectRatio} class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition duration-200">
      🔄 Toggle Aspect Ratio
    </button>
  </div>
  <h1 class="text-4xl font-extrabold text-gray-900 mb-8">📊 Event CSV & Graphs</h1>

  <div class="flex space-x-4">
    <button onclick={goToMainPage} class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">
      ⬅️ Back to Main Page
    </button>
    <button onclick={goToDataPage} class="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">
      ➡️ Go to Data Page
    </button>
  </div>

  <div class="mt-6">
    <button onclick={loadCharts} class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105">
      📊 Load Charts
    </button>
  </div>

  <div bind:this={chartsContainer} class="w-full max-w-6xl mt-10 space-y-8"></div>
</div>