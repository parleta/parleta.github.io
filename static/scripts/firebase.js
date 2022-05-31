const xObj = new XMLHttpRequest();
xObj.overrideMimeType("application/json");
xObj.open('GET', 'https://parleta.github.io/static/scripts/config.json', true);
xObj.onreadystatechange = () => {
    if (xObj.readyState == 4 && xObj.status == 200) {
        // 2. call your callback function
        const config = JSON.parse(xObj.responseText)
        firebase.initializeApp(JSON.parse(config));
        // make auth and firestore references
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage()

        // update firestore settings
        db.settings({ timestampsInSnapshots: true });
        window.onunload = function() {
            if(window.location.pathname == '/home.html')
                auth.signOut().then(() => {});
        };
    }
};
xObj.send();

