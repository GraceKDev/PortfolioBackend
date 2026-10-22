import { Controller, Get, HttpCode, HttpException, HttpStatus } from "@nestjs/common";
import { HeartbeatDTO } from "../dto/heartbeatDTO.js";

@Controller("Heartbeat")
export class HeartbeatController {
    @Get()
    getHeartbeat(): HeartbeatDTO {
        try {
            return {
                status: "Alive",
                statusCode: HttpStatus.OK
            };
        } catch (error) {
            throw new HttpException(
                {
                    status: "Dead",
                    statusCode: HttpStatus.BAD_REQUEST
                },
                HttpStatus.BAD_REQUEST,
                { cause: error }
            );
        }
    }
}