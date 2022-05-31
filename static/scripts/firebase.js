function setupFirebase() {
    return new Promise((resolve, reject) => {
        const xObj = new XMLHttpRequest();
        xObj.overrideMimeType("application/json");
        xObj.open('GET', 'https://parleta.github.io/static/scripts/config.json', true);
        xObj.onreadystatechange = () => {
            if (xObj.readyState == 4 && xObj.status == 200) {
                // 2. call your callback function
                const config = JSON.parse(xObj.responseText)
                resolve(config)
            }
        };
        xObj.send();
    })
    
}


window.onload = async () => {

    const config = await setupFirebase()

    firebase.initializeApp(config);

    // update firestore settings
    firebase.firestore().settings({ timestampsInSnapshots: true });

    //Signs the user out when closing the website
    window.onunload = function() {
        if(window.location.pathname == '/home.html')
            firebase.auth().signOut()
    };
}
