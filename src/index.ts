import { AppContext, Repository, ResourceMap } from "./context";
import { DynamoDB, DynamoTable } from "./data/database";
import { NodeBus, ConsoleBusDecorator } from "./cqrs";
import {
    RecalculateAllProductsAvailability,
    RecalculateProductsAvailability,
    GetAllAvailableProducts
} from "./actions";
import { initializeFromDir } from "./data/initialize";
import {
    createRecalculateAllProductsAvailabilityHandler,
    createRecalculateProductsAvailabilityHandler
} from "./actions/recalculate-products-availability";
import { createGetAllAvailableProductsHandler } from "./actions/get-all-available-products";

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
bus.consume(GetAllAvailableProducts, createGetAllAvailableProductsHandler(app));

initializeFromDir("./specifications", app)
    .then(async () => {
        console.group("Initial data");
        console.dir(dynamodb, { depth: 4 });
        console.groupEnd();

        console.group("Recalculate availability...");
        bus.tell(new RecalculateAllProductsAvailability());
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.dir(dynamodb, { depth: 4 });
        console.groupEnd();

        console.group("Get all available products...");
        const availableProducts = await bus.ask(new GetAllAvailableProducts());
        console.dir(availableProducts);
        console.groupEnd();
        return;
    })
    .catch((e) => e);
