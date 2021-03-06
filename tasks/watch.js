const chokidar = require("chokidar");
const bundleJS = require("./bundle-js");
const copy = require("./copy");
const reload = require("./reload");
const {runTasks, log} = require("./utils");

const DEBOUNCE = 200;

const watchers = [
    [["src/**/*.ts", "src/**/*.tsx", "src/**/*.js"], [bundleJS]],
    [["src/config/**/*.config", "src/*.json", "src/ui/assets/**/*.*"], [copy]]
];

function watch(options) {
    function observe(files, tasks) {
        const queue = new Set();
        let timeoutId = null;

        function onChange(path) {
            queue.add(path);
            if (!timeoutId) {
                timeoutId = setTimeout(async () => {
                    timeoutId = null;
                    try {
                        const files = Array.from(queue).sort();
                        log.ok(`Files changed:${files.map((path) => `\n${path}`)}`);
                        queue.clear();
                        await runTasks(tasks, options);
                        if (timeoutId) {
                            return;
                        }
                        reload({files});
                    } catch (err) {
                        log.error(err);
                    }
                }, DEBOUNCE);
            }
        }

        const watcher = chokidar
            .watch(files, {ignoreInitial: true})
            .on("add", onChange)
            .on("change", onChange)
            .on("unlink", onChange);

        function closeWatcher() {
            watcher.close();
        }

        process.on("exit", closeWatcher);
        process.on("SIGINT", closeWatcher);
    }

    watchers.forEach(([paths, tasks]) => observe(paths, tasks));
}

module.exports = watch;
