console.debug("Hello world!");

function splitCanvas(canvas, rows, cols) {
    const chunks = [];

    const chunkWidth = Math.floor(canvas.width / cols);
    const chunkHeight = Math.floor(canvas.height / rows);

    const ctx = canvas.getContext("2d");

    for (let y = 0; y < canvas.height; y += chunkHeight)
        for (let x = 0; x < canvas.width; x += chunkWidth)
            chunks.push(ctx.getImageData(x, y, chunkWidth, chunkHeight));

    return chunks;
}

let map = L.map('map').setView([53.430127, 14.564802], 18);
// L.tileLayer.provider('OpenStreetMap.DE').addTo(map);
L.tileLayer.provider('Esri.WorldImagery').addTo(map);
let marker = L.marker([53.430127, 14.564802]).addTo(map);
marker.bindPopup("<strong>Hello!</strong><br>This is a popup.");

const piecesContainer = document.getElementById("piecesContainer");

document.getElementById("saveButton").addEventListener("click", function() {
    leafletImage(map, function (err, canvas) {
        const puzzles = splitCanvas(canvas, 4, 4);

        piecesContainer.replaceChildren();
        puzzles.map(p => {
            const canvas = document.createElement("canvas");

            canvas.width = p.width;
            canvas.height = p.height;

            canvas.getContext("2d").putImageData(p, 0, 0);

            piecesContainer.append(canvas);
        });
    });
});

document.getElementById("getLocation").addEventListener("click", function(event) {
    if (! navigator.geolocation) {
        console.log("No geolocation.");
    }

    navigator.geolocation.getCurrentPosition(position => {
        console.log(position);
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;

        map.setView([lat, lon]);
    }, positionError => {
        console.error(positionError);
    });
});
