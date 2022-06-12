const auth = firebase.auth()
const db = firebase.firestore()
const storage = firebase.storage()

auth.onAuthStateChanged(user => {
    if(user){
        if (user.emailVerified){
            console.log(user);
        }
    } else {
        console.log('user logged out');
        window.close()
    }
})

function timestampToDate(timestamp) {
    // Converts timestamp to date
    const datetime = timestamp.toDate()
    const date = datetime.toDateString()
    return date.substr(date.indexOf(' ') + 1)
}

let currentAssignmentId;
let assignmentName;
const classId = sessionStorage.getItem("classId")
const emailMsg = '***Please make sure you are logged in from the correct browser account***'


    db.collection('classes').doc(classId).onSnapshot(snapshot => {
        const Class = snapshot.data();
        sessionStorage.setItem('students', JSON.stringify(Class.students))
        //shows class info
        let html = `<h1>${Class.name}</h1>
                    <hr>
                    <p>${Class.subject} - Grade ${Class.grade}</p>
                    <p style="display: inline">Teacher - ${Class.teacher_name}</p><span class="send-email-to-teacher" email=${Class.teacher_email}>✉</span>`
        document.getElementById('info').innerHTML = html

        const senfEmailToTeacher = document.querySelector('.send-email-to-teacher');
        senfEmailToTeacher.addEventListener('click', (e) => {
            const dest = senfEmailToTeacher.getAttribute('email')
            window.open(`https://mail.google.com/mail/u/0/?fs=1&to=${dest}&body=${emailMsg}&tf=cm`);
        })

        //show class members(students)
        html = "";
        const students = Class.students;
        for (const [uid, {name, email}] of Object.entries(students)) {
            if(uid == auth.currentUser.uid) continue
            html += `<div>
                      <span>${name}</span>
                      <span class="send-email" email=${email}>✉</span>
                     </div>
                     <hr>`
        }

        document.getElementById('members').innerHTML = html.substring(0, html.lastIndexOf("<hr>"));
        
        // send email buttons
        const sendEmail = document.querySelectorAll(".send-email")
        for(let btn of sendEmail){
            btn.addEventListener('click', (e) => {
                const dest = btn.getAttribute('email')
                window.open(`https://mail.google.com/mail/u/0/?fs=1&to=${dest}&body=${emailMsg}&tf=cm`);
            })
        }
    })

//shows assignments
db.collection('assignments').where('class_id', '==', classId)
.onSnapshot(snapshot =>  {
    const data = snapshot.docs;
    // Sorts the assignments by creation date
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
        const date = timestampToDate(assignment.created_at)
        if(assignment.students.hasOwnProperty(auth.currentUser.uid)){
            html += `<div id="${doc.id}">
                        <span class="assignment-name">${assignment.name}</span>
                        <span class="assignment-date">published at ${date}</span>
                        <span class="assignment-submitted">✓</span>
                    </div>`
        } else {
            html += `<div id="${doc.id}">
                        <span class="assignment-name">${assignment.name}</span>
                        <span class="assignment-date">published at ${date}</span>
                    </div>`
        }
    })
    document.getElementById('assignments').innerHTML = html;

    const assignments = document.querySelectorAll("#assignments div")
    for(let a of assignments){
        a.addEventListener('click', async (e) => {
            // Opens assignment window after clicking on it
            currentAssignmentId = a.id;
            const doc = await db.collection('assignments').doc(a.id).get()
            const assignment = doc.data()
            assignmentName = assignment.name
            document.getElementById("assignment-info").innerHTML = `<h1>${assignmentName}</h1>
                                                                    <p>${assignment.description}</p>`
            if(assignment.students.hasOwnProperty(auth.currentUser.uid)) { // If the user is in the list of the students submitted this assignment
                document.getElementById('submit-assignment').innerHTML = `<h3 style="text-align: center">You already submitted this assignment</h3>`
                
            } else {
                document.getElementById('submit-assignment').innerHTML = `<form id="submit-assignment-form">
                                                                            <h1>Sumbit Assignment</h1>
                                                                            <p id="deadline"></p>
                                                                            <input type="file" id="assignment-file" required="required" accept=".txt, .doc, .docx, .pdf, .png, .jpg">
                                                                            <br>
                                                                            <button class="form-submit" type="submit">submit</button>
                                                                            </form>`
                const deadline = timestampToDate(assignment.deadline)
                document.getElementById('deadline').textContent = 'Deadline - ' + deadline
                document.getElementById("assignment-info").innerHTML = `<h1>${assignmentName}</h1>
                                                                        <p>${assignment.description}</p>`

                document.getElementById("submit-assignment-form").addEventListener('submit', OnAssignmentSubmission)
                document.getElementById('assignment-file').addEventListener("change", (e) => {
                    // When selecting file to submit
                    e.preventDefault()
                    file = e.target.files[0];
                })
            }
            document.getElementById("assignment-info-window").style.display = 'block'
        })
    }
})


let file;
async function OnAssignmentSubmission(e) {
    e.preventDefault()
    // submits the assignment
    document.getElementById("assignment-info-window").style.display = 'none'

    // Checks if the file is valid
    const types = ['txt', 'doc', 'docx', 'pdf', 'png', 'jpg']
    const fileType = file.name.split('.').pop()
    if(!(types.includes(fileType))){
        alert('Wrong file type.');
        return;
    }
    
    const fileRef = storage.ref(`assignments submitted/${currentAssignmentId}/${auth.currentUser.uid}`) // Creates the path for the file
    await fileRef.child(`${assignmentName} - ${auth.currentUser.displayName}.${fileType}`).put(file) // sets its name to "assignment's name - user's name"
    await db.collection("assignments").doc(currentAssignmentId).set({
        students: {
            [`${auth.currentUser.uid}`]: firebase.firestore.Timestamp.now()
        }
    }, {merge: true}) // Adds the user to the list of students submitted the assignments
}

document.getElementById('close-assignment-window').onclick = function() {
    document.getElementById("assignment-info-window").style.display = 'none'
}