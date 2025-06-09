
console.log("--- Starting server.js ---");
console.log("Node.js version:", process.version);
console.log("Current Working Directory (CWD):", process.cwd());
console.log("Directory of server.js (__dirname):", __dirname);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT from env:", process.env.PORT);

try {
    const express = require('express');
    console.log("Successfully required 'express'.");
    const next = require('next');
    console.log("Successfully required 'next'.");

    const port = parseInt(process.env.PORT, 10) || 9003; // Ensure this matches package.json or desired port
    const dev = process.env.NODE_ENV !== 'production';
    const hostname = 'localhost';
    console.log(`Configured Port: ${port}, Dev mode: ${dev}, Hostname: ${hostname}`);

    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();
    console.log("Next.js app instance created.");

    app.prepare().then(() => {
        console.log("Next.js app prepared successfully.");
        const server = express();
        console.log("Express server instance created.");

        server.all('*', (req, res) => {
            // console.log(`Handling request for: ${req.url}`); // Optional: very verbose
            return handle(req, res);
        });

        server.listen(port, (err) => {
            if (err) {
                console.error('--- ERROR: Failed to start custom server listener ---');
                console.error(err);
                process.exit(1);
            }
            console.log(`> Custom Next.js server ready on http://${hostname}:${port}`);
            if (dev) {
                console.log('> Development mode');
            } else {
                console.log('> Production mode');
            }
        });
    }).catch((ex) => {
        console.error('--- ERROR: Error preparing Next.js app ---');
        console.error("Error message:", ex.message);
        console.error("Stack trace:", ex.stack);
        process.exit(1);
    });

} catch (e) {
    console.error("--- CRITICAL ERROR AT THE START OF server.js ---");
    console.error("Failed to initialize or require essential modules.");
    console.error("Error message:", e.message);
    console.error("Error stack:", e.stack);
    console.error("Please ensure you have run 'npm install' in the project root directory.");
    console.error("Verify that 'express' and 'next' are listed in your package.json and installed in node_modules.");
    console.error("Also, check Visual Studio's Node.js configuration and that the working directory is set to the project root.");
    process.exit(1);
}
