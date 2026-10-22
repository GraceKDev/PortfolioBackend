import { ApiProperty } from "@nestjs/swagger";

export class HeartbeatDTO {

    status:"Alive" | "Dead";


    statusCode:number;
}