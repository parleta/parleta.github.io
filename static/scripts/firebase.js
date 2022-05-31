function getFirebaseConfig(){
    return new Promise((resolve, reject) => {
        const xObj = new XMLHttpRequest();
        xObj.overrideMimeType("application/json");
        xObj.open('GET', './config.json', false);
        xObj.onreadystatechange = () => {
            if (xObj.readyState == 4 && xObj.status == 200) {
                // 2. call your callback function
                resolve(xObj.responseText);
            }
        };
        xObj.send();
    })
}

getFirebaseConfig()
.then(config => {
    firebase.initializeApp(JSON.parse(config));
})

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