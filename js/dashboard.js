// URL Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbyD288YXO--KuUtrynCux07QwKaZ_kagzCdjl0Y9xJyHlhI5Z8apYnf_t5dTEHRI05a/exec';

// Elemen UI
const totalSalesEl = document.getElementById('totalSales');
const avgROASEl = document.getElementById('avgROAS');
const leadsPerAgentEl = document.getElementById('leadsPerAgent');
const dataTableEl = document.getElementById('dataTable');
const dataSelectorEl = document.getElementById('dataSelector');
const chartTypeEl = document.getElementById('chartType');

// Data storage
let allData = {
    eCommerce: [],
    Marketing: [],
    SalesTeam: []
};

// Chart instance
let dataChart = null;

// Fetch data from Google Sheets
async function fetchData() {
    try {
        // Fetch all data
        const [eCommerceRes, marketingRes, salesteamRes] = await Promise.all([
            fetch(`${scriptURL}?sheet=eCommerce`),
            fetch(`${scriptURL}?sheet=Marketing`),
            fetch(`${scriptURL}?sheet=SalesTeam`)
        ]);

        allData.eCommerce = await eCommerceRes.json();
        allData.Marketing = await marketingRes.json();
        allData.SalesTeam = await salesteamRes.json();

        // Update metrics
        updateMetrics();
        // Update table
        updateTable();
        // Update chart
        updateChart();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Calculate and display metrics
function updateMetrics() {
    // Total Sales (eCommerce + SalesTeam)
    const ecomSales = allData.eCommerce.reduce((sum, row) => sum + parseFloat(row.sales || 0), 0);
    const salesTeamSales = allData.SalesTeam.reduce((sum, row) => sum + parseFloat(row.sales || 0), 0);
    totalSalesEl.textContent = `RM${(ecomSales + salesTeamSales).toLocaleString()}`;

    // Average ROAS (Marketing)
    const roasValues = allData.Marketing.map(row => parseFloat(row.roas || 0));
    const avgROAS = roasValues.reduce((sum, val) => sum + val, 0) / roasValues.length || 0;
    avgROASEl.textContent = avgROAS.toFixed(2);

    // Leads per Agent (SalesTeam)
    const agents = {};
    allData.SalesTeam.forEach(row => {
        if (!agents[row.agent]) agents[row.agent] = 0;
        agents[row.agent] += parseFloat(row.leads || 0);
    });
    const leadsPerAgent = Object.values(agents).reduce((sum, val) => sum + val, 0) / Object.keys(agents).length || 0;
    leadsPerAgentEl.textContent = leadsPerAgent.toFixed(1);
}

// Update table with selected data
function updateTable() {
    const selectedSheet = dataSelectorEl.value;
    const data = allData[selectedSheet];
    
    // Clear table
    dataTableEl.innerHTML = '';
    
    // Add rows
    data.forEach(row => {
        const tr = document.createElement('tr');
        
        // Different columns for different sheets
        if (selectedSheet === 'eCommerce') {
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${row.tarikh}</td>
                <td class="px-6 py-4 whitespace-nowrap">RM${parseFloat(row.sales).toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap">${row.order}</td>
                <td class="px-6 py-4 whitespace-nowrap">${row.channel}</td>
            `;
        } else if (selectedSheet === 'Marketing') {
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${row.tarikh}</td>
                <td class="px-6 py-4 whitespace-nowrap">RM${parseFloat(row.spend).toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap">${row.roas}</td>
                <td class="px-6 py-4 whitespace-nowrap">${row.impressions}</td>
            `;
        } else if (selectedSheet === 'SalesTeam') {
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${row.tarikh}</td>
                <td class="px-6 py-4 whitespace-nowrap">RM${parseFloat(row.sales).toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap">${row.agent}</td>
                <td class="px-6 py-4 whitespace-nowrap">${row.close_rate}%</td>
            `;
        }
        
        dataTableEl.appendChild(tr);
    });
}

// Update chart based on selection
function updateChart() {
    const selectedSheet = dataSelectorEl.value;
    const chartType = chartTypeEl.value;
    const data = allData[selectedSheet];
    
    // Destroy existing chart
    if (dataChart) dataChart.destroy();
    
    const ctx = document.getElementById('dataChart').getContext('2d');
    
    // Prepare chart data based on sheet
    let labels = [];
    let dataset = [];
    let backgroundColor = [];
    
    if (selectedSheet === 'eCommerce') {
        // Group by channel
        const channelData = {};
        data.forEach(row => {
            if (!channelData[row.channel]) {
                channelData[row.channel] = 0;
                backgroundColor.push(getRandomColor());
            }
            channelData[row.channel] += parseFloat(row.sales);
        });
        
        labels = Object.keys(channelData);
        dataset = Object.values(channelData);
    } 
    else if (selectedSheet === 'Marketing') {
        // Last 7 days ROAS
        const last7Days = data.slice(-7);
        labels = last7Days.map(row => row.tarikh);
        dataset = last7Days.map(row => parseFloat(row.roas));
        backgroundColor = labels.map(() => getRandomColor());
    }
    else if (selectedSheet === 'SalesTeam') {
        // Group by agent
        const agentData = {};
        data.forEach(row => {
            if (!agentData[row.agent]) {
                agentData[row.agent] = 0;
                backgroundColor.push(getRandomColor());
            }
            agentData[row.agent] += parseFloat(row.sales);
        });
        
        labels = Object.keys(agentData);
        dataset = Object.values(agentData);
    }
    
    // Create chart
    dataChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: `${selectedSheet} Data`,
                data: dataset,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor.map(color => color.replace('0.6', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: chartType === 'bar' ? {
                y: { beginAtZero: true }
            } : {}
        }
    });
}

// Helper function for random colors
function getRandomColor() {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r}, ${g}, ${b}, 0.6)`;
}

// Event listeners
dataSelectorEl.addEventListener('change', () => {
    updateTable();
    updateChart();
});

chartTypeEl.addEventListener('change', updateChart);

// Initialize
fetchData();
setInterval(fetchData, 300000); // Refresh every 5 minutes