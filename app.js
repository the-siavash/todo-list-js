const today = document.querySelector('.today');
const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#add-task-input');
const tasksList = document.querySelector('#tasks-list');
const tasksCounter = document.querySelector('#task-counter');
const completedTasksCounter = document.querySelector('#completed-task-counter');
const separatedLine = document.querySelector('.separated-line');
const filterTasks = document.querySelector('#filter-tasks');
const tasksLive = document.getElementsByClassName('task');

let tasks;
let filter = 'all';

class Task {
  id = Date.now();
  createdAt = new Date().toISOString();
  isCompleted = false;

  setTaskContent(content) {
    this.content = content;
  }
}

class UI {
  setupUI() {
    tasks = LocalStorage.getTasks();
    this.poppulateTasks();
    this.setTaskCounter(tasks);
    this.setCompletedTaskCounter(tasks);
  }

  poppulateTasks() {
    switch (filter) {
      case 'all':
        tasks.forEach((task) => this.displayTasks(task));
        break;
      case 'active':
        const activeTasks = tasks.filter((task) => !task.isCompleted);
        activeTasks.forEach((task) => this.displayTasks(task));
        break;
      case 'completed':
        const completedTasks = tasks.filter((task) => task.isCompleted);
        completedTasks.forEach((task) => this.displayTasks(task));
        break;
    }
    this.eventLogics();
  }

  displayTasks(task) {
    const li = document.createElement('li');
    li.classList.add('task');
    if (task.isCompleted) li.classList.add('task-checked');
    li.dataset.id = task.id;
    tasksList.appendChild(li);
    li.innerHTML = `
      ${
        task.isCompleted
          ? '<i class="fa-regular fa-circle-check task__checked"></i>'
          : '<i class="fa-regular fa-circle task__unchecked"></i>'
      }
      <p class="task__text">${task.content}</p>
      <i class="fa-regular fa-keyboard task__edit"></i>
      <i class="fa-regular fa-circle-xmark task__remove"></i>
    `;
    separatedLine.style.display = 'block';
  }

  updateDisplayTasks() {
    // tasksList.innerHTML = '';
    while (tasksList.hasChildNodes()) {
      tasksList.removeChild(tasksList.lastChild);
    }
  }

  addTask() {
    taskForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const task = new Task();
      if (taskInput.value) {
        task.setTaskContent(taskInput.value);
        taskInput.value = '';
        tasks.push(task);
        LocalStorage.saveTasks(tasks);
        this.updateDisplayTasks();
        this.poppulateTasks();
        this.setTaskCounter(tasks);
      }
    });
  }

  removeTask(taskId, taskNode) {
    // remove task from tasks[]
    tasks = tasks.filter((task) => task.id !== taskId);
    LocalStorage.saveTasks(tasks);
    // remove task from DOM
    taskNode.remove();
    // update taskCounter in DOM
    this.setTaskCounter(tasks);
    this.setCompletedTaskCounter(tasks);
  }

  editTask(taskId, content) {
    const task = tasks.find((task) => task.id === taskId);
    task.content = content;
    task.editedAt = new Date().toISOString();
    LocalStorage.saveTasks(tasks);
  }

  setTaskCounter(tasks) {
    tasksCounter.textContent = tasks.length;
  }

  setCompletedTaskCounter(tasks) {
    const completedTasks = tasks.filter((task) => task.isCompleted === true);
    completedTasksCounter.textContent = completedTasks.length;
  }

  changeTaskState(taskId) {
    const selectedTask = tasks.find((task) => task.id === taskId);
    selectedTask.isCompleted = !selectedTask.isCompleted;
    LocalStorage.saveTasks(tasks);
    this.updateDisplayTasks();
    this.poppulateTasks();
    this.setTaskCounter(tasks);
    this.setCompletedTaskCounter(tasks);
  }

  // problem: when focus in editable <p>, cursor was on first character of paragraph
  // solution: https://www.basedash.com/blog/how-to-set-the-cursor-position-in-javascript
  setCursorEditable(editableElem, position) {
    let range = document.createRange();
    let sel = window.getSelection();
    range.setStart(editableElem.childNodes[0], position);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    editableElem.focus();
  }

  eventLogics() {
    [...tasksLive].forEach((task) => {
      const taskId = parseInt(task.dataset.id);
      const checkButton = task.firstElementChild;
      const removeButton = task.lastElementChild;
      const editButton = task.lastElementChild.previousElementSibling;
      const taskContent = task.firstElementChild.nextElementSibling;

      removeButton.addEventListener('click', () => {
        this.removeTask(taskId, task);
        if (tasksList.children.length === 0)
          separatedLine.style.display = 'none';
      });

      checkButton.addEventListener('click', () => {
        this.changeTaskState(taskId);
      });

      editButton.addEventListener('click', (event) => {
        // update buttons in DOM
        editButton.classList.add('display-none');
        removeButton.classList.add('display-none');
        checkButton.classList.add('unvisible');

        // add save and cancel buttons in DOM
        const doneButton = document.createElement('i');
        const cancelButton = document.createElement('i');
        doneButton.classList.add('fa-regular', 'fa-circle-check', 'task__done');
        cancelButton.classList.add('fa-regular', 'fa-circle-xmark', 'task__cancel');
        task.appendChild(doneButton);
        task.appendChild(cancelButton);

        // update task bg-color
        task.classList.add('edit');

        // make paragraph editable
        let taskContentValue = taskContent.textContent;
        taskContent.contentEditable = true;
        taskContent.focus();
        this.setCursorEditable(taskContent, taskContentValue.length);

        // handle Enter and Escape keys
        taskContent.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === 'Escape') {
            makeElementUneditable();
          }
          if (event.key === 'Escape')
            taskContent.textContent = taskContentValue;
          if (event.key === 'Enter') {
            if (taskContent.textContent === '') {
              const task = tasks.find((task) => task.id === taskId);
              taskContent.textContent = task.content;
            }
            else this.editTask(taskId, taskContent.textContent);
          }
        });

        // save and cancel buttons functionlity
        doneButton.addEventListener('click', () => {
          makeElementUneditable();
          if (taskContent.textContent === '') {
            const task = tasks.find((task) => task.id === taskId);
            taskContent.textContent = task.content;
          }
          else this.editTask(taskId, taskContent.textContent);
        });

        cancelButton.addEventListener('click', () => {
          makeElementUneditable();
          taskContent.textContent = taskContentValue;
        });

        function makeElementUneditable() {
          taskContent.contentEditable = false;
          // update buttons in DOM
          editButton.classList.remove('display-none');
          removeButton.classList.remove('display-none');
          checkButton.classList.remove('unvisible');
          // remove save and cancel buttons from DOM
          doneButton.remove();
          cancelButton.remove();
          // update task bg-color
          task.classList.remove('edit');
        }
      });
    });

    filterTasks.addEventListener('click', (event) => {
      filter = event.target.id;
      if (event.target.id !== 'filter-tasks') {
        // remove and add '.selected' style
        [...filterTasks.children].forEach((node) =>
          node.classList.remove('selected')
        );
        event.target.classList.add('selected');
        //
        this.updateDisplayTasks();
        this.poppulateTasks();
      }
    });
  }
}

class LocalStorage {
  static saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
  static getTasks() {
    return JSON.parse(localStorage.getItem('tasks')) || [];
  }
}

class DateTime {
  days = [
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];
  months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  now = new Date();

  getDay() {
    return this.days.at(this.now.getDay());
  }

  getMonth() {
    return this.months.at(this.now.getMonth());
  }

  getDate() {
    return this.now.getDate();
  }

  getYear() {
    return this.now.getFullYear();
  }
}

//
document.addEventListener('DOMContentLoaded', () => {
  const now = new DateTime();
  today.textContent = `${now.getDay()}, ${now.getDate()} ${now.getMonth()} ${now.getYear()}`;

  const ui = new UI();
  ui.setupUI();
  ui.addTask();
});
