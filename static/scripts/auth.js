const auth = firebase.auth()
const db = firebase.firestore()
const storage = firebase.storage()


auth.onAuthStateChanged(user => {
    if(user){
        if(user.emailVerified){
            // user can go to home page only after verifying his email
            console.log("user logged in: ", user);
            window.location.replace("home.html");
        }
    } else {
        console.log("user logged out");
    }
})

let verifyCooldown = new Date();

const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    auth.signInWithEmailAndPassword(email, password)
    .then(() => {
        if(auth.currentUser.emailVerified){
            return new Promise((resolve, reject) => {
                resolve()
            })
        }
        
        document.getElementById("need-email").textContent = email;
        document.getElementById("wait-for-verify").style.display = "block" 

        // avoids too may requests error
        let timeDiff = ((new Date()).getTime() - verifyCooldown.getTime()) / 60000;
        if(timeDiff > 1) {
            verifyCooldown = new Date()
            return auth.currentUser.sendEmailVerification()
        }

        return new Promise((resolve, reject) => {
            reject('ignor')
        })
    })
    .then(() => {
        verifyCooldown = new Date()
    })
    .catch(err => {
        if (err == 'ignor'){
            return
        } else if (err.code == "auth/user-not-found") {
            alert("Wrong Email or Password.")
        } else {
            console.log(err)
            alert("An error has occurred try again later.")
        }
    });
});

const registerForm = document.getElementById("register-form");
registerForm.addEventListener("submit", (e) => {
    //creates the user, sets display name and sends email verification
    e.preventDefault()
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const name = document.getElementById("register-name").value;
    verifyCooldown = new Date()
    document.getElementById("need-email").textContent = email;
    document.getElementById("wait-for-verify").style.display = "block"
    auth.createUserWithEmailAndPassword(email, password) // creates the user
    .then(() => {
        return auth.currentUser.updateProfile({displayName: name}) // sets display name
    })
    .then(() => {
        return auth.currentUser.sendEmailVerification() // sends email verification
    })
    .then(() => {
        verifyCooldown = new Date()
    })
    .catch(err => {
        console.log(err)
        if (err.code == "auth/email-already-in-use") {
            alert("This email address is already in use by another account.")
        }
    });
});

const resendEmail = document.getElementById("resend-email");
resendEmail.addEventListener("click", (e) => {
    let timeDiff = ((new Date()).getTime() - verifyCooldown.getTime()) / 60000; // 60 seconds
    if(timeDiff > 1){ // avoids too many requests error
        auth.currentUser.sendEmailVerification()
        .then(() => {
            verifyCooldown = new Date()
        })
    } else {
        alert(`You need to wait ${60 - parseInt(timeDiff * 60)} seconds to send email verification again`)
    }
})

const closeContainer = document.getElementById("close-container");
closeContainer.addEventListener("click", (e) => {
    document.getElementById("wait-for-verify").style.display = "none"
    auth.signOut()
})
