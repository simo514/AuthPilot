import { useEffect } from 'react';
import { Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserStore } from '../../store/useUserStore';

export function ManagerDashboard() {
  const { user: currentUser } = useAuthStore();
  const { users: teamMembers, fetchUsers } = useUserStore();

  useEffect(() => {
    // Tenant context automatically filters to show only organization users
    fetchUsers();
  }, [fetchUsers]);

  // Count team members
  const teamMembersCount = teamMembers.length;

  // Count active today (users whose lastLoginAt is today)
  const activeToday = teamMembers.filter(member => {
    if (!member.lastLoginAt) return false;
    const lastLogin = new Date(member.lastLoginAt);
    const today = new Date();
    return (
      lastLogin.getDate() === today.getDate() &&
      lastLogin.getMonth() === today.getMonth() &&
      lastLogin.getFullYear() === today.getFullYear()
    );
  }).length;

  const stats = [
    {
      title: 'Team Members',
      value: teamMembersCount.toString(),
      change: `${teamMembersCount} total`,
      changeType: 'positive',
      icon: Users
    },
    {
      title: 'Active Today',
      value: activeToday.toString(),
      change: 'Logged in today',
      changeType: 'positive',
      icon: CheckCircle
    },
    {
      title: 'Pending Tasks',
      value: '3',
      change: '-1',
      changeType: 'positive',
      icon: Clock
    },
    {
      title: 'Issues',
      value: '1',
      change: '0',
      changeType: 'neutral',
      icon: AlertCircle
    }
  ];

  const getStatusColor = (member: any) => {
    if (!member.lastLoginAt) return 'bg-gray-400';
    
    const lastLogin = new Date(member.lastLoginAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastLogin.getTime()) / (1000 * 60);
    
    if (diffMinutes < 30) return 'bg-green-500'; // Online - logged in within last 30 minutes
    if (diffMinutes < 120) return 'bg-yellow-500'; // Away - logged in within last 2 hours
    return 'bg-gray-400'; // Offline
  };

  const getLastSeenText = (member: any) => {
    if (!member.lastLoginAt) return 'Never logged in';
    
    const lastLogin = new Date(member.lastLoginAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastLogin.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return 'Active now';
    if (diffMinutes < 60) return `${Math.floor(diffMinutes)} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return lastLogin.toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manager Dashboard</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {currentUser?.department || 'General Department'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className={`text-sm font-medium ${
                  stat.changeType === 'positive' 
                    ? 'text-green-600 dark:text-green-400' 
                    : stat.changeType === 'negative'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {stat.change} this week
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full">
                <stat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {teamMembers.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No team members found
              </p>
            ) : (
              teamMembers.map((member) => (
                <div key={member.uuid} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {member.fullName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member)} rounded-full border-2 border-white dark:border-gray-800`}></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.fullName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.role} {member.department && `• ${member.department}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getLastSeenText(member)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Tasks</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Code review completed
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Alice Johnson • 2 hours ago
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Design review pending
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bob Smith • 4 hours ago
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Weekly standup scheduled
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tomorrow at 9:00 AM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}