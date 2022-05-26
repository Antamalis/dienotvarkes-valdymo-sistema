$(document).ready(function () {
    let projectData;
    let projectId = document.querySelector('#getProjectId').value;
    const backToProjectButton = document.querySelector("#backToProject");

    feather.replace()

    fetchProjectData();

    backToProjectButton.addEventListener('click', (event) => {
        event.preventDefault();
        
        window.location.href = `/project/${projectId}`
    });

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
            console.log(data);
            document.querySelector('#task-spinner').remove();
            projectData = data.projectData;
            renderStats(projectData.tasks);
        })
    }

    function renderStats() {
        renderCompletedTasksChart()
        renderUncompletedTasksChart()
        renderTasksStatusChart()
        renderStatsText()
    }

    function renderStatsText() {
        const nameMap = projectData.members.map((member) => {
            return member.name
        })

        document.querySelector('#totalTasks').textContent = projectData.tasks.length;
        document.querySelector('#totalMembers').textContent = projectData.members.length;
        document.querySelector('#memberList').textContent = nameMap.join(", ");
    }

    function renderCompletedTasksChart() {
        let labels = [];
        let completedTasks = [];

        for (let i = 0; i < projectData.members.length; i++) {
            const member = projectData.members[i];
            
            labels.push(member.name)
            completedTasks.push(projectData.tasks.filter(task => task.assingedTo == member.name && task.completed).length)
        }


        const completedTasksData = {
            labels: labels,
            datasets: [{
                label: 'Atliktų užduočių skaičius',
                data: completedTasks,
                borderColor: 'rgba(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }],
          };
    
        const completedTasksConfig = {
            type: 'bar',
            data: completedTasksData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 20,
                        left: 20,
                        right: 20,
                        bottom: 30
                    }
                }
            }
        };

        // if(completedTasks.reduce((a, b) => a + b) > 0){
            const myChart = new Chart(
                document.getElementById('completedTasksChart'),
                completedTasksConfig
            );
        // }
        
    }

    function renderUncompletedTasksChart() {
        let labels = [];
        let uncompletedTasks = [];

        for (let i = 0; i < projectData.members.length; i++) {
            const member = projectData.members[i];
            
            labels.push(member.name)
            uncompletedTasks.push(projectData.tasks.filter(task => task.assingedTo == member.name && !task.completed).length)
        }


        const completedTasksData = {
            labels: labels,
            datasets: [{
                label: 'Neatliktų užduočių skaičius',
                data: uncompletedTasks,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }],
          };
    
        const completedTasksConfig = {
            type: 'bar',
            data: completedTasksData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 20,
                        left: 20,
                        right: 20,
                        bottom: 30
                    }
                }
            }
        };

        // if(completedTasks.reduce((a, b) => a + b) > 0){
            const myChart = new Chart(
                document.getElementById('uncompletedTasksChart'),
                completedTasksConfig
            );
        // }
        
    }

    function renderTasksStatusChart() {
        let chartData = {
            "Nepriskirtos ir neatliktos": projectData.tasks.filter(task => !task.assingedTo && !task.completed).length,
            "Priskirtos, bet neatliktos": projectData.tasks.filter(task => task.assingedTo && !task.completed).length,
            "Nepriskirtos, bet atliktos": projectData.tasks.filter(task => !task.assingedTo && task.completed).length,
            "Priskirtos ir atliktos": projectData.tasks.filter(task => task.assingedTo && task.completed).length,
        };

        const tasksStatusData = {
            labels: Object.keys(chartData),
            datasets: [{
                label: 'Užduočių statusai',
                data: Object.values(chartData),
                backgroundColor: [
                    'rgb(201, 203, 207)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 205, 86)',
                    'rgb(147,184,0)'
                ],
                hoverOffset: 4
            }]
          };
    
        const tasksStatusConfig = {
            type: 'doughnut',
            data: tasksStatusData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 20,
                        left: 20,
                        right: 20,
                        bottom: 30
                    }
                }
            }
        };

        // if(completedTasks.reduce((a, b) => a + b) > 0){
            const myChart = new Chart(
                document.getElementById('tasksStatusChart'),
                tasksStatusConfig
            );
        // }
        
    }
});

