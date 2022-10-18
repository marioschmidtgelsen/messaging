import * as Tcp from "../Tcp"

import * as net from "net"
import { Readable, Writable } from "stream"

export interface ConnectionOptions {
    socket: net.Socket
}
export class Client implements Tcp.Client {
    #connections = new Set<Connection>()
    async close() {
        this.#connections.forEach(async (connection) => await connection.close())
    }
    async connect(address: URL) {
        let socket = new net.Socket()
        let connection = new Connection({ socket })
        this.#connections.add(connection)
        socket.once("close", () => this.#connections.delete(connection))
        await connection.connect(address)
        await this.onconnect(connection)
        return connection
    }
    get connections() { return this.#connections.values() }
    protected async onconnect(connection: Connection): Promise<void> { }
}
export class Server implements Tcp.Server {
    #server: net.Server
    #connections = new Set<Connection>()
    constructor() {
        this.#server = net.createServer()
        this.#server.on("close", async () => await this.onclose())
        this.#server.on("connection", async (socket) => {
            let connection = new Connection({ socket })
            this.#connections.add(connection)
            socket.once("close", () => this.#connections.delete(connection))
            await this.onconnection(connection)
        })
        this.#server.on("drop", async (data?) => await this.ondrop(data))
        this.#server.on("error", async (err) => await this.onerror(err))
        this.#server.on("listening", async () => await this.onlistening())
    }
    get address() {
        let addressInfo = this.#server.address()
        if (!addressInfo) throw Error("Error gathering listening address info")
        if (typeof addressInfo == "string") throw Error("Unsupported listening address info format")
        return new URL(`tcp://[${addressInfo.address}]:${addressInfo.port}`)
    }
    async close() {
        return new Promise<void>((resolve, reject) => this.#server.close(err => err ? reject() : resolve()))
    }
    get connections() { return this.#connections.values() }
    async listen() {
        return new Promise<void>((resolve) => this.#server.listen(undefined, () => resolve()))
    }
    protected async onclose(): Promise<void> { }
    protected async onconnection(connection: Connection): Promise<void> { }
    protected async ondrop(data?: net.DropArgument): Promise<void> { }
    protected async onerror(err: Error): Promise<void> { }
    protected async onlistening(): Promise<void> { }
}
export class Connection implements Tcp.Connection {
    #socket: net.Socket
    constructor(options: ConnectionOptions) {
        this.#socket = options.socket
    }
    get localAddress(): URL {
        return new URL(`tcp://[${this.#socket.localAddress}]:${this.#socket.localPort}`)
    }
    get remoteAddress(): URL {
        return new URL(`tcp://[${this.#socket.remoteAddress}]:${this.#socket.remotePort}`)
    }
    get readable() { return Readable.toWeb(this.#socket) }
    get writable() { return Writable.toWeb(this.#socket) }
    async close() {
        return new Promise<void>((resolve) => this.#socket.once("close", () => resolve()).destroy())
    }
    async connect(address: URL) {
        let options: net.TcpSocketConnectOpts = { host: address.host, port: parseInt(address.port) }
        return new Promise<void>((resolve) => this.#socket.connect(options, async () => resolve()))
    }
}