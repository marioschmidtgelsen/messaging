export * as Node from "./tcp/Node"

import { ReadableStream, WritableStream } from "stream/web"

export interface Client {
    readonly connections: IterableIterator<Connection>
    connect(address: URL): Promise<Connection>
}
export interface Server {
    readonly address: URL
    readonly connections: IterableIterator<Connection>
    listen(): Promise<void>
    close(): Promise<void>
}
export interface Connection {
    readonly localAddress: URL
    readonly remoteAddress: URL
    readonly readable: ReadableStream<any>
    readonly writable: WritableStream<any>
    connect(address: URL): Promise<void>
    close(): Promise<void>
}