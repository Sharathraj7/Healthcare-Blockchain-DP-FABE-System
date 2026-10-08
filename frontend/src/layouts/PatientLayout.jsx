import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Badge } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  UserOutlined,
  FileAddOutlined,
  FolderOutlined,
  BlockOutlined,
  LogoutOutlined,
  SecurityScanOutlined,
  LockOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext.jsx'

const { Sider, Header, Content } = Layout
const { Text } = Typography

export default function PatientLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { key: '/patient/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/patient/profile', icon: <UserOutlined />, label: 'My Profile' },
    { key: '/patient/upload-record', icon: <FileAddOutlined />, label: 'Add Medical Record' },
    { key: '/patient/records', icon: <FolderOutlined />, label: 'My Records' },
    { key: '/patient/blockchain', icon: <BlockOutlined />, label: 'Blockchain Explorer' },
  ]

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Profile', onClick: () => navigate('/patient/profile') },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout, danger: true },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        style={{
          background: '#111827',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          position: 'fixed',
          height: '100vh',
          overflow: 'auto',
          left: 0,
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 8,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1a73e8, #7c4dff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}>
            🏥
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14, fontFamily: 'Outfit' }}>
                HealthChain
              </div>
              <div style={{ color: '#64748b', fontSize: 10, marginTop: 1 }}>
                Secure Medical Records
              </div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', border: 'none' }}
        />

        {/* Security Status */}
        {!collapsed && (
          <div style={{
            position: 'absolute',
            bottom: 60,
            left: 0,
            right: 0,
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Security Status
            </div>
            {[
              { label: 'AES-256-GCM', status: 'ACTIVE', color: '#10b981' },
              { label: 'DP-FABE', status: 'PROTO', color: '#7c4dff' },
              { label: 'Blockchain', status: 'SIM', color: '#1a73e8' },
            ].map(({ label, status, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}><LockOutlined style={{ marginRight: 4 }} />{label}</span>
                <span style={{ fontSize: 10, color, fontWeight: 600 }}>{status}</span>
              </div>
            ))}
          </div>
        )}
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header style={{
          background: '#111827',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 99,
        }}>
          <Space>
            <div
              onClick={() => setCollapsed(!collapsed)}
              style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 18, padding: 8 }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          </Space>

          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Badge dot color="#10b981" offset={[-2, 32]}>
                <Avatar
                  style={{ background: 'linear-gradient(135deg, #1a73e8, #7c4dff)' }}
                  icon={<UserOutlined />}
                />
              </Badge>
              <div>
                <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
                  {user?.name}
                </div>
                <div style={{ color: '#64748b', fontSize: 11 }}>Patient</div>
              </div>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ background: '#0a0e1a', minHeight: 'calc(100vh - 64px)', padding: 0 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
