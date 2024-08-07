/**
 * Util object provides us with needed utility functions
 */
var Util = {
    // Properties
    appFolder: null,

    // Methods
    allowOneInstance: function() {
        // Allow only one instance of our application
        const fs = require('fs');
        const path = require('path');
        const lockFile = path.join(this.appFolder, 'app.lock');
        if (fs.existsSync(lockFile)) {
            const lockFileContent = fs.readFileSync(lockFile, 'utf8');
            const lockFilePID = parseInt(lockFileContent, 10);
            const { execSync } = require('child_process');
            try {
                const { platform } = require('os');
                let runningPIDs = null;
                if (platform() === 'win32') {
                    const stdout = execSync('tasklist', { encoding: 'utf8' });
                    const lines = stdout.split('\n');
                    runningPIDs = lines.map(line => {
                        const columns = line.trim().split(/\s+/);
                        return columns[1];
                    }).filter(pid => !isNaN(pid)).map(pid => parseInt(pid, 10));
                }else{
                    const stdout = execSync('ps -ax -o pid', { encoding: 'utf8' });
                    runningPIDs = stdout.trim().split('\n').map(pid => parseInt(pid, 10));
                }
                if (runningPIDs.includes(lockFilePID)) {
                    console.log(`PID ${lockFilePID} exists and is running.`);

                    // Pull up the existing instance's settings window
                    const runtimePath = path.join(__dirname, 'runtime', process.platform + '_' +  process.arch, 'bin')
                    + path.delimiter + `${process.env.PATH}${path.delimiter}`;
                    const http = require('http');

                    const postData = JSON.stringify({
                      showSettings: true
                    });
                    
                    const options = {
                      hostname: '127.0.0.1',
                      port: 8088,
                      path: '/',
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': postData.length
                      }
                    };
                    
                    const req = http.request(options, (res) => {
                      console.log(`Response status code: ${res.statusCode}`);
                      res.on('data', (data) => {
                        console.log(`Response data: ${data}`);
                        process.exit();
                      });
                    });
                    
                    req.on('error', (error) => {
                      console.error(`Error making request: ${error.message}`);
                      process.exit();
                    });
                    
                    req.setTimeout(3000, () => {
                      console.error('Request timed out.');
                      req.abort();
                      process.exit();
                    });
                    req.write(postData);
                    req.end();
                    return true;
                } else {
                    console.log(`PID ${lockFilePID} does not exist.`);
                    fs.unlinkSync(lockFile);
                    fs.writeFileSync(lockFile, process.pid.toString());
                }
            } catch (error) {
                console.error(`Error executing Utils.allowOneInstance command: ${error.message}`);
                process.exit();
            }
        }else{
            fs.writeFileSync(lockFile, process.pid.toString());
        }
        process.on('exit', () => {
            fs.unlinkSync(lockFile);
        });
        return false;
    },
    copyScripts: function() {
        // Copy over our user customizable scripts folder
        const fs = require('fs');
        const path = require('path');
        const scriptsFolder = path.join(this.appFolder, 'scripts');
        if (!fs.existsSync(scriptsFolder)) {

            // Copy over our default scripts
            const defaultScriptsFolder = path.join(__dirname, 'scripts');
            const fse = require('fs-extra');
            try {
                fse.copySync(defaultScriptsFolder, scriptsFolder);
            } catch (err) {
                console.error('Error copying folder:', err);
            }
        }
    },
    uuidv4: function() {
        const crypto = require('crypto');
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, (c) =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
};
module.exports = Util;