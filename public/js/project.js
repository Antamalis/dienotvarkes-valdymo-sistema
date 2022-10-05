$(document).ready(function () {
    let projectData;
    let projectId = document.querySelector('#getProjectId').value;
    let username = document.querySelector('#getUsername').value;
    let socket = io();
    let selectedTaskData;
    
    const addTaskForm = document.querySelector("#task-add-form");
    const addTaskInput = document.querySelector("#task-add-input");
    const deleteProjectModal = document.getElementById('deleteProjectModal');
    const addMemberModal = document.getElementById('addMemberModal');
    const chatInput = document.getElementById('chat-input');
    const deleteProjectInput = document.getElementById('delete-project-title');
    const taskDataForm = document.querySelector("#task-data-form");
    const closeTaskDataButton = document.querySelector("#task-data-close");
    const viewStatsButton = document.querySelector("#viewStats");

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
    
    feather.replace()

    fetchProjectData();

    if(addTaskForm){
        addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
        
            const data = { 
                taskName: addTaskInput.value,
                projectId
            };
            
            addTask(data);
        })
    }

    closeTaskDataButton.addEventListener('click', (event) => {
        event.preventDefault();
        
        document.getElementById(`${selectedTaskData.taskData._id}`).checked = false;
        toggleTaskData(false)
        toggleSidebarSpinner(false)
        toggleChat(true)
    });

    viewStatsButton.addEventListener('click', (event) => {
        event.preventDefault();
        
        window.location.href = `/project/${projectId}/stats`
    });

    taskDataForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        updateProjectTaskData();
    });

    addMemberModal.addEventListener('show.bs.modal', function (event) {
        addMemberModal.querySelector('textarea').value = "";
    })

    addMemberModal.querySelector("#add-member-submit").addEventListener('click', (event) => {
        event.preventDefault();
        const memberList = addMemberModal.querySelector('textarea').value;

        if(memberList){
            addMembers(memberList.split('\n'))
        }
    });

    deleteProjectInput.addEventListener('input', (event) => {
        const enteredTitle = event.target.value;

        if(enteredTitle == projectData.title){
            document.querySelector("#delete-project-submit").disabled = false;
        }else{
            document.querySelector("#delete-project-submit").disabled = true;
        }
    });
    
    deleteProjectModal.querySelector("#delete-project-submit").addEventListener('click', (event) => {
        event.preventDefault();
        const enteredTitle = deleteProjectModal.querySelector('#delete-project-title').value;

        if(enteredTitle == projectData.title){
            deleteProject()
        }
    });

    chatInput.addEventListener("keyup", function(event) {
        if (event.code === "Enter" || event.key == "Enter") {
          event.preventDefault();

          if(chatInput.value){
            const message = chatInput.value
            chatInput.value = "";

            sendChatMessage(message);
          }
        }
    }); 

    socket.on("chatUpdate", (messages) => {
        renderChatMessages(messages)
    })

    function updateProjectTaskData() {
        let taskDataElement = document.getElementById("task-data");
        taskDataElement.querySelector("h3").textContent = `Užduoties "${selectedTaskData.taskData.name}" duomenys`;

        const taskName = taskDataElement.querySelector("#selectedTaskName").value;
        const taskComment = taskDataElement.querySelector("#selectedTaskComment").value;
        const taskAssignee = taskDataElement.querySelector("#selectedTaskAssignee").value;
        const taskDueDate = taskDataElement.querySelector("#selectedTaskDueDate").value;
        const taskStatus = taskDataElement.querySelector("#isTaskComplete").checked;

        if(taskName && taskAssignee && (taskStatus === true || taskStatus === false)){
            const data = {
                taskName,
                taskComment,
                taskAssignee,
                taskDueDate: new Date(taskDueDate).getTime(),
                taskStatus,
                taskId: selectedTaskData.taskData._id,
                projectId
            }

            fetch('/api/updateProjectTaskData', {
                headers: {
                    "Content-Type": "application/json",
                },
                method: 'POST',
                body: JSON.stringify(data)
            })
            .then((response) => response.json())
            .then((data) => {
                document.getElementById(`${selectedTaskData.taskData._id}`).checked = false;
                toggleTaskData(false);
                toggleChat(true);
                renderTasks(data.tasks);
            })
            .finally(() => {
                taskDataForm.reset();
            })
        }
    }

    function addTask(data) {
        fetch('/api/addProjectTask', {
            headers: {
                "Content-Type": "application/json",
            },
            method: 'POST',
            body: JSON.stringify(data)
        })
        .then((response) => response.json())
        .then((data) => {
            projectData.tasks = data.tasks
            renderTasks(projectData.tasks);
        })
        .finally(() => {
            addTaskForm.reset();
        })
    }

    function fetchProjectData() {
        fetch('/api/fetchProjectData', {
            headers: {
                "Content-Type": "application/json",
            },
            method: 'POST',
            body: JSON.stringify({projectId})
        })
        .then((response) => response.json())
        .then((data) => {
            document.querySelector('#task-spinner').remove();
            projectData = data.projectData;
            renderTasks(projectData.tasks);
        })
    }

    function deleteProject() {
        fetch('/api/deleteProject', {
            headers: {
                "Content-Type": "application/json",
            },
            method: 'POST',
            body: JSON.stringify({projectId})
        })
        .then((response) => response.json())
        .then((data) => {
            if(data.success){
                window.location.href = '/'
            }
        })
    }

    function addMembers(memberList) {
        fetch('/api/addMembersToProject', {
            headers: {
                "Content-Type": "application/json",
            },
            method: 'POST',
            body: JSON.stringify({memberList, projectId})
        })
        .then((response) => response.json())
        .then((data) => {
            if(data.error){
                createErrorToast("Klaida!", "Dabar", data.error);
            }
        })
    }

    function sendChatMessage(message) {
        socket.emit('sendMessage', {
            message
        });
    }

    function renderChatMessages(messages) {
        document.querySelector("#chat").innerHTML = "";

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            
            let chatMessage = document.importNode(document.querySelector("#chat-message-template").content, true);
            chatMessage.querySelector('.message-sender').textContent = message.senderName + ":"
            chatMessage.querySelector('.message-content').textContent = message.content
            document.querySelector("#chat").append(chatMessage);
        }

        document.querySelector("#chat").scrollTop = document.querySelector("#chat").scrollHeight;
    }

    function renderTasks(tasks) {
        let allCompeted = true;
        
        const notAssignedTasks = tasks.filter(task => !task.assingedTo)
        const assignedTasks = tasks.filter(task => task.assingedTo)

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
            renderNotAssignedTasks(notAssignedTasks);
            renderAssignedTasks(assignedTasks);
        }else{
            document.querySelector("#task-list").innerHTML = "";
            document.querySelector(".main-area").classList.add("align-items-center");
            document.querySelector(".main-area").classList.add("justify-content-center");
            document.querySelector("#no-tasks-notification").hidden = false;
        }
    }

    function renderNotAssignedTasks(tasks) {
        let heading = document.importNode(document.querySelector("#not-assigned-heading").content, true);
        let container = document.createElement("div");
        container.setAttribute('data-group', "none")
        heading.querySelector("h4").textContent = "Niekam nepriskirtos užduotys"
        container.append(heading);

        tasks.forEach(task => {
            let taskElement = prepareTaskElement(task)
            container.append(taskElement)
        });

        document.querySelector("#task-list").append(container);
    }

    function renderAssignedTasks(tasks) {
        let assignedTasksMap = {}

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            
            if(assignedTasksMap[task.assingedTo]){
                assignedTasksMap[task.assingedTo].push(task)
            }else{
                assignedTasksMap[task.assingedTo] = [task]
            }
        }

        for (const [assignee, assignedTasks] of Object.entries(assignedTasksMap)) {
            const tasksWithDueDate = assignedTasks.filter(task => task.dueDate).sort( (a, b) => a.dueDate - b.dueDate)
            const tasksWithNoDueDate = assignedTasks.filter(task => !task.dueDate)

            if(!document.querySelector(`div[data-group="${assignee}"]`)){
                let heading = document.importNode(document.querySelector("#assigned-heading").content, true);
                let container = document.createElement("div");
                let collapse = document.createElement("div");

                if(username == assignee) {
                    heading.querySelector("h4").style.color = "#17D7A0"
                    heading.querySelector("h4").style.textDecoration  = "underline"
                }

                heading.querySelector('div').setAttribute('href', `#${assignee}Collapse`)
                heading.querySelector("h4").textContent = assignee;
                container.setAttribute('data-group', assignee);
                collapse.id = `${assignee}Collapse`;
                collapse.classList = `collapse`;
                container.appendChild(heading);
                container.appendChild(collapse);
                document.querySelector("#task-list").append(container);
            }

            renderTaskNoDueDate(tasksWithNoDueDate, assignee);
            renderTaskWithDueDate(tasksWithDueDate, assignee);
        }
    }

    function prepareTaskElement(task) {
        let taskElement = document.importNode(document.getElementById("task-template").content, true);
        taskElement.querySelector("label").htmlFor = task._id;
        taskElement.querySelector("label").textContent = task.name;
        taskElement.querySelector("input").id = task._id;
        taskElement.querySelector("small").textContent = task.comments

        if(task.completed) {
            taskElement.querySelector("label").classList.add('project-task-complete')
        }

        taskElement.querySelector("input").addEventListener('change', (event) => {
            if(event.target.checked){
                toggleChat(false)
                toggleTaskData(false)
                toggleSidebarSpinner(true)
                fetchTaskData(event.target.id)
            }
        })

        return taskElement
    }

    function toggleSidebarSpinner(show) {
        if(show){
            document.querySelector('#sidebar-spinner').classList = "d-flex justify-content-center justify-content-center align-items-center h-100 bg-light border-start col-lg-2 col-md-2";
        }else{
            document.querySelector('#sidebar-spinner').classList = "d-none";
        }
    }

    function toggleChat(show) {
        if(show){
            document.querySelector('#chat-section').classList.replace('d-none', 'd-flex');
        }else{
            document.querySelector('#chat-section').classList.replace('d-flex', 'd-none');
        }
    }

    function toggleTaskData(show) {
        if(show){
            document.querySelector('#task-data').classList.replace('d-none', 'd-flex');
            renderTaskData();
        }else{
            document.querySelector('#task-data').classList.replace('d-flex', 'd-none');
        }
    }

    function fetchTaskData(id) {
        fetch('/api/fetchProjectTaskData', {
            headers: {
                "Content-Type": "application/json",
            },
            method: 'POST',
            body: JSON.stringify({taskId: id, projectId})
        })
        .then((response) => response.json())
        .then((data) => {
            selectedTaskData = data
            toggleSidebarSpinner(false)
            toggleTaskData(true)
        })
    }

    function renderTaskData() {
        let taskDataElement = document.getElementById("task-data");
        taskDataElement.querySelector("h3").textContent = `Užduoties "${selectedTaskData.taskData.name}" duomenys`;
        taskDataElement.querySelector("#selectedTaskName").value = selectedTaskData.taskData.name;
        taskDataElement.querySelector("#selectedTaskComment").value = selectedTaskData.taskData.comments;
        taskDataElement.querySelector("#selectedTaskAssignee").innerHTML = `<option value="none">Niekam</option>`
        taskDataElement.querySelector("#isTaskComplete").checked = selectedTaskData.taskData.completed

        if(selectedTaskData.taskData.dueDate){
            const taskDate = new Date(parseFloat(selectedTaskData.taskData.dueDate));
            const dateMonth = Math.round(taskDate.getMonth() + 1) >= 10 ? Math.round(taskDate.getMonth() + 1) : `0${Math.round(taskDate.getMonth() + 1)}`;
            const dateDay = taskDate.getDate() >= 10 ? taskDate.getDate() : `0${taskDate.getDate()}`;
            const dateHour = taskDate.getHours() >= 10 ? taskDate.getHours() : `0${taskDate.getHours()}`;
            const dateMinutes = taskDate.getMinutes() >= 10 ? taskDate.getMinutes() : `0${taskDate.getMinutes()}`;
            const dateValue = `${taskDate.getFullYear()}-${dateMonth}-${dateDay}T${dateHour}:${dateMinutes}`

            taskDataElement.querySelector("#selectedTaskDueDate").value = dateValue
        }else{
            taskDataElement.querySelector("#selectedTaskDueDate").value = "";
        }

        for (let i = 0; i < projectData.members.length; i++) {
            const member = projectData.members[i];
            let option = document.createElement('option')

            option.value = member.name;
            option.id = member.userId
            option.textContent = member.name

            taskDataElement.querySelector("#selectedTaskAssignee").appendChild(option)
        }

        if(selectedTaskData.taskData.assingedTo){
            taskDataElement.querySelector(`option[value='${selectedTaskData.taskData.assingedTo}']`).selected = "selected"
        }else{
            taskDataElement.querySelector(`option[value='none']`).selected = "selected"
        }

        if(!selectedTaskData.canEdit) enableReadOnlyMode()
        else disableReadOnlyMode()
    }

    function renderTaskWithDueDate(tasks, assignee) {
        let lastDay = -1;
        
        tasks.forEach(task => {
            const taskMonth = Math.round(new Date(task.dueDate).getMonth() + 1);
            const taskday = new Date(task.dueDate).getDate();

            if(lastDay != taskday){
                let heading = document.importNode(document.querySelector("#date-heading").content, true);
                heading.querySelector("h5").textContent = `${monthMap[taskMonth]} ${taskday}-oji`
                document.querySelector(`#${assignee}Collapse`).append(heading);
            }

            let taskElement = prepareTaskElement(task)
            document.querySelector(`#${assignee}Collapse`).append(taskElement);

            lastDay = taskday
        });
    }

    function renderTaskNoDueDate(tasks, assignee) {
        if(tasks.length == 0) return;

        let heading = document.importNode(document.querySelector("#date-heading").content, true);
        heading.querySelector("h5").textContent = "Užduotys be termino"
        document.querySelector(`#${assignee}Collapse`).append(heading);        

        tasks.forEach(task => {
            let taskElement = prepareTaskElement(task)
            document.querySelector(`#${assignee}Collapse`).append(taskElement);
        });
    }

    function enableReadOnlyMode() {
        let taskDataElement = document.getElementById("task-data");
        taskDataElement.querySelector("#selectedTaskName").readOnly = true;
        taskDataElement.querySelector("#selectedTaskComment").readOnly = true;
        taskDataElement.querySelector("#selectedTaskAssignee").disabled = true;
        taskDataElement.querySelector("#selectedTaskDueDate").readOnly = true;
        taskDataElement.querySelector("#isTaskComplete").disabled = true;
        taskDataElement.querySelector("#task-data-submit").disabled = true;
    }

    function disableReadOnlyMode() {
        let taskDataElement = document.getElementById("task-data");
        taskDataElement.querySelector("#selectedTaskName").readOnly = false;
        taskDataElement.querySelector("#selectedTaskComment").readOnly = false;
        taskDataElement.querySelector("#selectedTaskAssignee").disabled = false;
        taskDataElement.querySelector("#selectedTaskDueDate").readOnly = false;
        taskDataElement.querySelector("#isTaskComplete").disabled = false;
        taskDataElement.querySelector("#task-data-submit").disabled = false;
    }

    function createErrorToast(title, time, body) {
        let toastas = document.importNode(document.querySelector("#errorToastTemplate").content, true);

        toastas.querySelector('.toast-title').textContent = title;
        toastas.querySelector('.toast-time').textContent = time;
        toastas.querySelector('.toast-body').textContent = body;

        document.querySelector('#toastContaiter').append(toastas)
        let myToastEl = document.querySelectorAll('.toast')[document.querySelectorAll('.toast').length - 1]
        let myToast = new bootstrap.Toast(myToastEl)
        myToast.show()

        setTimeout(() => {
            myToast.dispose();
            myToastEl.remove();
        }, 4000);
    }
});

