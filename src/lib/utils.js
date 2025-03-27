// Funzione per parsare un CSV
export function parseCSV(csvString) {
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
  
  // Funzione per generare un colore casuale
  export function getRandomColor() {
    return `hsl(${Math.random() * 360}, 100%, 60%)`;
  }
