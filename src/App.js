import logo from "./logo.svg";
import "./App.css";
import { useEffect, useMemo, useState } from "react";
import { USER_DATA } from "./data";

const idb =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

const insertDataInIndexedDb = () => {
  //check for support
  if (!idb) {
    console.log("This browser doesn't support IndexedDB");
    return;
  }

  const request = idb.open("test-db", 1);

  request.onerror = function (event) {
    console.error("An error occurred with IndexedDB");
    console.error(event);
  };

  request.onupgradeneeded = function (event) {
    console.log(event);
    const db = request.result;

    if (!db.objectStoreNames.contains("userData")) {
      const objectStore = db.createObjectStore("userData", { keyPath: "id" });

      objectStore.createIndex("age", "age", {
        unique: false,
      });
    }
  };

  request.onsuccess = function () {
    console.log("Database opened successfully");

    const db = request.result;

    var tx = db.transaction("userData", "readwrite");
    var userData = tx.objectStore("userData");

    USER_DATA.forEach((item) => userData.add(item));

    return tx.complete;
  };
};

const App = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [addUser, setAddUser] = useState(false);
  const [editUser, setEditUser] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState({});
  const [age, setAge] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  

  useEffect(() => {
    insertDataInIndexedDb();
    getAllData();
    // getAgeWiseData();
  }, []);

  const getAgeWiseData = () => {
    try {
      const dbPromise = idb.open("test-db", 1);
      const filteredRecords = []

        // const keyRangeValue = IDBKeyRange.lowerBound(12);
        // const keyRangeValue = IDBKeyRange.upperBound(12);
        const keyRangeValue = IDBKeyRange.bound(parseInt(minAge), parseInt(maxAge), false, false);
        // If true then these values are not included other wise these will be included.
        dbPromise.onsuccess = function () {
          const db = dbPromise.result;

          if (db.objectStoreNames.contains('userData')) {
            const transaction = db.transaction('userData', "readonly");
            const objectStore = transaction.objectStore('userData');

            const dataIdIndex = objectStore.index("age");
            dataIdIndex.openCursor(keyRangeValue).onsuccess = function (event) {
              const cursor = event.target.result;
              if (cursor) {
                if (cursor.value) {
                  if (parseInt(cursor.value.age) > 0) {
                    console.log(cursor.value);
                    filteredRecords.push(cursor.value)
                  }
                }

                cursor.continue();
              }
            };

            transaction.oncomplete = function (event) {
              setAllUsers(filteredRecords)
              db.close();
            };
          }
        };
    } catch (error) {
      console.log(error);
    }
}

  const getAllData = () => {
    const dbPromise = idb.open("test-db", 1);
    dbPromise.onsuccess = () => {
      const db = dbPromise.result;

      var tx = db.transaction("userData", "readonly");
      var userData = tx.objectStore("userData");
      const users = userData.getAll();

      users.onsuccess = (query) => {
        setAllUsers(query.srcElement.result);
      };

      tx.oncomplete = function () {
        db.close();
      };
    };
  };

  const handleSubmit = (event) => {
    const dbPromise = idb.open("test-db", 1);
    console.log(addUser, editUser);

    if (firstName && lastName && email) {
      dbPromise.onsuccess = () => {
        const db = dbPromise.result;

        var tx = db.transaction("userData", "readwrite");
        var userData = tx.objectStore("userData");

        console.log(addUser, editUser);
        console.log(addUser, editUser);
        if (addUser) {
          const users = userData.put({
            id: allUsers?.length + 1,
            firstName,
            lastName,
            email,
            age,
          });

          console.log("add");
          users.onsuccess = (query) => {
            tx.oncomplete = function () {
              db.close();
            };
            alert("User added!");
            setFirstName("");
            setLastName("");
            setEmail("");
            setAge('')
            setAddUser(false);
            getAllData();
            event.preventDefault();
          };
        } else {
          const users = userData.put({
            id: selectedUser?.id,
            firstName,
            lastName,
            email,
            age,
          });
          console.log("edit");

          users.onsuccess = (query) => {
            tx.oncomplete = function () {
              db.close();
            };
            alert("User updated!");
            setFirstName("");
            setLastName("");
            setEmail("");
            setAge('')
            setEditUser(false);
            getAllData();
            setSelectedUser({});
            event.preventDefault();
          };
        }
      };
    } else {
      alert("Please enter all details");
    }
  };

  const deleteSelected = (user) => {
    const dbPromise = idb.open("test-db", 1);

    dbPromise.onsuccess = function () {
      const db = dbPromise.result;
      var tx = db.transaction("userData", "readwrite");
      var userData = tx.objectStore("userData");
      const deleteUser = userData.delete(user.id);

      deleteUser.onsuccess = (query) => {
        tx.oncomplete = function () {
          db.close();
        };
        alert("User deleted!");
        getAllData();
      };
    };
  };

  return (
    <div className="row" style={{ padding: 100 }}>
      <div className="col-md-6">
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
             <input type='number' value={minAge} onChange={e => setMinAge(e.target.value)} className="form-control" style={{width: '200px'}} placeholder="Enter Min Age"/>
             <input type='number' value={maxAge} onChange={e => setMaxAge(e.target.value)} className="form-control ml-2" style={{width: '200px'}} placeholder="Enter Max Age"/>
            <button type="button" className="btn btn-info mt-2" onClick={() => getAgeWiseData()}>Filter</button>
            <button type="button" className="btn btn-secondary mt-2" onClick={() => getAllData()}>Clear</button>
          </div>
          <button
            className="btn btn-primary float-end mb-2"
            onClick={() => {
              setFirstName("");
              setLastName("");
              setEmail("");
              setAge('')
              setEditUser(false);
              setAddUser(true);
            }}
          >
            Add
          </button>
        </div>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Age</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers?.map((user) => {
              return (
                <tr key={user?.id}>
                  <td>{user?.firstName}</td>
                  <td>{user?.lastName}</td>
                  <td>{user?.age}</td>
                  <td>{user?.email}</td>
                  <td>
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        setAddUser(false);
                        setEditUser(true);
                        setSelectedUser(user);
                        setEmail(user?.email);
                        setAge(user?.age)
                        setFirstName(user?.firstName);
                        setLastName(user?.lastName);
                      }}
                    >
                      Edit
                    </button>{" "}
                    <button
                      className="btn btn-danger"
                      onClick={() => deleteSelected(user)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="col-md-6">
        {editUser || addUser ? (
          <div className="card" style={{ padding: "20px" }}>
            <h3>{editUser ? "Update User" : "Add User"}</h3>
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                className="form-control"
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                className="form-control"
                onChange={(e) => setLastName(e.target.value)}
                value={lastName}
              />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                className="form-control"
                onChange={(e) => setAge(e.target.value)}
                value={age}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
              />
            </div>
            <div className="form-group">
              <button
                className="btn btn-primary mt-2"
                type="submit"
                onClick={handleSubmit}
              >
                {editUser ? "Update" : "Add"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default App;
