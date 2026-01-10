export * from './auth.service';
import { AuthService } from './auth.service';
export * from './enrollments.service';
import { EnrollmentsService } from './enrollments.service';
export * from './me.service';
import { MeService } from './me.service';
export * from './user.service';
import { UserService } from './user.service';
export const APIS = [AuthService, EnrollmentsService, MeService, UserService];
