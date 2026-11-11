console.debug("Hello world!");

function createDayList(data) {
    const dailyTemperatures = new Map();

    for (const entry of data.list) {
        const date = entry.dt_txt.substring(0, 10);
        const temp = entry.main.temp;

        if (!dailyTemperatures.has(date)) {
            dailyTemperatures.set(date, [{
                date: new Date(entry.dt_txt),
                temp: temp
            }]);
        }
        else {
            const day = dailyTemperatures.get(date);
            day.push({date: new Date(entry.dt_txt), temp: temp});
        }
    }

    return dailyTemperatures;
}

async function getCityForecast5(cityName) {
    const url = `https://nm55630.zut.edu.pl/weather_api/forecast?q=${cityName}`;
    const response = await fetch(url);

    return await response.json();
}

const xhr = new XMLHttpRequest();

xhr.open('GET', 'https://nm55630.zut.edu.pl/weather_api/weather');

xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        console.log(data);
    } else {
        console.error(`HTTP error: ${xhr.status}`);
    }
};

xhr.onerror = () => console.error('Network error');

xhr.send();

getCityForecast5("Szczecin");

let chart = null;

function renderForecast(dailyTemperatures) {
    const daysContainer = document.querySelector("#days");

    daysContainer.innerHTML = "";

    const days = [...dailyTemperatures.entries()];

    days.forEach(([date, temperatures], index) => {
        const button = document.createElement("button");

        button.textContent = new Date(date).toLocaleDateString(
            "en-GB",
            { weekday: "short", day: "numeric", month: "short" }
        );

        button.addEventListener("click", () => {
            document.querySelector("#days .active")
                ?.classList.remove("active");

            button.classList.add("active");

            updateChart(temperatures);
        });

        daysContainer.appendChild(button);

        // Domyślnie wybieramy pierwszy dzień.
        /*if (index === 0) {
            button.classList.add("active");
            updateChart(temperatures);
        }*/
    });
}

function updateChart(temperatures) {
    const labels = temperatures.map(entry =>
        entry.date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit"
        })
    );

    const values = temperatures.map(entry => entry.temp);

    if (!chart) {
        chart = new Chart(
            document.querySelector("#temperature-chart"),
            {
                type: "line",
                data: {
                    labels,
                    datasets: [{
                        label: "Temperature (°C)",
                        data: values,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );
    }
    else {
        chart.data.labels = labels;
        chart.data.datasets[0].data = values;
        chart.update();
    }
}

getCityForecast5('Szczecin').then(json => {
    const dailyTemperatures = createDayList(json);
    renderForecast(dailyTemperatures);
})
