// A simple utility to manage storing arrays of objects in localStorage.

export function localDatabase(storageKey: string) {
    const getAll = (): any[] => {
        if (typeof window === 'undefined') {
            return [];
        }
        try {
            const storedData = localStorage.getItem(storageKey);
            return storedData ? JSON.parse(storedData) : [];
        } catch (error) {
            console.error("Error reading from local storage:", error);
            return [];
        }
    };

    const add = (item: any): any[] => {
        if (!item || typeof item.id === 'undefined') {
            console.error("Cannot add item without an 'id' property to local database.");
            return getAll();
        }
        const items = getAll();
        // Avoid duplicates based on the item's own ID
        if (items.some(i => i.id === item.id)) {
            return items;
        }
        const newItems = [...items, item];
        try {
            localStorage.setItem(storageKey, JSON.stringify(newItems));
        } catch (error) {
            console.error("Error saving to local storage:", error);
        }
        return newItems;
    };

    const remove = (itemId: string): any[] => {
        const items = getAll();
        const newItems = items.filter(i => i.id !== itemId);
        try {
            localStorage.setItem(storageKey, JSON.stringify(newItems));
        } catch (error) {
            console.error("Error saving to local storage:", error);
        }
        return newItems;
    };
    
    return {
      add,
      remove,
      getAll,
    }
}
