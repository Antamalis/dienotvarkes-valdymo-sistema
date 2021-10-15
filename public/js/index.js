$(document).ready(function () {
    const addTaskForm = document.querySelector("#task-add-form");
    const addTaskInput = document.querySelector("#task-add-input");
    const editTaskModal = document.getElementById('editTaskModal');

    let tasks = [];

    fetchCalendar();

    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const data = { taskName: addTaskInput.value };
        
        addTask(data);
    })

    editTaskModal.addEventListener('submit', (e) => {
        e.preventDefault();

        const data = { taskName: addTaskInput.value };
        
        addTask(data);
    })
    
    editTaskModal.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget
        const title = button.getAttribute('data-bs-title');
        const comment = button.getAttribute('data-bs-comment');
        const taskId = button.getAttribute('data-bs-id');

        const modalBodyTitle = editTaskModal.querySelector('.modal-body input[type="text"]');
        const modalBodyComment = editTaskModal.querySelector('.modal-body textarea');
        const modalBodyId = editTaskModal.querySelector('.modal-body input[type="hidden"]');

        modalBodyTitle.value = title;
        modalBodyComment.value = comment;
        modalBodyId.value = taskId
    })

    editTaskModal.querySelector("#task-edit-submit").addEventListener('click', (event) => {
        event.preventDefault();
        const taskId = editTaskModal.querySelector('.modal-body input[type="hidden"]').value;
        const newTitle = editTaskModal.querySelector('.modal-body input[type="text"]').value;
        const newComment = editTaskModal.querySelector('.modal-body textarea').value;
        editTask(taskId, newTitle, newComment);
        editTaskModal.dispose();
    });


    function renderTasks() {
        let allCompeted = true;

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            if (!task.completed) {
                allCompeted = false;
                break
            }
        }

        if(tasks.length && !allCompeted){
            document.querySelector("#no-tasks-notification").hidden = true;
            document.querySelector(".main-area").classList.remove("align-items-center");
            document.querySelector(".main-area").classList.remove("justify-content-center");
            document.querySelector("#task-list").innerHTML = "";
            tasks.forEach(task => {
                if(!task.completed){
                    let taskElement = document.importNode(document.getElementById("task-template").content, true);
                    taskElement.querySelector("label").htmlFor = task._id;
                    taskElement.querySelector("label").textContent = task.name;
                    taskElement.querySelector("input").id = task._id;
                    taskElement.querySelector("small").textContent = task.comments
                    taskElement.querySelector("svg").setAttribute("data-bs-title", task.name);
                    taskElement.querySelector("svg").setAttribute("data-bs-comment", task.comments);
                    taskElement.querySelector("svg").setAttribute("data-bs-id", task._id);

                    taskElement.querySelector("input").addEventListener('change', (event) => {
                        const data = {
                            taskId: task._id,
                            completed: event.target.checked
                        }

                        fetch('/api/updateTaskStatus', {
                            headers: {
                                "Content-Type": "application/json",
                            },
                            method: 'POST',
                            body: JSON.stringify(data)
                        })
                    })
                    document.querySelector("#task-list").append(taskElement);
                }
            });
        }else{
            document.querySelector("#no-tasks-notification").hidden = false;
        }
    }

    function fetchCalendar() {
        fetch("/api/fetchCalendar")
        .then((response) => response.json())
        .then((data) => {
            //Remove loading animation
            document.querySelector('.spinner-grow').remove();
            tasks = data.tasks;
            renderTasks();
        })
    }

    function addTask(data) {
        fetch('/api/addTask', {
            headers: {
                "Content-Type": "application/json",
            },
            method: 'POST',
            body: JSON.stringify(data)
        })
        .then((response) => response.json())
        .then((data) => {
            tasks = data.tasks
            renderTasks();
        })
        .finally(() => {
            addTaskForm.reset();
        })
    }
    
    function editTask(taskId, taskName, taskComment) {
        const data = { taskId, taskName, taskComment };

        fetch('/api/editTask', {
            headers: {
                "Content-Type": "application/json",
            },
            method: 'POST',
            body: JSON.stringify(data)
        })
        .then((response) => response.json())
        .then((data) => {
            tasks = data.tasks
            renderTasks();
        })
    }
});

