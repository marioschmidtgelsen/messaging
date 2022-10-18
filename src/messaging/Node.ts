/**
 * Message broker reference implementation using node-style callback event listener.
 */
import * as Messaging from "./index"

export function createBroker() {
    return new Broker()
}

interface PublishEventListener<T = any> {
    (publication: Publication<T>): void
} 
interface SubscribeEventListener<T = any> {
    (subscription: Subscription<T>): void
}
interface UnsubscribeEventListener<T = any> {
    (subscription: Subscription<T>): void
}
class Broker implements Messaging.Broker {
    #listeners = { "publish": new Set<PublishEventListener>() }
    #sessions = new Map<string, Session>()
    #topics = new Map<string, Topic>()
    session(identification: string) {
        let session = new Session(identification)
        this.#sessions.set(identification, session)
        session.on("publish", (publication) => this.emit("publish", publication))
        return session
    }
    topic<T = any>(name: string) {
        const topic = new Topic<T>(this, name)
        this.#topics.set(name, topic)
        return topic
    }
    on<T>(name: "publish", listener: PublishEventListener<T>): void { this.#listeners[name].add(listener) }
    off<T>(name: "publish", listener: PublishEventListener<T>): boolean { return this.#listeners[name].delete(listener) }
    protected emit<T>(name: "publish", publication: Publication<T>): void { this.#listeners[name].forEach((listener) => listener(publication)) }
}
class Session implements Messaging.Session {
    #listeners = {
        "publish": new Set<PublishEventListener>(),
        "subscribe": new Set<SubscribeEventListener>(),
        "unsubscribe": new Set<UnsubscribeEventListener>()
    }
    #subscriptions = new Set<Subscription>()
    constructor(readonly identification: string) { }
    close() { this.#subscriptions.forEach(subscription => subscription.unsubscribe()) }
    publish<T>(topic: Topic<T>, data: T): Publication<T> {
        const publication = new Publication(this, topic, data)
        this.emit("publish", publication)
        return publication
    }
    subscribe<T>(topic: Topic<T>) {
        const subscription = new Subscription(this, topic)
        this.#subscriptions.add(subscription)
        this.emit("subscribe", subscription)
        return subscription
    }
    unsubscribe<T>(subscription: Subscription<T>) {
        let result = this.#subscriptions.delete(subscription)
        if (result) this.emit("unsubscribe", subscription)
        return result
    }
    on<T>(name: "publish", listener: PublishEventListener<T>): void
    on<T>(name: "subscribe", listener: SubscribeEventListener<T>): void
    on<T>(name: "unsubscribe", listener: UnsubscribeEventListener<T>): void
    on(name: "publish" | "subscribe" | "unsubscribe", listener: any) {
        this.#listeners[name].add(listener)
    }
    off<T>(name: "publish", listener: PublishEventListener<T>): boolean
    off<T>(name: "subscribe", listener: SubscribeEventListener<T>): boolean
    off<T>(name: "unsubscribe", listener: UnsubscribeEventListener<T>): boolean
    off(name: "publish" | "subscribe" | "unsubscribe", listener: any): boolean {
        return this.#listeners[name].delete(listener)
    }
    protected emit<T>(name: "publish", publication: Publication<T>): void
    protected emit<T>(name: "subscribe", subscription: Subscription<T>): void
    protected emit<T>(name: "unsubscribe", subscription: Subscription<T>): void
    protected emit(name: "publish" | "subscribe" | "unsubscribe", data: any): void {
        this.#listeners[name].forEach((listener) => listener(data))
    }
}
class Topic<T = any> implements Messaging.Topic {
    #listeners = { "publish": new Set<PublishEventListener>() }
    constructor(readonly broker: Broker, readonly name: string) {
        this.broker.on<T>("publish", (publication) => publication.topic.name == name && this.emit("publish", publication))
    }
    publish(publisher: Session, data: T): Publication<T> { return publisher.publish(this, data) }
    subscribe(subscriber: Session): Subscription<T> { return subscriber.subscribe(this) }
    on(name: "publish", listener: PublishEventListener<T>): void { this.#listeners[name].add(listener) }
    off(name: "publish", listener: PublishEventListener<T>): boolean { return this.#listeners[name].delete(listener) }
    protected emit(name: "publish", publication: Publication<T>): void { this.#listeners[name].forEach((listener) => listener(publication)) }
}
class Publication<T = any> implements Messaging.Publication<T> {
    constructor(readonly publisher: Session, readonly topic: Topic<T>, readonly data: T) { }
}
class Subscription<T = any> implements Subscription<T> {
    #listeners = { "publish": new Set<PublishEventListener>() }
    #publishListener = (publication: Publication<T>) => this.emit("publish", publication)
    constructor(readonly subscriber: Session, readonly topic: Topic<T>) {
        this.topic.on("publish", this.#publishListener)
    }
    unsubscribe() {
        this.topic.off("publish", this.#publishListener)
        this.subscriber.unsubscribe(this)
    }
    on(name: "publish", listener: PublishEventListener<T>): void { this.#listeners[name].add(listener) }
    off(name: "publish", listener: PublishEventListener<T>): boolean { return this.#listeners[name].delete(listener) }
    protected emit(name: "publish", publication: Publication<T>): void { this.#listeners[name].forEach((listener) => listener(publication)) }
}