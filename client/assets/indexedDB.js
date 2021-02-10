/**
 * Page is updated when transactions are made offline...
 * These updates do not persist when page is refreshed offline,
 * but the post requests do execute once back online
 */

const request = window.indexedDB.open("budgetTransactions", 1);

request.onupgradeneeded = e => {

    const db = e.target.result;

    // Create a new object store called "pendingTransactions"
    // with an auto-incrementing key
    db.createObjectStore("pendingTransactions", { autoIncrement: true });
}

request.onsuccess = () => {

    const db = request.result;

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

function saveRecord(record) {
    const transaction = request.result.transaction("pendingTransactions", "readwrite");
    const pendingTransactions = transaction.objectStore("pendingTransactions")

    pendingTransactions.add(record)
}