import { ApiProperty } from "@nestjs/swagger";

export class StatCardModel {
    @ApiProperty()
    current: number;

    @ApiProperty()
    changePct: number;

    constructor(data: { current: number; changePct: number }) {
        this.current = data.current;
        this.changePct = data.changePct;
    }
}

export class DashboardResponseModel {
    @ApiProperty({ type: StatCardModel })
    totalReservations: StatCardModel;

    @ApiProperty({ type: StatCardModel })
    totalCalls: StatCardModel;

    @ApiProperty({ type: StatCardModel })
    totalCallDuration: StatCardModel; // in minutes

    @ApiProperty({ type: StatCardModel })
    managerEscalations: StatCardModel;

    constructor(data: {
        totalReservations: { current: number; changePct: number };
        totalCalls: { current: number; changePct: number };
        totalCallDuration: { current: number; changePct: number };
        managerEscalations: { current: number; changePct: number };
    }) {
        this.totalReservations = new StatCardModel(data.totalReservations);
        this.totalCalls = new StatCardModel(data.totalCalls);
        this.totalCallDuration = new StatCardModel(data.totalCallDuration);
        this.managerEscalations = new StatCardModel(data.managerEscalations);
    }
}

