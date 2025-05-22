export function localDatabase(storageKey: string) {
    // const storageKey = 'jsonObjects'; // Key for localStorage
  
    // Function to generate a unique ID
    function generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
  
    // Create a new object and store it in localStorage
    function createObject(data) {
        const objects = readObjects(); // Get existing objects
        const newObject = {
            id: generateId(),
            ...data // Spread the data into the new object
        };
        objects.push(newObject);
        localStorage.setItem(storageKey, JSON.stringify(objects));
        return newObject; // Return the newly created object
    }
  
    // Read all objects from localStorage
    function readObjects() {
        const storedData = localStorage.getItem(storageKey);
        return storedData ? JSON.parse(storedData) : []; // Return parsed objects or an empty array
    }
  
    // Update an existing object by ID
    function updateObject(id, updatedData) {
        const objects = readObjects();
        const index = objects.findIndex(obj => obj.id === id);
        if (index !== -1) {
            objects[index] = { ...objects[index], ...updatedData }; // Update the object
            localStorage.setItem(storageKey, JSON.stringify(objects));
            return objects[index]; // Return the updated object
        }
        return null; // Return null if not found
    }
  
    // Delete an object by ID
    function deleteObject(id) {
        const objects = readObjects();
        const updatedObjects = objects.filter(obj => obj.id !== id); // Filter out the object to delete
        localStorage.setItem(storageKey, JSON.stringify(updatedObjects));
        return updatedObjects; // Return the updated list of objects
    }
  
    return {
      add: createObject,
      remove: deleteObject,
      update: updateObject,
      getAll: readObjects
    }
  }