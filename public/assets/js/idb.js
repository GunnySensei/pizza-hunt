let db;

//establish connection to IndexedDB database and call it 'pizza_hunt', version 1
//indexedDB is a global variable in the window object
const request = indexedDB.open("pizza_hunt", 1);

//event will emit if database version changes (nonexistant to version 1, v1 to v2, etc)
request.onupgradeneeded = function (event) {
  //save ref to the database
  const db = event.target.result;
  //create object store called `new_pizza`, set it to have auto increm primary key
  db.createObjectStore("new_pizza", { autoIncrement: true });
};

//upin success
request.onsuccess = function (event) {
  //when db is successfully created w/ object store or successful connection, save reference to db in global variable
  db = event.target.result;

  //check if app is online, if yes, run uploadPizza() to send all local db data to api
  if (navigator.onLine) {
    //uploadPizza();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

//this will be executed if attempt to submit new pizza w/ no internet
function saveRecord(record) {
  //open new transaction with db with read and write perms
  const transaction = db.transaction(["new_pizza"], "readwrite");

  //access object store for `new_pizza`
  const pizzaObjectStore = transaction.objectStore("new_pizza");

  //add record to store with add
  pizzaObjectStore.add(record);
}

function uploadPizza() {
  //open a transaction on your db
  const transaction = db.transaction(["new_pizza"], "readwrite");

  //access object store
  const pizzaObjectStore = transaction.objectStore("new_pizza");

  //get all records from store and set to a variable
  const getAll = pizzaObjectStore.getAll();

  getAll.onsuccess = function () {
    //if there was data in indexedDb's store, send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/pizzas", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          //open another transaction
          const transaction = db.transaction(["new_pizza", "readwrite"]);
          //access new_pizza object store
          const pizzaObjectStore = transaction.objectStore("new_pizza");
          //clear items in store
          pizzaObjectStore.clear();

          alert("All saved pizza has been submitted!");
        })
        .catch((err) => console.log(err));
    }
  };
}

//listen for app coming back online
window.addEventListener("online", uploadPizza);
