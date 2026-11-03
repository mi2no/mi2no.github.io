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
/*function pieceData(rows, cols) {
    const bits = rows * cols * 4;
    const count = (bits >> 3) + (bits % 8 != 0); // bytes
    const arr = new Uint8Array(count);

    for (let i = 0; i < 

    return arr;
}*/

function splitCanvas(canvas, rows, cols) {
    const chunks = [];

    const chunkWidth = Math.floor(canvas.width / cols);
    const chunkHeight = Math.floor(canvas.height / rows);

    const ctx = canvas.getContext("2d");

    for (let row = 0; row < rows; ++row)
        for (let col = 0; col < cols; ++col)
            chunks.push(ctx.getImageData(col * chunkWidth, row * chunkHeight, chunkWidth, chunkHeight));

    return chunks;
}

// Algorytm Fishera-Yatesa, tasuje tablicę w miejscu.
function shuffle(array) {
    for (let i = array.length - 1; i > 0; --i) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

let map =L.map('map').setView([53.430127, 14.564802], 18);
// L.tileLayer.provider('OpenStreetMap.DE').addTo(map);
L.tileLayer.provider('Esri.WorldImagery').addTo(map);
let marker = L.marker([53.430127, 14.564802]).addTo(map);
marker.bindPopup("<strong>Hello!</strong><br>This is a popup.");

const ROWS = 4;
const COLS = 4;

const piecesContainer = document.getElementById("piecesContainer");
const puzzleBoard = document.getElementById("puzzle");

// Element aktualnie przeciągany przez użytkownika.
let draggedPiece = null;

// Bez preventDefault() w dragover przeglądarka nie wywoła zdarzenia drop.
function makeDropTarget(element, canAccept) {
    element.addEventListener("dragover", event => {
        if (draggedPiece && canAccept())
            event.preventDefault();
    });

    element.addEventListener("drop", event => {
        event.preventDefault();
        element.append(draggedPiece);
        checkSolved();
    });
}

// Element jest na swoim miejscu, gdy jego numer zgadza się z numerem pola.
function checkSolved() {
    const solved = slots.every((slot, i) => slot.firstElementChild?.dataset.index === String(i));

    console.debug("Puzzle solved:", solved);

    if (solved && Notification.permission === "granted")
        new Notification("Puzzle ułożone!", { body: "Wszystkie elementy są na swoim miejscu." });
}

function makeDraggable(piece) {
    piece.draggable = true;

    piece.addEventListener("dragstart", event => {
        draggedPiece = piece;
        event.dataTransfer.setData("text/plain", "piece"); // wymagane przez Firefoksa
    });

    piece.addEventListener("dragend", () => {
        draggedPiece = null;
    });
}

// Na stół można odłożyć zawsze, a na pole planszy tylko gdy jest puste.
makeDropTarget(piecesContainer, () => true);

const slots = [];
for (let i = 0; i < ROWS * COLS; ++i) {
    const slot = document.createElement("div");
    slot.className = "slot";
    makeDropTarget(slot, () => slot.childElementCount === 0);
    slots.push(slot);
}
puzzleBoard.append(...slots);

document.getElementById("saveButton").addEventListener("click", function() {
    // Przeglądarki pozwalają prosić o zgodę tylko w reakcji na akcję użytkownika.
    Notification.requestPermission();

    leafletImage(map, function (err, canvas) {
        const puzzles = splitCanvas(canvas, ROWS, COLS);

        slots.forEach(slot => slot.replaceChildren());
        piecesContainer.replaceChildren();
        const pieces = puzzles.map((p, i) => {
            const canvas = document.createElement("canvas");

            canvas.width = p.width;
            canvas.height = p.height;
            canvas.dataset.index = i;

            canvas.getContext("2d").putImageData(p, 0, 0);

            makeDraggable(canvas);

            return canvas;
        });

        piecesContainer.append(...shuffle(pieces));
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
