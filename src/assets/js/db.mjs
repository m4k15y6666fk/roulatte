
function openIDB() {
    return new Promise((resolve, reject) => {
        // データベースを開く
        const request = window.indexedDB.open('RouletteIndexedDB', 1);

        request.onerror = (event) => {
            // このデータベースのリクエストに対するすべてのエラー用の
            // 汎用エラーハンドラー!
            reject(new Error(`Database error: ${event.target.errorCode}`));
        };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('upgradeneeded');

            db.createObjectStore('Roulettes', { keyPath: 'id', autoIncrement: true });

            db.createObjectStore('Settings');

        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            console.log('success');

            resolve(db);
        };
    });
}


class Settings {
    constructor(db) {
        this.db = db;
    }

    get(key) {
        return new Promise((resolve, reject) => {
            const request = this.db.transaction(['Settings'], 'readonly').objectStore('Settings').get(key);

            request.onerror = (event) => {
                reject(event.target.result);
            };
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    }

    set(key, value) {
        return new Promise((resolve, reject) => {
            const request = this.db.transaction(['Settings'], 'readwrite').objectStore('Settings').put(value, key);

            request.onerror = (event) => {
                reject(event.target.result);
            };
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    }
}



export { openIDB, Settings };
