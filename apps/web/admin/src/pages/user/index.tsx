import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Switch,
  Select,
  Button,
  message,
  Space,
  Modal,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { User, UserRole } from '@repo/types/user';
import { getUserList, updateUserRole, toggleUserActive } from '@/api/user';

export default function UserManagement() {
  const [data, setData] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchUsers = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const res: any = await getUserList({ page, limit });
      // 根据你的后端 PaginatedResponse 结构，这里可能需要适配
      // 假设结构为 { items: [], total: 0 }
      setData(res.list || []);
      setPagination({
        current: Number(res.page) || page,
        pageSize: limit,
        total: Number(res.total) || res.total || 0,
      });
    } catch (error) {
      console.error('获取用户列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);

    // 从缓存中获取当前登录用户信息
    setCurrentUser(JSON.parse(localStorage.getItem('user') || '{}'));
    console.log('currentUser', currentUser);
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchUsers(newPagination.current, newPagination.pageSize);
  };

  const handleToggleActive = async (checked: boolean, record: User) => {
    try {
      setLoading(true);
      await toggleUserActive(record.id);
      message.success(`已${checked ? '启用' : '封禁'}用户 ${record.username}`);
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (e) {
      // failed
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (value: string, record: User) => {
    Modal.confirm({
      title: '修改用户角色',
      content: `确定要把 ${record.username} 的角色修改为 ${value} 吗？`,
      onOk: async () => {
        try {
          await updateUserRole(record.id, value);
          message.success('角色修改成功');
          fetchUsers(pagination.current, pagination.pageSize);
        } catch (e) {
          // 失败拦截器会提示
        }
      },
      onCancel() {
        // 取消不操作，重置 Select 视图我们通过重新拉取或依赖驱动来解决
        fetchUsers(pagination.current, pagination.pageSize);
      },
    });
  };

  const roleColors: Record<string, string> = {
    [UserRole.USER]: 'default',
    [UserRole.ADMIN]: 'blue',
    [UserRole.SUPER_ADMIN]: 'red',
  };

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: '15%',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: '20%',
    },
    {
      title: '角色与权限',
      key: 'role',
      width: '25%',
      render: (_, record) => (
        <Space>
          <Tag color={roleColors[record.role]}>{record.role}</Tag>
          {/* 你可以选择在这里做权限管控：自己不能改自己的，只有 SUPER_ADMIN 能改别人 */}
          {/* {console.log(record, 'record')} */}
          {record.id != currentUser?.id && (
            <Select
              value={record.role}
              style={{ width: 140 }}
              onChange={(val) => handleRoleChange(val, record)}
              options={[
                { value: UserRole.USER, label: '普通用户' },
                { value: UserRole.ADMIN, label: '管理员' },
                { value: UserRole.SUPER_ADMIN, label: '超级管理员' },
              ]}
            />
          )}
        </Space>
      ),
    },
    {
      title: '账号状态',
      key: 'isActive',
      dataIndex: 'isActive',
      width: '15%',
      render: (isActive: boolean, record: User) =>
        record.id != currentUser?.id ? (
          <Switch
            checkedChildren="正常"
            unCheckedChildren="封禁"
            checked={isActive}
            onChange={(checked) => handleToggleActive(checked, record)}
          />
        ) : null,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .ant-table-wrapper .ant-table-body {
          overflow-y: auto !important;
        }
      `}</style>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <h2>用户与权限管理</h2>
        <Button
          onClick={() => fetchUsers(pagination.current, pagination.pageSize)}
        >
          刷新列表
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条数据`,
        }}
        size="small"
        loading={loading}
        onChange={handleTableChange}
        scroll={{ y: 'calc(100vh - 326px)' }}
      />
    </div>
  );
}
