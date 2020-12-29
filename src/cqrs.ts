import { EventEmitter } from "events";
import debug from "debug";

export const HiddenResultSymbol = Symbol("HiddenResult");
export interface IReturn<TResult> {
    readonly [HiddenResultSymbol]?: TResult; // NOTE: typescript lost the TResult type otherwise
}

export class Message {
    public readonly type: string;
    constructor() {
        this.type = this.constructor.name;
    }
    toString(): string {
        return JSON.stringify(this);
    }
}
export class Command extends Message {}
export class Event extends Message {}
export class Query<TResult> extends Message implements IReturn<TResult> {
    readonly [HiddenResultSymbol]?: TResult;
}

export interface IBus {
    tell<TCommand extends Command>(command: TCommand): void;
    emit<TEvent extends Event>(event: TEvent): void;
    ask<TQuery extends Query<unknown>, TResult = TQuery extends IReturn<infer TInfer> ? TInfer : void>(
        query: TQuery
    ): Promise<TResult>;
}

export class NodeBus implements IBus {
    private emitter: EventEmitter = new EventEmitter();

    consume<TMessage extends Message>(
        type: { new (...args: never[]): TMessage },
        handle: (message: TMessage) => Promise<TMessage extends IReturn<infer TInfer> ? TInfer : void>
    ): () => void {
        const listener = (
            message: TMessage,
            resolve?: (result: unknown) => void,
            reject?: (reason: unknown) => void
        ) => {
            const pipe = Promise.resolve().then(() => handle(message));
            const task: Promise<unknown> = resolve && reject ? pipe.then(resolve, reject) : pipe;
            task.catch((error: unknown) => console.warn(`BUS: %o %o`, message, error));
        };
        this.emitter.on(type.name, listener);
        return () => this.emitter.off(type.name, listener);
    }

    emit<TEvent extends Event>(event: TEvent): void {
        this.emitter.emit(event.type, event);
    }

    tell<TCommand extends Command>(command: TCommand): void {
        if (!this.emitter.emit(command.type, command)) {
            throw new Error(`The ${command.type} command handler is not registered.`);
        }
    }

    ask<TQuery extends Query<unknown>, TResult = TQuery extends IReturn<infer TInfer> ? TInfer : void>(
        query: TQuery
    ): Promise<TResult> {
        return new Promise<TResult>((resolve, reject) => {
            if (!this.emitter.emit(query.type, query, resolve, reject)) {
                reject(new Error(`The ${query.type} query handler is not registered.`));
            }
        });
    }
}

export class ConsoleBusDecorator implements IBus {
    private group = 0;
    private log = debug("BUS");
    constructor(private readonly original: IBus) {}
    tell<TCommand extends Command>(command: TCommand): void {
        const group = ++this.group;
        try {
            this.log(`tell():${group}:begin:%o`, command);
            this.original.tell(command);
        } catch (error) {
            this.log(`tell():${group}:error:%o`, error);
            throw error;
        } finally {
            this.log(`tell():${group}:end:`);
        }
    }
    emit<TEvent extends Event>(event: TEvent): void {
        const group = ++this.group;
        try {
            this.log(`emit():${group}:begin:%o`, event);
            this.original.emit(event);
        } catch (error) {
            this.log(`emit():${group}:error:%o`, error);
            throw error;
        } finally {
            this.log(`emit():${group}:end:`);
        }
    }
    async ask<TQuery extends Query<unknown>, TResult = TQuery extends IReturn<infer TInfer> ? TInfer : void>(
        query: TQuery
    ): Promise<TResult> {
        const group = ++this.group;
        try {
            this.log(`ask():${group}:begin:%o`, query);
            const result = await this.original.ask(query);
            this.log(`ask():${group}:result:%o`, result);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return result as any; // TODO: please, fix typescript check
        } catch (error) {
            this.log(`ask():${group}:error:%o`, error);
            throw error;
        } finally {
            this.log(`ask():${group}:end:`);
        }
    }
}
