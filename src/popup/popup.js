chrome.storage.sync.get("currentSide", (response) => {
    if (response.currentSide === undefined) {
        chrome.storage.sync.set({ currentSide: "left" })
        document.querySelector(".arrow-left").style.display = "none";
        document.querySelector(".arrow-right").style.display = "block";
        document.querySelector(".timers-box").style.display = "flex";
        document.querySelector(".daily-box").style.display = "none";
    }
    
    if (response.currentSide === "right") {
        document.querySelector(".arrow-left").style.display = "none";
        document.querySelector(".arrow-right").style.display = "block";
        document.querySelector(".timers-box").style.display = "flex";
        document.querySelector(".daily-box").style.display = "none";
    }

    if (response.currentSide === "left") {
        document.querySelector(".arrow-right").style.display = "none";
        document.querySelector(".arrow-left").style.display = "block";
        document.querySelector(".timers-box").style.display = "none";
        document.querySelector(".daily-box").style.display = "flex";
    }
})

document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get("username", (response) => {
        if (response.username === undefined) {
            alert("Username not set! Set the username by starting a timer in a ticket.")
        } 
    })
    
    chrome.storage.local.get(null, (result) => {
        const allKeys = Object.keys(result);
        if (allKeys.length > 0) {
            document.querySelector(".timers-title").textContent = `Active Timers (${allKeys.length})`
        }
        if (allKeys.length > 0) {
            allKeys.forEach((key) => {
                const data = result[key];
                document.querySelector('.timers-display').insertAdjacentHTML("beforeend", `
                 <div class="timer" id="${key}">
                    <span class="ticket-id">${key}</span>
                    <span class="ticket-title">${data.title}</span>
                    <span class="timer-duration">${updateTimerDisplay(data.timer)}</span>
                </div>
            `);

                const timerInterval = setInterval(() => {
                    const timerDurationElement = document.getElementById(key);
                    if (timerDurationElement) {
                        timerDurationElement.querySelector('.timer-duration').textContent = updateTimerDisplay(data.timer);
                    } else {
                        clearInterval(timerInterval);
                    }
                }, 1000);
            })
        }
    });

    chrome.runtime.sendMessage('get-user-data', (response) => {
        if (response !== null) {
            response.forEach((ticket) => {
                if (document.getElementById(ticket.id) !== null) {
                    document.getElementById(ticket.id).querySelector(".timer-duration").textContent = addTimes(document.getElementById(ticket.id).querySelector(".timer-duration").textContent, ticket.time);
                } else {
                    document.querySelector(".daily-display").insertAdjacentHTML("beforeend", `
                 <div class="daily" data-custom="false" data-id="${ticket.id}" id="${ticket.id}">
                    <span class="ticket-id">${ticket.id}</span>
                    <span class="ticket-title">${ticket.title}</span>
                    <span class="timer-duration">${ticket.time}</span>
                </div>
            `);
                }
            })

            document.querySelectorAll("[data-custom=\"false\"]").forEach((element) => {
                element.addEventListener("click", (event) => {
                    oldId = event.target.closest(".daily").dataset.id;
                    document.querySelector(".arrow-left").style.display = "none";
                    document.querySelector(".arrow-right").style.display = "none";
                    document.querySelector(".timers-box").style.display = "none";
                    document.querySelector(".daily-box").style.display = "none";
                    document.querySelector(".new-entry-box").style.display = "flex";
                    document.querySelector(".confirm").style.display = "none";
                    document.querySelector(".confirm-edit").style.display = "block";
                    document.querySelector(".calendar-box").style.display = "none";
                    document.querySelector(".delete").style.display = "block";

                    document.querySelector(".new-id-input").value = element.querySelector(".ticket-id").textContent;
                    document.querySelector(".new-id-input").readOnly = true;
                    document.querySelector(".new-title-input").value = element.querySelector(".ticket-title").textContent;
                    document.querySelector(".new-time-input").value = element.querySelector(".timer-duration").textContent;
                    document.querySelector(".new-time-input").readOnly = true;
                })
            })
        }
        
        if (document.querySelectorAll(".daily").length > 0) {
            document.querySelector(".daily-title").textContent = `Today's Bookings (${document.querySelectorAll(".daily").length})`
        }
    });
    
    let oldId;
    
    chrome.runtime.sendMessage("get-custom-object", (response) => {
        if (response !== null) {
            response.forEach((data) => {
                document.querySelector('.daily-display').insertAdjacentHTML("beforeend", `
                 <div class="daily" data-custom="true" data-id="${data.id}" id="${data.id}">
                    <span class="ticket-id">${data.id}</span>
                    <span class="ticket-title">${data.title}</span>
                    <span class="timer-duration">${data.customTime}</span>
                </div>
            `)
            })

            if (document.querySelectorAll(".daily").length > 0) {
                document.querySelector(".daily-title").textContent = `Today's Bookings (${document.querySelectorAll(".daily").length})`
            }
            
            document.querySelectorAll("[data-custom=\"true\"]").forEach((element) => {
                element.addEventListener("click", (event) => {
                    oldId = event.target.closest(".daily").dataset.id;
                    document.querySelector(".arrow-left").style.display = "none";
                    document.querySelector(".arrow-right").style.display = "none";
                    document.querySelector(".timers-box").style.display = "none";
                    document.querySelector(".daily-box").style.display = "none";
                    document.querySelector(".new-entry-box").style.display = "flex";
                    document.querySelector(".confirm").style.display = "none";
                    document.querySelector(".confirm-edit-custom").style.display = "block";
                    document.querySelector(".calendar-box").style.display = "none";
                    document.querySelector(".delete").style.display = "block";
                    
                    document.querySelector(".new-id-input").value = element.querySelector(".ticket-id").textContent;
                    document.querySelector(".new-title-input").value = element.querySelector(".ticket-title").textContent;
                    document.querySelector(".new-time-input").value = element.querySelector(".timer-duration").textContent;
                })
            })
        }
    })
    
    const dateInput = document.getElementById("datepicker");

    dateInput.addEventListener("change", () => {
        const selectedDate = dateInput.value;

        chrome.tabs.create({ url: "selected_date.html?date=" + encodeURIComponent(selectedDate) });
    });
    
    function timeToSeconds(time) {
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }

    function secondsToTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        return `${padZero(hours)}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
    }

    function padZero(number) {
        return number < 10 ? `0${number}` : `${number}`;
    }

    function addTimes(time1, time2) {
        // Convert time to seconds
        const seconds1 = timeToSeconds(time1);
        const seconds2 = timeToSeconds(time2);

        // Add the seconds
        const totalSeconds = seconds1 + seconds2;

        // Convert total seconds back to time format
        const result = secondsToTime(totalSeconds);

        return result;
    }

    document.querySelector(".arrow-right").addEventListener("click", () => {
        document.querySelector(".arrow-right").style.display = "none";
        document.querySelector(".arrow-left").style.display = "block";
        document.querySelector(".timers-box").style.display = "none";
        document.querySelector(".daily-box").style.display = "flex";
        chrome.storage.sync.set({ currentSide: "left" })
    })

    document.querySelector(".arrow-left").addEventListener("click", () => {
        document.querySelector(".arrow-left").style.display = "none";
        document.querySelector(".arrow-right").style.display = "block";
        document.querySelector(".timers-box").style.display = "flex";
        document.querySelector(".daily-box").style.display = "none";
        chrome.storage.sync.set({ currentSide: "right" })
    })

    document.querySelector(".new-entry").addEventListener("click", () => {
        document.querySelector(".arrow-left").style.display = "none";
        document.querySelector(".arrow-right").style.display = "none";
        document.querySelector(".timers-box").style.display = "none";
        document.querySelector(".daily-box").style.display = "none";
        document.querySelector(".new-entry-box").style.display = "flex";
        document.querySelector(".calendar-box").style.display = "none";
    })
    
    document.querySelector(".confirm").addEventListener("click", () => {
        let data = {};
        data.id = document.querySelector(".new-id-input").value;
        data.title = document.querySelector(".new-title-input").value;
        data.time = document.querySelector(".new-time-input").value;        
        
        chrome.runtime.sendMessage({ message: "send-custom-object", data: data}, (response) => {
            if (response === "success") {
                document.querySelector(".arrow-left").style.display = "block";
                document.querySelector(".daily-box").style.display = "flex";
                document.querySelector(".new-entry-box").style.display = "none";
                document.querySelector(".new-id-input").textContent = "-";
                document.querySelector(".new-title-input").textContent = "";
                document.querySelector(".new-time-input").textContent = 0.5;
                document.querySelector(".calendar-box").style.display = "flex";
                location.reload();
            } else {
                alert("Error adding the custom Object!")
            }
        })
    })

    document.querySelector(".confirm-edit").addEventListener("click", () => {
        let data = {};
        data.hidden = oldId;
        data.id = document.querySelector(".new-id-input").value;
        data.title = document.querySelector(".new-title-input").value;
        data.time = document.querySelector(".new-time-input").value;

        chrome.runtime.sendMessage({ message: "edit-object", data: data}, (response) => {
            if (response === "success") {
                document.querySelector(".arrow-left").style.display = "block";
                document.querySelector(".daily-box").style.display = "flex";
                document.querySelector(".confirm").style.display = "block";
                document.querySelector(".confirm-edit-custom").style.display = "none";
                document.querySelector(".new-entry-box").style.display = "none";
                document.querySelector(".new-id-input").value = "-";
                document.querySelector(".new-title-input").value = "";
                document.querySelector(".new-time-input").value = 0.5;
                document.querySelector(".calendar-box").style.display = "flex";
                document.querySelector(".delete").style.display = "none";
                location.reload();
            } else {
                alert("Error editing the Object!")
            }
        })
    })
    
    document.querySelector(".confirm-edit-custom").addEventListener("click", () => {
        let data = {};
        data.hidden = oldId;
        data.id = document.querySelector(".new-id-input").value;
        data.title = document.querySelector(".new-title-input").value;
        data.time = document.querySelector(".new-time-input").value;
        
        chrome.runtime.sendMessage({ message: "edit-custom-object", data: data}, (response) => {
            if (response === "success") {
                document.querySelector(".arrow-left").style.display = "block";
                document.querySelector(".daily-box").style.display = "flex";
                document.querySelector(".confirm").style.display = "block";
                document.querySelector(".confirm-edit-custom").style.display = "none";
                document.querySelector(".new-entry-box").style.display = "none";
                document.querySelector(".new-id-input").value = "-";
                document.querySelector(".new-title-input").value = "";
                document.querySelector(".new-time-input").value = 0.5;
                document.querySelector(".calendar-box").style.display = "flex";
                document.querySelector(".delete").style.display = "none";
                location.reload();
            } else {
                alert("Error editing the custom Object!")
            }
        })
    })
    
    document.querySelector(".delete").addEventListener("click", () => {
        chrome.runtime.sendMessage({ message: "delete-object", id: oldId}, (response) => {
            if (response === "success") {
                document.querySelector(".arrow-left").style.display = "block";
                document.querySelector(".daily-box").style.display = "flex";
                document.querySelector(".confirm").style.display = "block";
                document.querySelector(".confirm-edit-custom").style.display = "none";
                document.querySelector(".new-entry-box").style.display = "none";
                document.querySelector(".new-id-input").value = "-";
                document.querySelector(".new-title-input").value = "";
                document.querySelector(".new-time-input").value = 0.5;
                document.querySelector(".calendar-box").style.display = "flex";
                document.querySelector(".delete").style.display = "none";
                location.reload();
            } else {
                alert("Error editing the custom Object!")
            }
        })
    })
    
    document.querySelector(".cancel").addEventListener("click", () => {
        document.querySelector(".arrow-left").style.display = "block";
        document.querySelector(".daily-box").style.display = "flex";
        document.querySelector(".new-entry-box").style.display = "none";
        document.querySelector(".calendar-box").style.display = "flex";
        document.querySelector(".delete").style.display = "none";
        document.querySelector(".confirm-edit").style.display = "none";
        document.querySelector(".confirm-edit-custom").style.display = "none";
        document.querySelector(".confirm").style.display = "block";
        document.querySelector(".new-time-input").readOnly = false;
        document.querySelector(".new-id-input").readOnly = false;
        document.querySelector(".new-id-input").value = "-";
        document.querySelector(".new-title-input").value = "";
        document.querySelector(".new-time-input").value = 0.5;
    })
})

window.addEventListener("beforeunload", () => {
    let rightArrow = document.querySelector(".arrow-right").display;
    let leftArrow = document.querySelector(".arrow-left").display;
    
    if (rightArrow === "block") {
        chrome.storage.sync.set({ currentSide: "right" })
    } else if (leftArrow === "block") {
        chrome.storage.sync.set({ currentSide: "left" })
    } 
});

function updateTimerDisplay(startTime) {
    const currentTime = new Date().getTime();

    const timeDifference = currentTime - startTime;
    
    const formattedTime = new Date(timeDifference).toISOString().substr(11, 8);

    return formattedTime;
}