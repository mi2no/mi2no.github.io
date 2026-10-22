class Task {
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

class TODO {
  draw(list = this.tasks) {
    this.visualList.replaceChildren(
      ...list.map(t => t.toListItem())
    );
  }

  addTask(task) {
    this.tasks.push(task);
    this.draw();
  }

  constructor() {
    this.tasks = [];
    this.visualList = document.querySelector("#TODO ul");
    this.newTaskForm = document.querySelector("#TODO #newTask");
    this.searchInput = document.querySelector("#TODO #search input");

    this.newTaskForm.addEventListener("submit", event => {
      event.preventDefault();

      const name = this.newTaskForm.elements["name"].value;
      const due = this.newTaskForm.elements["due"].value;

      this.addTask(new Task(name, due));
    });

    this.searchInput.addEventListener("input", event => {
      const text = event.target.value;

      if (text.length >= 2) {
        const filtered = this.tasks.filter(t => t.name.startsWith(text));
        this.draw(filtered);
      }
      else if (this.visualList.childElementCount < this.tasks.length) this.draw();
    });
  }
}

const todo = new TODO();
