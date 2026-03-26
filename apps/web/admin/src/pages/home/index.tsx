import { useEffect, useState } from 'react';
import {
  HomeOutlined,
  LoadingOutlined,
  SettingFilled,
  SmileOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, message, Space } from 'antd';

import { User } from '@repo/types/user';
import { getUserList } from '@/api/user.js';
import { registerApi } from '@/api/auth.js';

const Home = () => {
  const [userList, setUserList] = useState<User[]>([]);
  const getData = async () => {
    try {
      // 获取用户列表（通过封装的 API）
      const res2 = await getUserList();
      setUserList(res2.list);
    } catch (error: any) {
      console.error('请求失败了', error);
    }
  };
  useEffect(() => {
    getData();
  }, []);

  const register = async () => {
    try {
      const res = await registerApi({
        username: 'huyue' + Math.floor(Math.random() * 1000),
        email: `test${Math.floor(Math.random() * 1000)}@qq.com`,
        password: '123456',
      });

      const { accessToken, refreshToken } = res;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      message.success('注册并保存 Token 成功');
      getData();
    } catch (error: any) {
      // 拦截器已统一处理异常提示
    }
  };
  return (
    <div>
      <h1>home</h1>
      <Space>
        <HomeOutlined />
        <SettingFilled />
        <SmileOutlined />
        <SyncOutlined spin />
        <SmileOutlined />
        <LoadingOutlined />
      </Space>
      <div>
        <Button onClick={register}>注册</Button>
      </div>
      <div>
        {
          /* 使用 antd 便利下  userList */
          userList.map((item) => {
            console.log(item);
            return <div key={item.id}>{item.username}</div>;
          })
        }
      </div>
    </div>
  );
};

export default Home;
