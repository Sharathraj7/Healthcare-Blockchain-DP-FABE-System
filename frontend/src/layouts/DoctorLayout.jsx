import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Space, Badge } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  TeamOutlined,
  AuditOutlined,
  BlockOutlined,
  LogoutOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext.jsx'

const { Sider, Header, Content } = Layout

export default function DoctorLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { key: '/doctor/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/doctor/patients', icon: <TeamOutlined />, label: 'Patients' },
    { key: '/doctor/audit-logs', icon: <AuditOutlined />, label: 'Audit Logs' },
    { key: '/doctor/blockchain', icon: <BlockOutlined />, label: 'Blockchain Explorer' },
  ]

  const userMenu = {
    items: [
      { key: 'info', label: `${user?.specialization || 'Doctor'} | ${user?.hospital || ''}`, disabled: true },
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
          background: '#0f1923',
          borderRight: '1px solid rgba(255,255,255,0.06)',
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
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 8,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #00c6a9, #1a73e8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}>
            <MedicineBoxOutlined style={{ color: 'white' }} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14, fontFamily: 'Outfit' }}>
                HealthChain
              </div>
              <div style={{ color: '#64748b', fontSize: 10, marginTop: 1 }}>
                Doctor Portal
              </div>
            </div>
          )}
        </div>

        {/* Doctor Info */}
        {!collapsed && (
          <div style={{ padding: '12px 16px', marginBottom: 8 }}>
            <div style={{ background: 'rgba(0, 198, 169, 0.1)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(0, 198, 169, 0.2)' }}>
              <div style={{ color: '#00c6a9', fontSize: 11, fontWeight: 600 }}>
                <SafetyOutlined style={{ marginRight: 4 }} />
                {user?.specialization || 'DOCTOR'}
              </div>
              <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>
                {user?.hospital || 'Medical Center'}
              </div>
            </div>
          </div>
        )}

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', border: 'none' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header style={{
          background: '#0f1923',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
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
              <Badge dot color="#00c6a9" offset={[-2, 32]}>
                <Avatar
                  style={{ background: 'linear-gradient(135deg, #00c6a9, #1a73e8)' }}
                  icon={<UserOutlined />}
                />
              </Badge>
              <div>
                <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
                  {user?.name}
                </div>
                <div style={{ color: '#64748b', fontSize: 11 }}>Doctor</div>
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
