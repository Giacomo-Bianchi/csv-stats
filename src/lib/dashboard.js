// InfluxDB & Chart.js Dashboard

const token = 'YOUR_TOKEN';
const org = 'YOUR_ORG';
const bucket = 'YOUR_BUCKET';
const url = 'http://localhost:8086';

const { InfluxDB } = require('@influxdata/influxdb-client');
const { DateTime } = require('luxon');

// Chart.js Plugins
Chart.register(ChartZoomPlugin);

const client = new InfluxDB({ url, token });
const queryApi = client.getQueryApi(org);

// Fetch Data from InfluxDB
async function fetchData(measurement, date) {
    const startDate = DateTime.fromISO(date).startOf('day').toISO();
    const endDate = DateTime.fromISO(date).endOf('day').toISO();

    const fluxQuery = `from(bucket: \"${bucket}\")
        |> range(start: ${startDate}, stop: ${endDate})
        |> filter(fn: (r) => r._measurement == \"${measurement}\")
        |> filter(fn: (r) => r._field == \"value\")`;

    const data = [];
    await queryApi.collectRows(fluxQuery).then(rows => {
        rows.forEach(row => {
            data.push({ x: new Date(row._time), y: row._value });
        });
    }).catch(err => console.error(err));

    return data;
}

// Create Chart
function createChart(measurement, data) {
    const ctx = document.getElementById(measurement).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: measurement,
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
            }]
        },
        options: {
            responsive: true,
            plugins: {
                zoom: {
                    pan: { enabled: true, mode: 'x' },
                    zoom: { enabled: true, mode: 'x' }
                }
            }
        }
    });
}

// Main Logic
async function createCharts(measurement, date) {
    document.getElementById('charts').innerHTML = `<canvas id="${measurement}"></canvas>`;
    const data = await fetchData(measurement, date);
    createChart(measurement, data);
}

// Event Listeners
document.getElementById('datePicker').addEventListener('change', (e) => {
    createCharts('YOUR_MEASUREMENT', e.target.value);
});

document.addEventListener('DOMContentLoaded', () => {
    createCharts('YOUR_MEASUREMENT', DateTime.now().toISODate());
});
