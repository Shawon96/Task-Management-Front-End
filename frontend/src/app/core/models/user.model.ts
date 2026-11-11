export type UserRole = 'Admin' | 'ProjectManager' | 'TeamMember';

export const USER_ROLES: readonly UserRole[] = ['Admin', 'ProjectManager', 'TeamMember'];

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: Exclude<UserRole, 'Admin'>;
}
