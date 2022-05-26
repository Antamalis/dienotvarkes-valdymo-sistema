$(document).ready(function () {
    const addTaskForm = document.querySelector("#task-add-form");
    const addTaskInput = document.querySelector("#task-add-input");
    const editTaskModal = document.getElementById('editTaskModal');
    const deleteTaskModal = document.getElementById('deleteTaskModal');
    const dueDateModal = document.getElementById('dueDateModal');
    // const taskSearchInput = document.getElementById('task-search-input');
    

    const monthMap = {
        1: "Sausio",
        2: "Vasario",
        3: "Kovo",
        4: "Balandžio",
        5: "Gegužės",
        6: "Birželio",
        7: "Liepos",
        8: "Rugpūčio",
        9: "Rugsėjo",
        10: "Spalio",
        11: "Lapkričio",
        12: "Gruodžio"
    }

    let tasks = [];

    feather.replace()

    fetchCalendar();     
    
    // taskSearchInput.addEventListener('input', (e) => {
    //     const searchTerm = e.target.value
        
    //     renderFilteredTasks();
    // })

    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const data = { taskName: addTaskInput.value };
        
        addTask(data);
    })

    dueDateModal.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget
        const taskId = button.getAttribute('data-bs-id');
        const date = button.getAttribute('data-bs-date');

        const modalBodyId = dueDateModal.querySelector('.modal-body input[type="hidden"]');

        console.log(date);

        if(date){
            const taskDate = new Date(parseFloat(date));
            const dateMonth = Math.round(taskDate.getMonth() + 1) >= 10 ? Math.round(taskDate.getMonth() + 1) : `0${Math.round(taskDate.getMonth() + 1)}`;
            const dateDay = taskDate.getDate() >= 10 ? taskDate.getDate() : `0${taskDate.getDate()}`;
            const dateHour = taskDate.getHours() >= 10 ? taskDate.getHours() : `0${taskDate.getHours()}`;
            const dateMinutes = taskDate.getMinutes() >= 10 ? taskDate.getMinutes() : `0${taskDate.getMinutes()}`;
            const dateValue = `${taskDate.getFullYear()}-${dateMonth}-${dateDay}T${dateHour}:${dateMinutes}`

            console.log(taskDate);
            console.log(dateValue);

            dueDateModal.querySelector('.modal-body input[type="datetime-local"]').value = dateValue
        }else{
            dueDateModal.querySelector('.modal-body input[type="datetime-local"]').value = ""
        }

        modalBodyId.value = taskId
    })

    dueDateModal.querySelector("#task-date-submit").addEventListener('click', (event) => {
        event.preventDefault();
        const taskId = dueDateModal.querySelector('.modal-body input[type="hidden"]').value;
        const date = dueDateModal.querySelector('.modal-body input[type="datetime-local"]').value;

        changeDueDate(taskId, date)
    });

    deleteTaskModal.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget
        const taskId = button.getAttribute('data-bs-id');

        const modalBodyId = deleteTaskModal.querySelector('.modal-body input[type="hidden"]');

        modalBodyId.value = taskId
    })

    deleteTaskModal.querySelector("#task-delete-submit").addEventListener('click', (event) => {
        event.preventDefault();
        const taskId = deleteTaskModal.querySelector('.modal-body input[type="hidden"]').value;

        deleteTask(taskId);
    });
    
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
    });

    function renderTasks() {
        let allCompeted = true;
        
        const tasksWithDueDate = tasks.filter(task => task.dueDate).sort( (a, b) => a.dueDate - b.dueDate)
        const tasksWithNoDueDate = tasks.filter(task => !task.dueDate)

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
            renderTaskNoDueDate(tasksWithNoDueDate);
            renderTaskWithDueDate(tasksWithDueDate);
        }else{
            document.querySelector("#task-list").innerHTML = "";
            document.querySelector(".main-area").classList.add("align-items-center");
            document.querySelector(".main-area").classList.add("justify-content-center");
            document.querySelector("#no-tasks-notification").hidden = false;
        }
    }

    function renderTaskWithDueDate(tasks) {
        let lastDay = -1;
        

        tasks.forEach(task => {
            const taskMonth = Math.round(new Date(task.dueDate).getMonth() + 1);
            const taskDay = new Date(task.dueDate).getDate();

            if(!task.completed){
                if(lastDay != taskDay){
                    let heading = document.importNode(document.querySelector("#date-heading").content, true);
                    if(isToday(new Date(task.dueDate))){
                        heading.querySelector("h4").textContent = `Šiandien`;
                        heading.querySelector("h4").classList.add('today');
                    }else if(isTommorow(new Date(task.dueDate))){
                        heading.querySelector("h4").textContent = `Rytoj`;
                        heading.querySelector("h4").classList.add('tomorrow');
                    }else{
                        heading.querySelector("h4").textContent = `${monthMap[taskMonth]} ${taskDay}-oji`;
                    }
                    document.querySelector("#task-list").append(heading);
                }
    
                let taskElement = prepareTaskElement(task)
                document.querySelector("#task-list").append(taskElement);

                lastDay = taskDay
            }
        });
    }

    function isTommorow(date) {
        let tomorrowsDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1);
        if (tomorrowsDate.getFullYear() == date.getFullYear() && tomorrowsDate.getMonth() == date.getMonth() && tomorrowsDate.getDate() == date.getDate()) {
            return true;
        }else{
            return false
        }
    }

    function isToday(date) {
        if (new Date().getFullYear() == date.getFullYear() && new Date().getMonth() == date.getMonth() && new Date().getDate() == date.getDate()) {
            return true;
        }else{
            return false
        }
    }

    function renderTaskNoDueDate(tasks) {
        let heading = document.importNode(document.querySelector("#date-heading").content, true);
        heading.querySelector("h4").textContent = "Užduotys be termino"
        document.querySelector("#task-list").append(heading);

        tasks.forEach(task => {
            if(!task.completed){
                let taskElement = prepareTaskElement(task)
                document.querySelector("#task-list").append(taskElement);
            }
        });
    }

    function prepareTaskElement(task) {
        let taskElement = document.importNode(document.getElementById("task-template").content, true);
        taskElement.querySelector("label").htmlFor = task._id;
        taskElement.querySelector("label").textContent = task.name;
        taskElement.querySelector("input").id = task._id;
        taskElement.querySelector("small").textContent = task.comments
        taskElement.querySelector("svg").setAttribute("data-bs-title", task.name);
        taskElement.querySelector("svg").setAttribute("data-bs-comment", task.comments);
        taskElement.querySelector("svg").setAttribute("data-bs-id", task._id);
        taskElement.querySelector("i.remove-task-icon").setAttribute("data-bs-id", task._id);
        taskElement.querySelector("i.fa-calendar-alt").setAttribute("data-bs-id", task._id);

        if(task.dueDate){
            taskElement.querySelector("i.fa-calendar-alt").setAttribute("data-bs-date", task.dueDate);
        }else{
            taskElement.querySelector("i.fa-calendar-alt").setAttribute("data-bs-date", "");
        }

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

        return taskElement
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

    function deleteTask(taskId) {
        fetch('/api/deleteTask', {
            headers: {
                "Content-Type": "application/json",
            },
            method: 'POST',
            body: JSON.stringify({taskId})
        })
        .then((response) => response.json())
        .then((data) => {
            tasks = data.tasks
            renderTasks();
        })
    }

    function changeDueDate(taskId, date) {
        const data = {taskId, date: new Date(date).getTime()}
    
        fetch('/api/changeDueDate', {
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

