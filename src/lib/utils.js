 
  // Funzione per generare un colore casuale
  export function getRandomColor() {
    return `hsl(${Math.random() * 360}, 100%, 60%)`;
  }
    // Funzione per parsare un CSV
    export  function parseCSV(csvString) {
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

  ///////////////////////////////////
  // Fuzioni di backup 

  async function saveOnInfluxDB() {
    try {
        // Salva i dati di dataCsv
        dataCsv.forEach(row => {
            const accelerometerX = parseFloat(row['accelerometer X']);
            const accelerometerY = parseFloat(row['accelerometer Y']);
            const accelerometerZ = parseFloat(row['accelerometer Z']);
            const gyroscopeX = parseFloat(row['gyroscope X']);
            const gyroscopeY = parseFloat(row['gyroscope Y']);
            const gyroscopeZ = parseFloat(row['gyroscope Z']);
            const temperature = parseFloat(row['temperature']);
            const pressure = parseFloat(row['pressure']);
            const VOC = parseFloat(row['VOC']);
            const CO2 = parseFloat(row['CO2']);
            const humidity = parseFloat(row['Humidity']);

            // Controlla se i valori sono numeri validi
            if (
                isNaN(accelerometerX) || isNaN(accelerometerY) || isNaN(accelerometerZ) ||
                isNaN(gyroscopeX) || isNaN(gyroscopeY) || isNaN(gyroscopeZ) ||
                isNaN(temperature) || isNaN(pressure) || isNaN(VOC) ||
                isNaN(CO2) || isNaN(humidity)
            ) {
                console.error('Valore non valido nel CSV:', row);
                return; // Salta questa riga
            }

            const point = new Point('data')
                .tag('email', email)
                .floatField('accelerometer_x', accelerometerX)
                .floatField('accelerometer_y', accelerometerY)
                .floatField('accelerometer_z', accelerometerZ)
                .floatField('gyroscope_x', gyroscopeX)
                .floatField('gyroscope_y', gyroscopeY)
                .floatField('gyroscope_z', gyroscopeZ)
                .floatField('temperature', temperature)
                .floatField('pressure', pressure)
                .floatField('VOC', VOC)
                .floatField('CO2', CO2)
                .floatField('humidity', humidity)
                .timestamp(new Date(row['time']).getTime() * 1e6); // Converti in nanosecondi
            writeApi.writePoint(point);
        });

        // Salva i dati di eventCsv
        eventCsv.forEach(row => {
            const accelerometerX = parseFloat(row['accelerometer X']);
            const accelerometerY = parseFloat(row['accelerometer Y']);
            const accelerometerZ = parseFloat(row['accelerometer Z']);
            const gyroscopeX = parseFloat(row['gyroscope X']);
            const gyroscopeY = parseFloat(row['gyroscope Y']);
            const gyroscopeZ = parseFloat(row['gyroscope Z']);

            // Controlla se i valori sono numeri validi
            if (
                isNaN(accelerometerX) || isNaN(accelerometerY) || isNaN(accelerometerZ) ||
                isNaN(gyroscopeX) || isNaN(gyroscopeY) || isNaN(gyroscopeZ)
            ) {
                console.error('Valore non valido nel CSV:', row);
                return; // Salta questa riga
            }

            const point = new Point('event')
                .tag('email', email)
                .floatField('accelerometer_x', accelerometerX)
                .floatField('accelerometer_y', accelerometerY)
                .floatField('accelerometer_z', accelerometerZ)
                .floatField('gyroscope_x', gyroscopeX)
                .floatField('gyroscope_y', gyroscopeY)
                .floatField('gyroscope_z', gyroscopeZ)
                .timestamp(new Date(row['time']).getTime() * 1e6); // Converti in nanosecondi
            writeApi.writePoint(point);
        });

        await writeApi.close();
        alert('Data saved successfully to InfluxDB!');
    } catch (error) {
        console.error('Errore durante il salvataggio su InfluxDB:', error);
        alert('Errore durante il salvataggio su InfluxDB: ' + error.message);
    }
  }

  async function downloadCSV(type) {
    try {
        const queryApi = influxDB.getQueryApi(influxOrg);

        // Query per ottenere i dati da InfluxDB
        const fluxQuery = `
            from(bucket: "${influxBucket}")
                |> range(start: -30d) // Recupera i dati degli ultimi 30 giorni
                |> filter(fn: (r) => r._measurement == "${type}")
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
                |> sort(columns: ["_time"])
        `;

        const rows = [];
        await new Promise((resolve, reject) => {
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
                    resolve();
                }
            });
        });

        if (rows.length === 0) {
            alert('Nessun dato trovato per il tipo selezionato.');
            return;
        }

        // Converti i dati in formato CSV
        const csvContent = convertToCSV(rows);

        // Crea un file CSV e scaricalo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${type}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Errore durante il download del CSV:', error);
        alert('Errore durante il download del CSV: ' + error.message);
    }
}

    // Funzione per convertire i dati in formato CSV
    function convertToCSV(data) {
      if (data.length === 0) return '';

      const headers = Object.keys(data[0]).join(','); // Intestazioni CSV
      const rows = data.map(row =>
          Object.values(row)
              .map(value => (typeof value === 'string' ? `"${value}"` : value)) // Gestisce i valori stringa
              .join(',')
      );

      return [headers, ...rows].join('\n');
  }