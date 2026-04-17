import React, { useEffect, useState } from 'react';
import userService from '../../services/userService';
import { normalizeUser } from '../../utils/normalizers';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await userService.getAll();
                setUsers(Array.isArray(data) ? data.map(normalizeUser) : []);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-gray-500">Loading users...</div>;
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-black mb-6">User Database</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                    <thead className="text-xs uppercase bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">User</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Subscription</th>
                            <th className="px-4 py-3 rounded-r-lg text-right">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-black">{user.name}</td>
                                <td className="px-4 py-3">{user.email}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-600">
                                        {user.subscriptionPlan}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-400 text-xs font-medium">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserList;
