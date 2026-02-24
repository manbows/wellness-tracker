function nextStep(stepNumber) {
    const currentStep = document.querySelector('.step.active')
    if (currentStep) {
        currentStep.classList.remove('active')
    }
    const next = document.getElementById('step-' + stepNumber)
    next.classList.add('active')
}

function switchView(view, btn) {
    document.querySelectorAll('.toggle-btn').forEach(function(b) {
        b.classList.remove('active-toggle')
    })
    btn.classList.add('active-toggle')
    if (window.myChartInstance) {
        window.myChartInstance.destroy()
    }
    loadChart(view)
}

function loadChart(view = '30days') {
    fetch('/api/entries')
        .then(function(response) {
            return response.json()
        })
        .then(function(allEntries) {
            let entries = allEntries

            if (view === '30days') {
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                entries = allEntries.filter(function(entry) {
                    const entryDate = new Date(entry.date)
                    return entryDate >= thirtyDaysAgo
                })
            }

            const labels = entries.map(function(entry) {
                const date = new Date(entry.date)
                return date.getDate()
            })

            const scores = entries.map(function(entry) {
                return entry.score
            })

            const now = new Date()
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

            const ctx = document.getElementById('myChart').getContext('2d')

            window.myChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Loving life',
                        data: scores,
                        borderColor: '#C4714F',
                        backgroundColor: 'rgba(196, 113, 79, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#C4714F',
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 2000,
                        easing: 'easeInOutQuart'
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 10,
                            grid: {
                                color: 'rgba(154, 140, 130, 0.2)'
                            }
                        },
                        x: {
                            type: 'linear',
                            min: labels[0] || 1,
                            max: lastDay,
                            grid: {
                                display: false
                            },
                            ticks: {
                                stepSize: 1
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            position: 'nearest',
                            yAlign: 'bottom',
                            callbacks: {
                                afterBody: function(context) {
                                    const entry = entries[context[0].dataIndex]
                                    return [
                                        '',
                                        'Grateful for:',
                                        '• ' + entry.grateful[0],
                                        '• ' + entry.grateful[1],
                                        '• ' + entry.grateful[2],
                                        '',
                                        'Praying for:',
                                        '• ' + entry.prayers[0],
                                        '• ' + entry.prayers[1],
                                        '• ' + entry.prayers[2]
                                    ]
                                }
                            }
                        }
                    }
                }
            })

            document.getElementById('chart-container').classList.add('loaded')

        })
}

function toggleHistory() {
    const table = document.getElementById('history-table')
    const btn = document.querySelector('.step-6-btn')
    if (table.style.display === 'none') {
        table.style.display = 'block'
        fetch('/api/entries')
            .then(function(response) {
                return response.json()
            })
            .then(function(entries) {
                const reversed = entries.slice().reverse()
                let html = ''
                reversed.forEach(function(entry) {
                    const date = new Date(entry.date)
                    const formatted = date.toLocaleDateString('en-GB', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })
                    html += '<div class="history-card">'
                    html += '<p class="history-date">' + formatted + '</p>'
                    html += '<p class="history-text">Today I\'m grateful for <em>' + entry.grateful[0] + '</em>, <em>' + entry.grateful[1] + '</em> and <em>' + entry.grateful[2] + '</em>, and I\'m praying about <em>' + entry.prayers[0] + '</em>, <em>' + entry.prayers[1] + '</em> and <em>' + entry.prayers[2] + '</em>.</p>'
                    html += '<p class="history-score">Score: ' + entry.score + '/10</p>'
                    html += '</div>'
                })
                table.innerHTML = html
            })
        btn.textContent = 'Hide entries ↑'
    } else {
        table.style.display = 'none'
        btn.textContent = 'See all past entries ↓'
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('main-form')
    if (form) {
        const hasName = form.querySelector('input[name="name"][type="hidden"]')
        if (hasName) {
            nextStep(2)
        } else {
            nextStep(1)
        }
        form.addEventListener('submit', function(e) {
            e.preventDefault()
            nextStep(5)
            setTimeout(function() {
                const formData = new FormData(form)
                fetch('/add', {
                    method: 'POST',
                    body: formData
                })
                .then(function() {
                    nextStep(6)
                    loadChart()
                })
            }, 2500)
        })
    } else {
        loadChart()
    }
})