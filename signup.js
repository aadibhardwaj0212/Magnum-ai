const signupForm = document.getElementById("signupForm");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput =
    document.getElementById("confirmPassword");

const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const passwordError =
    document.getElementById("passwordError");
const confirmPasswordError =
    document.getElementById("confirmPasswordError");

const signupError =
    document.getElementById("signupError");

const signupButton =
    document.getElementById("signupButton");

const buttonText =
    document.getElementById("buttonText");

const loader =
    document.getElementById("loader");


function validateName() {

    const name = nameInput.value.trim();

    if (name === "") {

        nameError.textContent =
            "Please enter your name.";

        return false;
    }

    nameError.textContent = "";

    return true;
}


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


function validateConfirmPassword() {

    const password = passwordInput.value;
    const confirmPassword =
        confirmPasswordInput.value;

    if (confirmPassword === "") {

        confirmPasswordError.textContent =
            "Please confirm your password.";

        return false;
    }

    if (password !== confirmPassword) {

        confirmPasswordError.textContent =
            "Passwords do not match.";

        return false;
    }

    confirmPasswordError.textContent = "";

    return true;
}


signupForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    signupError.classList.remove("show");

    const validName = validateName();
    const validEmail = validateEmail();
    const validPassword = validatePassword();
    const validConfirmPassword =
        validateConfirmPassword();


    if (
        !validName ||
        !validEmail ||
        !validPassword ||
        !validConfirmPassword
    ) {

        return;
    }


    signupButton.disabled = true;

    buttonText.style.display = "none";
    loader.style.display = "block";


    try {

        const response = await fetch("/api/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                name: nameInput.value.trim(),

                email: emailInput.value.trim(),

                password: passwordInput.value

            })

        });


        const data = await response.json();


        if (response.ok) {

            buttonText.textContent =
                "ACCOUNT CREATED";

            buttonText.style.display = "inline";

            loader.style.display = "none";


            setTimeout(function () {

                window.location.href =
                    "login.html";

            }, 1000);


        } else {

            signupError.textContent =
                data.message || "Registration failed.";

            signupError.classList.add("show");

            signupButton.disabled = false;

            buttonText.style.display = "inline";

            loader.style.display = "none";

        }

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        signupError.textContent =
            "Unable to connect to the server.";

        signupError.classList.add("show");

        signupButton.disabled = false;

        buttonText.style.display = "inline";

        loader.style.display = "none";

    }

});