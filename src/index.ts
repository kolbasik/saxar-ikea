import { AppContext, Repository, ResourceMap } from "./context";
import { DynamoDB, DynamoTable } from "./data/database";
import { initializeFromDir } from "./data/initialize";

const dynamodb: DynamoDB = {};
const appContext: AppContext = {
    repository<TResource extends Extract<keyof ResourceMap, string>>(
        resource: TResource
    ): Repository<ResourceMap[TResource]> {
        return new DynamoTable<ResourceMap[TResource]>(dynamodb, resource);
    }
};

initializeFromDir("./specifications", appContext);

console.dir(dynamodb, { depth: 4 });
