import { Inject, Injectable, Logger } from "@nestjs/common";
import { DatabaseService, User, UserType } from "@repo/database";
import { CannotDeleteSelfError } from "../../errors";

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    @Inject()
    private readonly databaseService: DatabaseService;

    public async createUser(name: string, email: string, passwordHash: string, type: UserType): Promise<User> {
        this.logger.log(`Creating user: ${name}, ${email}`);

        return this.databaseService.user.create({
            data: {
                name,
                email,
                passwordHash,
                type,
                isActive: true,
            },
        });
    }

    public async updateUserPassword(userId: string, passwordHash: string): Promise<User> {
        this.logger.log(`Updating user password: ${userId}`);
        return this.databaseService.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    }

    public async findUserByEmail(email: string): Promise<User | null> {
        this.logger.log(`Finding user by email: ${email}`);
        return this.databaseService.user.findUnique({
            where: { email, isActive: true },
        });
    }

    public async findUserById(id: string): Promise<User | null> {
        this.logger.log(`Finding user by id: ${id}`);
        return this.databaseService.user.findUnique({
            where: { id, isActive: true },
        });
    }

    public async getUsers(): Promise<User[]> {
        this.logger.log("Fetching all users");
        return this.databaseService.user.findMany();
    }

    public async deleteUser(id: string, currentUserId: string): Promise<User> {
        this.logger.log(`Deactivating user by id: ${id}`);

        if (id === currentUserId) {
            throw new CannotDeleteSelfError({ userId: id });
        }

        return this.databaseService.user.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
