<script>
    import Chart from 'chart.js/auto';
    
    let csvData = [];
    let charts = [];
    let chartsContainer; // Contenitore per i grafici
  
    async function handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        const text = await file.text();
        csvData = await parseCSV(text);
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
      // Distrugge eventuali grafici esistenti
      if (charts.length > 0) {
        charts.forEach(chart => chart.destroy());
        charts = [];
      }
  
      // Svuota il contenitore dei grafici
      chartsContainer.innerHTML = '';
  
      if (csvData.length === 0) return;
  
      // Assumiamo che la colonna "time" sia la prima
      const headers = Object.keys(csvData[0]);
      const timeLabels = csvData.map(row => row.time);
  
      // Crea un grafico per ogni colonna, tranne "time"
      for (let i = 1; i < headers.length; i++) {
        const header = headers[i];
        const values = csvData.map(row => parseFloat(row[header]));
  
        // Crea un canvas per il grafico
        const chartCanvas = document.createElement('canvas');
        chartsContainer.appendChild(chartCanvas);
  
        const chart = new Chart(chartCanvas, {
          type: 'line',
          data: {
            labels: timeLabels,
            datasets: [{
              label: header,
              data: values,
              borderColor: getRandomColor(),
              fill: false
            }]
          },
          options: {
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Time'
                }
              },
              y: {
                display: true,
                title: {
                  display: true,
                  text: header
                }
              }
            }
          }
        });
        charts.push(chart);
      }
    }
  
    function getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }
  
    function validateFile(event) {
      event.preventDefault();
    }
  </script>
  
  <!-- Form per il caricamento del file CSV -->
  <form class="mx-auto mt-8 max-w-md" onsubmit={validateFile}>
    <div class="mb-4">
      <label class="mb-2 block text-sm font-bold text-gray-700" for="csvFile">
        Carica file CSV
      </label>
      <input
        onchange={handleFileChange}
        class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
        id="csvFile"
        type="file"
        name="csvFile"
        accept=".csv"
      />
    </div>
    <div class="flex items-center justify-between">
      <button
        onclick={createCharts}
        class="focus:shadow-outline rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none"
        type="submit"
      >
        Invia
      </button>
    </div>
  </form>
  
  <!-- Contenitore per i grafici -->
  <div bind:this={chartsContainer} class="mx-auto mt-8 max-w-2xl"></div>