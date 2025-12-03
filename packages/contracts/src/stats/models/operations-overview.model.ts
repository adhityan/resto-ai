import { ApiProperty } from "@nestjs/swagger";

export class OperationsDataPointModel {
    @ApiProperty()
    date: string; // ISO date string YYYY-MM-DD

    @ApiProperty()
    newReservation: number;

    @ApiProperty()
    updateReservation: number;

    @ApiProperty()
    cancelReservation: number;

    @ApiProperty()
    searchReservation: number;

    constructor(data: {
        date: string;
        newReservation: number;
        updateReservation: number;
        cancelReservation: number;
        searchReservation: number;
    }) {
        this.date = data.date;
        this.newReservation = data.newReservation;
        this.updateReservation = data.updateReservation;
        this.cancelReservation = data.cancelReservation;
        this.searchReservation = data.searchReservation;
    }
}

export class OperationsOverviewResponseModel {
    @ApiProperty({ type: [OperationsDataPointModel] })
    data: OperationsDataPointModel[];

    constructor(data: OperationsDataPointModel[]) {
        this.data = data;
    }
}

