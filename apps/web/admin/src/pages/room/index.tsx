import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  message,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Card,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  KeyOutlined,
  GlobalOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { createRoom, getRooms } from '@/api/room';
import { Room } from '@repo/types/room';

// interface Room {
//   id: string;
//   title: string;
//   description: string;
//   inviteCode: string;
//   isPublic: boolean;
//   tags: string[];
//   createdAt: string;
//   owner?: {
//     username: string;
//   };
// }

export default function RoomManagement() {
  const [data, setData] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchRooms = async (page?: number, limit?: number) => {
    // 确保参数是数字，防止 React 事件对象被当作页码
    const p = typeof page === 'number' ? page : pagination.current;
    const l = typeof limit === 'number' ? limit : pagination.pageSize;

    try {
      setLoading(true);
      const res: any = await getRooms({ page: p, limit: l });
      setData(res.list || []);
      setPagination({
        current: p,
        pageSize: l,
        total: Number(res.total) || 0,
      });
    } catch (error) {
      console.error('获取房间列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms(1, 10);
  }, []);

  const handleTableChange = (pag: any) => {
    fetchRooms(pag.current, pag.pageSize);
  };

  const handleCreate = async (values: any) => {
    try {
      setLoading(true);
      await createRoom({
        ...values,
        tags: values.tags ? values.tags.split(',') : [],
      });
      message.success('房间创建成功');
      setIsModalOpen(false);
      form.resetFields();
      fetchRooms();
    } catch (error) {
      // 错误已由拦截器处理
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Room> = [
    {
      title: '房间名称',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space orientation="vertical" size={0}>
          <span style={{ fontWeight: 'bold' }}>{text}</span>
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.description}
          </span>
        </Space>
      ),
    },
    {
      title: '邀请码',
      dataIndex: 'inviteCode',
      key: 'inviteCode',
      render: (code) => (
        <Tag color="blue" icon={<KeyOutlined />}>
          {code}
        </Tag>
      ),
    },
    {
      title: '公开状态',
      dataIndex: 'isPublic',
      key: 'isPublic',
      render: (isPublic) =>
        isPublic == true ? (
          <Tag color="success" icon={<GlobalOutlined />}>
            公开
          </Tag>
        ) : (
          <Tag color="warning" icon={<LockOutlined />}>
            私密
          </Tag>
        ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space size={[0, 4]} wrap>
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            onClick={() => message.info('管理功能开发中...')}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            onClick={() => message.info('删除功能开发中...')}
          >
            删除
          </Button>
        </Space>
      ),
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
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>房间与协作管理</h2>
          <p style={{ color: '#8c8c8c', margin: '4px 0 0 0' }}>
            管理全站的实时协作房间及其实时状态
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchRooms()}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            创建房间
          </Button>
        </Space>
      </div>

      <Card
        bodyStyle={{ padding: 0 }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          size="small"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条数据`,
          }}
          onChange={handleTableChange}
          loading={loading}
          scroll={{ y: 'calc(100vh - 340px)' }}
        />
      </Card>

      <Modal
        title="创建新房间"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="title"
            label="房间名称"
            rules={[{ required: true, message: '请输入房间名' }]}
          >
            <Input placeholder="例如：前端周报协同编辑" />
          </Form.Item>
          <Form.Item name="description" label="备注描述">
            <Input.TextArea placeholder="简要说明房间用途" />
          </Form.Item>
          <Form.Item
            name="isPublic"
            label="是否公开 (公开房间可被任何人搜索发现)"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="公开" unCheckedChildren="私密" />
          </Form.Item>
          <Form.Item name="tags" label="标签 (英文逗号分隔)">
            <Input placeholder="例如：开发,设计,讨论" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
