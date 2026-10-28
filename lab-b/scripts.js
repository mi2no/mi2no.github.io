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

    item.onclick = event => this.click(event);
    item.onfocusout = null;

    return item;
  }

  click(event) {
    console.log(event.target);
    const form = document.createElement("form");
    const nameInput = document.createElement("input");
    const dateInput = document.createElement("input");
    const submitInput = document.createElement("input");

    nameInput.type = "text";
    dateInput.type = "date";
    submitInput.type = "submit";

    nameInput.defaultValue = this.name;
    dateInput.defaultValue = this.due;

    form.append(nameInput, dateInput, submitInput);

    const li = event.currentTarget;

    form.onsubmit = e => {
      e.preventDefault();

      this.name = nameInput.value;
      this.due = dateInput.value;

      document.onpointerdown = null;
      li.replaceWith(this.toListItem());
    };

    li.replaceChildren(form);

    li.onclick = null;

    document.onpointerdown = pointerEvent => {
      if (li.contains(pointerEvent.target)) return;

      this.name = nameInput.value;
      this.due = dateInput.value;

      document.onpointerdown = null;
      li.replaceWith(this.toListItem());
    };
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
    };

    item.append(taskElement, removeButton);

    return item;
  }

  draw(list = this.tasks) {
    this.visualList.replaceChildren(
      ...list.map(t => this.createListItem(t))
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
      const dueDate = due ? new Date(`${due}T00:00:00`) : null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate && dueDate <= today) {
        alert("Termin musi być pusty lub przypadać w przyszłości");
        return;
      }

      this.addTask(new Task(name, due));
    });

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

          const nameContainer = li.childNodes[0];
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
          li.childNodes[0].innerHTML = task.name;
        }
      }
    });
  }
}

const todo = new TODO();
