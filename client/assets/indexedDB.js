let db;

const request = window.indexedDB.open("budgetTransactions", 1);

request.onupgradeneeded = () => {

    db = request.result;

    // Create a new object store called "pendingTransactions"
    // with an auto-incrementing key
    db.createObjectStore("pendingTransactions", { autoIncrement: true });
}

request.onsuccess = () => {

    db = request.result;

    if (navigator.onLine) {
        checkDatabase();
    }
}

function saveRecord(record) {
    const transaction = request.result.transaction("pendingTransactions", "readwrite");
    const pendingTransactions = transaction.objectStore("pendingTransactions")

    pendingTransactions.add(record)
}

function checkDatabase() {
    // Open a transaction               /* object store */     /* mode */
    const transaction = db.transaction("pendingTransactions", "readwrite");

    // Access object store
    const pendingTransactions = transaction.objectStore("pendingTransactions")


    // Get all documents from db 
    const getRequest = pendingTransactions.getAll()

    getRequest.onsuccess = () => {
        // API - bulk POST documents
        fetch("/api/transaction/bulk", {
            method: "POST",
            body: JSON.stringify(getRequest.result),
            headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json"
            }
        })
            .then(response => response.json())
            .then(() => {
                // Delete documents from store
                const transaction = db.transaction("pendingTransactions", "readwrite");
                const pendingTransactions = transaction.objectStore("pendingTransactions");
                pendingTransactions.clear()
            })
    }
}

window.addEventListener("online", checkDatabase)