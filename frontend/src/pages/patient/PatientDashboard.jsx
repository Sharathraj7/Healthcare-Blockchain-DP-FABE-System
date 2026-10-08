import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Tag, Button, Typography, Space, Spin, Alert } from 'antd'
import {
  FileProtectOutlined, LockOutlined, BlockOutlined, DatabaseOutlined,
  PlusOutlined, UserOutlined, SafetyCertificateOutlined, CheckCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { patientAPI } from '../../services/api.js'

const { Title, Text } = Typography

export default function PatientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    patientAPI.getRecords().then(res => {
      setRecords(res.data.data.records)
    }).finally(() => setLoading(false))
  }, [])

  const securityFeatures = [
    { label: 'Encryption', value: 'AES-256-GCM', status: 'ACTIVE', color: '#10b981', icon: <LockOutlined /> },
    { label: 'Blockchain', value: 'Simulated', status: 'ACTIVE', color: '#1a73e8', icon: <BlockOutlined /> },
    { label: 'IPFS Storage', value: 'Simulated', status: 'SIMULATED', color: '#7c4dff', icon: <DatabaseOutlined /> },
    { label: 'DP-FABE', value: 'Prototype', status: 'PROTOTYPE', color: '#f59e0b', icon: <SafetyCertificateOutlined /> },
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 32, animation: 'fadeInUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #1a73e8, #7c4dff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}>
            <UserOutlined style={{ color: 'white' }} />
          </div>
          <div>
            <Title level={3} style={{ color: '#f1f5f9', margin: 0, fontFamily: 'Outfit' }}>
              Welcome back, {user?.name?.split(' ')[0]}!
            </Title>
            <Text style={{ color: '#64748b' }}>
              Your medical data is secured with blockchain encryption
            </Text>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {[
          {
            title: 'Medical Records',
            value: records.length,
            suffix: 'records',
            color: '#1a73e8',
            icon: <FileProtectOutlined style={{ fontSize: 24, color: '#1a73e8' }} />,
          },
          {
            title: 'Encrypted Records',
            value: records.filter(r => r.encryptionStatus === 'ENCRYPTED').length,
            suffix: 'encrypted',
            color: '#10b981',
            icon: <LockOutlined style={{ fontSize: 24, color: '#10b981' }} />,
          },
          {
            title: 'Blockchain Blocks',
            value: records.length + 1,
            suffix: 'blocks',
            color: '#7c4dff',
            icon: <BlockOutlined style={{ fontSize: 24, color: '#7c4dff' }} />,
          },
        ].map((stat, i) => (
          <Col xs={24} sm={8} key={i}>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>{stat.title}</Text>
                {stat.icon}
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                {loading ? '—' : stat.value}
              </div>
              <Text style={{ color: '#64748b', fontSize: 12 }}>{stat.suffix}</Text>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={[20, 20]}>
        {/* Profile Summary */}
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ color: '#f1f5f9' }}>Profile Summary</span>}
            extra={<Button type="link" onClick={() => navigate('/patient/profile')} style={{ color: '#1a73e8' }}>Edit</Button>}
          >
            <Row gutter={[0, 12]}>
              {[
                { label: 'Name', value: user?.name },
                { label: 'Age', value: user?.age ? `${user.age} years` : '—' },
                { label: 'Gender', value: user?.gender },
                { label: 'Height / Weight', value: user?.height ? `${user.height} cm / ${user.weight} kg` : '—' },
                { label: 'Blood Group', value: user?.bloodGroup },
                { label: 'Disease / Condition', value: user?.diseaseType },
              ].map(({ label, value }) => (
                <Col span={24} key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <Text style={{ color: '#64748b', fontSize: 13 }}>{label}</Text>
                    <Text style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{value || '—'}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Security Status */}
        <Col xs={24} lg={12}>
          <Card title={<span style={{ color: '#f1f5f9' }}>🔐 Security Status</span>}>
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {securityFeatures.map(({ label, value, status, color, icon }) => (
                <div key={label} className="security-indicator">
                  <Space>
                    <span style={{ color }}>{icon}</span>
                    <div>
                      <Text style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{label}</Text>
                      <div>
                        <Text style={{ color: '#64748b', fontSize: 11 }}>{value}</Text>
                      </div>
                    </div>
                  </Space>
                  <Tag
                    style={{
                      background: `rgba(${status === 'ACTIVE' ? '16,185,129' : status === 'SIMULATED' ? '26,115,232' : status === 'PROTOTYPE' ? '245,158,11' : '124,77,255'}, 0.15)`,
                      border: `1px solid rgba(${status === 'ACTIVE' ? '16,185,129' : status === 'SIMULATED' ? '26,115,232' : status === 'PROTOTYPE' ? '245,158,11' : '124,77,255'}, 0.3)`,
                      color: color,
                      borderRadius: 6,
                    }}
                  >
                    {status}
                  </Tag>
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Recent Records */}
        <Col span={24}>
          <Card
            title={<span style={{ color: '#f1f5f9' }}>Recent Medical Records</span>}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/patient/upload-record')}
              >
                Add Record
              </Button>
            }
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
            ) : records.length === 0 ? (
              <Alert
                message="No medical records yet"
                description="Add your first encrypted medical record to get started."
                type="info"
                action={
                  <Button type="primary" size="small" onClick={() => navigate('/patient/upload-record')}>
                    Add Record
                  </Button>
                }
              />
            ) : (
              records.slice(0, 5).map(record => (
                <div key={record.id} style={{
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <Space>
                      <Tag color="green" style={{ borderRadius: 6 }}>
                        <CheckCircleOutlined /> ENCRYPTED
                      </Tag>
                      <Text style={{ color: '#94a3b8', fontSize: 12 }} className="hash-text">
                        CID: {record.ipfsCid?.slice(0, 20)}...
                      </Text>
                    </Space>
                    <div style={{ marginTop: 4 }}>
                      <Text style={{ color: '#64748b', fontSize: 11 }}>
                        Block #{record.blockIndex} • {new Date(record.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                  <Button
                    size="small"
                    onClick={() => navigate('/patient/records')}
                    style={{ borderColor: 'rgba(26,115,232,0.4)', color: '#1a73e8' }}
                  >
                    View
                  </Button>
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
