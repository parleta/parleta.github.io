const loginButton = document.getElementById("option-login");
loginButton.addEventListener('click', (e) => {
    document.getElementById("option-register").disabled = false;
    loginButton.disabled = true;
    document.getElementById("register-form").style.display = 'none';
    document.getElementById("login-form").style.display = 'block';

});


const registerButton = document.getElementById("option-register");
registerButton.addEventListener('click', (e) => {
    document.getElementById("register-form").reset();
    document.getElementById("option-login").disabled = false;
    registerButton.disabled = true;
    document.getElementById("login-form").style.display = 'none';
    document.getElementById("register-form").style.display = 'block';
});
