class Piece {
    constructor(index) {
        this.index = index;
        this.shape = 0;

        /*
         * .shape określa krawędzie elementu - a dokładniej
         * typy łączników na tych krawędziach. Są 3 możliwości:
         * krawędź (brak), wypustka i wcięcie, stąd 2 bity na 
         * każdy łącznik
         * 00 - krawędź (brak);
         * 01 - wyputska;
         * 10 - wcięcie.
         * Czyli całość można zakodować na 1 bajcie, ale w js
         * nie ma jawnego typu uint8, więc jest to trochę 
         * "na niby".
         *
         * Łączniki są kodowane w następującej kolejności:
         * [lewo, góra, prawo, dół] zaczynając od najmłodszego
         * bitu - czyli będą zapisane jako (dół|prawo|góra|lewo).
         * */
    }
}

// Ta funkcja tworzy tablicę puzzli (typ Piece).
// Generuje losowe łączenia.
function pieceConnectorsData(rows, cols) {
    const pieces = [];
    const size = rows * cols;

    for (let i = 0; i < size; ++i) pieces.push(new Piece(i));

    // Generowanie łączeń poziomych
    for (let y = 0; y < rows; ++y) {
        for (let x = 0; x < cols - 1; ++x) {
            const connector = Math.round(Math.random());
            const i = y * cols + x;

            pieces[i].shape |= (0b00010000 << connector); 
            // Maska zakodowuje wypustkę na prawej krawędzi.
            // Przesunięcie może zamienić ją na wcięcie.
            pieces[i + 1].shape |= (0b00000010 >> connector);
            // Maska koduje wcięcie na lewej krawędzi.
            // Przesuwam w drugą stronę, aby zagwarantować
            // parę (wcięcie-wypustka) na przeciwnych krawędziach.
        }
    }

    // Generowanie łączeń pionowych
    for (let x = 0; x < cols; ++x) {
        for (let y = 0; y < rows - 1; ++y) {
            const connector = Math.round(Math.random());
            const i = y * cols + x;

            pieces[i].shape |= (0b01000000 << connector);
            // Maska koduje wypustkę na dolnej krawędzi.
            pieces[i + cols].shape |= (0b00001000 >> connector);
            // Maska koduje wcięcie na górnej krawędzi.
        }
    }

    return pieces;
}



// Zwraca obrys elementu jako ścieżkę SVG, we współrzędnych canvasa
// (przesuniętych o t, bo canvas ma margines na wypustki).
// boki jak w Piece: 0 - lewo, 1 - góra, 2 - prawo, 3 - dół
//
// Cały ten fragment wygenerowałem z wykorzystaniem Claude'a, chociaż
// operacje bitowe dodałem sam. Pierwotnie chciałem mieć plik svg wypustki,
// renderować do konkretnej rozdzielczości względem wymiarów puzzle'a. Ale
// zrezygnowałem z tego, bo clipPath z css wykorzystuje ścieżkę.
function piecePath(w, h, t, shape) {
    const edges = [
        { x: 0, y: 0, ux: 1,  uy: 0,  length: w, side: 1 },
        { x: w, y: 0, ux: 0,  uy: 1,  length: h, side: 2 },
        { x: w, y: h, ux: -1, uy: 0,  length: w, side: 3 },
        { x: 0, y: h, ux: 0,  uy: -1, length: h, side: 0 },
    ];

    // Łącznik to łuk koła o promieniu r, wystający z krawędzi dokładnie na t.
    // neck to połowa szerokości przewężenia, wynika z tw. Pitagorasa.
    const r = t * 0.6;
    const neck = Math.sqrt(2 * r * t - t * t);

    let path = `M${t} ${t}`;

    for (const { x, y, ux, uy, length, side } of edges) {
        const midX = x + ux * length / 2 + t;
        const midY = y + uy * length / 2 + t;

        const shift = side << 1;
        const mask = 0b11 << shift;
        const connector = (shape & mask) >> shift;

        if (connector !== 0) {
            // Obrys idzie zgodnie z ruchem wskazówek zegara, więc sweep 1 wyprowadza łuk
            // na zewnątrz (wypustka), a sweep 0 do środka (wcięcie).
            const sweep = connector === 1 ? 1 : 0;

            path += ` L${midX - ux * neck} ${midY - uy * neck}`;
            path += ` A${r} ${r} 0 1 ${sweep} ${midX + ux * neck} ${midY + uy * neck}`;
        }

        path += ` L${x + ux * length + t} ${y + uy * length + t}`;
    }

    return path + " Z";
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
L.tileLayer.provider('Esri.WorldImagery').addTo(map);
let marker = L.marker([53.430127, 14.564802]).addTo(map);
marker.bindPopup("<strong>Hello!</strong><br>This is a popup.");

const ROWS = 4;
const COLS = 4;
const TAB_SIZE = 20;

document.documentElement.style.setProperty("--tab-size", `${TAB_SIZE}px`);

const piecesContainer = document.getElementById("piecesContainer");
const puzzleBoard = document.getElementById("puzzle");

// Element aktualnie przeciągany przez użytkownika.
let draggedPiece = null;
let draggedPieceId = null;

let pieces = null; // Tablica z puzzlami
let placed = null; // Tablicowa reprezentacja układanki

function isSlotValid(piece, slot) {
    const row = Math.floor(slot / COLS);
    const col = slot % COLS;
    const [left, up, right, down] = [0b11, 0b11 << 2, 0b11 << 4, 0b11 << 6];

    // Prosta krawędź musi być na brzegu planszy i tylko tam.
    if ((col === 0) !== ((piece.shape & left) === 0)) return false;
    if ((row === 0) !== ((piece.shape & up) === 0)) return false;
    if ((col === COLS - 1) !== ((piece.shape & right) === 0)) return false;
    if ((row === ROWS - 1) !== ((piece.shape & down) === 0)) return false;

    let mask = 0;

    const shapeAt = neighborSlot => {
        const id = placed[neighborSlot];
        return (id === undefined || id === piece.index) ? 0 : pieces[id].shape;
    };

    if (col > 0) mask |= shapeAt(slot - 1) & right;
    if (row > 0) mask |= shapeAt(slot - COLS) & down;
    if (col < COLS - 1) mask |= shapeAt(slot + 1) & left;
    if (row < ROWS - 1) mask |= shapeAt(slot + COLS) & up;

    mask = (mask >> 4) | (mask << 4);

    return (mask & piece.shape) === 0;
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
    const solved = placed.every((p, i) => p === i);

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
        placed = new Array(pieces.length).fill(undefined); // every() pomija dziury w tablicy
        
        const visual = pieces.map(({ index, shape }) => {
            const row = Math.floor(index / COLS);
            const col = index % COLS;

            const piece = renderPiece(canvas, row, col, pieceWidth, pieceHeight, TAB_SIZE, shape);

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
