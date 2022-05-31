//read the firebase info from json file
const xObj = new XMLHttpRequest();
xObj.overrideMimeType("application/json");
xObj.open('GET', '/static/scripts/config.json', false);
xObj.onreadystatechange = () => {
    if (xObj.readyState == 4 && xObj.status == 200) {

        //sets firebase up
        const config = JSON.parse(xObj.responseText)
        firebase.initializeApp(config);

        // update firestore settings
        firebase.firestore().settings({ timestampsInSnapshots: true });

        //Signs the user out when closing the website
        window.onunload = function() {
            if(window.location.pathname == '/home.html')
                firebase.auth().signOut()
        }
    }
};
xObj.send();




