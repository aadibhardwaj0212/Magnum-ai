/* =========================================================
   MAGNUM AI ASSISTANT
   Frontend Controller
========================================================= */


/* =========================================================
   DOM ELEMENTS
========================================================= */
const loggedInUser =
    JSON.parse(localStorage.getItem("user") || "null");

if (!loggedInUser) {
    window.location.href = "login.html";
}

const logoutButton =
    document.getElementById("logoutButton");

logoutButton.addEventListener("click", function () {

    localStorage.removeItem("user");

    window.location.href = "login.html";

});





const app = document.querySelector(".magnum-app");

const statusText = document.getElementById("statusText");
const assistantState = document.getElementById("assistantState");

const userQuestion = document.getElementById("userQuestion");
const magnumAnswer = document.getElementById("magnumAnswer");

const waveform = document.getElementById("waveform");

const microphoneButton =
    document.getElementById("microphoneButton");

const keyboardButton =
    document.getElementById("keyboardButton");

const stopButton =
    document.getElementById("stopButton");

const textInputContainer =
    document.getElementById("textInputContainer");

const textInput =
    document.getElementById("textInput");

const sendButton =
    document.getElementById("sendButton");

const webStatus =
    document.getElementById("webStatus");

const webStatusDot =
    document.getElementById("webStatusDot");

const searchMessage =
    document.getElementById("searchMessage");

const sourceName =
    document.getElementById("sourceName");

const sourceUrl =
    document.getElementById("sourceUrl");

const recentSearches =
    document.getElementById("recentSearches");


/* =========================================================
   APPLICATION STATE
========================================================= */

let isListening = false;
let isProcessing = false;
let isSpeaking = false;

let recognition = null;

let microphoneStream = null;
let audioContext = null;
let analyser = null;
let microphoneSource = null;
let animationFrame = null;

let finalTranscript = "";

let currentUtterance = null;


/* =========================================================
   SPEECH RECOGNITION SUPPORT
========================================================= */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


const speechRecognitionSupported =
    !!SpeechRecognition;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeSpeechRecognition();

    initializeButtons();

    initializeKeyboard();

    initializeSpeechSynthesis();

    loadRecentSearches();

    checkBrowserSupport();

    setReadyState();

});


/* =========================================================
   BROWSER SUPPORT
========================================================= */

function checkBrowserSupport() {

    if (!speechRecognitionSupported) {

        console.warn(
            "Speech Recognition is not supported in this browser."
        );

        assistantState.textContent =
            "Voice recognition unavailable";

        statusText.textContent =
            "TEXT MODE";

        return;
    }

}


/* =========================================================
   SPEECH RECOGNITION INITIALIZATION
========================================================= */

function initializeSpeechRecognition() {

    if (!speechRecognitionSupported) {
        return;
    }


    recognition = new SpeechRecognition();


    /*
        Continuous listening allows the browser
        to keep listening while the user speaks.
    */

    recognition.continuous = false;


    /*
        We need interim results so that the UI
        can show what the user is currently saying.
    */

    recognition.interimResults = true;


    /*
        English India is appropriate for your setup.

        You can change this later to:

        en-US
        en-GB
        hi-IN
        etc.
    */

    recognition.lang = "en-IN";


    recognition.maxAlternatives = 1;


    /* -----------------------------------------
       Recognition started
    ------------------------------------------ */

    recognition.onstart = () => {

        isListening = true;

        finalTranscript = "";

        setListeningState();

        startMicrophoneVisualizer();

    };


    /* -----------------------------------------
       Recognition results
    ------------------------------------------ */

    recognition.onresult = (event) => {

        let interimTranscript = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            const transcript =
                event.results[i][0].transcript;

            if (event.results[i].isFinal) {

                finalTranscript += transcript;

            } else {

                interimTranscript += transcript;

            }

        }


        const displayedText =
            (finalTranscript + " " + interimTranscript)
                .trim();


        if (displayedText) {

            userQuestion.textContent =
                displayedText;

        }

    };


    /* -----------------------------------------
       Recognition ended
    ------------------------------------------ */

    recognition.onend = () => {

        isListening = false;

        stopMicrophoneVisualizer();


        const question =
            finalTranscript.trim();


        if (question) {

            processQuestion(question);

        } else {

            setReadyState();

        }

    };


    /* -----------------------------------------
       Recognition error
    ------------------------------------------ */

    recognition.onerror = (event) => {

        console.error(
            "Speech recognition error:",
            event.error
        );


        isListening = false;

        stopMicrophoneVisualizer();


        handleRecognitionError(
            event.error
        );

    };

}


/* =========================================================
   MICROPHONE PERMISSION
========================================================= */

async function requestMicrophoneAccess() {

    /*
        We request microphone access separately from
        speech recognition.

        This allows us to create the visual waveform.
    */

    try {

        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia) {

            throw new Error(
                "Microphone API is not supported."
            );

        }


        microphoneStream =
            await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });


        console.log(
            "Microphone access granted."
        );


        return true;

    } catch (error) {

        console.error(
            "Microphone access error:",
            error
        );


        handleMicrophoneError(error);

        return false;

    }

}


/* =========================================================
   START LISTENING
========================================================= */

async function startListening() {

    if (isProcessing) {
        return;
    }


    if (isSpeaking) {

        stopSpeaking();

    }


    /*
        Request microphone access first.
    */

    const microphoneReady =
        await requestMicrophoneAccess();


    if (!microphoneReady) {
        return;
    }


    if (!speechRecognitionSupported) {

        /*
            If browser speech recognition isn't available,
            open text input instead.
        */

        showTextInput();

        assistantState.textContent =
            "Type your question";

        return;
    }


    try {

        finalTranscript = "";

        userQuestion.textContent =
            "Listening...";


        recognition.start();

    } catch (error) {

        console.error(
            "Could not start recognition:",
            error
        );

    }

}


/* =========================================================
   STOP LISTENING
========================================================= */

function stopListening() {

    if (recognition && isListening) {

        try {

            recognition.stop();

        } catch (error) {

            console.warn(error);

        }

    }


    isListening = false;

    stopMicrophoneVisualizer();

}


/* =========================================================
   MICROPHONE VISUALIZER
========================================================= */

async function startMicrophoneVisualizer() {

    try {

        if (!microphoneStream) {
            return;
        }


        /*
            Create AudioContext only once.
        */

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }


        if (
            audioContext.state ===
            "suspended"
        ) {

            await audioContext.resume();

        }


        analyser =
            audioContext.createAnalyser();


        analyser.fftSize = 256;


        analyser.smoothingTimeConstant = 0.7;


        microphoneSource =
            audioContext.createMediaStreamSource(
                microphoneStream
            );


        microphoneSource.connect(
            analyser
        );


        animateWaveform();


    } catch (error) {

        console.error(
            "Audio visualizer error:",
            error
        );

    }

}


/* =========================================================
   ANIMATE WAVEFORM
========================================================= */

function animateWaveform() {

    if (!analyser) {
        return;
    }


    const bufferLength =
        analyser.frequencyBinCount;


    const dataArray =
        new Uint8Array(bufferLength);


    const bars =
        waveform.querySelectorAll("span");


    function draw() {

        if (!isListening) {
            return;
        }


        animationFrame =
            requestAnimationFrame(draw);


        analyser.getByteFrequencyData(
            dataArray
        );


        /*
            Calculate average microphone volume.
        */

        let total = 0;

        for (let i = 0; i < dataArray.length; i++) {

            total += dataArray[i];

        }


        const average =
            total / dataArray.length;


        /*
            Convert microphone volume to
            a useful visual height.
        */

        const volume =
            Math.max(
                0.2,
                average / 100
            );


        bars.forEach((bar, index) => {

            const wave =
                Math.sin(
                    index * 0.8 +
                    Date.now() * 0.01
                );


            const height =
                20 +
                Math.abs(wave) *
                60 *
                volume;


            bar.style.height =
                `${height}px`;

        });

    }


    draw();

}


/* =========================================================
   STOP MICROPHONE VISUALIZER
========================================================= */

function stopMicrophoneVisualizer() {

    if (animationFrame) {

        cancelAnimationFrame(
            animationFrame
        );

        animationFrame = null;

    }


    /*
        Return waveform to CSS animation.
    */

    const bars =
        waveform.querySelectorAll("span");


    bars.forEach(bar => {

        bar.style.height = "";

    });


    /*
        Stop microphone tracks.
    */

    if (microphoneStream) {

        microphoneStream
            .getTracks()
            .forEach(track => {
                track.stop();
            });

        microphoneStream = null;

    }


    if (microphoneSource) {

        try {

            microphoneSource.disconnect();

        } catch (error) {

            console.warn(error);

        }

        microphoneSource = null;

    }


    analyser = null;

}


/* =========================================================
   PROCESS QUESTION
========================================================= */

async function processQuestion(question) {

    if (!question) {
        return;
    }


    isProcessing = true;


    /*
        Display user question.
    */

    userQuestion.textContent =
        question;


    /*
        Add to recent searches.
    */

    addRecentSearch(question);


    /*
        Show web searching state.
    */

    setSearchingState();


    try {

        /*
            Send question to Flask backend.
        */

        const response =
            await fetch("/api/ask", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    question: question
                })

            });


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        /*
            Backend response expected:

            {
                answer: "...",
                source: "...",
                url: "...",
                search_used: true
            }
        */


        if (data.search_used) {

            setWebSearchConnected();

        }


        /*
            Update source information.
        */

        if (data.source) {

            sourceName.textContent =
                data.source;

        }


        if (data.url) {

            sourceUrl.textContent =
                data.url;

        }


        /*
            Display answer.
        */

        const answer =
            data.answer ||
            "I couldn't find an answer.";


        setAnswerState(answer);


        /*
            Speak answer.
        */

        speakAnswer(answer);

    } catch (error) {

        console.error(
            "Backend error:",
            error
        );


        handleBackendError();

    }


    isProcessing = false;

}


/* =========================================================
   SPEECH SYNTHESIS
========================================================= */

function initializeSpeechSynthesis() {

    if (!("speechSynthesis" in window)) {

        console.warn(
            "Speech synthesis is not supported."
        );

    }

}


/* =========================================================
   SPEAK ANSWER
========================================================= */

function speakAnswer(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }


    /*
        Stop previous speech.
    */

    window.speechSynthesis.cancel();


    currentUtterance =
        new SpeechSynthesisUtterance(text);


    currentUtterance.lang =
        "en-IN";


    currentUtterance.rate =
        0.95;


    currentUtterance.pitch =
        1.0;


    currentUtterance.volume =
        1.0;


    currentUtterance.onstart = () => {

        isSpeaking = true;

        setSpeakingState();

    };


    currentUtterance.onend = () => {

        isSpeaking = false;

        setReadyState();

    };


    currentUtterance.onerror = (event) => {

        console.error(
            "Speech synthesis error:",
            event
        );


        isSpeaking = false;

        setReadyState();

    };


    window.speechSynthesis.speak(
        currentUtterance
    );

}


/* =========================================================
   STOP SPEAKING
========================================================= */

function stopSpeaking() {

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();

    }


    isSpeaking = false;

    currentUtterance = null;

}


/* =========================================================
   BUTTON INITIALIZATION
========================================================= */

function initializeButtons() {


    /* Microphone */

    microphoneButton.addEventListener(
        "click",
        () => {

            if (isListening) {

                stopListening();

            } else {

                startListening();

            }

        }
    );


    /* Keyboard */

    keyboardButton.addEventListener(
        "click",
        () => {

            showTextInput();

        }
    );


    /* Stop */

    stopButton.addEventListener(
        "click",
        () => {

            stopEverything();

        }
    );


    /* Send */

    sendButton.addEventListener(
        "click",
        () => {

            sendTextQuestion();

        }
    );

}


/* =========================================================
   TEXT INPUT
========================================================= */

function initializeKeyboard() {

    textInput.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                sendTextQuestion();

            }


            if (event.key === "Escape") {

                hideTextInput();

                stopEverything();

            }

        }
    );

}


/* =========================================================
   SEND TEXT QUESTION
========================================================= */

function sendTextQuestion() {

    const question =
        textInput.value.trim();


    if (!question) {
        return;
    }


    hideTextInput();


    textInput.value = "";


    processQuestion(question);

}


/* =========================================================
   SHOW TEXT INPUT
========================================================= */

function showTextInput() {

    textInputContainer.classList.add(
        "visible"
    );


    setTimeout(() => {

        textInput.focus();

    }, 100);

}


/* =========================================================
   HIDE TEXT INPUT
========================================================= */

function hideTextInput() {

    textInputContainer.classList.remove(
        "visible"
    );

}


/* =========================================================
   STOP EVERYTHING
========================================================= */

function stopEverything() {

    stopListening();

    stopSpeaking();

    stopMicrophoneVisualizer();

    isProcessing = false;

    app.classList.remove(
        "searching",
        "thinking"
    );


    assistantState.textContent =
        "Stopped";


    statusText.textContent =
        "READY";


    setTimeout(() => {

        setReadyState();

    }, 1200);

}


/* =========================================================
   UI STATES
========================================================= */


/* READY */

function setReadyState() {

    app.classList.remove(
        "searching",
        "thinking"
    );


    statusText.textContent =
        "READY";


    assistantState.textContent =
        "I'm ready";


    microphoneButton.classList.remove(
        "active"
    );

}


/* LISTENING */

function setListeningState() {

    app.classList.remove(
        "searching",
        "thinking"
    );


    statusText.textContent =
        "LISTENING";


    assistantState.textContent =
        "I'm listening";


    microphoneButton.classList.add(
        "active"
    );

}


/* SEARCHING */

function setSearchingState() {

    app.classList.remove(
        "thinking"
    );


    app.classList.add(
        "searching"
    );


    statusText.textContent =
        "SEARCHING";


    assistantState.textContent =
        "Searching the web...";


    searchMessage.textContent =
        "Searching for current information...";


    webStatus.textContent =
        "Searching";


    microphoneButton.classList.remove(
        "active"
    );

}


/* ANSWER / THINKING */

function setAnswerState(answer) {

    app.classList.remove(
        "searching"
    );


    app.classList.add(
        "thinking"
    );


    statusText.textContent =
        "MAGNUM";


    assistantState.textContent =
        "Thinking...";


    magnumAnswer.textContent =
        answer;

}


/* SPEAKING */

function setSpeakingState() {

    app.classList.remove(
        "searching",
        "thinking"
    );


    statusText.textContent =
        "SPEAKING";


    assistantState.textContent =
        "Magnum is speaking";

}


/* =========================================================
   WEB SEARCH STATUS
========================================================= */

function setWebSearchConnected() {

    webStatus.textContent =
        "Connected";


    webStatusDot.style.background =
        "#5eff96";


    webStatusDot.style.boxShadow =
        "0 0 10px rgba(94, 255, 150, 0.8)";


    searchMessage.textContent =
        "Web search completed";

}


/* =========================================================
   MICROPHONE ERROR
========================================================= */

function handleMicrophoneError(error) {

    statusText.textContent =
        "MIC ERROR";


    if (
        error.name ===
        "NotAllowedError"
    ) {

        assistantState.textContent =
            "Microphone permission denied";


        userQuestion.textContent =
            "Please allow microphone access in your browser.";

        return;

    }


    if (
        error.name ===
        "NotFoundError"
    ) {

        assistantState.textContent =
            "No microphone found";


        userQuestion.textContent =
            "Connect a microphone and try again.";

        return;

    }


    assistantState.textContent =
        "Microphone unavailable";

}


/* =========================================================
   SPEECH RECOGNITION ERROR
========================================================= */

function handleRecognitionError(error) {

    switch (error) {

        case "not-allowed":

            assistantState.textContent =
                "Microphone permission denied";

            break;


        case "no-speech":

            assistantState.textContent =
                "I didn't hear anything";

            break;


        case "audio-capture":

            assistantState.textContent =
                "Microphone unavailable";

            break;


        case "network":

            assistantState.textContent =
                "Speech recognition network error";

            break;


        case "aborted":

            assistantState.textContent =
                "Listening stopped";

            break;


        default:

            assistantState.textContent =
                "Voice recognition error";

    }


    statusText.textContent =
        "READY";


    microphoneButton.classList.remove(
        "active"
    );


    setTimeout(() => {

        setReadyState();

    }, 2000);

}


/* =========================================================
   BACKEND ERROR
========================================================= */

function handleBackendError() {

    app.classList.remove(
        "searching",
        "thinking"
    );


    statusText.textContent =
        "ERROR";


    assistantState.textContent =
        "Connection problem";


    magnumAnswer.textContent =
        "I couldn't connect to Magnum's backend. Make sure the Flask server is running.";


    searchMessage.textContent =
        "Backend unavailable";


    webStatus.textContent =
        "Offline";


    webStatusDot.style.background =
        "#ff5c6c";


    webStatusDot.style.boxShadow =
        "0 0 10px rgba(255, 92, 108, 0.8)";


    setTimeout(() => {

        setReadyState();

    }, 4000);

}


/* =========================================================
   RECENT SEARCHES
========================================================= */

function loadRecentSearches() {

    let searches = [];


    try {

        searches =
            JSON.parse(
                localStorage.getItem(
                    "magnumRecentSearches"
                )
            ) || [];

    } catch (error) {

        console.warn(
            "Could not load recent searches."
        );

    }


    renderRecentSearches(
        searches
    );

}


/* =========================================================
   ADD RECENT SEARCH
========================================================= */

function addRecentSearch(query) {

    let searches = [];


    try {

        searches =
            JSON.parse(
                localStorage.getItem(
                    "magnumRecentSearches"
                )
            ) || [];

    } catch (error) {

        searches = [];

    }


    /*
        Remove duplicate.
    */

    searches =
        searches.filter(
            item => item !== query
        );


    /*
        Add newest search to beginning.
    */

    searches.unshift(query);


    /*
        Keep only last 5.
    */

    searches =
        searches.slice(0, 5);


    localStorage.setItem(
        "magnumRecentSearches",
        JSON.stringify(searches)
    );


    renderRecentSearches(
        searches
    );

}


/* =========================================================
   RENDER RECENT SEARCHES
========================================================= */

function renderRecentSearches(searches) {

    recentSearches.innerHTML = "";


    if (!searches.length) {

        const empty =
            document.createElement("div");


        empty.className =
            "empty-search";


        empty.textContent =
            "No recent searches";


        recentSearches.appendChild(
            empty
        );


        return;

    }


    searches.forEach(
        search => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "recent-item";


            item.textContent =
                search;


            item.title =
                search;


            /*
                Clicking a previous search
                runs it again.
            */

            item.addEventListener(
                "click",
                () => {

                    processQuestion(
                        search
                    );

                }
            );


            recentSearches.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   GLOBAL KEYBOARD SHORTCUTS
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {


        /*
            Escape = stop everything
        */

        if (event.key === "Escape") {

            stopEverything();

            return;

        }


        /*
            Spacebar = microphone

            Only trigger if the user
            isn't typing into an input.
        */

        if (
            event.code === "Space" &&
            document.activeElement !== textInput
        ) {

            event.preventDefault();


            if (!isListening) {

                startListening();

            } else {

                stopListening();

            }

        }

    }
);


/* =========================================================
   PAGE VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        /*
            Stop microphone if user
            changes browser tab.
        */

        if (
            document.hidden &&
            isListening
        ) {

            stopListening();

        }

    }
);


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopListening();

        stopSpeaking();

        stopMicrophoneVisualizer();

    }
);