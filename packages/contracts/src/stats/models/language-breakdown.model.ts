import { ApiProperty } from "@nestjs/swagger";

export class LanguageDataPointModel {
    @ApiProperty()
    date: string; // ISO date string YYYY-MM-DD

    @ApiProperty()
    language: string;

    @ApiProperty()
    count: number;

    constructor(data: { date: string; language: string; count: number }) {
        this.date = data.date;
        this.language = data.language;
        this.count = data.count;
    }
}

export class LanguageBreakdownResponseModel {
    @ApiProperty({ type: [LanguageDataPointModel] })
    data: LanguageDataPointModel[];

    @ApiProperty()
    totalByLanguage: Record<string, number>;

    constructor(data: LanguageDataPointModel[], totalByLanguage: Record<string, number>) {
        this.data = data;
        this.totalByLanguage = totalByLanguage;
    }
}

