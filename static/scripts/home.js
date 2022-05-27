auth.onAuthStateChanged(user => {
    if(user){
        if(user.emailVerified){
            console.log('user logged in: ', user);
            getClasses()
        }
    } else {
        console.log('user logged out');
        window.location.replace("index.html");
    }
})

async function getClassesTeacher(){
    // Gets all the necessary information of the classes the user teaches
    const user = auth.currentUser
    const snapshot = await db.collection('classes').where('teacher_uid', '==', user.uid).get()
    let html = "";
    const data = snapshot.docs;
    data.sort((a, b) => { // sorts the classes by creation date
        const aDate = a.data().created_at.toDate()
        const bDate = b.data().created_at.toDate()
        if (aDate < bDate) return -1;
        if (aDate > bDate) return 1;
        return 0;
    })

    data.forEach(doc => {
        // Creates the class element
        const Class = doc.data();
        const datetime = Class.created_at.toDate()
        let date = datetime.toDateString()
        date = date.substr(date.indexOf(' ') + 1)
        
        html += `<div class="class" id=${doc.id}>
                    <h2>${Class.name}</h2>
                    <p>Subject - ${Class.subject}</p>
                    <p>Grade - ${Class.grade}</p>
                    <p>Created at - ${date}</p>
                    <span class="delete-class" class-id=${doc.id}>🗑</span>
                    </div>`
    }) 
    document.getElementById("classes").innerHTML = html;
    const classes = document.querySelectorAll(".class")
    for(let c of classes){
        c.addEventListener('click', (e) => {
            if (c.querySelector('.delete-class').matches(':hover')) return; // If the user clicked on the trash can don't open class
            sessionStorage.setItem("classId", c.id);
            window.open("teacher_class.html");
        })
    }

    const deleteClassButtons = document.querySelectorAll(".delete-class")
    for(let c of deleteClassButtons){
        c.addEventListener('click', async (e) => {
            // Deletes all class related information
            if(!confirm('Are you sure you want to delete this class?')) return;

            const classid = c.getAttribute('class-id')
            db.collection('classes').doc(classid).delete() // Deletes the class
            document.getElementById(classid).remove();

            const snapshots = await db.collection('assignments').where('class_id', '==', classid).get()
            for(doc of snapshots.docs){
                db.collection('assignments').doc(doc.id).delete() // Deletes the assignments of the class

                // Deletes the files submitted by students
                const ref = storage.ref(`assignments submitted/${doc.id}`)
                const next = await ref.listAll()
                next.prefixes.forEach(async folder => {
                    const fileRef = (await folder.listAll()).items[0]
                    fileRef.delete()
                    console.log(folder)
                })
            }
        })
    }
}

async function getClassesStudent() {
    // Gets all the necessary information about the classes the user is taking
    const user = auth.currentUser
    const snapshot = await db.collection('classes').where(`students.${user.uid}`, '==', {name: user.displayName, email: user.email}).get()
    let html = "";
    const data = snapshot.docs;

    data.sort((a, b) => { // sorts the classes by creation date
        const aDate = a.data().created_at.toDate()
        const bDate = b.data().created_at.toDate()
        if (aDate < bDate) return -1;
        if (aDate > bDate) return 1;
        return 0;
    })

    data.forEach(doc => {
        // Creates the class element
        const Class = doc.data();
        html += `<div class="class" id=${doc.id}>
                    <h2>${Class.name}</h2>
                    <p>Subject - ${Class.subject}</p>
                    <p>Grade - ${Class.grade}</p>
                    <p>Teacher - ${Class.teacher_name}</p>
                    <span class="leave-class" class-id=${doc.id}>🗑</span>
                    </div>`
    }) 
    document.getElementById("classes").innerHTML = html;
    const classes = document.querySelectorAll(".class")
    for(let c of classes){
        c.addEventListener('click', (e) => {
            if (c.querySelector('.leave-class').matches(':hover')) return; // If the user clicked on the trash can don't open class
            sessionStorage.setItem("classId", c.id);
            window.open("student_class.html");
        })
    }

    // Removes the user from the class
    const LeaveClassButtons = document.querySelectorAll(".leave-class")
    for(let c of LeaveClassButtons){
        c.addEventListener('click', async (e) => {
            if(!confirm('Are you sure you want to leave this class?')) return;

            const classid = c.getAttribute('class-id')
            await db.collection("classes").doc(classid).set({
                students : {
                    [auth.currentUser.uid]: firebase.firestore.FieldValue.delete()
                }
            }, {merge: true}) // Removes the user from the students list of the class
            
            document.getElementById(classid).remove(); // Removes the class from the list in the page
        })
    }
}

function getClasses() {
    // Gets all the necessary information of the user's choice
    const user = auth.currentUser;
    const option = teacherStudent.options[teacherStudent.selectedIndex].value;
    if(option == 'teacher'){
        getClassesTeacher()
    } else if (option == 'student') {
        getClassesStudent()
    }
}

function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}

const teacherStudent = document.getElementById("teacher-student");
teacherStudent.onchange = function() {
    const option = teacherStudent.options[teacherStudent.selectedIndex].value;
    if (option == 'teacher'){
        createClass.style.display = "block"
        joinClass.style.display = "none"
    } else if (option == "student") {
        createClass.style.display = "none"
        joinClass.style.display = "block"
    }
    getClasses()
}

const createClass = document.getElementById("create-class")
createClass.addEventListener("click", (e) => {
    closeNav()
    document.getElementById("create-class-window").style.display = "block"
})

const joinClass = document.getElementById("join-class")
joinClass.addEventListener("click", (e) => {
    closeNav()
    document.getElementById("join-class-window").style.display = "block"
})

const createClassForm = document.getElementById("create-class-form")
createClassForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const className = document.getElementById("class-name").value;
    const classSubject = document.getElementById("class-subject").value;
    const ClassGrade = document.getElementById("class-grade").value;

    document.getElementById("create-class-window").style.display = "none";
    
    const user = auth.currentUser;
    db.collection("classes").add({
        created_at: firebase.firestore.Timestamp.now(),
        grade: ClassGrade,
        name: className,
        students: {},
        subject: classSubject,
        teacher_email: user.email,
        teacher_name: user.displayName,
        teacher_uid: user.uid
    })
    .then(() => {
        createClassForm.reset();
        getClasses()
    })
})

const closeCreateClass = document.getElementById("close-create-class")
closeCreateClass.addEventListener("click", (e) => {
    createClassForm.reset()
    document.getElementById("create-class-window").style.display = "none"
})

const joinClassForm = document.getElementById("join-class-form")
joinClassForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const classCode = document.getElementById("class-code").value.replaceAll(' ', '');
    const user = auth.currentUser;

    document.getElementById("join-class-window").style.display = "none";

    db.collection("classes").doc(classCode).get()
    .then(snapshot => {
        if (Object.keys(snapshot.data().students).includes(auth.currentUser.uid)) { // If the user is already a member of the class
            alert('You are already a member of this class')
            return
        }
        db.collection("classes").doc(classCode).set({
            students: {
                [user.uid]: {name: user.displayName, email: user.email}
            }
        }, {merge: true}) // Adds the user to the students list of the class
        .then(() => {
            joinClassForm.reset();
            getClasses()
        })
    })
    .catch(err => {
        alert('Invalid class code')
    })
})

const closeJoinClass = document.getElementById("close-join-class")
closeJoinClass.addEventListener("click", (e) => {
    joinClassForm.reset()
    document.getElementById("join-class-window").style.display = "none"
})

const signoutButton = document.getElementById("signout-button");
signoutButton.addEventListener('click', (e) => {
    auth.signOut();
})





