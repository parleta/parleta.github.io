const xObj = new XMLHttpRequest();
xObj.overrideMimeType("application/json");
xObj.open('GET', 'https://parleta.github.io/static/scripts/config.json', true);
xObj.onreadystatechange = () => {
    if (xObj.readyState == 4 && xObj.status == 200) {
        // 2. call your callback function
        const config = JSON.parse(xObj.responseText)
        firebase.initializeApp(JSON.parse(config));

        // update firestore settings
        firebase.firestore().settings({ timestampsInSnapshots: true });
        window.onunload = function() {
            if(window.location.pathname == '/home.html')
                firebase.auth().signOut().then(() => {});
        };
    }
};
xObj.send();

