
import { Roulette } from './roulette.mjs';


let db;
let RouletteStorage = {

    init: (database) => {
        db = database;
    },

    getTemplate: (idx) => {
        if (! db) {
            throw new Error('not initialize');
        }

        return new Promise((resolve, reject) => {
            const request = db.transaction(['Roulettes'], 'readonly').objectStore('Roulettes').get(idx);

            request.onerror = _ => {
                reject(new Error('cant get'));
            };
            request.onsuccess = (event) => {
                resolve(event.target.result)
            };
        });
    },

    getFirstTemplate: _ => {
        if (! db) {
            throw new Error('not initialize');
        }

        return new Promise((resolve, reject) => {
            const request = db.transaction(['Roulettes'], 'readonly').objectStore('Roulettes').openCursor();

            request.onerror = _ => {
                reject(new Error('cant get'));
            };
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    resolve(cursor.value);

                } else {
                    reject(new Error('no cursor'));
                }
            };
        });
    },

    removeTemplate: (idx) => {
        if (! db) {
            throw new Error('not initialize');
        }

        return new Promise((resolve, reject) => {
            const request = db.transaction(['Roulettes'], 'readwrite').objectStore('Roulettes').delete(idx);

            request.onerror = _ => {
                reject(new Error('cant remove'));
            };
            request.onsuccess = (event) => {
                resolve();
            };
        });
    },

    updateTemplate: (_template) => {
        if (! db) {
            throw new Error('not initialize');
        }

        const template = {
            ..._template,
            roulette: Roulette.toObject(_template.roulette)
        }

        return new Promise((resolve, reject) => {
            const request = db.transaction(['Roulettes'], 'readwrite').objectStore('Roulettes').put(template);

            request.onerror = _ => {
                reject(new Error('cant update'));
            };
            request.onsuccess = (event) => {
                resolve();
            };
        });
    },

    countTemplates: _ => {
        if (! db) {
            throw new Error('not initialize');
        }

        return new Promise((resolve, reject) => {
            const request = db.transaction(['Roulettes'], 'readonly').objectStore('Roulettes').count();

            request.onerror = _ => {
                reject(new Error('cant update'));
            };
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    },


    addNewTemplate: (_template) => {
        if (! db) {
            throw new Error('not initialize');
        }

        const roulette = Roulette.toObject(_template.roulette);
        const name = 'COPY - ' + _template.name;

        return new Promise(resolve => {
            const request = db.transaction(['Roulettes'], 'readwrite').objectStore('Roulettes').add({ roulette, name });

            request.onerror = _ => {
                reject(new Error('cant update'));
            };
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    },

    addFirstTemplate: _ => {
        if (! db) {
            throw new Error('not initialize');
        }

        return new Promise((resolve, reject) => {
            const request = db.transaction(['Roulettes'], 'readwrite').objectStore('Roulettes').add(
                { roulette: Roulette.init(), name: `Default Template` }
            );

            request.onerror = _ => {
                reject(new Error('cant update'));
            };
            request.onsuccess = _ => {
                resolve();
            };
        });
    },


    getAllTemplates: _ => {
        if (! db) {
            throw new Error('not initialize');
        }

        return new ReadableStream({
            start(controller) {
                const request = db.transaction(['Roulettes'], 'readonly').objectStore('Roulettes').openCursor();

                request.onerror = _ => {
                    controller.error();
                };
                request.onsuccess = (event) => {
                    const cursor = event.target.result;

                    if (cursor) {
                        controller.enqueue(cursor.value);

                        cursor.continue();

                    } else {
                        controller.close();
                    }
                };
            }
        })
    },


    isCorrectID: (idx) => {
        if (! db) {
            throw new Error('not initialize');
        }

        return new Promise((resolve, reject) => {
            const request = db.transaction(['Roulettes'], 'readonly').objectStore('Roulettes').openCursor();

            request.onerror = _ => {
                reject(new Error('cant get'));
            };
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.id && cursor.value.id === idx) {
                        resolve(true);

                    } else {
                        cursor.continue();
                    }

                } else {
                    resolve(false);
                }
            };
        });
    },

    getFirstID: (reverse = true) => {
        if (! db) {
            throw new Error('not initialize');
        }

        let direction = "next";
        if (reverse) {
            direction = "prev";
        }

        return new Promise((resolve, reject) => {
            const request = db.transaction(['Roulettes'], 'readonly').objectStore('Roulettes').openCursor(null, direction);

            request.onerror = _ => {
                reject(new Error('cant get'));
            };
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    resolve(cursor.value.id);

                } else {
                    reject(new Error('no cursor'));
                }
            };
        });
    }
};



export default RouletteStorage;
