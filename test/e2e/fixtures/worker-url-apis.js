importScripts("./worker-spector-stub.js", "./worker-spector-stub.js");

self.onmessage = async () => {
    try {
        const request = new Request("./worker-module-offscreen-data.txt");
        const fetched = await (await fetch(request)).text();
        const xhr = new XMLHttpRequest();
        const loaded = new Promise((resolve, reject) => {
            xhr.onload = () => resolve(xhr.responseText);
            xhr.onerror = reject;
        });
        xhr.open("GET", "./worker-module-offscreen-data.txt");
        xhr.send();
        self.postMessage({ fetched, loaded: await loaded, requestURL: request.url, workerURL: self.location.href });
    } catch (error) {
        self.postMessage({ error: String(error) });
    }
};
