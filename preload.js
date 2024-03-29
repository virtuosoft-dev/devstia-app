/**
 * Our preload script provides a bridge between the main process and the renderer process.
 */
const { contextBridge, ipcRenderer } = require('electron');
function uuidv4() {
    const cryptoObj = window.crypto || window.msCrypto; // Check for browser crypto support
    if (!cryptoObj) {
        console.error('Crypto API not available in this browser.');
        return null;
    }

    const data = new Uint8Array(16);
    cryptoObj.getRandomValues(data);

    // Set the version (4) and reserved bits
    data[6] = (data[6] & 0x0f) | 0x40; // version 4
    data[8] = (data[8] & 0x3f) | 0x80; // variant RFC4122

    // Convert the UUID bytes to a string representation
    const hexDigits = '0123456789abcdef';
    let uuid = '';
    for (let i = 0; i < 16; i++) {
        uuid += hexDigits.charAt(data[i] >> 4);
        uuid += hexDigits.charAt(data[i] & 0xf);
        if (i === 3 || i === 5 || i === 7 || i === 9) {
            uuid += '-';
        }
    }

    return uuid;
}
global.ipcMain_callbacks = {};
global.ipcComm = {

    // Methods
    /**
     * send - allows the render process to send a message to the main process.
     * @param {string} event - the name of the event to send.
     * @param {*} message - an optional message to send, if not an object, will be wrapped in an object with a 'value' property.
     * @param {function} callback - an optional callback function to receive a response from the main process.
     */
    send: function(event, message = {}, callback = null) {

        // Allow for optional message parameter
        if (typeof message == 'function'){
            callback = message;
            message = {};
        }
        
        // Store callback and invoke it when we receive a response
        if (callback != null) {
            if (typeof message == 'object' && Array.isArray(message) == false) {
                message.uuid = uuidv4();
            }else{
                message = { value: message, uuid: uuidv4() };
            }
            
            ipcMain_callbacks[message.uuid] = callback;
            ipcRenderer.once(message.uuid, (event, response) => {
                if (typeof ipcMain_callbacks[message.uuid] === 'function') {
                    ipcMain_callbacks[message.uuid](response);
                    delete ipcMain_callbacks[message.uuid];
                }
            });
        }
        ipcRenderer.send(event, message);
    }
}
contextBridge.exposeInMainWorld('ipcComm', global.ipcComm);
