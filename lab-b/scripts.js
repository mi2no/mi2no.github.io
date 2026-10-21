console.debug("Hello world!");

class task {
  constructor(name, due) {
    this.name = name;
    this.due = due;
  }

  toListItem() {
    const item = document.createElement("li");
    const nameElement = document.createElement("span");
    const dueElement = document.createElement("span");

    nameElement.textContent = this.name;
    dueElement.textContent = this.due.toString();

    item.appendChild(nameElement);
    item.appendChild(dueElement);

    return item;
  }
}

const tasks = [];
const visualList = document.querySelector("#TODO ul");
const newTaskForm = document.querySelector("#TODO #newTask");

function draw() {
  visualList.replaceChildren(
    ...tasks.map(t => t.toListItem())
  );
}

function addTask(task) {
  tasks.push(task);
  draw();
}

newTaskForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const name = newTaskForm.elements["name"].value;
  const due = newTaskForm.elements["due"].value;

  addTask(new task(name, due));
});
