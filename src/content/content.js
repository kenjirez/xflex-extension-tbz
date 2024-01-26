// handle the listener for the content js
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.text === "getDom") {
        // get ticket infos from site
        let ticketInfos = {};
        ticketInfos.document = 
        ticketInfos.username = document.querySelector("body").querySelector(".user-name").textContent;
        ticketInfos.id = document.querySelector('[data-test-id="ticket-human-display-id"]').innerText;
        ticketInfos.title = document.querySelector('[data-test-id="subject-text"]').innerText;
        ticketInfos.requester = document.querySelector("body").querySelector('#primary_email').textContent;
        ticketInfos.company = document.querySelector('[aria-labelledby$="_departmentId"]').querySelector(".ember-power-select-selected-item").innerText;
        ticketInfos.agent = document.querySelector('[aria-labelledby$="_responderId"]').querySelector(".ember-power-select-selected-item").innerText;
        
         // send response to background worker
        sendResponse(JSON.stringify(ticketInfos));
    }
    if (msg.text === "alert") {
        alert(msg.message);
    }
});