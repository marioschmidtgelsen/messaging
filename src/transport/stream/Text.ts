import { WritableStreamDefaultWriter, TextDecoderStream, TextEncoderStream, TransformStream, Transformer } from "stream/web"

export class TextWriter extends WritableStreamDefaultWriter<any> {
    constructor(stream: WritableStream, readonly encoder = new TextEncoder()) { super(stream )}
    async writeText(text?: string) {
        const encoded = this.encoder.encode(text)
        await this.write(encoded)
    }
}
export class LineWriter extends TextWriter {
    constructor(stream: WritableStream, readonly linefeed = "\r\n") { super(stream) }
    async writeLine(text?: string) {
        const line = (text || "").concat(this.linefeed)
        await this.writeText(line)
    }
}
export class DecoderStream extends TextDecoderStream { }
export class EncoderStream extends TextEncoderStream { }
export class SplitStream extends TransformStream<string, string> {
    constructor(separator: string = "\r\n") { super(new SplitTransformer(separator)) }
}
export class SplitTransformer implements Transformer<string, string> {
    private buffer = ""
    constructor(readonly separator: string) { }
    async transform(chunk: string, controller: TransformStreamDefaultController<string>) {
        // Create a split array
        const splits = chunk.split(this.separator)
        // Split array with a single element (chunk does not contain the separator)
        if (splits.length == 1) {
            // Append the single element to an existing buffered text or use it as the new buffered text
            this.buffer = this.buffer.concat(splits.at(0)!)
        // Split array with multiple elements (chunk contains the separator)
        } else if (splits.length > 0) {
            // Each element except for the last element
            for (var index = 0; index < splits.length - 1; index++) {
                // First element
                if (index == 0) {
                    // Append buffered text in front of the first element end add the separator at the end
                    const text = (index == 0 ? this.buffer.concat(splits[index]) : splits[index]).concat(this.separator)
                    // Enqueue text
                    controller.enqueue(text.concat(this.separator))
                    // Clear buffered text
                    this.buffer = ""
                // Not first and non-empty element
                } else if (index > 0 && splits[index].length > 0) {
                    // Append separator at the end of the element
                    const text = splits[index].concat(this.separator)
                    // Enqueue text
                    controller.enqueue(text.concat(this.separator))
                // Last element
                } else {
                    // Append element to an existing or as the new buffered text
                    this.buffer = this.buffer.concat(splits[index])
                }
            }
        }
    }
    // TODO: Handle last chunk on closed input stream
}