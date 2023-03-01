
function openIDB() {
    return new Promise((resolve, reject) => {
        // データベースを開く
        const request = window.indexedDB.open('RouletteIndexedDB', 1);

        request.onblocked = _ => {
            // 他のタブがデータベースを読み込んでいる場合は、処理を進める前に
            // それらを閉じなければなりません。
            $('#modal-database-blocked').modal('hide others');
            $('#modal-database-blocked').modal('show');
        };

        request.onerror = (event) => {
            // このデータベースのリクエストに対するすべてのエラー用の
            // 汎用エラーハンドラー!
            reject(new Error(`Database error: ${event.target.errorCode}`));
        };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('upgradeneeded');

            if (! db.objectStoreNames.contains('Roulettes')) {
                db.createObjectStore('Roulettes', { keyPath: 'id', autoIncrement: true });
            }

            if (! db.objectStoreNames.contains('Settings')) {
                db.createObjectStore('Settings');
            }

            // 別のページがバージョン変更を求めた場合に、通知されるようにするためのハンドラーを追加するようにしてください。
            // データベースを閉じなければなりません。データベースを閉じると、別のページがデータベースをアップグレードできます。
            // これを行わなければ、ユーザーがタブを閉じるまでデータベースはアップグレードされません。
            db.onversionchange = _ => {
                db.close();
                window.location.reload();
            };
        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            console.log('success');

            if (! db.onversionchange) {
                db.onversionchange = _ => {
                    db.close();
                    window.location.reload();
                };
            }

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
