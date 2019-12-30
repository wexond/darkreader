import { Extension } from "./extension";

// Initialize extension
const extension = new Extension();
extension.start();

declare const __DEBUG__: boolean;
declare const __PORT__: number;
const DEBUG = __DEBUG__;

if (DEBUG) {
    const PORT = __PORT__;
    const listen = () => {
        const socket = new WebSocket(`ws://localhost:${PORT}`);
        const send = (message: any) => socket.send(JSON.stringify(message));
        socket.onmessage = (e) => {
            const message = JSON.parse(e.data);

            if (message.type === 'reload') {
                send({type: 'reloading'});
                chrome.runtime.reload();
            }
        };
        socket.onclose = () => setTimeout(listen, 1000);
    };
    listen();
}
