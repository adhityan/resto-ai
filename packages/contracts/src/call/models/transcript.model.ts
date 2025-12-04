import { ApiProperty } from "@nestjs/swagger";
import { Speaker } from "@repo/database";

export class TranscriptItemModel {
    @ApiProperty({ description: "Transcript ID" })
    id: string;

    @ApiProperty({ description: "Speaker type", enum: Speaker })
    speaker: Speaker;

    @ApiProperty({ description: "Transcript contents" })
    contents: string;

    @ApiProperty({ description: "Whether the speaker was interrupted" })
    wasInterupted: boolean;

    @ApiProperty({ description: "Timestamp of the transcript entry" })
    time: Date;

    constructor(data: any) {
        this.id = data.id;
        this.speaker = data.speaker as Speaker;
        this.contents = data.contents;
        this.wasInterupted = data.wasInterupted;
        this.time = data.time;
    }
}

export class TranscriptListResponseModel {
    @ApiProperty({ type: [TranscriptItemModel] })
    items: TranscriptItemModel[];

    @ApiProperty({ description: "Total count of transcripts" })
    total: number;

    constructor(items: TranscriptItemModel[], total: number) {
        this.items = items;
        this.total = total;
    }
}
