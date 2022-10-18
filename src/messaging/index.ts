export interface Broker {
    session(identification: string): Session
    topic<T = any>(name: string): Topic<T>
}
export interface Session {
    readonly identification: string
    publish<T>(topic: Topic<T>, data: T): Publication<T>
    subscribe<T>(topic: Topic<T>): Subscription<T>
    unsubscribe<T>(subscription: Subscription<T>): boolean
}
export interface Topic<T = any> {
    readonly broker: Broker
    readonly name: string
    publish(publisher: Session, data: T): Publication<T>
    subscribe(subscriber: Session): Subscription<T>
}
export interface Publication<T = any> {
    readonly publisher: Session
    readonly topic: Topic<T>
    readonly data: T
}
export interface Subscription<T = any> {
    readonly subscriber: Session
    readonly topic: Topic<T>
    unsubscribe(): void
}

export { createBroker } from "./Node"