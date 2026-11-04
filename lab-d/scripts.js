console.debug("Hello world!");
const key = "7ded80d91f2b280ec979100cc8bbba94";

async function fetchJSON(url) {
    //try {
        const response = await fetch(url);

        const data = await response.json();
        return data;
    //} 
}

async function getCityForecast5(cityName) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${key}`;
    return fetchJSON(url);
}
