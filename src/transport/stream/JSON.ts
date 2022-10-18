import { TransformStream, Transformer, TransformStreamDefaultController } from "stream/web"
import * as Text from "./Text"

export class DecoderStream<T = any> extends TransformStream<string, T> {
    constructor() { super(new DecoderTransformer<T>()) }
}
export class DecoderTransformer<T = any> implements Transformer<string, T> {
    async transform(chunk: string, controller: TransformStreamDefaultController<T>) {
        const value = JSON.parse(chunk)
        if (value) controller.enqueue(value)
    }
}
export class Writer extends Text.LineWriter {
    async writeObject(value: any) {
        const encoded = JSON.stringify(value)
        await this.writeLine(encoded)
    }
}