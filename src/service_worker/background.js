let regex = ["https://dinotronic.freshservice.com/a/tickets/*?current_tab=details"];

// initialize firebase database
self.importScripts('../../firebase/firebase-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDVNqfU2vVPzsdYXr67Ncq-g29Kkan6PMQ",
    authDomain: "xflex-extension.firebaseapp.com",
    projectId: "xflex-extension",
    storageBucket: "xflex-extension.appspot.com",
    messagingSenderId: "455393526148",
    appId: "1:455393526148:web:60e1b7b40ea76dc42fddd1",
    measurementId: "G-F80DKM4YD2"
};

firebase.initializeApp(firebaseConfig);
let db = firebase.firestore();

// create context menus
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "start",
        title: "Start Timer",
        contexts: ["page"],
        documentUrlPatterns: regex
    });

    chrome.contextMenus.create({
        id: "stop",
        title: "Stop Timer",
        contexts: ["page"],
        documentUrlPatterns: regex
    })
})

// add listener for context menus (v3.0 manifest)
chrome.contextMenus.onClicked.addListener(onClick);

function onClick(info, tab) {
    // handle click event for "timer start"
    if (info.menuItemId === "start") {
        // send callback to tab / content.js
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {text: "getDom"}, (response) => {
                // handle the callback from tab
                const ticketInfos = JSON.parse(response);

                checkEmptyDocuments(ticketInfos.username, true, false, ticketInfos.id)
                    .then((result) => {
                        if (result === true) {
                            const timer = Date.now();
                            db.collection(ticketInfos.username).doc().set({
                                id: ticketInfos.id,
                                title: ticketInfos.title,
                                requester: ticketInfos.requester,
                                company: ticketInfos.company,
                                agent: ticketInfos.agent,
                                started: true,
                                startTime: timer,
                                stopped: false,
                                customTime: null,
                                custom: false
                            })
                                .then(() => {
                                    console.info("[DATABASE] Firestore Data successfully written");
                                    chrome.storage.local.set({ [ticketInfos.id]: { title: ticketInfos.title, timer: timer } }).then(() => {
                                        console.log(`Key ${ticketInfos.id} is added to storage`);
                                    });

                                    chrome.storage.sync.get("username", (result) => {
                                        if (result.username === undefined) {
                                            chrome.storage.sync.set({ username: ticketInfos.username }).then(() => {
                                                console.log(`Username ${ticketInfos.username} is added to storage`);
                                            });
                                        }
                                    });
                                })
                                .catch((error) => {
                                    console.error("[DATABASE] Error writing document: ", error);
                                })
                        } else {
                            chrome.tabs.sendMessage(tabs[0].id, {text: "alert", message: "[XFlex Extension] There is already a Timer started for this ticket!"});
                        }
                    })
                    .catch((error) => {
                        console.error("[FUNCTION] Error in checkEmptyDocuments: ", error);
                    })
            });
        });
    }

    if (info.menuItemId === "stop") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {text: "getDom"}, (response) => {
                // handle the callback from tab
                const ticketInfos = JSON.parse(response);

                getDocumentId(ticketInfos.username, true, false, ticketInfos.id)
                    .then((result) => {
                        if (result != false) {
                            db.collection(ticketInfos.username).doc(result).update({
                                title: ticketInfos.title,
                                requester: ticketInfos.requester,
                                company: ticketInfos.company,
                                agent: ticketInfos.agent,
                                started: false,
                                stopped: true,
                                stopTime: Date.now()
                            })
                                .then(() => {
                                    console.info("[DATABASE] Firestore Data successfully written");
                                    chrome.storage.local.remove([ticketInfos.id], () => {
                                        console.log(`Key ${ticketInfos.id} is removed from storage`);
                                    })
                                })
                                .catch((error) => {
                                    console.error("[DATABASE] Error writing document: ", error);
                                })
                        } else {
                            chrome.tabs.sendMessage(tabs[0].id, {text: "alert", message: "[XFlex Extension] There is no Timer started for this ticket!"});
                        }
                    })
                    .catch((error) => {
                        console.error("[FUNCTION] Error in getDocumentId: ", error);
                    })

            });
        });
    }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg === 'get-user-data') {
        chrome.storage.sync.get("username", (result) => {
            const username = result.username;

            if (username) {
                getDailyBookings(username).then((result) => {
                    if (result !== undefined) {
                        sendResponse(result);
                    } else {
                        sendResponse(null);
                    }
                }).catch((error) => {
                    console.error("Error in getDailyBookings:", error);
                });
            } else {
                console.error("Username not found in storage.");
            }
        });
        return true;
    }

    if (msg.message === 'get-user-date') {
        chrome.storage.sync.get("username", (result) => {
            const username = result.username;

            if (username) {
                getDateBookings(username, msg.date).then((result) => {
                    if (result !== undefined) {
                        sendResponse(result);
                    } else {
                        sendResponse(null);
                    }
                }).catch((error) => {
                    console.error("Error in getDateBookings:", error);
                });
            } else {
                console.error("Username not found in storage.");
            }
        });
        return true;
    }

    if (msg.message === 'get-custom-user-date') {
        chrome.storage.sync.get("username", (result) => {
            const username = result.username;

            if (username) {
                getCustomDateBooking(username, msg.date).then((result) => {
                    if (result !== undefined) {
                        console.log("done")
                        sendResponse(result);
                    } else {
                        sendResponse(null);
                    }
                }).catch((error) => {
                    console.error("Error in getDateBookings:", error);
                });
            } else {
                console.error("Username not found in storage.");
            }
        });
        return true;
    }
    
    if (msg.message === "send-custom-object") {
        let data = msg.data;
        chrome.storage.sync.get("username", (result) => {
            const username = result.username;

            if (username) {
                if (data.id !== "-") {
                    db.collection(username).doc().set({
                        id: data.id,
                        title: data.title,
                        customTime: data.time,
                        date: Date.now(),
                        custom: true
                    }).then(() => {
                        sendResponse("success");
                    }).catch(() => {
                        sendResponse(null)
                    })
                } else {
                    db.collection(username).doc().set({
                        id: generateRandomNumberString(10),
                        title: data.title,
                        customTime: data.time,
                        date: Date.now(),
                        custom: true
                    }).then(() => {
                        sendResponse("success");
                    }).catch((error) => {
                        sendResponse(null);
                    })
                }
                
            } else {
                console.error("Username not found in storage.");
                sendResponse(null);
            }
        });
        return true;
    } 
    
    if (msg === "get-custom-object") {
        chrome.storage.sync.get("username", (result) => {
            const username = result.username;

            if (username) {
                getDailyCustoms(username).then((data) => {
                    if (data !== null) {
                        sendResponse(data)
                    } else {
                        sendResponse(null);
                    }
                })
            } else {
                console.error("Username not found in storage.");
            }
        });
        return true;
    }
    
    if (msg.message === "edit-custom-object") {
        let data = msg.data;

        chrome.storage.sync.get("username", (result) => {
            const username = result.username;
            
            if (username) {
                getCustomId(username, data.hidden).then((result) => {
                    db.collection(username).doc(result).update({
                        id: data.id,
                        title: data.title,
                        customTime: data.time
                    }).then(() => {
                        sendResponse("success");
                    }).catch((e) => {
                        sendResponse(null)
                    })
                })
            } else {
                console.error("Username not found in storage.");
                sendResponse(null);
            }
        });
        return true;
    }

    if (msg.message === "edit-object") {
        let data = msg.data;

        chrome.storage.sync.get("username", (result) => {
            const username = result.username;

            if (username) {
                updateObject(username, data.hidden, data.title).then((result) => {
                    sendResponse("success");
                }).catch((e) => {
                    sendResponse(null);
                })
            } else {
                console.error("Username not found in storage.");
                sendResponse(null);
            }
        });
        return true;
    }
    
    if (msg.message === "delete-object") {
        chrome.storage.sync.get("username", (result) => {
            const username = result.username;

            if (username) {
                deleteObject(username, msg.id).then((result) => {
                    sendResponse("success");
                }).catch((e) => {
                    sendResponse(null);
                })
            } else {
                console.error("Username not found in storage.");
                sendResponse(null);
            }
        });
        return true;
    }
    
});

function deleteObject(username, id) {
    return db.collection(username)
        .where("id", "==", id)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                querySnapshot.forEach((document) => {
                    db.collection(username).doc(document.id).delete().then(() => {
                        return true
                    }).catch((e) => {
                        return false;
                    })
                })
            } else {
                return null;
            }
        })
        .catch((error) => {
            console.error("Error in getDailyBookings:", error);
            throw error;
        });
}

function generateRandomNumberString(length) {
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charactersLength);
        result += characters.charAt(randomIndex);
    }

    return result;
}

function getDailyCustoms(collection) {
    return db.collection(collection)
        .where("custom", "==", true)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const results = [];
                querySnapshot.forEach((snapshot) => {
                    if (snapshot.get("date") !== undefined && snapshot.get("date") !== null) {
                        const ticketDate = new Date(snapshot.get("date"))
                        const ticketDay = ticketDate.getDate();
                        const ticketMonth = ticketDate.getMonth();
                        const ticketYear = ticketDate.getFullYear();
                        const formattedTicketDate = `${ticketDay}/${ticketMonth}/${ticketYear}`

                        const nowDate = new Date(Date.now());
                        const nowDay = nowDate.getDate();
                        const nowMonth = nowDate.getMonth();
                        const nowYear = nowDate.getFullYear();
                        const formattedNowDate = `${nowDay}/${nowMonth}/${nowYear}`

                        if (formattedTicketDate === formattedNowDate) {
                            results.push({
                                id: snapshot.get("id"),
                                title: snapshot.get("title"),
                                customTime: snapshot.get("customTime")
                            })
                        }
                    }
                });
                return results;
            } else {
                return null;
            }
        })
        .catch((error) => {
            console.error("Error in getDailyBookings:", error);
            throw error;
        });
}

function checkEmptyDocuments(collection, started, stopped, ticketId) {
return db.collection(collection)
    .where("started", "==", started)
    .where("stopped", "==", stopped)
    .where("id", "==", ticketId)
    .get()
    .then((querySnapshot) => {
        if (querySnapshot.empty) {
            return true;
        } else {
            return false;
        }
    })
    .catch ((error) => {
        console.error("[DATABASE] Error getting documents: ", error)
        throw error;
    });
}             

function getDocumentId(collection, started, stopped, ticketId) {
return db.collection(collection)
    .where("started", "==", started)
    .where("stopped", "==", stopped)
    .where("id", "==", ticketId)
    .get()
    .then((querySnapshot) => {
        if (querySnapshot.docs[1] === undefined && querySnapshot.docs[0] !== undefined) {
            return querySnapshot.docs[0].id;
        } else {
            return false;
        }
    })
    .catch ((error) => {
        console.error("[DATABASE] Error getting documents: ", error)
        throw error;
    });
}

function getCustomId(collection, id) {
    return db.collection(collection)
        .where("id", "==", id)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.docs[1] === undefined && querySnapshot.docs[0] !== undefined) {
                return querySnapshot.docs[0].id;
            } else {
                return false;
            }
        })
        .catch ((error) => {
            console.error("[DATABASE] Error getting documents: ", error)
            throw error;
        });
}

function updateObject(collection, id, title) {
    return db.collection(collection)
        .where("id", "==", id)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.docs[0] !== undefined) {
                querySnapshot.forEach((object) => {
                    if (object.data().id === id) {
                        db.collection(collection).doc(object.id).update({
                            title: title
                        }).then(() => {
                            return true;
                        }).catch((e) => {
                            return false;
                        })
                    }
                })
            } else {
                return false;
            }
        })
        .catch ((error) => {
            console.error("[DATABASE] Error getting documents: ", error)
            throw error;
        });
}

function getDailyBookings(username) {
    return db.collection(username)
        .where("started", "==", false)
        .where("stopped", "==", true)
        .get()
        .then((querySnapshot) => {            
            if (!querySnapshot.empty) {
                const results = [];
                querySnapshot.forEach((snapshot) => {
                    if (snapshot.get("startTime") !== undefined && snapshot.get("startTime") !== null) {
                        const ticketDate = new Date(snapshot.get("startTime"))
                        const ticketDay = ticketDate.getDate();
                        const ticketMonth = ticketDate.getMonth();
                        const ticketYear = ticketDate.getFullYear();
                        const formattedTicketDate = `${ticketDay}/${ticketMonth}/${ticketYear}`
                        
                        const nowDate = new Date(Date.now());
                        const nowDay = nowDate.getDate();
                        const nowMonth = nowDate.getMonth();
                        const nowYear = nowDate.getFullYear();
                        const formattedNowDate = `${nowDay}/${nowMonth}/${nowYear}`
                        
                        if (formattedTicketDate === formattedNowDate) {
                            results.push({
                                id: snapshot.get("id"),
                                title: snapshot.get("title"),
                                time: timerCalculator(snapshot.get("startTime"), snapshot.get("stopTime"))
                            })
                        }
                    }
                });
                return results;
            } else {
                return null;
            }
        })
        .catch((error) => {
            console.error("Error in getDailyBookings:", error);
            throw error;
        });
}

function timerCalculator(startTime, endTime) {
    const timeDifference = endTime - startTime;
    
    const formattedTime = new Date(timeDifference).toISOString().substr(11, 8);

    return formattedTime;
}

function getCustomDateBooking(username, date) {
    return db.collection(username)
        .where("custom", "==", true)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                console.log("test")
                const results = [];
                querySnapshot.forEach((snapshot) => {
                    if (snapshot.get("customTime") !== undefined && snapshot.get("customTime") !== null) {
                        const ticketDate = new Date(snapshot.get("date"))
                        const ticketDay = ticketDate.getDate();
                        const ticketMonth = ticketDate.getMonth();
                        const ticketYear = ticketDate.getFullYear();
                        const formattedTicketDate = `${ticketDay}/${ticketMonth}/${ticketYear}`

                        const providedDate = new Date(date);
                        const providedDay = providedDate.getDate();
                        const providedMonth = providedDate.getMonth();
                        const providedYear = providedDate.getFullYear();
                        const formattedProvidedDate = `${providedDay}/${providedMonth}/${providedYear}`

                        if (formattedTicketDate === formattedProvidedDate) {
                            results.push({
                                id: snapshot.get("id"),
                                title: snapshot.get("title"),
                                agent: "-",
                                company: "-",
                                time: snapshot.get("customTime")
                            })
                        }
                    }
                });
                return results;
            }
            else {
                return null;
            }
        })
        .catch((error) => {
            console.error("Error in getDateBookings:", error);
            throw error;
        });
}

function getDateBookings(username, date) {
    return db.collection(username)
        .where("started", "==", false)
        .where("stopped", "==", true)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const results = [];
                querySnapshot.forEach((snapshot) => {
                    if (snapshot.get("startTime") !== undefined && snapshot.get("startTime") !== null) {
                        const ticketDate = new Date(snapshot.get("startTime"))
                        const ticketDay = ticketDate.getDate();
                        const ticketMonth = ticketDate.getMonth();
                        const ticketYear = ticketDate.getFullYear();
                        const formattedTicketDate = `${ticketDay}/${ticketMonth}/${ticketYear}`

                        const providedDate = new Date(date);
                        const providedDay = providedDate.getDate();
                        const providedMonth = providedDate.getMonth();
                        const providedYear = providedDate.getFullYear();
                        const formattedProvidedDate = `${providedDay}/${providedMonth}/${providedYear}`

                        if (formattedTicketDate === formattedProvidedDate) {
                            results.push({
                                id: snapshot.get("id"),
                                title: snapshot.get("title"),
                                agent: snapshot.get("agent"),
                                company: snapshot.get("company"),
                                time: timerCalculator(snapshot.get("startTime"), snapshot.get("stopTime"))
                            })
                        }
                    }
                });
                return results;
            }
            else {
                return null;
            }
        })
        .catch((error) => {
            console.error("Error in getDateBookings:", error);
            throw error;
        });
}