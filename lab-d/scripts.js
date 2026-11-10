console.debug("Hello world!");
async function fetchJSON(url) {
    //try {
        const response = await fetch(url);

        const data = await response.json();
        return data;
    //} 
}

async function getCityForecast5(cityName) {
    const url = `https://nm55630.zut.edu.pl/weather_api/forecast?q=${cityName}`;
    return fetchJSON(url);
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
