class Piece {
    constructor(index) {
        this.shape = [0, 0, 0, 0]; // brzeg układanki zostaje prostą krawędzią
        this.index = index;
    }
}

function pieceConnectorsData(rows, cols) {
    const pieces = [];
    const size = rows * cols;

    for (let i = 0; i < size; ++i) pieces.push(new Piece(i));
    // 0 -left, 1 - up, 2 - right, 3 - down

    for (let y = 0; y < rows; ++y) {
        for (let x = 0; x < cols - 1; ++x) {
            const connector = Math.random() < 0.5 ? 1 : -1;
            const i = y * cols + x;

            pieces[i].shape[2] = connector;
            pieces[i + 1].shape[0] = -connector;
        }
    }

    for (let x = 0; x < cols; ++x) {
        for (let y = 0; y < rows - 1; ++y) {
            const connector = Math.random() < 0.5 ? 1 : -1;
            const i = y * cols + x;

            pieces[i].shape[3] = connector;
            pieces[i + cols].shape[1] = -connector;
        }
    }

    return pieces;
}



// Zwraca obrys elementu jako ścieżkę SVG, we współrzędnych canvasa
// (przesuniętych o t, bo canvas ma margines na wypustki).
// shape[bok]: 1 - wypustka, -1 - wcięcie, 0 - prosta krawędź
// boki jak w Piece: 0 - left, 1 - up, 2 - right, 3 - down
function piecePath(w, h, t, shape) {
    const edges = [
        { x: 0, y: 0, dx: w,  dy: 0,  nx: 0,  ny: -1, side: 1 },
        { x: w, y: 0, dx: 0,  dy: h,  nx: 1,  ny: 0,  side: 2 },
        { x: w, y: h, dx: -w, dy: 0,  nx: 0,  ny: 1,  side: 3 },
        { x: 0, y: h, dx: 0,  dy: -h, nx: -1, ny: 0,  side: 0 },
    ];

    const points = [];

    for (const { x, y, dx, dy, nx, ny, side } of edges) {
        const d = shape[side] * t;

        points.push([x, y]);
        points.push([x + dx * 0.4, y + dy * 0.4]);
        points.push([x + dx * 0.4 + nx * d, y + dy * 0.4 + ny * d]);
        points.push([x + dx * 0.6 + nx * d, y + dy * 0.6 + ny * d]);
        points.push([x + dx * 0.6, y + dy * 0.6]);
    }

    return "M" + points.map(([x, y]) => `${x + t} ${y + t}`).join(" L") + " Z";
}

function renderPiece(source, row, col, w, h, t, shape) {
    const canvas = document.createElement("canvas");
    canvas.width = w + 2 * t;
    canvas.height = h + 2 * t;

    const outline = piecePath(w, h, t, shape);

    const ctx = canvas.getContext("2d");
    ctx.clip(new Path2D(outline));
    ctx.drawImage(source, t - col * w, t - row * h);

    // Bez tego przezroczyste marginesy łapałyby mysz i zasłaniały sąsiednie elementy.
    canvas.style.clipPath = `path("${outline}")`;

    return canvas;
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
const TAB_SIZE = 15;

document.documentElement.style.setProperty("--tab-size", `${TAB_SIZE}px`);

const piecesContainer = document.getElementById("piecesContainer");
const puzzleBoard = document.getElementById("puzzle");

// Element aktualnie przeciągany przez użytkownika.
let draggedPiece = null;
let draggedPieceId = null;

let pieces = null;
let placed = null;

// Sprawdza, czy łączenie pasuje do elementu leżącego na sąsiednim polu.
function fitsNeighbor(piece, side, neighborSlot) {
    const neighborId = placed[neighborSlot];

    // Puste pole, albo przeciągany element, który wciąż jest zapisany na starym polu.
    if (neighborId === undefined || neighborId === piece.index)
        return true;

    const oppositeSide = (side + 2) % 4;

    return pieces[neighborId].shape[oppositeSide] === -piece.shape[side];
}

function isSlotValid(piece, slot) {
    const row = Math.floor(slot / COLS);
    const col = slot % COLS;
    const [left, up, right, down] = piece.shape;

    // Prosta krawędź musi być na brzegu planszy i tylko tam.
    if ((col === 0) !== (left === 0)) return false;
    if ((row === 0) !== (up === 0)) return false;
    if ((col === COLS - 1) !== (right === 0)) return false;
    if ((row === ROWS - 1) !== (down === 0)) return false;

    if (col > 0 && !fitsNeighbor(piece, 0, slot - 1)) return false;
    if (row > 0 && !fitsNeighbor(piece, 1, slot - COLS)) return false;
    if (col < COLS - 1 && !fitsNeighbor(piece, 2, slot + 1)) return false;
    if (row < ROWS - 1 && !fitsNeighbor(piece, 3, slot + COLS)) return false;

    return true;
}

// Bez preventDefault() w dragover przeglądarka nie wywoła zdarzenia drop.
function makeDropTarget(element, canAccept, index) {
    element.addEventListener("dragover", event => {
        if (draggedPiece && canAccept())
            event.preventDefault();
    });

    element.addEventListener("drop", event => {
        event.preventDefault();

        console.log(draggedPieceId, index);

        const previousSlot = placed.indexOf(draggedPieceId);
        if (previousSlot !== -1) placed[previousSlot] = undefined;

        if (index !== -1) placed[index] = draggedPieceId; // -1 oznacza stół

        element.append(draggedPiece);
        checkSolved();
    });
}

// Element jest na swoim miejscu, gdy jego numer zgadza się z numerem pola.
function checkSolved() {
    const solved = slots.every((slot, i) => slot.firstElementChild?.dataset.index === String(i));

    console.log("Puzzle solved:", solved);

    if (solved && Notification.permission === "granted")
        new Notification("Puzzle ułożone!", { body: "Wszystkie elementy są na swoim miejscu." });
}

function makeDraggable(piece, index) {
    piece.draggable = true;

    piece.addEventListener("dragstart", event => {
        draggedPiece = piece;
        draggedPieceId = index;
        event.dataTransfer.setData("text/plain", "piece"); // wymagane przez Firefoksa
    });

    piece.addEventListener("dragend", () => {
        draggedPiece = null;
        draggedPieceId = null;
    });
}

// Na stół można odłożyć zawsze, a na pole planszy tylko gdy jest puste i łączenia pasują.
makeDropTarget(piecesContainer, () => true, -1);

const slots = [];
for (let i = 0; i < ROWS * COLS; ++i) {
    const slot = document.createElement("div");
    slot.className = "slot";
    makeDropTarget(slot, () => slot.childElementCount === 0 && isSlotValid(pieces[draggedPieceId], i), i);
    slots.push(slot);
}
puzzleBoard.append(...slots);

document.getElementById("saveButton").addEventListener("click", function() {
    // Przeglądarki pozwalają prosić o zgodę tylko w reakcji na akcję użytkownika.
    Notification.requestPermission();

    leafletImage(map, function (err, canvas) {
        const pieceWidth = Math.floor(canvas.width / COLS);
        const pieceHeight = Math.floor(canvas.height / ROWS);

        slots.forEach(slot => slot.replaceChildren());
        piecesContainer.replaceChildren();
        
        // Bez tasowania, żeby pieces[i] było elementem o numerze i. Tasowany jest tylko widok.
        pieces = pieceConnectorsData(ROWS, COLS);
        placed = new Array(pieces.length);
        
        const visual = pieces.map(({ index, shape }) => {
            const row = Math.floor(index / COLS);
            const col = index % COLS;

            const piece = renderPiece(canvas, row, col, pieceWidth, pieceHeight, TAB_SIZE, shape);
            piece.dataset.index = index;

            makeDraggable(piece, index);

            return piece;
        });

        piecesContainer.append(...shuffle(visual));
    });
});

const coordinates = document.getElementById("coordinates");

document.getElementById("getLocation").addEventListener("click", function(event) {
    if (! navigator.geolocation) {
        coordinates.textContent = "Przeglądarka nie obsługuje geolokalizacji.";
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        const text = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

        coordinates.textContent = text;
        marker.setLatLng([lat, lon]).setPopupContent(`<strong>Moja lokalizacja</strong><br>${text}`);
        map.setView([lat, lon]);
    }, positionError => {
        console.error(positionError);
        coordinates.textContent = `Nie udało się pobrać lokalizacji: ${positionError.message}`;
    });
});
