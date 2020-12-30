import express from "express";
import morgan from "morgan";
import { AppContext, Repository, ResourceMap } from "./context";
import { DynamoDB, DynamoTable } from "./data/database";
import { NodeBus, ConsoleBusDecorator } from "./cqrs";
import {
    RecalculateAllProductsAvailability,
    RecalculateProductsAvailability,
    GetAllAvailableProducts,
    SellProduct,
    ProductSold
} from "./actions";
import { initializeFromDir } from "./data/initialize";
import {
    createRecalculateAllProductsAvailabilityHandler,
    createRecalculateProductsAvailabilityHandler
} from "./actions/recalculate-products-availability";
import { createGetAllAvailableProductsHandler } from "./actions/get-all-available-products";
import { createSellProductHandler, createAdjustInventoryHandler } from "./actions/sell-products";

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
bus.consume(SellProduct, createSellProductHandler(app));
bus.consume(ProductSold, createAdjustInventoryHandler(app));

const main = async () => {
    const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";
    const PORT = +(process.env.PORT || 3000);

    if (IS_DEVELOPMENT) {
        await initializeFromDir("./specifications", app);
        app.bus.tell(new RecalculateAllProductsAvailability());
    }

    const web = express();
    web.use(express.json()); // eslint-disable-line import/no-named-as-default-member
    web.use(express.urlencoded({ extended: true })); // eslint-disable-line import/no-named-as-default-member
    web.use(morgan(IS_DEVELOPMENT ? "dev" : "combined"));
    web.get("/api/v1/articles", async (_, res) => {
        res.json(await app.repository("article").all());
    });
    web.get("/api/v1/products", async (_, res) => {
        res.json(await app.repository("product").all());
    });
    web.post("/api/v1/rpc/get-available-products", async (_, res) => {
        res.json(await bus.ask(new GetAllAvailableProducts()));
    });
    web.post("/api/v1/rpc/sell-product", async (req, res) => {
        const { product_id, amount } = req.body; // TODO: add parameter's validations
        await bus.tell(new SellProduct(product_id, amount));
        res.sendStatus(204);
    });
    web.use((_, res) => {
        res.sendStatus(404);
    });
    const server = web.listen(PORT, () => {
        console.info(`Listening at http://localhost:${PORT} ...`);
        process.on("beforeExit", () => server.close());
    });
};
main().catch((e) => console.error(e));
