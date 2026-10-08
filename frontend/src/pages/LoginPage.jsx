import React, { useState } from 'react'
import { Form, Input, Button, Select, Tabs, message, Typography, Space, Alert, Divider, Row, Col } from 'antd'
import {
  UserOutlined, LockOutlined, MedicineBoxOutlined,
  SafetyCertificateOutlined, SecurityScanOutlined, WarningOutlined
} from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const { Title, Text } = Typography
const { TabPane } = Tabs

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('patient')
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      let response
      if (activeTab === 'patient') {
        response = await authAPI.loginPatient(values)
        const { patient, token } = response.data.data
        login(patient, token)
        message.success(`Welcome back, ${patient.name}!`)
        navigate('/patient/dashboard')
      } else {
        response = await authAPI.loginDoctor(values)
        const { doctor, token } = response.data.data
        login(doctor, token)
        message.success(`Welcome, ${doctor.name}!`)
        navigate('/doctor/dashboard')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Login failed. Please try again.'
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26, 115, 232, 0.08) 0%, transparent 70%)',
        top: '-200px',
        right: '-200px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124, 77, 255, 0.06) 0%, transparent 70%)',
        bottom: '-100px',
        left: '-100px',
        pointerEvents: 'none',
      }} />

      <Row style={{ width: '100%', maxWidth: 1100, zIndex: 1 }} align="middle" gutter={[48, 48]}>
        {/* Left side - Branding */}
        <Col xs={0} md={12}>
          <Space direction="vertical" size={24}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #1a73e8, #7c4dff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                boxShadow: '0 8px 32px rgba(26, 115, 232, 0.4)',
              }}>
                🏥
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontFamily: 'Outfit', color: '#f1f5f9' }}>
                  HealthChain
                </Title>
                <Text style={{ color: '#64748b' }}>Blockchain-Based Secure Healthcare</Text>
              </div>
            </div>

            <div>
              <Title level={1} style={{ color: '#f1f5f9', fontFamily: 'Outfit', lineHeight: 1.2, marginBottom: 16 }}>
                Your Medical Data.<br />
                <span style={{ background: 'linear-gradient(135deg, #1a73e8, #7c4dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Protected by Blockchain.
                </span>
              </Title>
              <Text style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.7 }}>
                Phase 1 Prototype: Secure medical records with AES-256-GCM encryption,
                DP-FABE dual-privilege access control, and simulated blockchain storage.
              </Text>
            </div>

            <Row gutter={[16, 16]}>
              {[
                { icon: <SecurityScanOutlined />, title: 'AES-256-GCM', desc: 'Military-grade encryption', color: '#10b981' },
                { icon: <SafetyCertificateOutlined />, title: 'DP-FABE', desc: 'Dual-privilege access', color: '#1a73e8' },
                { icon: <MedicineBoxOutlined />, title: 'Blockchain', desc: 'Immutable audit trail', color: '#7c4dff' },
              ].map(({ icon, title, desc, color }) => (
                <Col span={8} key={title}>
                  <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '16px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                  }}>
                    <div style={{ fontSize: 24, color, marginBottom: 8 }}>{icon}</div>
                    <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>{title}</div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{desc}</div>
                  </div>
                </Col>
              ))}
            </Row>

            <Alert
              icon={<WarningOutlined />}
              message="Phase 1 Prototype"
              description="This is a research prototype. DP-FABE policy enforcement is simulated. AES-256-GCM encryption is real."
              type="info"
              showIcon
              style={{
                background: 'rgba(26, 115, 232, 0.08)',
                border: '1px solid rgba(26, 115, 232, 0.2)',
                borderRadius: 10,
              }}
            />
          </Space>
        </Col>

        {/* Right side - Login Form */}
        <Col xs={24} md={12}>
          <div style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '36px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Title level={3} style={{ color: '#f1f5f9', margin: 0, fontFamily: 'Outfit' }}>
                Sign In
              </Title>
              <Text style={{ color: '#64748b' }}>
                Access your secure healthcare portal
              </Text>
            </div>

            <Tabs
              activeKey={activeTab}
              onChange={(key) => { setActiveTab(key); form.resetFields() }}
              centered
              style={{ marginBottom: 24 }}
              items={[
                {
                  key: 'patient',
                  label: (
                    <Space>
                      <UserOutlined />
                      Patient
                    </Space>
                  ),
                },
                {
                  key: 'doctor',
                  label: (
                    <Space>
                      <MedicineBoxOutlined />
                      Doctor
                    </Space>
                  ),
                },
              ]}
            />

            <Form
              form={form}
              onFinish={handleLogin}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                label={<span style={{ color: '#94a3b8' }}>Email Address</span>}
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Enter a valid email' },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#64748b' }} />}
                  placeholder="Enter your email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span style={{ color: '#94a3b8' }}>Password</span>}
                rules={[{ required: true, message: 'Password is required' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#64748b' }} />}
                  placeholder="Enter your password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  style={{
                    height: 48,
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 16,
                  }}
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
              </Form.Item>

              {activeTab === 'patient' && (
                <>
                  <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#64748b', fontSize: 12 }}>
                    New patient?
                  </Divider>
                  <Link to="/register">
                    <Button block size="large" style={{
                      height: 44,
                      borderRadius: 10,
                      borderColor: 'rgba(26, 115, 232, 0.4)',
                      color: '#1a73e8',
                      background: 'rgba(26, 115, 232, 0.08)',
                    }}>
                      Register as Patient
                    </Button>
                  </Link>
                </>
              )}
            </Form>

            {/* Demo Credentials */}
            <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', marginTop: 24 }} />
            <div style={{
              background: 'rgba(124, 77, 255, 0.08)',
              border: '1px solid rgba(124, 77, 255, 0.2)',
              borderRadius: 10,
              padding: 16,
            }}>
              <Text style={{ color: '#7c4dff', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                🔑 DEMO CREDENTIALS (Development Only)
              </Text>
              {activeTab === 'doctor' ? (
                <div>
                  <Text code style={{ fontSize: 11, display: 'block' }}>doctor@example.com</Text>
                  <Text code style={{ fontSize: 11 }}>DemoDoctor@123</Text>
                </div>
              ) : (
                <div>
                  <Text code style={{ fontSize: 11, display: 'block' }}>patient@example.com</Text>
                  <Text code style={{ fontSize: 11 }}>DemoPatient@123</Text>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}
