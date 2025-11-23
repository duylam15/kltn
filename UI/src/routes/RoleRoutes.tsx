import React from 'react';
import ProtectedRoute from './ProtectedRoute';
import { ROLES } from '../constants/roles';

export const StudentRoute: React.FC<{ children: React.ReactNode }> = ({
	children
}) => (
	<ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
		{children}
	</ProtectedRoute>
);

export const TeacherRoute: React.FC<{ children: React.ReactNode }> = ({
	children
}) => (
	<ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
		{children}
	</ProtectedRoute>
);

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({
	children
}) => (
	<ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
		{children}
	</ProtectedRoute>
);

// Route cho nhiều roles
export const TeacherOrAdminRoute: React.FC<{ children: React.ReactNode }> = ({
	children
}) => (
	<ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
		{children}
	</ProtectedRoute>
);

export const AllRolesRoute: React.FC<{ children: React.ReactNode }> = ({
	children
}) => (
	<ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN]}>
		{children}
	</ProtectedRoute>
);