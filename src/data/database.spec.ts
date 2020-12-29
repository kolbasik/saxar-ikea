import { DynamoDB, DynamoTable } from "./database";
import { v4 as uuid } from "uuid";
import assert from "assert";

type Fake = {
    uuid: string;
};

const fake = {
    uuid: (): string => uuid(),
    create: (): Fake => ({ uuid: fake.uuid() })
};

describe("DynamoTable", () => {
    let dynamodb: DynamoDB;

    beforeEach(() => {
        dynamodb = {};
    });

    it("should set and get", async () => {
        // arrange
        const table = new DynamoTable<Fake>(dynamodb, "fake");
        const expected = fake.create();

        // act
        await table.set(expected.uuid, expected);
        const actual = await table.get(expected.uuid);

        // assert
        assert.deepStrictEqual(actual, expected);
    });

    it("should set and get all", async () => {
        // arrange
        const table = new DynamoTable<Fake>(dynamodb, "fake");
        const expected = [fake.create(), fake.create(), fake.create()];

        // act
        await Promise.all(expected.map((it) => table.set(it.uuid, it)));
        const actual = await table.all();

        // assert
        assert.deepStrictEqual(actual, expected);
    });

    it("should set and delete", async () => {
        // arrange
        const table = new DynamoTable<Fake>(dynamodb, "fake");
        const subject = fake.create();

        // act
        await table.set(subject.uuid, subject);
        await table.delete(subject.uuid);
        const actual = await table.get(subject.uuid);

        // assert
        assert.strictEqual(actual, undefined);
    });
});
