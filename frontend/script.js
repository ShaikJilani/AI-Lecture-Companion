const API_URL = "http://127.0.0.1:8000";

// Application state
let currentLecture = null;
let selectedVideo = null;
let selectedSlides = null;


// ========================================
// 1. GET HTML ELEMENTS
// ========================================

const videoInput = document.getElementById("videoInput");
const slidesInput = document.getElementById("slidesInput");

const videoDropzone = document.getElementById("videoDropzone");
const slidesDropzone = document.getElementById("slidesDropzone");

const videoFileName = document.getElementById("videoFileName");
const slidesFileName = document.getElementById("slidesFileName");

const processButton = document.getElementById("processButton");

const processingStatus = document.getElementById("processingStatus");
const processingTitle = document.getElementById("processingTitle");
const processingMessage = document.getElementById("processingMessage");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const loadingSpinner = document.getElementById("loadingSpinner");

const errorMessage = document.getElementById("errorMessage");

const resultsSection = document.getElementById("resultsSection");
const transcriptContent = document.getElementById("transcriptContent");
const slidesContent = document.getElementById("slidesContent");
const notesContent = document.getElementById("notesContent");

const lectureHistory = document.getElementById("lectureHistory");


// ========================================
// 2. HELPER FUNCTIONS
// ========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
}


function clearError() {
    errorMessage.textContent = "";
    errorMessage.hidden = true;
}


function setProgress(percent, title, message) {
    processingStatus.hidden = false;

    processingTitle.textContent = title;
    processingMessage.textContent = message;

    progressFill.style.width = `${percent}%`;
    progressLabel.textContent = `${percent}% complete`;
}


function formatTime(seconds) {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));

    const minutes = Math.floor(value / 60);
    const remainingSeconds = value % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}


function formatDate(value) {
    if (!value) {
        return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString();
}


// ========================================
// 3. FILE SELECTION
// ========================================

function updateSelectedFile(input, display, type) {
    const file = input.files[0];

    if (!file) {
        return;
    }

    if (type === "video") {
        const extension = file.name.split(".").pop().toLowerCase();

        if (!["mp4", "mov", "mkv"].includes(extension)) {
            showError("Please select an MP4, MOV, or MKV video.");
            input.value = "";
            return;
        }

        selectedVideo = file;

    } else {
        const extension = file.name.split(".").pop().toLowerCase();

        if (extension !== "pdf") {
            showError("Please select a PDF slide file.");
            input.value = "";
            return;
        }

        selectedSlides = file;
    }

    clearError();

    display.textContent = `${file.name} (${(
        file.size / (1024 * 1024)
    ).toFixed(2)} MB)`;

    display.classList.add("has-file");
}


videoInput.addEventListener("change", () => {
    updateSelectedFile(videoInput, videoFileName, "video");
});


slidesInput.addEventListener("change", () => {
    updateSelectedFile(slidesInput, slidesFileName, "slides");
});


document.getElementById("chooseVideoButton").addEventListener(
    "click",
    () => videoInput.click()
);


document.getElementById("chooseSlidesButton").addEventListener(
    "click",
    () => slidesInput.click()
);


// ========================================
// 4. DRAG AND DROP
// ========================================

function setupDropzone(zone, input, display, type) {
    ["dragenter", "dragover"].forEach(eventName => {
        zone.addEventListener(eventName, event => {
            event.preventDefault();
            zone.classList.add("drag-over");
        });
    });

    ["dragleave", "drop"].forEach(eventName => {
        zone.addEventListener(eventName, event => {
            event.preventDefault();
            zone.classList.remove("drag-over");
        });
    });

    zone.addEventListener("drop", event => {
        const file = event.dataTransfer.files[0];

        if (!file) {
            return;
        }

        const extension = file.name.split(".").pop().toLowerCase();

        const valid = type === "video"
            ? ["mp4", "mov", "mkv"].includes(extension)
            : extension === "pdf";

        if (!valid) {
            showError(
                type === "video"
                    ? "Drop an MP4, MOV, or MKV video."
                    : "Drop a PDF slide file."
            );
            return;
        }

        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;

        updateSelectedFile(input, display, type);
    });
}


setupDropzone(
    videoDropzone,
    videoInput,
    videoFileName,
    "video"
);

setupDropzone(
    slidesDropzone,
    slidesInput,
    slidesFileName,
    "slides"
);


// ========================================
// 5. NAVIGATION
// ========================================

const navigationTitles = {
    dashboard: "My Lectures",
    upload: "Upload Lecture",
    history: "Lecture History",
    notes: "Study Notes"
};


document.querySelectorAll(".nav-item[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".nav-item[data-page]").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        const page = button.dataset.page;

        document.getElementById("breadcrumbCurrent").textContent =
            navigationTitles[page] || "My Lectures";

        if (page === "upload") {
            document.getElementById("uploadSection").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        } else if (page === "history") {
            document.getElementById("historySection").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        } else if (page === "notes" && currentLecture) {
            resultsSection.hidden = false;

            activateResultTab("notes");

            resultsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        } else {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    });
});


document.getElementById("newLectureButton").addEventListener(
    "click",
    () => {
        document.getElementById("uploadSection").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
);


document.getElementById("settingsButton").addEventListener(
    "click",
    () => {
        alert(
            "Settings are not implemented yet. " +
            "Your lecture processing features remain available."
        );
    }
);


document.getElementById("profileButton").addEventListener(
    "click",
    () => {
        alert("This project does not have user accounts yet.");
    }
);


// ========================================
// 6. PROCESS LECTURE
// ========================================

processButton.addEventListener("click", processLecture);


async function processLecture() {
    clearError();

    if (!selectedVideo || !selectedSlides) {
        showError(
            "Please select both a lecture video and its PDF slides."
        );
        return;
    }

    processButton.disabled = true;
    processButton.textContent = "Processing...";

    resultsSection.hidden = true;

    setProgress(
        5,
        "Connecting to backend...",
        "Preparing your lecture files."
    );

    const formData = new FormData();

    formData.append("video", selectedVideo);
    formData.append("slides", selectedSlides);

    let progressTimer = null;

    try {
        // This is an estimated progress indicator.
        // The current backend does not report individual processing stages.
        let estimatedProgress = 5;

        progressTimer = setInterval(() => {
            estimatedProgress = Math.min(
                estimatedProgress + 1,
                90
            );

            progressFill.style.width = `${estimatedProgress}%`;
            progressLabel.textContent =
                `${estimatedProgress}% — processing`;

            if (estimatedProgress < 25) {
                processingTitle.textContent = "Transcribing lecture...";
                processingMessage.textContent =
                    "Faster-Whisper is analyzing the audio.";
            } else if (estimatedProgress < 45) {
                processingTitle.textContent = "Extracting slides...";
                processingMessage.textContent =
                    "Reading your PDF presentation.";
            } else if (estimatedProgress < 65) {
                processingTitle.textContent = "Synchronizing content...";
                processingMessage.textContent =
                    "Matching transcript segments with slides.";
            } else {
                processingTitle.textContent = "Generating AI notes...";
                processingMessage.textContent =
                    "Gemini is preparing your study notes.";
            }
        }, 1500);

        const response = await fetch(`${API_URL}/api/process`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "Lecture processing failed."
            );
        }

        currentLecture = data;
clearGeneratedContent();

        clearInterval(progressTimer);
        progressTimer = null;

        setProgress(
            100,
            "Lecture processed successfully!",
            "Your transcript and AI study notes are ready."
        );

        loadingSpinner.classList.add("complete");

        renderLecture(data);

        await loadLectureHistory();

        resultsSection.hidden = false;

        resultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        if (progressTimer) {
            clearInterval(progressTimer);
        }

        loadingSpinner.classList.remove("complete");

        setProgress(
            0,
            "Processing failed",
            "Please check the error message below."
        );

        showError(
            `Could not process lecture: ${error.message}. ` +
            "Make sure FastAPI is running."
        );

    } finally {
        processButton.disabled = false;
        processButton.innerHTML = "<span>✦</span> Process Lecture";
    }
}


// ========================================
// 7. DISPLAY LECTURE RESULTS
// ========================================

function renderLecture(data) {
    document.getElementById("resultLectureTitle").textContent =
        data.title || "Your Lecture";

    document.getElementById("resultLanguage").textContent =
        data.language || "Unknown";

    document.getElementById("resultSegmentCount").textContent =
        (data.transcript || []).length;

    document.getElementById("resultSlideCount").textContent =
        data.slide_count ?? 0;

    document.getElementById("resultProcessingTime").textContent =
        `${data.processing_time ?? 0} sec`;

    document.getElementById("totalSegments").textContent =
        (data.transcript || []).length;

    document.getElementById("totalNotes").textContent = "1";

    renderTranscript(data.transcript || []);
    renderSlides(data);
    renderNotes(data.notes || "No notes were returned.");

    activateResultTab("transcript");
}


// ========================================
// 8. DISPLAY TRANSCRIPT
// ========================================

function renderTranscript(segments) {
    if (!segments.length) {
        transcriptContent.innerHTML =
            '<p class="empty-state">No transcript segments were generated.</p>';

        return;
    }

    transcriptContent.innerHTML = segments.map(segment => {
        const start = Number(segment.start) || 0;
        const end = Number(segment.end) || 0;

        const slideNumber = segment.slide_number;

        const slideLabel = slideNumber !== null &&
            slideNumber !== undefined
            ? `Slide ${escapeHTML(slideNumber)}`
            : "No matching slide detected";

        return `
            <div class="transcript-item">
                <div class="transcript-time">
                    ${formatTime(start)}
                </div>

                <div>
                    <p class="transcript-text">
                        ${escapeHTML(segment.text)}
                    </p>

                    <span class="transcript-slide">
                        ${slideLabel}
                        · ${formatTime(end)}
                    </span>
                </div>
            </div>
        `;
    }).join("");
}


// ========================================
// 9. DISPLAY SLIDES
// ========================================


function renderSlides(data) {
    const count = Number(data.slide_count) || 0;
    const slides = data.slides || [];

    if (!count || !slides.length) {
        slidesContent.innerHTML = `
            <p class="empty-state">
                No slide images are available.
                Please process the lecture again.
            </p>
        `;
        return;
    }

    slidesContent.innerHTML = `
        <div class="slides-gallery">
            ${slides.map(slide => {
                const imageUrl =
                    `${API_URL}${slide.image_url}`;

                return `
                    <div class="slide-card">
                        <h3>Slide ${slide.slide_number}</h3>

                        <img
                            src="${imageUrl}"
                            alt="Lecture slide ${slide.slide_number}"
                            class="lecture-slide-image"
                            loading="lazy"
                        />
                    </div>
                `;
            }).join("")}
        </div>
    `;
}



// ========================================
// 10. DISPLAY AI NOTES
// ========================================

// Converts basic Markdown into HTML.
// HTML characters are escaped before formatting.
function markdownToHTML(markdown) {
    let html = escapeHTML(markdown);

    html = html.replace(
        /^### (.+)$/gm,
        "<h3>$1</h3>"
    );

    html = html.replace(
        /^## (.+)$/gm,
        "<h2>$1</h2>"
    );

    html = html.replace(
        /^# (.+)$/gm,
        "<h1>$1</h1>"
    );

    html = html.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
    );  

    html = html.replace(
        /\*(.+?)\*/g,
        "<em>$1</em>"
    );

    html = html.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    html = html.replace(
        /^- (.+)$/gm,
        "<li>$1</li>"
    );

    html = html.replace(
        /(<li>.*<\/li>\n?)+/g,
        match => `<ul>${match}</ul>`
    );

    html = html.replace(/\n{2,}/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");

    return `<p>${html}</p>`;
}


function renderNotes(notes) {
    notesContent.innerHTML = markdownToHTML(notes);
}

function renderGeneratedContent(actionName, content) {
    let generatedContent = document.getElementById("generatedContent");

    if (!generatedContent) {
        generatedContent = document.createElement("div");
        generatedContent.id = "generatedContent";
        generatedContent.className = "generated-content";

        notesContent.parentNode.insertBefore(
            generatedContent,
            notesContent.nextSibling
        );
    }

    generatedContent.innerHTML = `
        <hr>
        <h2>${escapeHTML(actionName)}</h2>
        ${markdownToHTML(content)}
    `;
}

function clearGeneratedContent() {
    const generatedContent = document.getElementById("generatedContent");

    if (generatedContent) {
        generatedContent.remove();
    }
}



// ========================================
// 11. TRANSCRIPT SEARCH
// ========================================

document.getElementById("transcriptSearch").addEventListener(
    "input",
    event => {
        if (!currentLecture) {
            return;
        }

        const query = event.target.value.toLowerCase().trim();

        const filtered = (currentLecture.transcript || []).filter(
            segment => String(segment.text || "")
                .toLowerCase()
                .includes(query)
        );

        renderTranscript(filtered);
    }
);


// ========================================
// 12. RESULT TABS
// ========================================

function activateResultTab(tabName) {
    document.querySelectorAll(".result-tab").forEach(button => {
        const active = button.dataset.tab === tabName;

        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
    });

    document.querySelectorAll(".result-panel").forEach(panel => {
        panel.hidden = true;
        panel.classList.remove("active");
    });

    const selectedPanel = document.getElementById(
        `${tabName}Panel`
    );

    if (selectedPanel) {
        selectedPanel.hidden = false;
        selectedPanel.classList.add("active");
    }
}


document.querySelectorAll(".result-tab").forEach(button => {
    button.addEventListener("click", () => {
        activateResultTab(button.dataset.tab);
    });
});




// ========================================
// 13. DOWNLOAD NOTES
// ========================================

async function downloadNotes() {
    if (!currentLecture || !currentLecture.notes) {
        alert("No lecture notes available to download.");
        return;
    }

    const formattedNotes = markdownToHTML(currentLecture.notes);
    const container = document.createElement("div");

    container.style.cssText = `
        background: white;
        color: #222;
        padding: 30px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.7;
    `;

    container.innerHTML = formattedNotes;

    container.querySelectorAll("h1, h2, h3").forEach(heading => {
        heading.style.color = "#176b45";
    });

    document.body.appendChild(container);

    try {
        await html2pdf()
            .set({
                margin: 12,
                filename: "lecture_notes.pdf",
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    backgroundColor: "#ffffff"
                },
                jsPDF: {
                    unit: "mm",
                    format: "a4",
                    orientation: "portrait"
                },
                pagebreak: {
                    mode: ["css", "legacy"]
                }
            })
            .from(container)
            .save();
    } catch (error) {
        console.error("PDF download failed:", error);
        alert("PDF download failed. Check the browser console.");
    } finally {
        container.remove();
    }
}

const downloadNotesButton = document.getElementById("downloadNotesButton");

if (downloadNotesButton) {
    downloadNotesButton.addEventListener("click", downloadNotes);
}

// ========================================
// 14. LOAD SAVED LECTURES
// ========================================

async function loadLectureHistory() {
    try {
        const response = await fetch(`${API_URL}/api/lectures`);

        if (!response.ok) {
            throw new Error("Could not retrieve lecture history.");
        }

        const data = await response.json();
        const lectures = data.lectures || [];

        document.getElementById("totalLectures").textContent =
            lectures.length;

        if (!lectures.length) {
            lectureHistory.innerHTML = `
                <div class="empty-history">
                    <div class="empty-history-icon">▤</div>
                    <h3>No lectures yet</h3>
                    <p>Your processed lectures will appear here.</p>
                </div>
            `;
            return;
        }

        lectureHistory.innerHTML = lectures.map(lecture => `
            <div class="lecture-history-item">
                <div class="history-icon">▤</div>

                <div class="lecture-history-details">
                    <h3>${escapeHTML(lecture.title)}</h3>
                    <p>${escapeHTML(formatDate(lecture.created_at))}</p>
                </div>

                <div class="lecture-history-buttons">
                    <button
                        class="view-lecture-button"
                        type="button"
                        data-view-id="${lecture.id}">
                        View
                    </button>

                    <button
                        class="delete-lecture-button"
                        type="button"
                        data-delete-id="${lecture.id}">
                        Delete
                    </button>
                </div>
            </div>
        `).join("");

    } catch (error) {
        lectureHistory.innerHTML = `
            <div class="empty-history">
                <h3>Could not load lecture history</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
    }
}


// ========================================
// 15. AI ASSISTANT PLACEHOLDER
// ========================================

const chatMessages = document.getElementById("chatMessages");


function addChatMessage(message, sender) {
    const wrapper = document.createElement("div");

    wrapper.className = sender === "user"
        ? "chat-message user-message"
        : "chat-message assistant-message";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = sender === "user" ? "P" : "✦";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const paragraph = document.createElement("div");

    if (sender === "assistant") {
        paragraph.innerHTML = markdownToHTML(message);
    } else {
        paragraph.textContent = message;
    }

    bubble.appendChild(paragraph);
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);

    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}




document.getElementById("chatForm").addEventListener(
    "submit",
    async event => {
        event.preventDefault();

        const input = document.getElementById("chatInput");
        const message = input.value.trim();

        if (!message) {
            return;
        }

        if (!currentLecture || !currentLecture.transcript) {
            addChatMessage(
                "Please process a lecture before asking questions.",
                "assistant"
            );
            return;
        }

        const transcript = Array.isArray(currentLecture.transcript)
            ? currentLecture.transcript
                .map(segment => segment.text || "")
                .join(" ")
            : currentLecture.transcript;

        if (!transcript.trim()) {
            addChatMessage(
                "No lecture transcript is available. Please process the lecture again.",
                "assistant"
            );
            return;
        }

        addChatMessage(message, "user");
        input.value = "";

        const sendButton = document.querySelector(
            '#chatForm button[type="submit"]'
        );

        if (sendButton) {
            sendButton.disabled = true;
        }

        try {
            addChatMessage("Thinking...", "assistant");

            const response = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    transcript: transcript,
                    question: message
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Could not get an answer from Gemini."
                );
            }

            addChatMessage(data.answer, "assistant");

        } catch (error) {
            console.error("Lecture chat error:", error);

            addChatMessage(
                "Sorry, I couldn't answer your question: " + error.message,
                "assistant"
            );
        } finally {
            if (sendButton) {
                sendButton.disabled = false;
            }
        }
    }
);


document.getElementById("clearChatButton").addEventListener(
    "click",
    () => {
        chatMessages.innerHTML = "";

        addChatMessage(
            "Chat cleared. Process a lecture to get started.",
            "assistant"
        );
    }
);


document.querySelectorAll(".action-card").forEach(button => {
    button.addEventListener("click", async () => {
        const action = button.dataset.action;

        const actionNames = {
            summarize: "Summarize",
            flashcards: "Flashcards",
            quiz: "Generate Quiz",
            "study-guide": "Study Guide",
            "key-terms": "Explain Key Terms"
        };

        const actionName = actionNames[action] || "Learning Material";

        if (!currentLecture) {
            addChatMessage(
                "Please process a lecture before using " + actionName + ".",
                "assistant"
            );
            return;
        }

        if (action === "summarize") {
            resultsSection.hidden = false;
            activateResultTab("notes");

            resultsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            addChatMessage(
                "Your lecture summary is available in the AI Study Notes tab.",
                "assistant"
            );

            return;
        }

        const transcript = (currentLecture.transcript || [])
            .map(segment => segment.text || "")
            .join(" ");

        if (!transcript.trim()) {
            addChatMessage(
                "No transcript is available. Please process the lecture again.",
                "assistant"
            );
            return;
        }

        button.disabled = true;
        const originalText = button.innerHTML;

        try {
            button.innerHTML = "Generating...";

            addChatMessage(
                "Generating your " + actionName + ". Please wait...",
                "assistant"
            );

            const response = await fetch(`${API_URL}/api/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    transcript: transcript,
                    material_type: action
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Could not generate learning material."
                );
            }

            // Keep the original lecture notes unchanged.
// Display generated learning materials in a separate area.

let generatedContent = document.getElementById("generatedContent");

if (!generatedContent) {
    generatedContent = document.createElement("div");
    generatedContent.id = "generatedContent";
    generatedContent.className = "generated-content";

    notesContent.parentNode.insertBefore(
        generatedContent,
        notesContent.nextSibling
    );
}
generatedContent.innerHTML = `
    <hr>
    <h2>${escapeHTML(actionName)}</h2>
    ${markdownToHTML(data.content)}
`;

resultsSection.hidden = false;
activateResultTab("notes");

resultsSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
});

generatedContent.innerHTML = `
    <hr>
    <h2>${escapeHTML(actionName)}</h2>
    ${markdownToHTML(data.content)}
`;

resultsSection.hidden = false;
activateResultTab("notes");

resultsSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
});

            addChatMessage(
                actionName + " generated successfully! Check the AI Study Notes tab.",
                "assistant"
            );

        } catch (error) {
            console.error("Generation error:", error);

            addChatMessage(
                "Error: " + error.message,
                "assistant"
            );

        } finally {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    });
});


// ========================================
// 16. REFRESH HISTORY
// ========================================

document.getElementById("refreshHistoryButton").addEventListener(
    "click",
    loadLectureHistory
);


// ========================================
// 17. INITIALIZE DASHBOARD
// ========================================

async function initializeDashboard() {
    try {
        const response = await fetch(`${API_URL}/api/health`);

        if (!response.ok) {
            throw new Error("Backend health check failed.");
        }

        const data = await response.json();

        console.log("Backend connected:", data.message);

    } catch (error) {
        showError(
            "The Python backend is not reachable. Start it using: " +
            "python -m uvicorn api:app --reload --port 8000"
        );
    }

    await loadLectureHistory();
}


initializeDashboard();
lectureHistory.addEventListener("click", async (event) => {
    const viewButton = event.target.closest("[data-view-id]");
    const deleteButton = event.target.closest("[data-delete-id]");


if (viewButton) {
    const lectureId = viewButton.dataset.viewId;

    try {
        viewButton.disabled = true;
        viewButton.textContent = "Loading...";

        const response = await fetch(
            `${API_URL}/api/lectures/${lectureId}`
        );

        if (!response.ok) {
            throw new Error("Could not load this lecture.");
        }

        const lecture = await response.json();

        // Convert saved transcript JSON into readable text
        let transcript = lecture.transcript || "";

        try {
            const parsedTranscript = JSON.parse(transcript);

            if (Array.isArray(parsedTranscript)) {
                transcript = parsedTranscript
                    .map(segment => segment.text || "")
                    .filter(text => text.trim() !== "")
                    .join(" ");

            } else if (
                parsedTranscript &&
                Array.isArray(parsedTranscript.segments)
            ) {
                transcript = parsedTranscript.segments
                    .map(segment => segment.text || "")
                    .filter(text => text.trim() !== "")
                    .join(" ");
            }
        } catch (error) {
            // The transcript is already plain text.
        }

        // Update lecture title
        const titleElement = document.getElementById(
            "resultLectureTitle"
        );

        if (titleElement) {
            titleElement.textContent = lecture.title || "Saved Lecture";
        }

// Display transcript and restore the original lecture notes.
transcriptContent.textContent =
    transcript || "No transcript saved.";

renderNotes(lecture.notes || "No notes saved.");

// Clear generated materials from the previously viewed lecture.
clearGeneratedContent();


        // IMPORTANT: Make the hidden results section visible
        resultsSection.hidden = false;

        // Open the Transcript tab
        activateResultTab("transcript");

        // Update the current lecture for other features
     // Convert the transcript into segments for AI features
let transcriptSegments = [];

if (Array.isArray(lecture.transcript)) {
    transcriptSegments = lecture.transcript;
} else if (typeof lecture.transcript === "string") {
    try {
        const parsedTranscript = JSON.parse(lecture.transcript);

        if (Array.isArray(parsedTranscript)) {
            transcriptSegments = parsedTranscript;
        } else if (Array.isArray(parsedTranscript?.segments)) {
            transcriptSegments = parsedTranscript.segments;
        } else {
            transcriptSegments = [{
                text: transcript,
                start: 0,
                end: 0
            }];
        }
    } catch {
        if (transcript.trim()) {
            transcriptSegments = [{
                text: transcript,
                start: 0,
                end: 0
            }];
        }
    }
}

// Update the current lecture for other features
currentLecture = {
    id: lecture.id,
    title: lecture.title,
    transcript: transcriptSegments,
    notes: lecture.notes || ""
};

        // Scroll to the displayed lecture
        resultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        console.error("View lecture error:", error);
        alert(error.message);

    } finally {
        viewButton.disabled = false;
        viewButton.textContent = "View";
    }
}

    if (deleteButton) {
        const lectureId = deleteButton.dataset.deleteId;

        const confirmed = confirm(
            "Are you sure you want to delete this lecture?"
        );

        if (!confirmed) return;

        try {
            deleteButton.disabled = true;
            deleteButton.textContent = "Deleting...";

            const response = await fetch(
                `${API_URL}/api/lectures/${lectureId}`,
                { method: "DELETE" }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.detail || "Could not delete this lecture."
                );
            }

            await loadLectureHistory();

            alert("Lecture deleted successfully.");

        } catch (error) {
            alert(error.message);
            await loadLectureHistory();
        }
    }
});
const refreshHistoryButton =
    document.getElementById("refreshHistoryButton");

const clearAllLecturesButton =
    document.getElementById("clearAllLecturesButton");

if (refreshHistoryButton) {
    refreshHistoryButton.addEventListener("click", async () => {
        refreshHistoryButton.disabled = true;

        try {
            await loadLectureHistory();
        } finally {
            refreshHistoryButton.disabled = false;
        }
    });
}

if (clearAllLecturesButton) {
    clearAllLecturesButton.addEventListener("click", async () => {
        const confirmed = confirm(
            "Are you sure you want to delete ALL saved lectures? This cannot be undone."
        );

        if (!confirmed) return;

        clearAllLecturesButton.disabled = true;

        try {
            const response = await fetch(`${API_URL}/api/lectures`, {
                method: "DELETE"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.detail || "Could not clear lecture history."
                );
            }

            await loadLectureHistory();

            alert("All saved lectures have been deleted.");

        } catch (error) {
            alert(error.message);
        } finally {
            clearAllLecturesButton.disabled = false;
        }
    });
}
document.getElementById("downloadNotesButton")
    .addEventListener("click", downloadNotes);