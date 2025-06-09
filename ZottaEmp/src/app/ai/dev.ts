
import { config } from 'dotenv';
config();

// No Genkit flows are being imported, especially those dependent on Google AI.
// This file is primarily used by 'genkit start' commands.
// If Genkit related packages are removed, this file might not be needed
// or the scripts in package.json invoking it would be removed.

// console.log("Genkit development server configuration file (no flows loaded).");
