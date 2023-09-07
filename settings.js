/**
 * Settings object contains our settings related functions.
 */
var Settings = {

    /**
     * Decrypts data using aes-256-cbc algorithm
     * 
     * @param data string to be decrypted
     * @returns string containing decrypted data
     */
    decrypt: function(data) {
        const crypto = require('crypto');
        const key = crypto.createHash('md5').update('personal-web-server').digest('hex');
        let encryptedText = data.split(':');
        let iv = encryptedText[1];
        iv = Buffer.from(iv, 'base64');
        encryptedText = encryptedText[0];
        encryptedText = Buffer.from(encryptedText, 'base64');

        // Creating Decipher
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);

        // Updating encrypted text
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        // returns data after decryption
        return decrypted.toString();
    },

    /**
     * Encrypts data using aes-256-cbc algorithm
     * 
     * @param data string to be encrypted
     * @returns string containing encrypted data and iv
     */
    encrypt: function(data) {
        const crypto = require('crypto');
        const key = crypto.createHash('md5').update('personal-web-server').digest('hex');
        let iv = crypto.randomBytes(16);
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encrypted = cipher.update(data);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        // Returning iv and encrypted data
        return encrypted.toString('base64') + ":" + iv.toString('base64');
    },

    /**
     * getDefaultLocalIP - Gets the default IP address of the host.
     * 
     * @returns {String} Default IP address of the host.
     */
    getDefaultLocalIP: function() {
        const os = require('os');
        const interfaces = os.networkInterfaces();

        for (const interfaceName of Object.keys(interfaces)) {
        const interfaceList = interfaces[interfaceName];
    
        for (const interface of interfaceList) {

            // Skip over non-IPv4 and internal addresses
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
        }  
        return '127.0.0.1';
    },

    /**
     * read - Reads and returns settings from the settings file.
     * 
     * @returns {Object} Application settings.
     */
    read: function() {

        // Default settings
        const app = require('electron').app;
        const path = require('path');
        const packageJson = require('./package.json');
        let pwsSettings = {
            webFolder: path.join(app.getPath('home'), 'Sites'),
            pwsPass: 'personal-web-server',
            sshPort: 8022,
            cpPort: 8083,
            allowCG: true,
            debugMode: false,
            lanIP: this.getDefaultLocalIP(),
            appFolder: path.join(app.getPath('appData'), packageJson.name)
        };

        // Read settings file
        const pwsFile = path.join(pwsSettings.appFolder, 'settings.json');
        const fs = require('fs');
        if (fs.existsSync(pwsFile)) {
            pwsSettings = JSON.parse(fs.readFileSync(pwsFile));
            pwsSettings.pwsPass = this.decrypt(pwsSettings.pwsPass);
        }else{
            this.save(pwsSettings); // Save the default settings
        }
        return pwsSettings;
    },

    /**
     * save - Saves the settings to the settings file.
     * 
     * @param {Object} pwsSettings Application settings.
     */
    save: function(pwsSettings) {
        let pwsCopy = JSON.parse(JSON.stringify(pwsSettings));

        // Ensure the folder exists
        const fs = require('fs');
        if (!fs.existsSync(pwsCopy.appFolder)) {
            try {
                fs.mkdirSync(pwsCopy.appFolder, { recursive: true });
            } catch (error) {
                console.log("Unable to create application settings folder.");
                console.log(error);
            }
        }
    
        // Save the settings
        pwsCopy.pwsPass = this.encrypt(pwsCopy.pwsPass);
        const path = require('path');
        const pwsFilePath = path.join(pwsCopy.appFolder, 'settings.json');
        fs.writeFileSync(pwsFilePath, JSON.stringify(pwsCopy, null, 2));
    }
};
module.exports = Settings;