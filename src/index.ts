import * as Messaging from "./messaging"

enum PresenceState {
    ABSENT = 0,
    PRESENT = 1
}
interface Presence {
    name: string
    state: PresenceState
}

(async function main() {
    const broker = Messaging.createBroker()
    const topic = broker.topic<Presence>("presence")
    const consumer = broker.session("consumer")
    const subscription = consumer.subscribe(topic)
    subscription.on("publish", (publication) => console.info(publication))
    const producer =  broker.session("producer")
    producer.publish(topic, { name: "Alice", state: PresenceState.PRESENT })
    producer.publish(topic, { name: "Bob", state: PresenceState.PRESENT })
    producer.publish(topic, { name: "Charlie", state: PresenceState.PRESENT })
    producer.publish(topic, { name: "Charlie", state: PresenceState.ABSENT })
    producer.publish(topic, { name: "Bob", state: PresenceState.ABSENT })
    producer.publish(topic, { name: "Alice", state: PresenceState.ABSENT })
    producer.close()
    consumer.close()
})().catch(console.error)