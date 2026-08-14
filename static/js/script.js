// ========================================
// MEDICINE REMINDER SYSTEM
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const reminderData = document.getElementById("reminder-data");

    if (!reminderData) {
        return;
    }

    let medicines = [];

    try {
        medicines = JSON.parse(reminderData.textContent);
    } catch (error) {
        console.error("Could not load medicine data:", error);
        return;
    }


    // ========================================
    // REQUEST NOTIFICATION PERMISSION
    // ========================================

    if ("Notification" in window) {

        if (Notification.permission === "default") {

            Notification.requestPermission()
                .then(function (permission) {

                    console.log(
                        "Notification permission:",
                        permission
                    );

                });

        }

    }


    // ========================================
    // STORAGE KEY
    // ========================================

    function getTodayKey() {

        const today = new Date();

        return today.getFullYear() +
            "-" +
            String(today.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(today.getDate()).padStart(2, "0");

    }


    // ========================================
    // CHECK WHETHER MEDICINE IS ACTIVE
    // ========================================

    function isMedicineActive(medicine) {

        const today = new Date();

        const todayString =
            today.getFullYear() +
            "-" +
            String(today.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(today.getDate()).padStart(2, "0");


        if (
            medicine.start_date &&
            todayString < medicine.start_date
        ) {
            return false;
        }


        if (
            medicine.end_date &&
            todayString > medicine.end_date
        ) {
            return false;
        }


        return true;
    }


    // ========================================
    // TAKEN STATUS
    // ========================================

    function getTakenData() {

        const data =
            localStorage.getItem("medicineTaken");

        if (!data) {
            return {};
        }

        try {
            return JSON.parse(data);
        } catch {
            return {};
        }

    }


    function isTaken(medicineId) {

        const data = getTakenData();

        const today = getTodayKey();

        return data[today] &&
               data[today][medicineId] === true;
    }


    function markAsTaken(medicineId) {

        let data = getTakenData();

        const today = getTodayKey();


        if (!data[today]) {
            data[today] = {};
        }


        data[today][medicineId] = true;


        localStorage.setItem(
            "medicineTaken",
            JSON.stringify(data)
        );


        updateReminderCards();

        updateProgress();

    }


    // ========================================
    // CREATE REMINDER CARD
    // ========================================

    function createReminderCard(medicine) {

        const container =
            document.getElementById("active-reminders");

        if (!container) {
            return;
        }


        const existing =
            document.querySelector(
                `[data-reminder-id="${medicine.id}"]`
            );

        if (existing) {
            return;
        }


        const card =
            document.createElement("div");


        card.className =
            "reminder-card";


        card.setAttribute(
            "data-reminder-id",
            medicine.id
        );


        card.innerHTML = `

            <div class="reminder-icon">
                🔔
            </div>

            <div class="reminder-content">

                <strong>
                    Medicine Reminder
                </strong>

                <h3>
                    💊 ${medicine.name}
                </h3>

                <p>
                    Dose: ${medicine.dose}
                </p>

                <small>
                    Reminder time: ${medicine.reminder_time}
                </small>

            </div>

            <button
                class="taken-btn"
                type="button">

                ✓ Taken

            </button>

        `;


        const button =
            card.querySelector(".taken-btn");


        button.addEventListener(
            "click",
            function () {

                markAsTaken(medicine.id);

                card.classList.add(
                    "reminder-completed"
                );

                button.textContent =
                    "✓ Taken";

                button.disabled = true;

            }
        );


        container.appendChild(card);

    }


    // ========================================
    // SHOW BROWSER NOTIFICATION
    // ========================================

    function showNotification(medicine) {

        if (
            !("Notification" in window) ||
            Notification.permission !== "granted"
        ) {
            return;
        }


        const notification =
            new Notification(
                "💊 Medicine Reminder",
                {
                    body:
                        medicine.name +
                        " — " +
                        medicine.dose +
                        "\nIt is time for your medicine.",
                    icon: "/static/favicon.png"
                }
            );


        notification.onclick =
            function () {

                window.focus();

                notification.close();

            };

    }


    // ========================================
    // CHECK CURRENT TIME
    // ========================================

    function checkReminders() {

        const now =
            new Date();


        const currentHour =
            String(
                now.getHours()
            ).padStart(2, "0");


        const currentMinute =
            String(
                now.getMinutes()
            ).padStart(2, "0");


        const currentTime =
            currentHour +
            ":" +
            currentMinute;


        medicines.forEach(
            function (medicine) {

                if (!isMedicineActive(medicine)) {
                    return;
                }


                if (isTaken(medicine.id)) {
                    return;
                }


                if (
                    medicine.reminder_time ===
                    currentTime
                ) {

                    const reminderKey =
                        getTodayKey() +
                        "_" +
                        medicine.id +
                        "_" +
                        currentTime;


                    const lastReminder =
                        localStorage.getItem(
                            "lastReminder"
                        );


                    if (
                        lastReminder !==
                        reminderKey
                    ) {

                        localStorage.setItem(
                            "lastReminder",
                            reminderKey
                        );


                        showNotification(
                            medicine
                        );


                        createReminderCard(
                            medicine
                        );

                    }

                }

            }
        );

    }


    // ========================================
    // UPDATE ACTIVE REMINDERS
    // ========================================

    function updateReminderCards() {

        const container =
            document.getElementById(
                "active-reminders"
            );

        if (!container) {
            return;
        }


        container.innerHTML = "";


        medicines.forEach(
            function (medicine) {

                if (!isMedicineActive(medicine)) {
                    return;
                }


                if (isTaken(medicine.id)) {
                    return;
                }


                const now =
                    new Date();


                const currentHour =
                    String(
                        now.getHours()
                    ).padStart(2, "0");


                const currentMinute =
                    String(
                        now.getMinutes()
                    ).padStart(2, "0");


                const currentTime =
                    currentHour +
                    ":" +
                    currentMinute;


                if (
                    medicine.reminder_time ===
                    currentTime
                ) {

                    createReminderCard(
                        medicine
                    );

                }

            }
        );

    }


    // ========================================
    // PROGRESS
    // ========================================

    function updateProgress() {

        const progressValue =
            document.getElementById(
                "progress-value"
            );

        const progressBar =
            document.getElementById(
                "progress-bar"
            );


        if (
            !progressValue ||
            !progressBar
        ) {
            return;
        }


        const activeMedicines =
            medicines.filter(
                function (medicine) {
                    return isMedicineActive(
                        medicine
                    );
                }
            );


        if (activeMedicines.length === 0) {

            progressValue.textContent =
                "0%";

            progressBar.style.width =
                "0%";

            return;
        }


        let completed = 0;


        activeMedicines.forEach(
            function (medicine) {

                if (
                    isTaken(medicine.id)
                ) {
                    completed++;
                }

            }
        );


        const percentage =
            Math.round(
                (completed /
                    activeMedicines.length) *
                100
            );


        progressValue.textContent =
            percentage + "%";


        progressBar.style.width =
            percentage + "%";

    }


    // ========================================
    // START REMINDER CHECK
    // ========================================

    checkReminders();

    updateReminderCards();

    updateProgress();


    setInterval(
        function () {

            checkReminders();

            updateReminderCards();

            updateProgress();

        },
        30000
    );

});