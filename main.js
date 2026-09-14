// Global chart instances
let activityChartInstance = null;
let taxChartInstance = null;
let distributionChartInstance = null;

// Initialize bracket inputs
function initBrackets() {
    const progressiveDefault = [
        { upper: 100, rate: 0.05 },
        { upper: 500, rate: 0.10 },
        { upper: 1000, rate: 0.20 },
        { upper: Infinity, rate: 0.30 }
    ];
    const regressiveDefault = [
        { upper: 100, rate: 0.30 },
        { upper: 500, rate: 0.20 },
        { upper: 1000, rate: 0.10 },
        { upper: Infinity, rate: 0.05 }
    ];

    renderBrackets('progressiveBrackets', progressiveDefault);
    renderBrackets('regressiveBrackets', regressiveDefault);
}

function renderBrackets(containerId, brackets) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    brackets.forEach((b, i) => {
        const row = document.createElement('div');
        row.className = 'bracket-row';
        row.innerHTML = `
            <input type="number" placeholder="Upper bound" value="${b.upper === Infinity ? '' : b.upper}" data-upper="${b.upper}">
            <input type="number" placeholder="Rate" value="${b.rate}" step="0.01" min="0" max="1" data-rate="${b.rate}">
        `;
        container.appendChild(row);
    });
}

function addBracket(containerId) {
    const container = document.getElementById(containerId);
    const row = document.createElement('div');
    row.className = 'bracket-row';
    row.innerHTML = `
        <input type="number" placeholder="Upper bound" value="">
        <input type="number" placeholder="Rate" value="0.10" step="0.01" min="0" max="1">
    `;
    container.appendChild(row);
}

function getBrackets(containerId) {
    const container = document.getElementById(containerId);
    const rows = container.querySelectorAll('.bracket-row');
    const brackets = [];
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        let upper = parseFloat(inputs[0].value);
        if (isNaN(upper) || inputs[0].value === '') {
            upper = Infinity;
        }
        const rate = parseFloat(inputs[1].value) || 0;
        brackets.push({ upper, rate });
    });
    // Ensure last bracket has Infinity
    if (brackets.length > 0 && brackets[brackets.length - 1].upper !== Infinity) {
        brackets[brackets.length - 1].upper = Infinity;
    }
    return brackets;
}

function updateControls() {
    const policy = document.getElementById('policySelect').value;

    // Hide all specific controls
    document.getElementById('flatControls').classList.add('hidden');
    document.getElementById('progressiveControls').classList.add('hidden');
    document.getElementById('regressiveControls').classList.add('hidden');
    document.getElementById('thresholdControls').classList.add('hidden');

    // Show relevant controls
    if (policy === 'flat') {
        document.getElementById('flatControls').classList.remove('hidden');
    } else if (policy === 'progressive') {
        document.getElementById('progressiveControls').classList.remove('hidden');
    } else if (policy === 'regressive') {
        document.getElementById('regressiveControls').classList.remove('hidden');
    } else if (policy === 'threshold') {
        document.getElementById('thresholdControls').classList.remove('hidden');
    }
}

function updateRangeValue(id, decimals = 2) {
    const value = document.getElementById(id).value;
    document.getElementById(id + 'Value').textContent = parseFloat(value).toFixed(decimals);
}

// Tax functions
function noRST(activity) {
    return 0;
}

function flatTax(rate) {
    return function(activity) {
        return rate * activity;
    };
}

function progressiveTax(brackets) {
    return function(activity) {
        let total = 0;
        let lower = 0;
        for (const { upper, rate } of brackets) {
            const taxable = Math.max(0, Math.min(activity, upper) - lower);
            total += taxable * rate;
            if (activity <= upper) break;
            lower = upper;
        }
        return total;
    };
}

function thresholdTax(threshold, rate) {
    return function(activity) {
        return Math.max(0, activity - threshold) * rate;
    };
}

function calculateGini(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const total = sorted.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;

    let weightedSum = 0;
    sorted.forEach((value, i) => {
        weightedSum += (i + 1) * value;
    });

    const n = sorted.length;
    return (2 * weightedSum) / (n * total) - (n + 1) / n;
}

function simulate(initialActivities, taxFunction, periods, investmentEfficiency, diminishingReturns) {
    let capability = 1.0;
    const initialCapability = capability;
    const agents = [...initialActivities];
    const results = [];

    for (let period = 0; period < periods; period++) {
        const totalActivity = agents.reduce((a, b) => a + b, 0);
        const totalTax = agents.reduce((sum, activity) => sum + taxFunction(activity), 0);
        const investment = totalTax;

        let capabilityGain = 0;
        if (investment > 0) {
            capabilityGain = investmentEfficiency * Math.pow(investment, diminishingReturns);
        }
        capability += capabilityGain;

        results.push({
            period,
            activity: totalActivity,
            tax: totalTax,
            investment,
            capability,
            agentActivities: [...agents]
        });

        // Growth for next period
        if (period < periods - 1 && totalActivity > 0) {
            const growthFactor = capability / initialCapability;
            for (let i = 0; i < agents.length; i++) {
                agents[i] *= growthFactor;
            }
        }
    }

    return {
        periods: results,
        initialActivity: results[0].activity,
        finalActivity: results[results.length - 1].activity,
        totalRST: results.reduce((sum, r) => sum + r.tax, 0),
        capabilityImprovement: results[results.length - 1].capability / initialCapability,
        recursiveDividend: function() {
            if (this.totalRST === 0) return 0;
            return (this.finalActivity - this.initialActivity) / this.totalRST;
        }(),
        finalGini: calculateGini(results[results.length - 1].agentActivities)
    };
}

function runSingleSimulation(policyName, initialActivities, periods, investmentEfficiency, diminishingReturns) {
    let taxFunction;

    switch(policyName) {
        case 'no_rst':
            taxFunction = noRST;
            break;
        case 'flat':
            const flatRate = parseFloat(document.getElementById('flatRate').value);
            taxFunction = flatTax(flatRate);
            break;
        case 'progressive':
            const progBrackets = getBrackets('progressiveBrackets');
            taxFunction = progressiveTax(progBrackets);
            break;
        case 'regressive':
            const regBrackets = getBrackets('regressiveBrackets');
            taxFunction = progressiveTax(regBrackets); // Same logic, different rates
            break;
        case 'threshold':
            const threshold = parseFloat(document.getElementById('thresholdValue').value);
            const threshRate = parseFloat(document.getElementById('thresholdRate').value);
            taxFunction = thresholdTax(threshold, threshRate);
            break;
    }

    return simulate(initialActivities, taxFunction, periods, investmentEfficiency, diminishingReturns);
}

function runSimulation() {
    const policySelect = document.getElementById('policySelect');
    const policyName = policySelect.value;
    const policyLabel = policySelect.options[policySelect.selectedIndex].text;

    const periods = parseInt(document.getElementById('periods').value);
    const investmentEfficiency = parseFloat(document.getElementById('investmentEfficiency').value);
    const diminishingReturns = parseFloat(document.getElementById('diminishingReturns').value);
    const initialActivities = document.getElementById('initialActivities').value.split(',').map(s => parseFloat(s.trim()));

    const result = runSingleSimulation(policyName, initialActivities, periods, investmentEfficiency, diminishingReturns);

    // Update metrics
    document.getElementById('finalActivity').textContent = result.finalActivity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('totalRST').textContent = result.totalRST.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('capabilityImprovement').textContent = result.capabilityImprovement.toFixed(2) + 'x';
    document.getElementById('recursiveDividend').textContent = result.recursiveDividend.toFixed(2) + 'x';
    document.getElementById('giniCoefficient').textContent = result.finalGini.toFixed(4);

    // Update charts
    updateCharts(result, policyLabel);

    // Run comparison
    runComparison(initialActivities, periods, investmentEfficiency, diminishingReturns);
}

function updateCharts(result, policyLabel) {
    const periods = result.periods.map(p => p.period);
    const activities = result.periods.map(p => p.activity);
    const capabilities = result.periods.map(p => p.capability);
    const taxes = result.periods.map(p => p.tax);

    // Activity & Capability Chart
    if (activityChartInstance) {
        activityChartInstance.destroy();
    }
    const activityCtx = document.getElementById('activityChart').getContext('2d');
    activityChartInstance = new Chart(activityCtx, {
        type: 'line',
        data: {
            labels: periods,
            datasets: [{
                label: 'Activity',
                data: activities,
                borderColor: '#0066cc',
                backgroundColor: 'rgba(0, 102, 204, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Capability',
                data: capabilities,
                borderColor: '#009933',
                backgroundColor: 'rgba(0, 153, 51, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#333' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#333' },
                    grid: { color: 'rgba(0,0,0,0.1)' }
                },
                y: {
                    ticks: { color: '#333' },
                    grid: { color: 'rgba(0,0,0,0.1)' }
                }
            }
        }
    });

    // Tax Chart
    if (taxChartInstance) {
        taxChartInstance.destroy();
    }
    const taxCtx = document.getElementById('taxChart').getContext('2d');
    taxChartInstance = new Chart(taxCtx, {
        type: 'bar',
        data: {
            labels: periods,
            datasets: [{
                label: 'Tax Collected',
                data: taxes,
                backgroundColor: 'rgba(0, 102, 204, 0.6)',
                borderColor: '#0066cc',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#333' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#333' },
                    grid: { color: 'rgba(0,0,0,0.1)' }
                },
                y: {
                    ticks: { color: '#333' },
                    grid: { color: 'rgba(0,0,0,0.1)' }
                }
            }
        }
    });

    // Distribution Chart
    if (distributionChartInstance) {
        distributionChartInstance.destroy();
    }
    const distCtx = document.getElementById('distributionChart').getContext('2d');
    const initialDist = result.periods[0].agentActivities;
    const finalDist = result.periods[result.periods.length - 1].agentActivities;

    distributionChartInstance = new Chart(distCtx, {
        type: 'bar',
        data: {
            labels: initialDist.map((_, i) => `Agent ${i + 1}`),
            datasets: [{
                label: 'Initial',
                data: initialDist,
                backgroundColor: 'rgba(0, 102, 204, 0.6)',
                borderColor: '#0066cc',
                borderWidth: 1
            }, {
                label: 'Final',
                data: finalDist,
                backgroundColor: 'rgba(0, 153, 51, 0.6)',
                borderColor: '#009933',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#333' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#333' },
                    grid: { color: 'rgba(0,0,0,0.1)' }
                },
                y: {
                    ticks: { color: '#333' },
                    grid: { color: 'rgba(0,0,0,0.1)' }
                }
            }
        }
    });
}

function runComparison(initialActivities, periods, investmentEfficiency, diminishingReturns) {
    const policies = [
        ['No RST', 'no_rst'],
        ['Flat 10%', 'flat_custom'],
        ['Progressive', 'progressive_default'],
        ['Regressive', 'regressive_default'],
        ['Threshold', 'threshold_default']
    ];

    const tbody = document.getElementById('comparisonBody');
    tbody.innerHTML = '';

    policies.forEach(([label, policyKey]) => {
        let result;

        if (policyKey === 'flat_custom') {
            // Use current slider value
            const currentPolicy = document.getElementById('policySelect').value;
            if (currentPolicy === 'flat') {
                result = runSingleSimulation('flat', initialActivities, periods, investmentEfficiency, diminishingReturns);
            } else {
                // Temporarily set to flat with 10%
                const originalRate = document.getElementById('flatRate').value;
                document.getElementById('flatRate').value = 0.10;
                result = runSingleSimulation('flat', initialActivities, periods, investmentEfficiency, diminishingReturns);
                document.getElementById('flatRate').value = originalRate;
            }
        } else if (policyKey === 'progressive_default') {
            const brackets = [
                { upper: 100, rate: 0.05 },
                { upper: 500, rate: 0.10 },
                { upper: 1000, rate: 0.20 },
                { upper: Infinity, rate: 0.30 }
            ];
            const taxFn = progressiveTax(brackets);
            result = simulate(initialActivities, taxFn, periods, investmentEfficiency, diminishingReturns);
        } else if (policyKey === 'regressive_default') {
            const brackets = [
                { upper: 100, rate: 0.30 },
                { upper: 500, rate: 0.20 },
                { upper: 1000, rate: 0.10 },
                { upper: Infinity, rate: 0.05 }
            ];
            const taxFn = progressiveTax(brackets);
            result = simulate(initialActivities, taxFn, periods, investmentEfficiency, diminishingReturns);
        } else if (policyKey === 'threshold_default') {
            const taxFn = thresholdTax(100, 0.15);
            result = simulate(initialActivities, taxFn, periods, investmentEfficiency, diminishingReturns);
        } else {
            result = runSingleSimulation(policyKey, initialActivities, periods, investmentEfficiency, diminishingReturns);
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${label}</td>
            <td>${result.finalActivity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${result.totalRST.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${result.capabilityImprovement.toFixed(2)}x</td>
            <td>${result.recursiveDividend.toFixed(2)}x</td>
        `;
        tbody.appendChild(row);
    });
}

// Initialize
initBrackets();
updateControls();
runSimulation();
