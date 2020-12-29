import { IBus } from "./cqrs";
import { ResourceMap } from "./data/types";
export type { ResourceMap };

export type Repository<T> = {
    set(key: string, item: T): Promise<void>;
    get(key: string): Promise<T | undefined>;
    all(): Promise<T[]>;
    delete(key: string): Promise<void>;
};

export type AppContext = {
    bus: IBus;
    repository<TResource extends Extract<keyof ResourceMap, string>>(
        resource: TResource
    ): Repository<ResourceMap[TResource]>;
};
