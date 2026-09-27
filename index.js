const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const loginError = document.getElementById("loginError");

const loginButton = document.getElementById("loginButton");
const buttonText = document.getElementById("buttonText");
const loader = document.getElementById("loader");

const togglePassword = document.getElementById("togglePassword");


togglePassword.addEventListener("click", function () {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "🙈";
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "👁";
    }
});


loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    emailError.textContent = "";
    passwordError.textContent = "";
    loginError.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
        emailError.textContent = "Please enter your email";
        return;
    }

    if (!password) {
        passwordError.textContent = "Please enter your password";
        return;
    }

    loginButton.disabled = true;
    buttonText.textContent = "LOGGING IN...";
    loader.style.display = "inline-block";

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (response.ok) {

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            buttonText.textContent = "SUCCESS!";

            setTimeout(function () {
                window.location.href = "dashboard.html";
            }, 500);

        } else {

            loginError.textContent = data.message;

        }

    } catch (error) {

        console.error("Login error:", error);

        loginError.textContent =
            "Unable to connect to MAGNUM AI server.";

    } finally {

        loginButton.disabled = false;

        if (buttonText.textContent !== "SUCCESS!") {
            buttonText.textContent = "LOGIN";
        }

        loader.style.display = "none";
    }
});