// Ta funkcja zwraca tablicę uint8 z "losowymi"
// wartościami oznaczającymi kształt elementu.
// 0 - wejście, 1 - przyłącze
// Każdy element ma 4 bity określające rodzaj
// każdego z 4 łączeń. W przypadku rogów
// i krawędzi, bit określający nieużywane łącze
// jest ignorowany.
// Można to jeszcze bardziej upakować, np: 2 bity 
// na rogi i 3 bity na krawędzie, ale nie miałem
// już na to siły :3
function pieceData(rows, cols) {
    const bits = rows * cols * 4;
    const count = (bits >> 3) + (bits % 8 != 0); // bytes
    const arr = new Uint8Array(count);

    for (let i = 0; i < 

    return arr;
}

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

            canvas.onpointerdown = event => pointerDown(event); 

            piecesContainer.append(canvas);
        });
    });
});

const pointerDown = function(event) {
    const piece = event.target;

    console.log(event.clientX);
    console.log(event.clientY);
};

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
