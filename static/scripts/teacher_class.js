auth.onAuthStateChanged(user => {
    if(user && user.emailVerified){
        console.log(user);
    } else {
        console.log('user logged out');
        window.close()
    }
})

function timestampToDate(timestamp) {
    const datetime = timestamp.toDate()
    const date = datetime.toDateString()
    return date.substr(date.indexOf(' ') + 1)
}

const classId = sessionStorage.getItem("classId")
const emailMsg = '**Please make sure you are logged in from the correct browser account**'

window.onload = function() {
    db.collection('classes').doc(classId).onSnapshot(snapshot => {
        const Class = snapshot.data();
        sessionStorage.setItem('students', JSON.stringify(Class.students))
        //show class info
        let html = `<h1>${Class.name}</h1>
                    <hr>
                    <p>${Class.subject} - Grade ${Class.grade}</p>
                    <p>Class code:  ${snapshot.id}</p>`
        document.getElementById('info').innerHTML = html

        //show class members(students)
        html = "";
        const students = Class.students;
        for (const [uid, {name, email}] of Object.entries(students)) {
            html += `<div>
                      <span>${name}</span>
                      <span class="send-email" email=${email}>✉</span>
                     </div>
                     <hr>`
        }

        document.getElementById('members').innerHTML = html.substring(0, html.lastIndexOf("<hr>"));
        
        const sendEmail = document.querySelectorAll(".send-email")
        for(let btn of sendEmail){
            btn.addEventListener('click', (e) => {
                e.preventDefault()
                const dest = btn.getAttribute('email')
                window.open(`https://mail.google.com/mail/u/0/?fs=1&to=${dest}&body=${emailMsg}&tf=cm`);
            })
        }
    })
    //show assignments
    db.collection('assignments').where('class_id', '==', classId)
    .onSnapshot(snapshot =>  {
        const data = snapshot.docs;
        data.sort((a, b) => {
            const aDate = a.data().created_at.toDate()
            const bDate = b.data().created_at.toDate()
            if (aDate < bDate) return -1;
            if (aDate > bDate) return 1;
            return 0;
        })

        let html = ``;
        data.forEach(doc => {
            const assignment = doc.data();
            const datetime = assignment.created_at.toDate()
            let date = datetime.toDateString()
            date = date.substr(date.indexOf(' ') + 1)
            
            html += `<div id="${doc.id}">
                        <span class="assignment-name">${assignment.name}</span>
                        <span class="assignment-date">published at ${date}</span>
                        <span class="delete-assignment" assignment-id=${doc.id}>🗑</span>
                    </div>`
        })
        document.getElementById('assignments').innerHTML = html;

        const assignments = document.querySelectorAll("#assignments div")
        for(let a of assignments){
            a.addEventListener('click', async (e) => {
                if (a.querySelector('.delete-assignment').matches(':hover')) return;
                const doc = await db.collection('assignments').doc(a.id).get()
                const assignment = doc.data()
                document.getElementById("assignment-info").innerHTML = `<h1>${assignment.name}</h1>
                                                                        <p>${assignment.description}</p>`
                document.getElementById("assignment-info-window").style.display = 'block'
                const students = JSON.parse(sessionStorage.getItem('students'));
                const deadline = timestampToDate(assignment.deadline);
                let html = ''
                for (const [uid, {name, email}] of Object.entries(students)) {
                    const timestamp = assignment.students[uid]
                    let date;
                    let color = 'rgb(200, 0, 0)';
                    let downloadClass = 'disabled'
                    if(timestamp == null) {
                        date = 'Not Submitted'
                    } else {
                        downloadClass = 'enabled'
                        date = timestampToDate(timestamp)
                        if(new Date(deadline) > new Date(date)) {
                            color = 'rgb(0, 128, 0)'
                        } else {
                            color = 'rgb(200, 0, 0)'
                        }
                    }
                    html += `
                    <div>
                        <div class="student-name-date">
                            <span>${name}</span> <br> <span style="color: ${color}">${date}</span>
                        </div>
                        <div class="download">
                            <span class="${downloadClass}" id="${a.id}/${uid}">🡣</span>
                        </div>
                    </div>
                    <hr>`
                }
                document.getElementById('students-info').innerHTML = html.substring(0, html.lastIndexOf("<hr>")) + '<br>';
                downloadBtns = document.querySelectorAll('.download > span.enabled')
                downloadBtns.forEach(b => {
                    b.onclick = async function() {
                        const fileRef = (await storage.ref(`assignments submitted/${b.id}`).listAll()).items[0]
                        const url = await fileRef.getDownloadURL()
                        var link = document.createElement("a");
                        link.download = fileRef.name;
                        link.href = url;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        delete link;
                    }   
                })
            })
        }

        const deleteAssignmentButtons = document.querySelectorAll('.delete-assignment')
        for(let b of deleteAssignmentButtons){
            b.addEventListener('click', (e) => {
                if (!confirm('Are you sure you want to delete this assignment?')) return

                const assignmentid = b.getAttribute('assignment-id')
                db.collection('assignments').doc(assignmentid).delete()
                delete document.getElementById(assignmentid)
            })
        }
    })

    const today = (new Date()).toLocaleDateString().split('/')
    let [year, month, day] = [today[2], today[0], today[1]] //yyyy-mm-dd
    if(month.length == 1) month = '0' + month;
    if(day.length == 1) day = '0' + day;

    const todayDate = year + '-' + month + '-' + day
    document.getElementById('deadline').setAttribute("min", todayDate);
}

const createAssignment = document.getElementById("create-assignment")
createAssignment.addEventListener("click", (e) => {
    document.getElementById("create-assignment-window").style.display = "block"
})

const CreateAssignmentForm = document.getElementById('create-assignment-form')
CreateAssignmentForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const deadline = document.getElementById('deadline').value;
    const description = document.getElementById('assignment-description').value;
    const name = document.getElementById('assignment-name').value;

    document.getElementById("create-assignment-window").style.display = "none";

    db.collection("assignments").add({
        class_id: classId,
        created_at: firebase.firestore.Timestamp.now(),
        deadline: new Date(deadline),
        description: description,
        name: name,
        students: {}
    })
    .then(() => {
        CreateAssignmentForm.reset();
    })
    

})

document.getElementById('close-create-assignment').addEventListener('click', (e) => {
    CreateAssignmentForm.reset()
    document.getElementById('create-assignment-window').style.display = 'none'
})

document.getElementById('close-assignment-info').onclick = function() {
    document.getElementById("assignment-info-window").style.display = 'none'
}
