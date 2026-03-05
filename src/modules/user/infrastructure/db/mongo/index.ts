import mongoose from "mongoose";
import { logger } from "../../../../../shared/infrastructure/logger/logger";


export class ConnectDb {
    constructor(
        private readonly uri: string
    ){}

    public async connect(): Promise<void> {
        try {
            const conn = await mongoose.connect(this.uri);

            logger.info(`MongoDB connected: ${conn.connection.host}`);
            
        } catch (error) {
            logger.error(`MongoDB connection error: ${error}`);
            process.exit(1)
        }
    }


    public async disconnect():Promise<void> {
        try {
            await mongoose.disconnect()
        } catch (error) {
            logger.error(`MongoDB disconnection error: ${error}`);
        }
    }
}