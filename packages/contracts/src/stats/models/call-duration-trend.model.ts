import { ApiProperty } from "@nestjs/swagger";

export class CallDurationDataPointModel {
    @ApiProperty()
    date: string; // ISO date string YYYY-MM-DD

    @ApiProperty()
    totalDuration: number; // in minutes

    @ApiProperty()
    callCount: number;

    constructor(data: { date: string; totalDuration: number; callCount: number }) {
        this.date = data.date;
        this.totalDuration = data.totalDuration;
        this.callCount = data.callCount;
    }
}

export class CallDurationTrendResponseModel {
    @ApiProperty({ type: [CallDurationDataPointModel] })
    data: CallDurationDataPointModel[];

    constructor(data: CallDurationDataPointModel[]) {
        this.data = data;
    }
}

