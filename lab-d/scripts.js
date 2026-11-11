/*
· pojedyncza strona HTML ze skryptem ładowanym z zewnętrznego pliku JS i stylami z zewnętrznego pliku CSS;

· pole tekstowe (input typu „text”) do wprowadzania adresu

· przycisk „Pogoda”, po kliknięciu którego wykonywane jest zapytanie asynchroniczne: o do API Current Weather: https://openweathermap.org/current za pomocą XMLHttpRequest o do API 5 day forecast: https://openweathermap.org/forecast5 za pomocą Fetch API

· obsługa zwrotki z obu API – wypisanie pogody bieżącej oraz prognoz poniżej pola wyszukiwania.

· wymagane jest użycie własnego klucza do API, w przypadku użycia cudzego klucza praca nie zostanie oceniona

· aplikacja musi być responsywna oraz różnić się wyglądem od zaprezentowanego poniżej, w przypadku wykorzystania poniższego wyglądu praca nie zostanie oceniona
*/

function createDayList(data) {
    const dailyTemperatures = new Map();

    for (const entry of data.list) {
        const date = entry.dt_txt.substring(0, 10);
        const temp = kelvinToCelsius(entry.main.temp);

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

// API bez parametru "units" zwraca temperaturę w kelwinach.
function kelvinToCelsius(kelvin) {
    return kelvin - 273.15;
}

function renderCurrent(data) {
    const temp = Math.round(kelvinToCelsius(data.main.temp));
    const feelsLike = Math.round(kelvinToCelsius(data.main.feels_like));

    document.querySelector("#current-city").textContent =
        `${data.name}, ${data.sys.country}`;
    document.querySelector("#current-temp").textContent = `${temp}°C`;
    document.querySelector("#current-description").textContent =
        data.weather[0].description;
    document.querySelector("#current-feels-like").textContent = `${feelsLike}°C`;
    document.querySelector("#current-pressure").textContent = `${data.main.pressure} hPa`;
    document.querySelector("#current-humidity").textContent = `${data.main.humidity}%`;

    
    const icon = document.querySelector("#current-icon");
    icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    icon.alt = data.weather[0].description;
    icon.hidden = false;
}

function renderForecast(dailyTemperatures) {
    const daysContainer = document.querySelector("#days");

    daysContainer.innerHTML = "";

    const days = [...dailyTemperatures.entries()];

    days.forEach(([date, temperatures], index) => {
        const button = document.createElement("button");

        button.textContent = new Date(date).getDate();

        button.addEventListener("click", () => {
            document.querySelector("#days .active")
                ?.classList.remove("active");

            button.classList.add("active");

            updateChart(temperatures);
        });

        daysContainer.appendChild(button);

        // Domyślnie wybieramy pierwszy dzień.
        if (index === 0) {
            button.classList.add("active");
            updateChart(temperatures);
        }
    });
}

const SVG_NS = "http://www.w3.org/2000/svg";

// Tworzy element SVG z podanymi atrybutami (i opcjonalnym tekstem).
function svgElement(tag, attributes = {}, text) {
    const element = document.createElementNS(SVG_NS, tag);

    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function updateChart(temperatures) {
    const svg = document.querySelector("#temperature-chart");

    // Wymiary "logiczne" – viewBox sprawia, że wykres skaluje się do szerokości kontenera.
    const width = 600;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 35, left: 45 };

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const bottom = padding.top + plotHeight;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.replaceChildren();

    // Zakres osi Y – zaokrąglony z zapasem, podzielony na 5 równych kroków.
    const values = temperatures.map(entry => entry.temp);
    const tickCount = 5;
    const min = Math.floor(Math.min(...values)) - 1;
    const step = Math.max(1, Math.ceil((Math.ceil(Math.max(...values)) + 1 - min) / tickCount));
    const max = min + step * tickCount;

    const count = temperatures.length;
    const x = i => padding.left + (count > 1 ? i * plotWidth / (count - 1) : plotWidth / 2);
    const y = t => padding.top + (max - t) / (max - min) * plotHeight;

    // Linie siatki i etykiety osi Y.
    for (let t = min; t <= max; t += step) {
        svg.append(svgElement("line", {
            x1: padding.left, x2: width - padding.right,
            y1: y(t), y2: y(t),
            class: "chart-grid"
        }));
        svg.append(svgElement("text", {
            x: padding.left - 8, y: y(t),
            class: "chart-label chart-label-y"
        }, `${t}°`));
    }

    // Wypełnienie pod wykresem i sama linia.
    const points = temperatures.map((entry, i) => `${x(i)},${y(entry.temp)}`).join(" ");

    svg.append(svgElement("polygon", {
        points: `${x(0)},${bottom} ${points} ${x(count - 1)},${bottom}`,
        class: "chart-area"
    }));
    svg.append(svgElement("polyline", { points, class: "chart-line" }));

    // Punkty pomiarowe z podpowiedzią oraz etykiety godzin na osi X.
    temperatures.forEach((entry, i) => {
        const time = entry.date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const point = svgElement("circle", {
            cx: x(i), cy: y(entry.temp), r: 4,
            class: "chart-point"
        });
        point.append(svgElement("title", {}, `${time}: ${entry.temp.toFixed(1)} °C`));
        svg.append(point);

        svg.append(svgElement("text", {
            x: x(i), y: bottom + 20,
            class: "chart-label chart-label-x"
        }, time));
    });
}

const cityInput = document.querySelector("#search-form #city-input");
const form = document.querySelector("#search-form");

form.onsubmit = event => {
    event.preventDefault();

    const city = cityInput.value;

    getCityForecast5(city).then(json => {
        const dailyTemperatures = createDayList(json);
        renderForecast(dailyTemperatures);
    })

    const xhr = new XMLHttpRequest();

    xhr.open('GET', `https://nm55630.zut.edu.pl/weather_api/weather?q=${city}`);

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            renderCurrent(data);
        } else {
            console.error(`HTTP error: ${xhr.status}`);
        }
    };

    xhr.onerror = () => console.error('Network error');
    xhr.send();
};
