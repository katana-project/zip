import { readFileSync, opendirSync, type Dirent } from "node:fs";
import { join } from "node:path";
import { Decompressor, readBytes, UnsupportedCompressionMethodError } from "./";
import { expect } from "chai";
import { deflateRaw } from "pako";

const pakoDecompressor: Decompressor = async (method, data) => {
    if (method === 0) {
        return data;
    }

    if (method !== 8) {
        throw new UnsupportedCompressionMethodError(method);
    }

    return deflateRaw(data);
};

describe("reader", () => {
    const register = (path: string) => {
        const data = new Uint8Array(readFileSync(path));
        it(`read ${path}`, async () => {
            const zip = await readBytes(data, {
                // decoder: new TextDecoder("shift-jis")
                // decompressor: pakoDecompressor,
            });

            // console.log(zip);
            expect(zip.entries.length).greaterThan(0);
            for (const entry of zip.entries) {
                try {
                    await entry.blob();
                    const bytes = await entry.bytes();
                    /*if (bytes.length === 0 && !entry.isDirectory) {
                        console.warn(`Entry ${entry.name} has zero bytes`);
                    }*/
                    /*if (entry.name === "fabric.mod.json") {
                        console.log(new TextDecoder().decode(bytes));
                    }*/
                } catch (e) {
                    console.log(entry);
                    throw e;
                }
            }
        });

        /*it(`read naive ${path}`, async () => {
            const zip = await readBytes(data, { naive: true });
            console.log(zip);
        });*/
    };

    const walk = (path: string) => {
        const dir = opendirSync(path);

        let entry: Dirent | null;
        while ((entry = dir.readSync()) !== null) {
            const childPath = join(path, entry.name);

            if (entry.isFile()) {
                register(childPath);
            } else if (entry.isDirectory()) {
                walk(childPath);
            }
        }

        dir.closeSync();
    };

    walk("./samples");
});
