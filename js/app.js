"use strict";

var ENTER_KEY = 13;
var ESCAPE_KEY = 27;

var util = {
	uuid: function () {
		/*jshint bitwise:false */
		var i, random;
		var uuid = "";

		for (i = 0; i < 32; i++) {
			random = (Math.random() * 16) | 0;
			if (i === 8 || i === 12 || i === 16 || i === 20) {
				uuid += "-";
			}
			uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(
				16
			);
		}

		return uuid;
	},
	pluralize: function (count, word) {
		return count === 1 ? word : word + "s";
	},
	store: function (namespace, data) {
		if (arguments.length > 1) {
			return localStorage.setItem(namespace, JSON.stringify(data));
		} else {
			var store = localStorage.getItem(namespace);
			return (store && JSON.parse(store)) || [];
		}
	},
};

var App = {
	init: function () {
		this.todos = util.store("todos");

		new Router({
			"/:filter": function (filter) {
				this.filter = filter;
				this.render();
			}.bind(this),
		}).init("/all");
		this.bindEvents();
	},

	generateTodoListElements: function (todos) {
		function generateSingleTodoElements(todo) {
			var todoLi = document.createElement("li"); // create an li
			todoLi.setAttribute("data-id", todo.id);
			if (todo.completed == true) {
				todoLi.classList.add("completed");
			}

			var todoDiv = document.createElement("div");
			todoDiv.classList.add("view");

			var completedInput = document.createElement("input");
			completedInput.classList.add("toggle");
			completedInput.setAttribute("type", "checkbox");
			if (todo.completed) {
				completedInput.setAttribute("checked", true);
			}

			var divLabel = document.createElement("label");
			divLabel.textContent = todo.title;

			var divDeleteButton = document.createElement("button");
			divDeleteButton.textContent = "delete";
			divDeleteButton.classList.add("destroy");

			var todoInput = document.createElement("input");
			todoInput.classList.add("edit");
			todoInput.setAttribute("value", todo.title);

			todoDiv.appendChild(completedInput);

			//Add button to create child element
			var addChildTodoButton = document.createElement("button");
			addChildTodoButton.textContent = "+";
			addChildTodoButton.classList.add("add-child");

			todoDiv.appendChild(todoInput);
			todoDiv.appendChild(addChildTodoButton);
			todoDiv.appendChild(divDeleteButton);
			todoLi.appendChild(todoDiv);

			// todoTemplate.appendChild(todoLi);

			// If the todo has children todos
			if (todo.children.length > 0) {
				// creates new UL element
				var childUl = document.createElement("ul");
				todo.children.forEach((todo) => {
					let childLi = generateSingleTodoElements(todo); // create li for each child
					childUl.appendChild(childLi);
				});
				// append to parent li element
				todoLi.appendChild(childUl);
			}
			return todoLi;
		}

		todos.forEach((todo) => {
			// generate the single todo UI
			let singleTodo = generateSingleTodoElements(todo);
			// attach it to the template
			// todoTemplate.appendChild(singleTodo);
			document.getElementById("todo-list").appendChild(singleTodo);
		});
	},

	// Creates a higher-order function for binding events.
	bindEvents: function () {
		function bindTodoListEvents(
			elementId,
			eventTrigger,
			callback,
			targetElement
		) {
			document
				.getElementById(elementId)
				.addEventListener(eventTrigger, function (e) {
					if (targetElement) {
						if (
							event.target.className == targetElement ||
							event.target.tagName == targetElement.toUpperCase() ||
							event.target.id == targetElement
						) {
							callback.call(App, e);
						}
					} else callback.call(App, e);
				});
		}

		// Calls the higher-order function for each desired event listener.
		bindTodoListEvents("new-todo", "keyup", this.create);
		// bindTodoListEvents("toggle-all", "change", this.toggleAll);
		bindTodoListEvents("todo-list", "change", this.toggle, "toggle");
		bindTodoListEvents("todo-list", "dblclick", this.edit, "label");
		bindTodoListEvents("todo-list", "keyup", this.editKeyup, "edit");
		bindTodoListEvents("todo-list", "focusout", this.update, "edit");
		bindTodoListEvents("todo-list", "click", this.destroy, "destroy");
		bindTodoListEvents("todo-list", "click", this.addChild, "add-child");
		// bindTodoListEvents(
		// 	"footer",
		// 	"click",
		// 	this.destroyCompleted,
		// 	"clear-completed"
		// );
	},
	render: function () {
		// Reset the UI
		if (document.getElementById("todo-list")) {
			document.getElementById("todo-list").innerHTML = "";
		}

		var todos = this.getFilteredTodos();
		// Generate all the UI elements
		var elements = this.generateTodoListElements(todos);

		var mainElement = document.getElementById("main");
		if (todos.length > 0) {
			mainElement.style.display = "block";
		} else {
			mainElement.style.display = "none";
		}

		document.getElementById("new-todo").focus();
		util.store("todos", this.todos);
	},
	toggleAll: function (e) {
		var isChecked = document.getElementById(e.target.id).checked;

		this.todos.forEach(function (todo) {
			todo.completed = isChecked;
		});

		this.render();
	},
	getActiveTodos: function () {
		// function getCountOfActiveTodos(array, count) {
		// 	for (var i = 0; i < array.length; i++) {
		// 		var todo = array[i];
		// 		if (!todo.completed) {
		// 			count++;
		// 		}
		// 		if (todo.children.length > 0) {
		// 			return getCountOfActiveTodos(todo.children, count);
		// 		}
		// 	}
		// 	return count;
		// }
		// var count = getCountOfActiveTodos(this.todos, 0);
		// console.log("active count", count);
		// return count;

		return this.todos.filter(function (todo) {
			return !todo.completed;
		});
	},
	getCompletedTodos: function () {
		return this.todos.filter(function (todo) {
			return todo.completed;
		});
	},
	getFilteredTodos: function () {
		if (this.filter === "active") {
			return this.getActiveTodos();
		}

		if (this.filter === "completed") {
			return this.getCompletedTodos();
		}

		return this.todos;
	},
	destroyCompleted: function () {
		this.todos = this.getActiveTodos();
		this.filter = "all";
		this.render();
	},
	deleteObjectById: function (array, idToFind) {
		for (var i = 0; i < array.length; i++) {
			var todo = array[i];
			if (todo.id === idToFind) {
				// remove element from array
				array.splice(i, 1);
				break;
			} else if (todo.children.length > 0) {
				// recurse with searchTodosForId passing in children
				this.deleteObjectById(todo.children, idToFind);
			}
		}
	},
	addChildById: function (array, idToFind) {
		for (var i = 0; i < array.length; i++) {
			var todo = array[i];
			// Base case
			if (todo.id === idToFind) {
				// add new element to children
				todo.children.push({
					id: util.uuid(),
					title: "Enter a title",
					completed: false,
					children: [],
				});
				break;
			}
			if (todo.children.length > 0) {
				this.addChildById(todo.children, idToFind);
			}
		}
	},
	addChild: function (e) {
		var elementId = e.target.closest("li").getAttribute("data-id");
		this.addChildById(this.todos, elementId);
		this.render();
	},
	create: function (e) {
		var input = e.target;
		var val = input.value.trim();

		if (e.which !== ENTER_KEY || !val) {
			return;
		}

		this.todos.push({
			id: util.uuid(),
			title: val,
			completed: false,
			children: [],
		});

		input.value = "";

		this.render();
	},
	toggleById: function (array, idToFind) {
		for (var i = 0; i < array.length; i++) {
			var todo = array[i];
			if (todo.id === idToFind) {
				// add new element to children
				todo.completed = !todo.completed;
				break;
			} else if (todo.children.length > 0) {
				this.toggleById(todo.children, idToFind);
			}
		}
	},
	toggle: function (e) {
		var id = e.target.closest("li").getAttribute("data-id");
		this.toggleById(this.todos, id);
		this.render();

		// var i = this.indexFromEl(e.target);
		// this.todos[i].completed = !this.todos[i].completed;
	},
	edit: function (e) {
		var input = e.target.closest("li");
		input.classList.add("editing");
		input.querySelector(".edit").focus();
	},
	editKeyup: function (e) {
		if (e.which === ENTER_KEY) {
			e.target.blur();
		}

		if (e.which === ESCAPE_KEY) {
			e.target.setAttribute("abort", true);
			e.target.blur();
		}
	},
	update: function (e) {
		var id = e.target.closest("li").getAttribute("data-id");
		var el = e.target;
		var val = e.target.value.trim();

		if (!val) {
			this.destroy(e);
			return;
		}

		if (e.target.getAttribute("abort") == "true") {
			e.target.getAttribute("abort") == "false";
		} else {
			// Create new updater function here.
			function updateObjectById(array, idToFind) {
				for (var i = 0; i < array.length; i++) {
					var todo = array[i];
					if (todo.id === idToFind) {
						// add new element to children
						todo.title = val;
						break;
					} else if (todo.children.length > 0) {
						return updateObjectById(todo.children, idToFind);
					}
				}
			}
			updateObjectById(this.todos, id);
			// this.todos[this.indexFromEl(el)].title = val;
		}
		this.render();
	},
	destroy: function (e) {
		var id = e.target.closest("li").getAttribute("data-id");
		this.deleteObjectById(this.todos, id);
		// this.todos.splice(this.indexFromEl(e.target), 1);
		this.render();
	},
};

App.init();
