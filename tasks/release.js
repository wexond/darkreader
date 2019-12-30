const bundleJS = require("./bundle-js");
const clean = require("./clean");
const codeStyle = require("./code-style");
const copy = require("./copy");
const {runTasks, log} = require("./utils");
const zip = require("./zip");

async function release() {
    log.ok("RELEASE");
    try {
        await runTasks([clean, bundleJS, copy, codeStyle, zip], {
            production: true
        });
        log.ok("MISSION PASSED! RESPECT +");
    } catch (err) {
        log.error(`MISSION FAILED!`);
        process.exit(13);
    }
}

release();
