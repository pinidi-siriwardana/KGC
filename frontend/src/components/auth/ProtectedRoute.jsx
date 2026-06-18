import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRole }) => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (!token || !userJson) {
        return <Navigate to="/login" replace />;
    }

    const user = JSON.parse(userJson);

    if (user.role !== allowedRole) {
        return <Navigate to={`/${user.role}/dashboard`} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
