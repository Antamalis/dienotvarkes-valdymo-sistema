$(document).ready(function () {
    const addProjectModal = document.getElementById('addProjectModal');

    feather.replace()

    fetchProjects()

    addProjectModal.querySelector("#add-project-submit").addEventListener('click', (event) => {
        event.preventDefault();
        const projectTitle = addProjectModal.querySelector('#add-project-title').value;
        addProject(projectTitle);
    });

    function fetchProjects() {
        fetch("/api/fetchProjects")
        .then((response) => response.json())
        .then((data) => {
            renderProjects(data);
        })
    }

    function addProject(title) {
        console.log(`NAME: ${title}`);

        fetch('/api/createNewProject', {
            headers: {
                "Content-Type": "application/json",
            },
            method: 'POST',
            body: JSON.stringify({title})
        })
        .then((response) => response.json())
        .then((data) => {
            renderProjects(data.projects);
        })
    }

    function renderProjects(projects) {
        document.querySelector("#active-projects").innerHTML = "";
        console.log(`Projects:`);
        console.log(projects);

        for (let i = 0; i < projects.length; i++) {
            const project = projects[i];
            
            let projectListItem = document.importNode(document.querySelector("#project-list-item").content, true);
            projectListItem.querySelector('a').textContent = project.projectTitle
            projectListItem.querySelector('a').setAttribute('href', `/project/${project.projectId}`)
            document.querySelector("#active-projects").append(projectListItem);
        }
    }
});

