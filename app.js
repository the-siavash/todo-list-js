const today = document.querySelector('.today');
const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#add-task-input');
const tasksList = document.querySelector('#tasks-list');
const tasksCounter = document.querySelector('#task-counter');
const completedTasksCounter = document.querySelector('#completed-task-counter');
const separatedLine = document.querySelector('.separated-line');
const filterTasks = document.querySelector('#filter-tasks');

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
      task.setTaskContent(taskInput.value);
      taskInput.value = '';
      tasks.push(task);
      LocalStorage.saveTasks(tasks);
      this.displayTasks(task);
      this.setTaskCounter(tasks);
    });
  }

  removeTask(taskId, taskNode) {
    // remove task from tasks[]
    tasks = tasks.filter((task) => task.id !== parseInt(taskId));
    LocalStorage.saveTasks(tasks);
    // remove task from DOM
    taskNode.remove();
    // update taskCounter in DOM
    this.setTaskCounter(tasks);
    this.setCompletedTaskCounter(tasks);
  }

  setTaskCounter(tasks) {
    tasksCounter.textContent = tasks.length;
  }

  setCompletedTaskCounter(tasks) {
    const completedTasks = tasks.filter((task) => task.isCompleted === true);
    completedTasksCounter.textContent = completedTasks.length;
  }

  changeTaskState(taskId) {
    const selectedTask = tasks.find((task) => task.id === parseInt(taskId));
    selectedTask.isCompleted = !selectedTask.isCompleted;
    LocalStorage.saveTasks(tasks);
    this.updateDisplayTasks();
    this.poppulateTasks();
    this.setTaskCounter(tasks);
    this.setCompletedTaskCounter(tasks);
  }

  eventLogics() {
    tasksList.addEventListener('click', (event) => {
      const id = event.target.parentNode.dataset.id;
      if (event.target.classList.contains('task__remove')) {
        this.removeTask(id, event.target.parentNode);
      } else if (event.target.classList.contains('task__checked')) {
        this.changeTaskState(id);
      } else if (event.target.classList.contains('task__unchecked')) {
        this.changeTaskState(id);
      }
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

//
document.addEventListener('DOMContentLoaded', () => {
  today.textContent = new Date().toDateString();
  const ui = new UI();
  ui.setupUI();
  ui.addTask();
  ui.eventLogics();
});
