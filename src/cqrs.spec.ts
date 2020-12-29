import assert from "assert";
import { Command, Event, Query, NodeBus } from "./cqrs";

describe("NodeBus", () => {
    describe("Command", () => {
        it("should register a command handler and handle a command", async () => {
            // arrange
            class TestCommand extends Command {
                constructor(public readonly value: number) {
                    super();
                }
            }
            const command = new TestCommand(Math.random());
            const expected = [command];
            const bus = new NodeBus();

            // act
            const handlers: Promise<TestCommand>[] = [];
            for (let i = 0; i < expected.length; ++i) {
                handlers.push(
                    new Promise((resolve) => {
                        bus.consume(TestCommand, async (command) => resolve(command));
                    })
                );
            }
            bus.tell(command);
            const actual = await Promise.all(handlers);

            // assert
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe("Event", () => {
        it("should register multiple event handlers and handle events", async () => {
            // arrange
            class TestEvent extends Event {}
            const event = new TestEvent();
            const expected = [event, event, event];
            const bus = new NodeBus();

            // act
            const handlers: Promise<TestEvent>[] = [];
            for (let i = 0; i < expected.length; ++i) {
                handlers.push(
                    new Promise((resolve) => {
                        bus.consume(TestEvent, async (event) => resolve(event));
                    })
                );
            }
            bus.emit(event);
            const actual = await Promise.all(handlers);

            // assert
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe("Query", () => {
        it("should register a query handler and handle a query", async () => {
            // arrange
            class TestQuery extends Query<number> {
                constructor(public readonly value: number) {
                    super();
                }
            }
            const expected = Math.random();
            const query = new TestQuery(expected);
            const bus = new NodeBus();

            // act
            bus.consume(TestQuery, async (query: TestQuery) => {
                return query.value;
            });
            const actual = await bus.ask(query);

            // assert
            assert.strictEqual(actual, expected);
        });
    });
});
