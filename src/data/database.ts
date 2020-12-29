import { Repository } from "../context";

export type DynamoDB = { [key: string]: unknown };

export class DynamoTable<T> implements Repository<T> {
    #prefix: string;

    constructor(private db: DynamoDB, private name: string) {
        this.#prefix = `${this.name}:`;
    }

    set(key: string, value: T): Promise<void> {
        this.db[this.#prefix + key] = value;
        return Promise.resolve();
    }

    get(key: string): Promise<T | undefined> {
        const value = this.db[this.#prefix + key] as T | undefined;
        if (typeof value !== "undefined") {
            return Promise.resolve({ ...value });
        }
        return Promise.resolve(undefined);
    }

    all(): Promise<T[]> {
        return Promise.resolve(
            Object.keys(this.db).reduce((result, key: string) => {
                if (key.startsWith(this.#prefix)) {
                    result.push({ ...(this.db[key] as T) });
                }
                return result;
            }, [] as T[])
        );
    }

    delete(key: string): Promise<void> {
        delete this.db[this.#prefix + key];
        return Promise.resolve();
    }
}
