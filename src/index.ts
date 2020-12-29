import { AppContext, Repository, ResourceMap } from "./context";
import { DynamoDB, DynamoTable } from "./data/database";
import { NodeBus, ConsoleBusDecorator } from "./cqrs";
import { RecalculateAllProductsAvailability, RecalculateProductsAvailability } from "./actions";
import { initializeFromDir } from "./data/initialize";
import {
    createRecalculateAllProductsAvailabilityHandler,
    createRecalculateProductsAvailabilityHandler
} from "./actions/recalculate-products-availability";

const bus = new NodeBus();
const dynamodb: DynamoDB = {};
const app: AppContext = {
    bus: new ConsoleBusDecorator(bus),
    repository<TResource extends Extract<keyof ResourceMap, string>>(
        resource: TResource
    ): Repository<ResourceMap[TResource]> {
        return new DynamoTable<ResourceMap[TResource]>(dynamodb, resource);
    }
};

bus.consume(RecalculateAllProductsAvailability, createRecalculateAllProductsAvailabilityHandler(app));
bus.consume(RecalculateProductsAvailability, createRecalculateProductsAvailabilityHandler(app));

initializeFromDir("./specifications", app)
    .then(() => {
        console.dir(dynamodb, { depth: 4 });

        app.bus.tell(new RecalculateAllProductsAvailability());

        return setTimeout(() => console.dir(dynamodb, { depth: 4 }), 2000);
    })
    .catch((e) => e);
