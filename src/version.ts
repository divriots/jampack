import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgjson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json')).toString());

export const VERSION = pkgjson.version;