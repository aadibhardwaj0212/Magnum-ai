const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const togglePassword =
    document.getElementById("togglePassword");

const emailError =
    document.getElementById("emailError");

const passwordError =
    document.getElementById("passwordError");

const loginError =
    document.getElementById("loginError");

const loginButton =
    document.getElementById("loginButton");

const buttonText =
    document.getElementById("buttonText");

const loader =
    document.getElementById("loader");


togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";
        togglePassword.textContent = "🙈";

    } else {

        passwordInput.type = "password";
        togglePassword.textContent = "👁";

    }

});


function validateEmail() {

    const email = emailInput.value.trim();

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === "") {

        emailError.textContent =
            "Please enter your email.";

        return false;
    }

    if (!emailPattern.test(email)) {

        emailError.textContent =
            "Please enter a valid email address.";

        return false;
    }

    emailError.textContent = "";

    return true;
}


function validatePassword() {

    const password = passwordInput.value;

    if (password === "") {

        passwordError.textContent =
            "Please enter your password.";

        return false;
    }

    if (password.length < 8) {

        passwordError.textContent =
            "Password must contain at least 8 characters.";

        return false;
    }

    passwordError.textContent = "";

    return true;
}


emailInput.addEventListener("input", function () {

    if (emailInput.value.length > 0) {

        validateEmail();

    } else {

        emailError.textContent = "";

    }

});


passwordInput.addEventListener("input", function () {

    if (passwordInput.value.length > 0) {

        validatePassword();

    } else {

        passwordError.textContent = "";

    }

});


loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    loginError.classList.remove("show");

    const validEmail = validateEmail();
    const validPassword = validatePassword();

    if (!validEmail || !validPassword) {
        return;
    }

    loginButton.disabled = true;

    buttonText.style.display = "none";
    loader.style.display = "block";

    try {

        const response = await fetch("/api/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: emailInput.value.trim(),
                password: passwordInput.value
            })

        });


        const data = await response.json();


        if (response.ok) {

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            buttonText.textContent = "SUCCESS";

            buttonText.style.display = "inline";
            loader.style.display = "none";


            setTimeout(function () {

                window.location.href =
                    "dashboard.html";

            }, 500);


        } else {

            loginError.textContent =
                data.message || "Invalid email or password.";

            loginError.classList.add("show");

            loginButton.disabled = false;

            buttonText.style.display = "inline";
            loader.style.display = "none";

        }

    } catch (error) {

        console.error("Login error:", error);

        loginError.textContent =
            "Unable to connect to the server.";

        loginError.classList.add("show");

        loginButton.disabled = false;

        buttonText.style.display = "inline";
        loader.style.display = "none";

    }

});