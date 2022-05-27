const firebaseConfig = {
    apiKey: "AIzaSyC1NusntUcWqSPB1vrf_h34dg8QU10H7pg",
    authDomain: "classroom-c429c.firebaseapp.com",
    projectId: "classroom-c429c",
    appId: "1:428755126371:web:a51d93dc3ff5254db4d056",
    storageBucket: "classroom-c429c.appspot.com"
};
firebase.initializeApp(firebaseConfig);

// make auth and firestore references
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage()

// update firestore settings
db.settings({ timestampsInSnapshots: true });
window.onunload = function() {
    if(window.location.pathname == '/home.html')
        auth.signOut().then(() => {});
};