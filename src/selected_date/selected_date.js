document.addEventListener("DOMContentLoaded", () => {
    const date = new URLSearchParams(location.search).get('date');
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const newDate = new Date(date);
    const formattedWeekDay = daysOfWeek[newDate.getDay()];
    const formattedDay = newDate.getDate();
    const formattedMonth = newDate.getMonth() + 1;
    const formattedYear = newDate.getFullYear();


    chrome.runtime.sendMessage({ message: "get-user-date", date: date }, (response) => {
        if (response !== null) {
            response.forEach((ticket) => {

                if (document.getElementById(ticket.id) !== null) {
                    const ticketTimeElement = document.getElementById(ticket.id).querySelector(".ticket-time");
                    ticketTimeElement.textContent = addTimes(ticketTimeElement.textContent, ticket.time);
                } else {
                    document.querySelector(".content-box").insertAdjacentHTML("beforeend", `
                    <div class="ticket" id="${ticket.id}">
                        <span class="ticket-id">${ticket.id}</span>
                        <span class="ticket-title">${ticket.title}</span>
                        <span class="ticket-agent">${ticket.agent}</span>
                        <span class="ticket-company">${ticket.company}</span>
                        <span class="ticket-time">${ticket.time}</span>
                    </div>
                `);
                }
            });

            setTimeout(() => {
                document.querySelectorAll(".ticket").forEach((ticket) => {
                    if (isValidTimeFormat(ticket.querySelector(".ticket-time").textContent)) {
                        console.log(document.querySelector(".ticket-time").textContent)
                        let ticketTime = roundTimeToQuarterHour(createDateFromTimeString(ticket.querySelector(".ticket-time").textContent))
                        ticket.querySelector(".ticket-time").textContent = ticketTime.toString();
                    }
                })
            }, 0)
            
            let totalTicketTime = 0;
            document.querySelectorAll(".ticket").forEach((ticket) => {
                totalTicketTime += parseFloat(ticket.querySelector(".ticket-time").textContent);
            });

            document.querySelector(".title-title").textContent = `${formattedWeekDay}, ${formattedDay}/${formattedMonth}/${formattedYear} (${totalTicketTime})`;
        } else {
            document.querySelector(".title-title").textContent = `${formattedWeekDay}, ${formattedDay}/${formattedMonth}/${formattedYear} (0)`;
        }
    });

    chrome.runtime.sendMessage({message: "get-custom-user-date", date: date}, (response) => {
        if (response !== null) {
            response.forEach((ticket) => {
                document.querySelector(".content-box").insertAdjacentHTML( "beforeend",`
                 <div class="ticket" id="${ticket.id}">
                    <span class="ticket-id">${ticket.id}</span>
                    <span class="ticket-title">${ticket.title}</span>
                    <span class="ticket-agent">${ticket.agent}</span>
                    <span class="ticket-company">${ticket.company}</span>
                    <span class="ticket-time">${ticket.time}</span>
                </div>
                `)
            })
            let time = 0;
            document.querySelectorAll(".ticket").forEach((ticket) => {
                time += parseFloat(ticket.querySelector(".ticket-time").textContent);
            })
            document.querySelector(".title-title").textContent = `${formattedWeekDay}, ${formattedDay}/${formattedMonth}/${formattedYear} (${time})`;
        }
    })

    function isValidTimeFormat(timeString) {
        const regex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
        return regex.test(timeString);
    }

    function roundTimeToQuarterHour(time) {
        const timeInMinutes = time.getHours() * 60 + time.getMinutes() + time.getSeconds() / 60;

        const roundedDecimal = Math.round(timeInMinutes / 15) / 4;

        return roundedDecimal;
    }

    function createDateFromTimeString(timeString) {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        const date = new Date(0, 0, 0, hours, minutes, seconds);
        return date;
    }

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
        const seconds1 = timeToSeconds(time1);
        const seconds2 = timeToSeconds(time2);

        const totalSeconds = seconds1 + seconds2;

        const result = secondsToTime(totalSeconds);

        return result;
    }
})

