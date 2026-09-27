const emailStep =
    document.getElementById("emailStep");

const otpStep =
    document.getElementById("otpStep");

const passwordStep =
    document.getElementById("passwordStep");

const successStep =
    document.getElementById("successStep");


const emailInput =
    document.getElementById("email");

const otpInput =
    document.getElementById("otp");

const newPasswordInput =
    document.getElementById("newPassword");

const confirmPasswordInput =
    document.getElementById("confirmPassword");


const emailError =
    document.getElementById("emailError");

const otpError =
    document.getElementById("otpError");

const newPasswordError =
    document.getElementById("newPasswordError");

const confirmPasswordError =
    document.getElementById("confirmPasswordError");


const emailMessage =
    document.getElementById("emailMessage");

const otpMessage =
    document.getElementById("otpMessage");

const passwordMessage =
    document.getElementById("passwordMessage");


const sendOtpButton =
    document.getElementById("sendOtpButton");

const verifyOtpButton =
    document.getElementById("verifyOtpButton");

const resetPasswordButton =
    document.getElementById("resetPasswordButton");

const resendButton =
    document.getElementById("resendButton");

const loginButton =
    document.getElementById("loginButton");


const sendOtpText =
    document.getElementById("sendOtpText");

const sendOtpLoader =
    document.getElementById("sendOtpLoader");

const verifyOtpText =
    document.getElementById("verifyOtpText");

const verifyOtpLoader =
    document.getElementById("verifyOtpLoader");

const resetPasswordText =
    document.getElementById("resetPasswordText");

const resetPasswordLoader =
    document.getElementById("resetPasswordLoader");


let userEmail = "";
let resetToken = "";


function showStep(step) {

    emailStep.classList.add("hidden");
    otpStep.classList.add("hidden");
    passwordStep.classList.add("hidden");
    successStep.classList.add("hidden");

    step.classList.remove("hidden");
}


function validEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


/* =========================================================
   SEND OTP
========================================================= */

async function sendOtp() {

    const email =
        emailInput.value.trim().toLowerCase();


    emailError.textContent = "";
    emailMessage.textContent = "";


    if (!email) {

        emailError.textContent =
            "Please enter your email.";

        return;

    }


    if (!validEmail(email)) {

        emailError.textContent =
            "Please enter a valid email.";

        return;

    }


    sendOtpButton.disabled = true;

    sendOtpText.style.display = "none";
    sendOtpLoader.style.display = "block";


    try {

        const response = await fetch(
            "/api/forgot-password",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    email: email
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            emailError.textContent =
                data.message ||
                "Unable to send OTP.";

            return;

        }


        userEmail = email;


        emailMessage.textContent =
            "If this email is registered, an OTP has been sent.";


        setTimeout(function () {

            showStep(otpStep);

        }, 800);


    } catch (error) {

        console.error(error);

        emailError.textContent =
            "Unable to connect to server.";

    } finally {

        sendOtpButton.disabled = false;

        sendOtpText.style.display = "inline";
        sendOtpLoader.style.display = "none";

    }

}


/* =========================================================
   VERIFY OTP
========================================================= */

async function verifyOtp() {

    const otp =
        otpInput.value.trim();


    otpError.textContent = "";
    otpMessage.textContent = "";


    if (!/^\d{6}$/.test(otp)) {

        otpError.textContent =
            "Please enter a valid 6-digit OTP.";

        return;

    }


    verifyOtpButton.disabled = true;

    verifyOtpText.style.display = "none";
    verifyOtpLoader.style.display = "block";


    try {

        const response = await fetch(
            "/api/verify-otp",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    email: userEmail,

                    otp: otp

                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            otpError.textContent =
                data.message ||
                "Invalid OTP.";

            return;

        }


        resetToken =
            data.reset_token;


        showStep(passwordStep);


    } catch (error) {

        console.error(error);

        otpError.textContent =
            "Unable to verify OTP.";

    } finally {

        verifyOtpButton.disabled = false;

        verifyOtpText.style.display =
            "inline";

        verifyOtpLoader.style.display =
            "none";

    }

}


/* =========================================================
   RESET PASSWORD
========================================================= */

async function resetPassword() {

    const password =
        newPasswordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;


    newPasswordError.textContent = "";
    confirmPasswordError.textContent = "";
    passwordMessage.textContent = "";


    if (password.length < 8) {

        newPasswordError.textContent =
            "Password must be at least 8 characters.";

        return;

    }


    if (password !== confirmPassword) {

        confirmPasswordError.textContent =
            "Passwords do not match.";

        return;

    }


    resetPasswordButton.disabled = true;

    resetPasswordText.style.display = "none";
    resetPasswordLoader.style.display = "block";


    try {

        const response = await fetch(
            "/api/reset-password",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    email: userEmail,

                    reset_token:
                        resetToken,

                    password:
                        password

                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            passwordMessage.textContent =
                data.message ||
                "Unable to reset password.";

            return;

        }


        showStep(successStep);


    } catch (error) {

        console.error(error);

        passwordMessage.textContent =
            "Unable to connect to server.";

    } finally {

        resetPasswordButton.disabled = false;

        resetPasswordText.style.display =
            "inline";

        resetPasswordLoader.style.display =
            "none";

    }

}


/* =========================================================
   BUTTONS
========================================================= */

sendOtpButton.addEventListener(
    "click",
    sendOtp
);


verifyOtpButton.addEventListener(
    "click",
    verifyOtp
);


resetPasswordButton.addEventListener(
    "click",
    resetPassword
);


resendButton.addEventListener(
    "click",
    async function () {

        if (!userEmail) {
            return;
        }

        emailInput.value = userEmail;

        showStep(emailStep);

        await sendOtp();

    }
);


loginButton.addEventListener(
    "click",
    function () {

        window.location.href =
            "login.html";

    }
);