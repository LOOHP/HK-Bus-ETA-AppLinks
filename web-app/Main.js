function isAppleDevice() {
    return /iPad|iPhone|iPod|Macintosh/.test(navigator.platform) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function shareUrlMenu(url, title) {
    if (navigator.share) {
        navigator.share({title: title, url: url});
    }
}

function addNavigateListener(callback) {
    window.navigation.addEventListener("navigate", event => callback())
}

async function decompressBase64GzipToBase64(inputBase64) {
    const binaryString = window.atob(inputBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/gzip' });
    const ds = new DecompressionStream('gzip');
    const decompressedStream = blob.stream().pipeThrough(ds);
    return new Response(decompressedStream).arrayBuffer().then((arrayBuffer) => {
        const uintArray = new Uint8Array(arrayBuffer);
        let resultBase64 = '';
        const chunkSize = 0x8000;
        let c = 0;
        for (let i = 0; i < uintArray.length; i += chunkSize) {
            c = uintArray.subarray(i, i + chunkSize);
            resultBase64 += String.fromCharCode.apply(null, c);
        }
        return window.btoa(resultBase64);
    });
}

function canDecodeGzip() {
    return 'DecompressionStream' in window
}

function decodeGzip(data, callback) {
    decompressBase64GzipToBase64(data).then((plain) => {
        callback(plain);
    });
}

function readFromIndexedDB(key, callback) {
    const dbName = "Database";
    const storeName = "Files";
    const openRequest = indexedDB.open(dbName, 2);
    openRequest.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
        }
    };
    openRequest.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = function() {
            callback(request.result);
        };
        request.onerror = function() {
            console.error('Error reading data from IndexedDB', request.error);
        };
    };
    openRequest.onerror = function(event) {
        console.error('Error opening IndexedDB', event.target.errorCode);
    };
}

function writeToIndexedDB(key, data) {
    const dbName = "Database";
    const storeName = "Files";
    const openRequest = indexedDB.open(dbName, 2);
    openRequest.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
        }
    };
    openRequest.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data, key);
        request.onsuccess = function() {
            //success
        };
        request.onerror = function() {
            console.error('Error writing data to IndexedDB', request.error);
        };
    };
    openRequest.onerror = function(event) {
        console.error('Error opening IndexedDB', event.target.errorCode);
    };
}

function listAllKeysInIndexedDB(callback) {
    const dbName = "Database";
    const storeName = "Files";
    const openRequest = indexedDB.open(dbName, 2);
    openRequest.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
        }
    };
    openRequest.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAllKeys();
        request.onsuccess = function() {
            callback(request.result.join('\0'));
        };
        request.onerror = function() {
            console.error('Error listing keys from IndexedDB', request.error);
        };
    };
    openRequest.onerror = function(event) {
        console.error('Error opening IndexedDB', event.target.errorCode);
    };
}

function deleteFromIndexedDB(key, callback) {
    const dbName = "Database";
    const storeName = "Files";
    const openRequest = indexedDB.open(dbName, 2);
    openRequest.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
        }
    };
    openRequest.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const deleteRequest = store.delete(key);
        deleteRequest.onsuccess = function() {
            callback(true);
        };
        deleteRequest.onerror = function() {
            callback(false);
        };
    };
    openRequest.onerror = function(event) {
        console.error('Error opening IndexedDB', event.target.errorCode);
    };
}

function readFile(callback) {
    var input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
       var file = e.target.files[0];
       var reader = new FileReader();
       reader.readAsText(file,'UTF-8');
       reader.onload = readerEvent => {
          callback(readerEvent.target.result);
       }
    }
    input.click();
}

function writeFile(fileName, fileContent) {
    var blob = new Blob([fileContent], {type: "text/plain;charset=utf-8"});
    saveAs(blob, fileName);
}

function getLocation(position, error) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((result) => {
            position(result.coords.latitude, result.coords.longitude);
        }, (reason) => {
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    error(true);
                    break;
                case error.POSITION_UNAVAILABLE:
                    error(false);
                    break;
                case error.TIMEOUT:
                    error(false);
                    break;
                case error.UNKNOWN_ERROR:
                    error(false);
                    break;
                default:
                    error(false);
                    break;
            }
        });
    } else {
        error(false);
    }
}