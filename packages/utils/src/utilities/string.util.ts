export class StringUtils {
    public static reduceWhitespace(input: string) {
        return input
            .replace(/(?: *[\n\r])+ */g, "\n")
            .replace(/(\r\n|\n|\r)/gm, "")
            .trim();
    }

    public static sliceMiddle(input: string, maxLength: number) {
        if (input.length <= maxLength) return input;
        const mid = Math.floor(maxLength / 2);
        return input.slice(0, mid) + "..." + input.slice(-mid);
    }

    public static base64ToArrayBuffer(base64: string) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
