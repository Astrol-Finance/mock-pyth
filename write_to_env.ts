
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as envfile from 'envfile';
// Define the path to your .env file
const envFilePath = path.resolve('.env');

/**
 * Adds or updates an environment variable in the .env file
 * @param key The key of the environment variable
 * @param value The value of the environment variable
 */
export function updateEnvVariable(key: string, value: string): void {
    let parsedEnv: Record<string, string> = {};

    // Check if .env file exists
    if (fs.existsSync(envFilePath)) {
        // Read the existing .env file and parse it
        const envContent = fs.readFileSync(envFilePath, 'utf8');
        parsedEnv = envfile.parse(envContent);
    }

    // Add or update the environment variable
    parsedEnv[key] = value;

    // Convert the updated env object back to string format
    const updatedEnvContent = envfile.stringify(parsedEnv);

    // Write the updated content back to the .env file
    fs.writeFileSync(envFilePath, updatedEnvContent, 'utf8');

    console.log(`Updated ${key}=${value} in the .env file.`);
}
