class Task {
  constructor(name, due) {
    this.name = name;
    this.due = due;
  }

  toListItem() {
    const item = document.createElement("div");
    const nameElement = document.createElement("div");
    const dueElement = document.createElement("span");

    nameElement.textContent = this.name;
    dueElement.textContent = this.due.toString();

    item.append(nameElement, dueElement);

    return item;
  }
}

class TODO {
  createListItem(task) {
    const item = document.createElement("li");

    const taskElement = task.toListItem();
    const removeButton = document.createElement("button");

    removeButton.onclick = event => {
      const index = this.tasks.indexOf(task);

      this.tasks.splice(index, 1);
      this.visualList.removeChild(this.visualList.children[index]);
      this.saveTasks();
    };

    removeButton.innerHTML = '<span class="material-symbols-outlined">delete</span>';

    item.append(taskElement, removeButton);

    item.onclick = event => this.click(task, event);

    return item;
  }

  dateValidity(dateString) {
      const date = dateString ? new Date(`${dateString}T00:00:00`) : null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return date === null || date > today;
  }

  click(task, event) {
    console.log(event.target);
    const form = document.createElement("form");
    const nameInput = document.createElement("input");
    const dateInput = document.createElement("input");
    const submitInput = document.createElement("input");

    nameInput.type = "text";
    nameInput.minLength = 3;
    nameInput.maxLength = 255;
    nameInput.placeholder = "Enter name";
    nameInput.required = true;

    dateInput.type = "date";
    submitInput.type = "submit";

    nameInput.defaultValue = task.name;
    dateInput.defaultValue = task.due;

    form.append(nameInput, dateInput, submitInput);

    const li = event.currentTarget;

    form.onsubmit = e => {
      e.preventDefault();

      if (!this.dateValidity(dateInput.value)) {
        alert("Termin musi być pusty lub przypadać w przyszłości");
        return;
      }

      task.name = nameInput.value;
      task.due = dateInput.value;

      li.onclick = event => this.click(task, event);
      document.onpointerdown = null;

      li.childNodes[0].replaceWith(task.toListItem());

      this.saveTasks();
    };

    li.childNodes[0].replaceWith(form);

    li.onclick = null;

    document.onpointerdown = pointerEvent => {
      if (li.contains(pointerEvent.target)) return;

      if (!form.reportValidity()) {
        alert("Nieprawidłowy format nazwy.");
        return;
      }

      if (!this.dateValidity(dateInput.value)) {
        alert("Termin musi być pusty lub przypadać w przyszłości");
        return;
      }

      task.name = nameInput.value;
      task.due = dateInput.value;

      li.onclick = event => this.click(task, event);
      document.onpointerdown = null;

      li.childNodes[0].replaceWith(task.toListItem());

      this.saveTasks();
    };
  }

  draw(list = this.tasks) {
    this.visualList.replaceChildren(
      ...list.map(t => this.createListItem(t))
    );
  }

  addTask(task) {
    this.tasks.push(task);
    this.saveTasks();

    this.draw();
  }

  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  loadTasks() {
    const json = localStorage.getItem("tasks");

    if (!json) return [];

    return JSON.parse(json).map(
      task => new Task(task.name, task.due)
    );
  }

  constructor() {
    this.tasks = this.loadTasks();
    this.visualList = document.querySelector("#TODO ul");
    this.newTaskForm = document.querySelector("#TODO #newTask");
    this.searchInput = document.querySelector("#TODO #searchForm input");

    this.newTaskForm.addEventListener("submit", event => {
      event.preventDefault();

      const name = this.newTaskForm.elements["name"].value;

      const due = this.newTaskForm.elements["due"].value;

      if (!this.dateValidity(due)) {
        alert("Termin musi być pusty lub przypadać w przyszłości");
        return;
      }

      this.addTask(new Task(name, due));
    });

    this.searchInput.onkeydown = event => {
      if (event.key == "Enter") event.preventDefault();
    };

    this.searchInput.addEventListener("input", event => {
      const query = event.target.value;

      /*
       * Zmieniam widoczność elementów zamiast wywoływać draw().
       * Dzięki temu nie tworzę nowych elementów reprezentujących
       * zadania przy każdym wyszukaniu.
       */

      if (query.length >= 2) {
        for (const [i, task] of this.tasks.entries()) {
          let li = this.visualList.childNodes[i];

          /*if (li.childNodes[0].nodeName == "FORM") {
            li.replaceWith(task.toListItem());
            li = this.visualList.childNodes[i];
          }*/

          const nameContainer = li.childNodes[0].childNodes[0];
          const index = task.name.indexOf(query);

          if (index == -1) {
            li.hidden = true;
            continue;
          }

          li.hidden = false;

          const before = task.name.slice(0, index);
          const match = task.name.slice(index, index + query.length);
          const after = task.name.slice(index + query.length);

          nameContainer.replaceChildren();

          if (before) nameContainer.append(document.createTextNode(before));

          const mark = document.createElement("mark");
          mark.textContent = match;
          nameContainer.append(mark);

          if (after) nameContainer.append(document.createTextNode(after));
        }
      }
      else /*if (this.visualList.childElementCount < this.tasks.length)*/ {
        for (const [i, task] of this.tasks.entries()) {
          const li = this.visualList.childNodes[i];

          li.hidden = false;
          li.childNodes[0].childNodes[0].innerHTML = task.name;
        }
      }
    });

    this.draw();
  }
}

const todo = new TODO();
