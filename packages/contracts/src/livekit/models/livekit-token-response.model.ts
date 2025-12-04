import { ApiProperty } from "@nestjs/swagger";

export class LivekitTokenResponseModel {
    @ApiProperty()
    token: string;

    @ApiProperty()
    roomName: string;

    @ApiProperty()
    serverUrl: string;

    constructor(data: { token: string; roomName: string; serverUrl: string }) {
        this.token = data.token;
        this.roomName = data.roomName;
        this.serverUrl = data.serverUrl;
    }
}
